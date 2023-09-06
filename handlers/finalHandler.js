const { ObjectId } = require('mongodb');
const {
    mongoClient,
    driversCollection,
    reportsCollection,
} = require('../db/connection');
const { Whatsapp } = require('../services/whatsapp');
const calculateRisk = require('../utils/riskcalc');

const finalHandler = async (
    conversation,
    incomingMessage,
    recipientPhone,
    recipientName,
    match,
    messageLowerCase
) => {
    if (
        (incomingMessage.button_reply &&
            incomingMessage.button_reply.id === 'is_location_yes' &&
            conversation.data.reportLocation) ||
        incomingMessage.type === 'location_message'
    ) {
        // Llamada a la función para calcular el riesgo y hacer update al driver del riskmatrix.
        const driverId = conversation.data.vehicle.driverId;

        const risk = await calculateRisk(
            driverId,
            conversation.data.reportType,
            conversation.data.reportLocation,
            mongoClient
        );

        const driver = await driversCollection.findOne({
            _id: new ObjectId(driverId),
        });

        if (driver) {
            await driversCollection.updateOne(
                { _id: driver._id },
                { $set: { riskMatrix: risk } }
            );
            console.log(
                `Risk Matrix del driverid ${driverId} actualizada a ${risk}`
            );
        } else {
            console.log(
                `No se encontró ningún conductor con el driverId ${driverId}`
            );
        }

        let reportData = {
            userPhone: recipientPhone,
            profileName: recipientName,
            companyId: conversation.data.vehicle.companyId,
            // driverId: conversation.data.driverId,
            vehicle: conversation.data.vehicle,
            reportType: conversation.data.reportType,
            reportDetails: conversation.data.reportDetails,
            reportMedia: conversation.data.media,
            reportLocation: conversation.data.reportLocation,
            additionalDetails: conversation.data.additionalDetails,
            reportId: conversation.uniqueId,
            date: new Date(),
        };
        await reportsCollection.insertOne(reportData);
        await Whatsapp.sendText({
            recipientPhone: recipientPhone,
            message:
                '*Hemos registrado tu reporte exitosamente*. Gracias por ayudarnos a mejorar la seguridad vial.',
        });
        conversation.isCompleted = true;
        conversation.step = 0;
    } else if (
        incomingMessage.button_reply &&
        incomingMessage.button_reply.id === 'is_location_no'
    ) {
        await Whatsapp.sendText({
            recipientPhone: recipientPhone,
            message:
                'Lo siento por el error. Por favor, envia o ingresa nuevamente la dirección con el formato apropiado.',
        });
        conversation.step = 7;
    } else if (incomingMessage.type !== 'text_message') {
        await Whatsapp.sendSimpleButtons({
            recipientPhone: recipientPhone,
            message: 'No entendí tu respuesta. ¿Es correcta la dirección?',
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
};

module.exports = finalHandler;
