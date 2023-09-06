const { ObjectId } = require('mongodb');
const { companiesCollection, vehiclesCollection } = require('../db/connection');
const { Whatsapp } = require('../services/whatsapp');

const initialHandler = async (
    conversation,
    incomingMessage,
    recipientPhone,
    recipientName,
    match,
    messageLowerCase
) => {
    if (match) {
        const stickerID = match[1];
        vehicle = await vehiclesCollection.findOne({
            stickerID: stickerID,
        });
        if (vehicle) {
            conversation.data.vehicle = vehicle;
            let companyId = vehicle.companyId;
            let company = await companiesCollection.findOne({
                _id: new ObjectId(companyId),
            });
            conversation.data.companyId = companyId;

            let companyName = company
                ? company.companyName
                : 'Nombre de Empresa No Disponible';

            const message = `Gracias. Encontramos el siguiente vehículo:\n\n*Marca*: ${
                vehicle.brand
            }\n*Modelo*: ${vehicle.model}\n*Año*: ${vehicle.year}\n*Color*: ${
                vehicle.color
            }\n*Placa*: ${vehicle.plate.toUpperCase()}\n*Empresa*: ${companyName}\n\n¿Es este el vehículo que deseas reportar?`;

            await Whatsapp.sendSimpleButtons({
                recipientPhone: recipientPhone,
                message: message,
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
            conversation.step = 2; // Salta al caso 2
        } else {
            await Whatsapp.sendText({
                recipientPhone: recipientPhone,
                message: `No pudimos encontrar el vehículo que intentas reportar. Por favor, verifica el *stickerID* e inténtalo nuevamente.`,
            });
            conversation.step = 0; // Regresa al caso 0
        }
    } else {
        await Whatsapp.sendText({
            recipientPhone: recipientPhone,
            message: `*Hola ${recipientName}*, soy el asistente de reportes de imprudencias. Por favor, ingresa el *stickerID* o la *placa* del vehículo que deseas reportar.`,
        });
        conversation.step++;
    }
};

module.exports = initialHandler;
