const { Whatsapp } = require('../services/whatsapp');
const getCoordinatesFromLocation = require('../utils/coordinatesLocation');

const locationHandler = async (
    conversation,
    incomingMessage,
    recipientPhone,
    recipientName,
    match,
    messageLowerCase
) => {
    let location = null;
    if (incomingMessage.type === 'location_message') {
        location = {
            latitude: incomingMessage.location.latitude,
            longitude: incomingMessage.location.longitude,
        };
        conversation.step++;
    } else if (incomingMessage.type === 'text_message') {
        const coordinatesAndAddress = await getCoordinatesFromLocation(
            incomingText
        );
        if (coordinatesAndAddress) {
            const [coordinates, addressByMapbox] = coordinatesAndAddress;
            location = {
                latitude: coordinates[1],
                longitude: coordinates[0],
                addressByMapbox: addressByMapbox,
                userText: incomingText,
            };
        } else {
            location = {
                userText: incomingText,
            };
        }

        if (location.addressByMapbox) {
            await Whatsapp.sendSimpleButtons({
                recipientPhone: recipientPhone,
                message: `Detectamos la siguiente dirección:\n\n${location.addressByMapbox}\n\n¿Es correcta?`,
                listOfButtons: [
                    {
                        title: 'Sí',
                        id: 'is_location_yes',
                    },
                    {
                        title: 'No',
                        id: 'is_location_no',
                    },
                ],
            });
            conversation.step++;
        } else if (location.userText) {
            await Whatsapp.sendSimpleButtons({
                recipientPhone: recipientPhone,
                message: `Detectamos la siguiente ubicación:\n\n${location.userText}\n\n¿Es correcta?`,
                listOfButtons: [
                    {
                        title: 'Sí',
                        id: 'is_location_yes',
                    },
                    {
                        title: 'No',
                        id: 'is_location_no',
                    },
                ],
            });
        }
    } else {
        await Whatsapp.sendText({
            recipientPhone: recipientPhone,
            message:
                'No pudimos detectar la dirección o ubicación. Por favor, ingresa nuevamente la dirección con el formato apropiado.',
        });
    }

    if (location) {
        conversation.data.reportLocation = location;
    }
};

module.exports = locationHandler;
