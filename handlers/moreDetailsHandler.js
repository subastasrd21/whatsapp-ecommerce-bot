const { Whatsapp } = require('../services/whatsapp');

const moreDetailsHandler = async (
    conversation,
    incomingMessage,
    recipientPhone,
    recipientName,
    match,
    messageLowerCase
) => {
    if (incomingMessage.button_reply) {
        if (incomingMessage.button_reply.id === 'yes_details') {
            await Whatsapp.sendText({
                recipientPhone: recipientPhone,
                message:
                    'Por favor, proporciona más detalles sobre la imprudencia.',
            });
            // Incrementar el paso después de enviar el mensaje solicitando más detalles
            conversation.step++;
        } else if (incomingMessage.button_reply.id === 'no_details') {
            conversation.data.reportDetails = 'no details provided by reporter';
            conversation.step = 6;
            await Whatsapp.sendSimpleButtons({
                recipientPhone: recipientPhone,
                message:
                    '¿Deseas agregar alguna imagen o video para soportar tu reporte?',
                listOfButtons: [
                    {
                        type: 'button_reply',
                        title: 'Sí',
                        id: 'yes_media',
                    },
                    {
                        type: 'button_reply',
                        title: 'No',
                        id: 'no_media',
                    },
                ],
            });
        }
    } else {
        await Whatsapp.sendSimpleButtons({
            recipientPhone: recipientPhone,
            message:
                'No entendi tu respuesta. ¿Deseas agregar más detalles sobre la imprudencia?',
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
    }
};

module.exports = moreDetailsHandler;
