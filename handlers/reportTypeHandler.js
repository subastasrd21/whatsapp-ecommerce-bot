const { Whatsapp } = require('../services/whatsapp');
const listOfSections = require('../utils/imprudences');

const reportTypeHandler = async (
    conversation,
    incomingMessage,
    recipientPhone,
    recipientName,
    match,
    messageLowerCase
) => {
    if (
        incomingMessage.button_reply &&
        incomingMessage.button_reply.id === 'is_vehicle_yes'
    ) {
        await Whatsapp.sendRadioButtons({
            recipientPhone: recipientPhone,
            headerText: 'Selecciona tipo de Imprudencias',
            bodyText:
                'Tu reporte puede marcar la diferencia para crear un entorno vial más seguro. \n\nPor favor selecciona la imprudencia cometida:',
            footerText: 'Powered by: Driports',
            listOfSections, // Asegúrate de tener la lista de secciones aquí definida previamente.
        });
        conversation.step++;
    } else if (
        incomingMessage.button_reply &&
        incomingMessage.button_reply.id === 'is_vehicle_no'
    ) {
        await Whatsapp.sendText({
            recipientPhone: recipientPhone,
            message:
                'Lo siento por el error. Por favor, ingresa nuevamente la placa del vehículo que deseas reportar.',
        });
        conversation.step = 1;
    } else {
        await Whatsapp.sendText({
            recipientPhone: recipientPhone,
            message:
                'No entendí tu respuesta, por favor confirma si el vehículo es el correcto.',
        });
        await Whatsapp.sendSimpleButtons({
            recipientPhone: recipientPhone,
            message: '¿Es este el vehículo que deseas reportar?',
            listOfButtons: [
                {
                    title: 'Si',
                    id: 'is_vehicle_yes',
                },
                {
                    title: 'No',
                    id: 'is_vehicle_no',
                },
            ],
        });
    }
};

module.exports = reportTypeHandler;
