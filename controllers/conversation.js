const { conversationsCollection } = require('../db/connection');
const { v4: uuidv4 } = require('uuid');

module.exports = {
    createOrUpdateConversation: async function (recipientPhone, incomingText) {
        let conversation = await conversationsCollection.findOne({
            sender: recipientPhone,
            isCompleted: false,
        });

        if (!conversation) {
            const uniqueId = uuidv4();
            const newConversation = {
                sender: recipientPhone,
                profileName: recipientPhone,
                uniqueId: uniqueId,
                step: 0,
                data: {},
                messages: [
                    {
                        sender: recipientPhone,
                        text: incomingText,
                        timestamp: new Date(),
                    },
                ],
                isCompleted: false,
            };
            const result = await conversationsCollection.insertOne(
                newConversation
            );
            newConversation._id = result.insertedId;
            conversation = newConversation;
        } else {
            conversation.messages.push({
                sender: recipientPhone,
                text: incomingText,
                timestamp: new Date(),
            });
            // Verificar si la conversación anterior está completada
            if (conversation.isCompleted) {
                conversation.uniqueId = uuidv4();
                conversation.isCompleted = false;
                conversation.step = 0;
                conversation.data = {};
                conversation.messages = [
                    {
                        sender: recipientPhone,
                        text: incomingText,
                        timestamp: new Date(),
                    },
                ];
                const result = await conversationsCollection.insertOne(
                    conversation
                );
                conversation._id = result.insertedId;
            }
        }

        return conversation;
    },
};
