const { Whatsapp } = require('../services/whatsapp');
const listOfSections = require('../utils/imprudences');

const reportDetailsHandler = async (
    conversation,
    incomingMessage,
    recipientPhone,
    recipientName,
    match,
    messageLowerCase
) => {
    if (incomingMessage.list_reply && incomingMessage.list_reply.id) {
        let idFound = false;
        for (let section of listOfSections) {
            if (
                section.rows.some(
                    (row) => row.id === incomingMessage.list_reply.id
                )
            ) {
                idFound = true;
                break;
            }
        }

        if (idFound) {
            conversation.data.reportType = incomingMessage.list_reply.id;
            await Whatsapp.sendSimpleButtons({
                recipientPhone: recipientPhone,
                message: '¿Deseas agregar más detalles sobre la imprudencia?',
                listOfButtons: [
                    {
                        type: 'button_reply',
                        title: 'Sí',
                        id: 'yes_details',
                    },
                    {
                        type: 'button_reply',
                        title: 'No',
                        id: 'no_details',
                    },
                ],
            });
            conversation.step++;
        } else if (!incomingMessage.button_reply) {
            await Whatsapp.sendText({
                recipientPhone: recipientPhone,
                message:
                    'No entendí tu respuesta. Por favor, selecciona el tipo de imprudencia que deseas reportar nuevamente.',
            });
        }
    }
};

module.exports = reportDetailsHandler;
