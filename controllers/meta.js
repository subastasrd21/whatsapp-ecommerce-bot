const { Whatsapp } = require('../services/whatsapp');
const { conversationsCollection } = require('../db/connection.js');
const { createOrUpdateConversation } = require('./conversation');
const stateHandlers = require('../handlers/stateHandlers');

module.exports = {
    metaWebhookCallbackURL: async function (req, res) {
        try {
            const mode = req.query['hub.mode'];
            const token = req.query['hub.verify_token'];
            const challenge = req.query['hub.challenge'];

            console.log(mode, token, mode, token);

            if (
                mode &&
                token &&
                mode === 'subscribe' &&
                process.env.Meta_WA_VerifyToken === token
            ) {
                return res.status(200).send(challenge);
            } else {
                return res.sendStatus(403);
            }
        } catch (error) {
            console.error({ error });
            return res.sendStatus(500);
        }
    },
    handleMetaWebhookCallback: async function (req, res) {
        try {
            let data = Whatsapp.parseMessage(req.body);

            if (data && data.isMessage && !data.isNotificationMessage) {
                let incomingMessage = data.message;
                let incomingText = incomingMessage?.text?.body || '';
                let recipientPhone = incomingMessage?.from?.phone || '';
                let recipientName = incomingMessage?.from?.name || '';
                let typeOfMsg = incomingMessage.type;
                let message_id = incomingMessage.message_id;

                if (incomingText && incomingText.toLowerCase() === 'reset') {
                    console.log(
                        'Reset command received. Resetting conversation.'
                    );

                    const result = await conversationsCollection.deleteOne({
                        sender: recipientPhone,
                        isCompleted: false,
                    });

                    if (result.deletedCount === 0) {
                        console.log('No conversation found to reset.');
                    } else {
                        console.log('Deleted conversation:', result);
                    }

                    await Whatsapp.sendText({
                        recipientPhone: recipientPhone,
                        message:
                            'La conversación ha sido reiniciada. Vamos a empezar de nuevo.',
                    });
                }

                let conversation = await createOrUpdateConversation(
                    recipientPhone,
                    incomingText,
                    conversationsCollection
                );

                const messageLowerCase = incomingText.toLowerCase();
                const match = messageLowerCase.match(/stickerid: (\w+)$/);
                let vehicle = null;
                const { step } = conversation;

                if (stateHandlers[step]) {
                    await stateHandlers[step](
                        conversation,
                        incomingMessage,
                        recipientPhone,
                        recipientName,
                        match,
                        messageLowerCase
                    );
                } else {
                    console.log(
                        `No se reconoció el paso de la conversación: ${conversation.step}`
                    );
                }
                await conversationsCollection.updateOne(
                    { _id: conversation._id },
                    { $set: conversation }
                );
                await Whatsapp.markMessageAsRead({
                    message_id: message_id,
                });
                return res.sendStatus(200);
            } else {
                console.log('No es un mensaje válido');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    },
};
