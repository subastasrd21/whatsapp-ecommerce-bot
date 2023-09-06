const { ObjectId } = require('mongodb');
const { companiesCollection, vehiclesCollection } = require('../db/connection');
const { Whatsapp } = require('../services/whatsapp');

const vehicleHandler = async (
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
    } else {
        vehicle = await vehiclesCollection.findOne({
            plate: messageLowerCase,
        });
    }
    if (vehicle) {
        let companyId = vehicle.companyId;
        let company = await companiesCollection.findOne({
            _id: new ObjectId(companyId),
        });
        // Verificar si se encontró la empresa y si tiene un nombre válido
        let companyName = company
            ? company.companyName
            : 'Nombre de Empresa No Disponible';
        conversation.data.vehicle = vehicle;
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
        conversation.step++;
    } else {
        await Whatsapp.sendText({
            recipientPhone: recipientPhone,
            message: `No pudimos encontrar el vehículo que intentas reportar. Por favor, verifica el *stickerID* o la *placa* e inténtalo nuevamente.`,
        });
        conversation.step = 1;
    }
};

module.exports = vehicleHandler;
