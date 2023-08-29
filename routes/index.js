'use strict';
const router = require('express').Router();
const { MongoClient, ObjectId } = require('mongodb'); // Se eliminó la importación innecesaria de ObjectId
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const WhatsappCloudAPI = require('whatsappcloudapi_wrapper');
const listOfSections = require('../utils/imprudences');
const calculateRisk = require('../utils/riskcalc')
const downloadAndUploadToS3 = require('../utils/upload');
const getCoordinatesFromLocation = require('../utils/coordinatesLocation'); // Adjust the path accordingly


const mongoClient = new MongoClient('mongodb+srv://secureapp:xwtjbuZGXRjYD1nf@cluster0.gahyus1.mongodb.net/');
let conversationsCollection;
let vehiclesCollection;
let driversCollection;
let companiesCollection;
let reportsCollection;

mongoClient.connect()
  .then(() => {
    console.log('Connected to MongoDB');
    const db = mongoClient.db('driport');
    conversationsCollection = db.collection('conversations');
    vehiclesCollection = db.collection('vehicles');
    driversCollection = db.collection('drivers');
    companiesCollection = db.collection('companies');
    reportsCollection = db.collection('reports');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  });

const Whatsapp = new WhatsappCloudAPI({
  accessToken: process.env.Meta_WA_accessToken,
  senderPhoneNumberId: process.env.Meta_WA_SenderPhoneNumberId,
  WABA_ID: process.env.Meta_WA_wabaId,
});

router.get('/meta_wa_driports_callbackurl', (req, res) => {
  try {
    // console.log('GET: Someone is pinging me!');

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token && mode === 'subscribe' && process.env.Meta_WA_VerifyToken === token) {
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  } catch (error) {
    console.error({ error });
    return res.sendStatus(500);
  }
});

router.post('/meta_wa_driports_callbackurl', async (req, res) => {
  // console.log('POST: Someone is pinging me!');
  try {
    let data = Whatsapp.parseMessage(req.body);

    if (data && data.isMessage && !data.isNotificationMessage) {
      let incomingMessage = data.message;
      let incomingText = incomingMessage?.text?.body || '';
      let recipientPhone = incomingMessage?.from?.phone || '';
      let recipientName = incomingMessage?.from?.name || '';
      let typeOfMsg = incomingMessage.type
      let message_id = incomingMessage.message_id

      console.log(`Received message: ${incomingText} from ${recipientPhone}`);

      if (incomingText && incomingText.toLowerCase() === 'reset') {
        console.log('Reset command received. Resetting conversation.');
        
        const result = await conversationsCollection.deleteOne({ sender: recipientPhone, isCompleted: false });
      
        if (result.deletedCount === 0) {
          console.log('No conversation found to reset.');
        } else {
          console.log('Deleted conversation:', result);
        }
        
        await Whatsapp.sendText({
          recipientPhone: recipientPhone,
          message: 'La conversación ha sido reiniciada. Vamos a empezar de nuevo.',
        });
      }
      

      let conversation = await conversationsCollection.findOne({ sender: recipientPhone, isCompleted: false });
      // if (data.isMessage) {
      //   console.log(incomingMessage);
      // }

      if (!conversation) {
        const uniqueId = uuidv4();
        const newConversation = {
          sender: recipientPhone,
          profileName: recipientPhone,
          uniqueId: uniqueId,
          step: 0,
          data: {},
          messages: [{ sender: recipientPhone, text: incomingText, timestamp: new Date() }],
          isCompleted: false,
        };
        const result = await conversationsCollection.insertOne(newConversation);
        newConversation._id = result.insertedId;
        conversation = newConversation;
      } else {
        conversation.messages.push({ sender: recipientPhone, text: incomingText, timestamp: new Date() });
        // Verificar si la conversación anterior está completada
        if (conversation.isCompleted) {
          conversation.uniqueId = uuidv4();
          conversation.isCompleted = false;
          conversation.step = 0;
          conversation.data = {};
          conversation.messages = [{ sender: recipientPhone, text: incomingText, timestamp: new Date() }];
          const result = await conversationsCollection.insertOne(conversation);
          conversation._id = result.insertedId;
        }
      }

      const messageLowerCase = incomingText.toLowerCase();
      const match = messageLowerCase.match(/stickerid: (\w+)$/);
      let vehicle = null;

  switch (conversation.step) {
    case 0:
      if (match) {
        const stickerID = match[1];
        vehicle = await vehiclesCollection.findOne({ stickerID: stickerID });
        if (vehicle) {
          conversation.data.vehicle = vehicle;
          let companyId = vehicle.companyId;
          let company = await companiesCollection.findOne({ _id: new ObjectId(companyId) });
          conversation.data.companyId = companyId;
          // Verificar si se encontró la empresa y si tiene un nombre válido
          let companyName = company ? company.companyName : 'Nombre de Empresa No Disponible';
  
          const message = `Gracias. Encontramos el siguiente vehículo:\n\n*Marca*: ${vehicle.brand}\n*Modelo*: ${vehicle.model}\n*Año*: ${vehicle.year}\n*Color*: ${vehicle.color}\n*Placa*: ${vehicle.plate.toUpperCase()}\n*Empresa*: ${companyName}\n\n¿Es este el vehículo que deseas reportar?`;
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
      break;
  
  case 1:
    if (match) {
      const stickerID = match[1];
      vehicle = await vehiclesCollection.findOne({ stickerID: stickerID });
    } else {
      vehicle = await vehiclesCollection.findOne({ plate: messageLowerCase });
    }
    if (vehicle) {
      let companyId = vehicle.companyId;
      let company = await companiesCollection.findOne({ _id: new ObjectId(companyId) });
      // Verificar si se encontró la empresa y si tiene un nombre válido
      let companyName = company ? company.companyName : 'Nombre de Empresa No Disponible';
      conversation.data.vehicle = vehicle;
      const message = `Gracias. Encontramos el siguiente vehículo:\n\n*Marca*: ${vehicle.brand}\n*Modelo*: ${vehicle.model}\n*Año*: ${vehicle.year}\n*Color*: ${vehicle.color}\n*Placa*: ${vehicle.plate.toUpperCase()}\n*Empresa*: ${companyName}\n\n¿Es este el vehículo que deseas reportar?`;
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
    break;

  case 2:
    if (incomingMessage.button_reply && incomingMessage.button_reply.id === 'is_vehicle_yes') {
      await Whatsapp.sendRadioButtons({
        recipientPhone: recipientPhone,
        headerText: 'Selecciona tipo de Imprudencias',
        bodyText: 'Tu reporte puede marcar la diferencia para crear un entorno vial más seguro. \n\nPor favor selecciona la imprudencia cometida:',
        footerText: 'Powered by: Driports',
        listOfSections, // Asegúrate de tener la lista de secciones aquí definida previamente.
      });
      conversation.step++;
    } else if (incomingMessage.button_reply && incomingMessage.button_reply.id === 'is_vehicle_no') {
      await Whatsapp.sendText({
        recipientPhone: recipientPhone,
        message: 'Lo siento por el error. Por favor, ingresa nuevamente la placa del vehículo que deseas reportar.',
      });
      conversation.step = 1;
    } else {
      await Whatsapp.sendText({
        recipientPhone: recipientPhone,
        message: 'No entendí tu respuesta, por favor confirma si el vehículo es el correcto.',
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
    break;

  case 3:
    if (incomingMessage.list_reply && incomingMessage.list_reply.id) {
      let idFound = false;
      for (let section of listOfSections) {
        if (section.rows.some((row) => row.id === incomingMessage.list_reply.id)) {
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
          message: 'No entendí tu respuesta. Por favor, selecciona el tipo de imprudencia que deseas reportar nuevamente.',
        });
      }
    } 
    break;

    case 4:
  if (incomingMessage.button_reply) {
    if (incomingMessage.button_reply.id === 'yes_details') {
      await Whatsapp.sendText({
        recipientPhone: recipientPhone,
        message: 'Por favor, proporciona más detalles sobre la imprudencia.',
      });
      // Incrementar el paso después de enviar el mensaje solicitando más detalles
      conversation.step++;
    } else if (incomingMessage.button_reply.id === 'no_details') {
      conversation.data.reportDetails = "no details provided by reporter";
      conversation.step = 6;
      await Whatsapp.sendSimpleButtons({
        recipientPhone: recipientPhone,
        message: '¿Deseas agregar alguna imagen o video para soportar tu reporte?',
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
      message: 'No entendi tu respuesta. ¿Deseas agregar más detalles sobre la imprudencia?',
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
  break;

case 5:
  if (typeOfMsg === 'text_message') {
    conversation.data.reportDetails = incomingText;
    await Whatsapp.sendSimpleButtons({
      recipientPhone: recipientPhone,
      message: 'Gracias. ¿Deseas agregar alguna imagen o video para soportar tu reporte?',
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
    conversation.step++;
  } else {
    await Whatsapp.sendSimpleButtons({
      recipientPhone: recipientPhone,
      message: 'No entendí tu respuesta. ¿Deseas agregar alguna imagen o video para soportar tu reporte?',
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
  break; 
     
  case 6:
    if (incomingMessage.button_reply && incomingMessage.button_reply.id === 'yes_media') {
        await Whatsapp.sendText({
          recipientPhone: recipientPhone,
          message: 'Por favor, envia tu imagen o video.',
        });
    } else if (incomingMessage.image && incomingMessage.image.mime_type && incomingMessage.image.mime_type.includes('image')) {
        await downloadAndUploadToS3(incomingMessage.image.id);
        await Whatsapp.sendText({
          recipientPhone: recipientPhone,
          message: 'Gracias, hemos recibido tu imagen. Envíanos la ubicación del incidente o escribe la dirección donde ocurrió para que podamos rastrear mejor el incidente.',
        });
        conversation.step++;
    } else if (incomingMessage.video && incomingMessage.video.mime_type && incomingMessage.video.mime_type.includes('video')) {
        await downloadAndUploadToS3(incomingMessage.video.id);
        await Whatsapp.sendText({
          recipientPhone: recipientPhone,
          message: 'Gracias, hemos recibido tu video. Envíanos la ubicación del incidente o escribe la dirección donde ocurrió para que podamos rastrear mejor el incidente.',
        });
        conversation.step++;
    } else if (incomingMessage.button_reply && incomingMessage.button_reply.id === 'no_media') {
        await Whatsapp.sendText({
          recipientPhone: recipientPhone,
          message: 'Gracias. Envíanos la ubicación del incidente o escribe la dirección donde ocurrió para que podamos rastrear mejor el incidente.',
        });
        conversation.step++;
    } else {
        await Whatsapp.sendText({
          recipientPhone: recipientPhone,
          message: 'No entendí tu respuesta. Por favor, envía una imagen o video nuevamente.',
        });
    }
    break;

    case 7:
      let location = null;
      if (incomingMessage.type === 'location_message') {
        location = {
          latitude: incomingMessage.location.latitude,
          longitude: incomingMessage.location.longitude,
        };
        conversation.step++;
      } else if (incomingMessage.type === 'text_message') {
          const coordinatesAndAddress = await getCoordinatesFromLocation(incomingText);
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
            message: 'No pudimos detectar la dirección o ubicación. Por favor, ingresa nuevamente la dirección con el formato apropiado.',
          });
      }
  
      if (location) {
          conversation.data.reportLocation = location;
      }


      case 8:
        if ((incomingMessage.button_reply && incomingMessage.button_reply.id === 'is_location_yes' && conversation.data.reportLocation) || incomingMessage.type === 'location_message') {
          
           // Llamada a la función para calcular el riesgo y hacer update al driver del riskmatrix.
          const driverId = conversation.data.vehicle.driverId; // Obtén el driverId de la conversación
          const risk = await calculateRisk(driverId, conversation.data.reportType, conversation.data.reportLocation, mongoClient);
          const driver = await driversCollection.findOne({ _id: new ObjectId(driverId) });
    
          if (driver) {
           await driversCollection.updateOne({ _id: driver._id }, { $set: { riskMatrix: risk } });
            console.log(`Risk Matrix del driverid ${driverId} actualizada a ${risk}`);
           } else {
             console.log(`No se encontró ningún conductor con el driverId ${driverId}`);
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
            message: '*Hemos registrado tu reporte exitosamente*. Gracias por ayudarnos a mejorar la seguridad vial.',
          });
          conversation.isCompleted = true;
          conversation.step = 0;
        } else if (incomingMessage.button_reply && incomingMessage.button_reply.id === 'is_location_no') {
          await Whatsapp.sendText({
            recipientPhone: recipientPhone,
            message: 'Lo siento por el error. Por favor, envia o ingresa nuevamente la dirección con el formato apropiado.',
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
        break;
  default:
    console.log(`No se reconoció el paso de la conversación: ${conversation.step}`);
}
        
        await conversationsCollection.updateOne({ _id: conversation._id }, { $set: conversation });
        await Whatsapp.markMessageAsRead({
          message_id: message_id,
        });
        return res.sendStatus(200);                 
  
} else {
  // console.log('No es un mensaje válido');
}
  } catch (error) {
    console.error('Error:', error);
  }
});

module.exports = router;
