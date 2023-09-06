const { Whatsapp } = require('../services/whatsapp');
const downloadAndUploadToS3 = require('../utils/upload');

const mediaUpload = async (
    conversation,
    incomingMessage,
    recipientPhone,
    recipientName,
    match,
    messageLowerCase
) => {
    if (
        incomingMessage.button_reply &&
        incomingMessage.button_reply.id === 'yes_media'
    ) {
        await Whatsapp.sendText({
            recipientPhone: recipientPhone,
            message: 'Por favor, envia tu imagen o video.',
        });
    } else if (
        incomingMessage.image &&
        incomingMessage.image.mime_type &&
        incomingMessage.image.mime_type.includes('image')
    ) {
        await downloadAndUploadToS3(incomingMessage.image.id);
        await Whatsapp.sendText({
            recipientPhone: recipientPhone,
            message:
                'Gracias, hemos recibido tu imagen. Envíanos la ubicación del incidente o escribe la dirección donde ocurrió para que podamos rastrear mejor el incidente.',
        });
        conversation.step++;
    } else if (
        incomingMessage.video &&
        incomingMessage.video.mime_type &&
        incomingMessage.video.mime_type.includes('video')
    ) {
        await downloadAndUploadToS3(incomingMessage.video.id);
        await Whatsapp.sendText({
            recipientPhone: recipientPhone,
            message:
                'Gracias, hemos recibido tu video. Envíanos la ubicación del incidente o escribe la dirección donde ocurrió para que podamos rastrear mejor el incidente.',
        });
        conversation.step++;
    } else if (
        incomingMessage.button_reply &&
        incomingMessage.button_reply.id === 'no_media'
    ) {
        await Whatsapp.sendText({
            recipientPhone: recipientPhone,
            message:
                'Gracias. Envíanos la ubicación del incidente o escribe la dirección donde ocurrió para que podamos rastrear mejor el incidente.',
        });
        conversation.step++;
    } else {
        await Whatsapp.sendText({
            recipientPhone: recipientPhone,
            message:
                'No entendí tu respuesta. Por favor, envía una imagen o video nuevamente.',
        });
    }
};

module.exports = mediaUpload;
