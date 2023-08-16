'use strict';
const router = require('express').Router();
const { MongoClient, ObjectId } = require('mongodb'); // Se eliminó la importación innecesaria de ObjectId
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const WhatsappCloudAPI = require('whatsappcloudapi_wrapper');
const listOfSections = require('../utils/imprudences.js');
const calculateRisk = require('../utils/riskcalc.js')

const mongoClient = new MongoClient('mongodb+srv://secureapp:xwtjbuZGXRjYD1nf@cluster0.gahyus1.mongodb.net/');
let conversationsCollection;
let vehiclesCollection;
let driversCollection;

mongoClient.connect()
  .then(() => {
    console.log('Connected to MongoDB');
    const db = mongoClient.db('driport');
    conversationsCollection = db.collection('conversations');
    vehiclesCollection = db.collection('vehicles');
    driversCollection = db.collection('drivers')
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
    console.log('GET: Someone is pinging me!');

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
  console.log('POST: Someone is pinging me!');
  try {
    let data = Whatsapp.parseMessage(req.body);

    if (data && data.isMessage && !data.isNotificationMessage) {
      let incomingMessage = data.message;
      let incomingText = incomingMessage?.text?.body || '';
      let recipientPhone = incomingMessage?.from?.phone || '';
      let recipientName = incomingMessage?.from?.name || '';
      let typeOfMsg = incomingMessage.type
      let message_id = incomingMessage.message_id

      let conversation = await conversationsCollection.findOne({ sender: recipientPhone, isCompleted: false });
      console.log('Todos los mensajes:');
      if (data.isMessage) {
        console.log(req.body);
      }

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
      const match = messageLowerCase.match(/^stickerid: (\w+)$/);
      let vehicle = null;

        switch (conversation.step) {
          case 0:
            if (match) {
              const stickerID = match[1];
              vehicle = await vehiclesCollection.findOne({ stickerID: stickerID });
              if (vehicle) {
                conversation.data.vehicle = vehicle;
                const message = `Gracias. Encontramos el siguiente vehículo:\n\n*Marca*: ${vehicle.brand}\n*Modelo*: ${vehicle.model}\n*Año*: ${vehicle.year}\n*Color*: ${vehicle.color}\n*Placa*: ${vehicle.plate.toUpperCase()}\n*Empresa*: ${conversation.data.companyName}\n\n¿Es este el vehículo que deseas reportar?`;
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
            conversation.data.vehicle = vehicle;
            const message = `Gracias. Encontramos el siguiente vehículo:\n\n*Marca*: ${vehicle.brand}\n*Modelo*: ${vehicle.model}\n*Año*: ${vehicle.year}\n*Color*: ${vehicle.color}\n*Placa*: ${vehicle.plate.toUpperCase()}\n*Empresa*: ${conversation.data.companyName}\n\n¿Es este el vehículo que deseas reportar?`;
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
              listOfSections,
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
          if (data.message.list_reply && data.message.list_reply.id) {
            let idFound = false;
            for (let section of listOfSections) {
              if (section.rows.some((row) => row.id === data.message.list_reply.id)) {
                idFound = true;
                break;
              }
            }
      
            if (idFound) {
              conversation.data.reportType = data.message.list_reply.id;
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
            } else {
              await Whatsapp.sendText({
                recipientPhone: recipientPhone,
                message: 'No entendí tu respuesta. Por favor, selecciona el tipo de imprudencia que deseas reportar nuevamente.',
              });
            }
          } else {
            await Whatsapp.sendText({
              recipientPhone: recipientPhone,
              message: 'No entendí tu respuesta. Por favor, selecciona el tipo de imprudencia que deseas reportar nuevamente.',
            });
          }
          break;
      
          case 4:
            if (incomingMessage.button_reply) {
              if (incomingMessage.button_reply.id === 'yes_details') {
                await Whatsapp.sendText({
                  recipientPhone: recipientPhone,
                  message: 'Por favor, proporciona más detalles sobre la imprudencia.',
                });
                // Aquí incrementas el paso después de enviar el mensaje solicitando más detalles
                conversation.step++;
              } else if (incomingMessage.button_reply.id === 'no_details') {
                conversation.data.reportDetails = null;
                // Avanzar al siguiente paso directamente sin esperar más detalles
                // En lugar de incrementar el paso, vamos directamente al siguiente paso: solicitar una imagen o video.
                await Whatsapp.sendSimpleButtons({
                  recipientPhone: recipientPhone,
                  message: 'Gracias por tu reporte. ¿Deseas agregar alguna imagen o video para soportar tu reporte?',
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
                // Aquí incrementas el paso después de enviar el mensaje de solicitud de imagen o video.
                conversation.step++;
              }
            } else if (incomingText) {
              // Esto manejará la lógica de recepción de los detalles
              conversation.data.reportDetails = incomingText;
              await Whatsapp.sendSimpleButtons({
                recipientPhone: recipientPhone,
                message: 'Gracias por tu reporte. ¿Deseas agregar alguna imagen o video para soportar tu reporte?',
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
            }
            break;         

          case 5:
            if (incomingMessage.button_reply && incomingMessage.button_reply.id === 'yes_media') {
              await Whatsapp.sendText({
                recipientPhone: recipientPhone,
                message: 'Por favor, envía la imagen o video.',
              });
              conversation.step++;
            } else if (incomingMessage.button_reply && incomingMessage.button_reply.id === 'no_media') {
              await Whatsapp.sendText({
                recipientPhone: recipientPhone,
                message: 'Entendido. Proporciona tu ubicación actual (si estás en el lugar del incidente) o escribe la dirección donde ocurrió para que podamos rastrear mejor el incidente.',
              });
              conversation.step = 7;
            } else {
              await Whatsapp.sendText({
                recipientPhone: recipientPhone,
                message: 'No entendí tu respuesta. ¿Deseas agregar alguna imagen o video para soportar tu reporte?',
              });
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
            break;
          
        case 6:
          if (data.message.type === 'media_message') {
            if (data.message.image && data.message.image.mime_type && data.message.image.mime_type.includes('image')) {
              const image = {
                file: data.message.image.file,
                id: data.message.image.id,
                mime_type: data.message.image.mime_type,
                sha256: data.message.image.sha256,
                caption: data.message.image.caption || '',
              };
      
              if (!conversation.data.media) {
                conversation.data.media = [];
              }
              conversation.data.media.push(image);
      
              await Whatsapp.sendText({
                recipientPhone: recipientPhone,
                message: 'Gracias, hemos recibido tu imagen. Envíanos la ubicación del incidente o escribe la dirección donde ocurrió para que podamos rastrear mejor el incidente.',
              });
              conversation.step++;
            } else if (data.message.video && data.message.video.mime_type && data.message.video.mime_type.includes('video')) {
              const video = {
                id: data.message.video.id,
                mime_type: data.message.video.mime_type,
                sha256: data.message.video.sha256,
                caption: data.message.caption || '',
              };
      
              if (!conversation.data.media) {
                conversation.data.media = [];
              }
              conversation.data.media.push(video);
      
              await Whatsapp.sendText({
                recipientPhone: recipientPhone,
                message: 'Gracias, hemos recibido tu video. Envíanos la ubicación del incidente o escribe la dirección donde ocurrió para que podamos rastrear mejor el incidente.',
              });
              conversation.step++;
            } else {
              await Whatsapp.sendText({
                recipientPhone: recipientPhone,
                message: 'No entendí tu respuesta. Por favor, envía una imagen o video nuevamente.',
              });
            }
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
            } else if (incomingText) {
              location = {
                text: incomingText,
              };
            }
            
            if (location) {
              conversation.data.reportLocation = location;
            } else {
              conversation.data.reportLocation = null;
            }
            conversation.step++;
            
        case 8:

          let fileId = null;
          if (conversation.data.media && conversation.data.media.length > 0) {
            fileId = conversation.data.media[0].id;
          }
      
          let reportData = {
            userPhone: recipientPhone,
            profileName: recipientName,
            vehicle: conversation.data.vehicle,
            reportType: conversation.data.reportType,
            reportDetails: conversation.data.reportDetails,
            reportMedia: conversation.data.media,
            reportLocation: conversation.data.reportLocation,
            additionalDetails: conversation.data.additionalDetails,
            reportId: conversation.uniqueId,
            fileId: fileId,
            timestamp: new Date(),
          };
         
          try {
            const webhookUrl = 'https://webhook.site/0e7f4fcb-c0cf-4340-a29c-27e5111f3da2';
            await axios.post(webhookUrl, reportData);
      
            await Whatsapp.sendText({
              recipientPhone: recipientPhone,
              message: '*Hemos registrado tu reporte exitosamente*. Gracias por ayudarnos a mejorar la seguridad vial.',
            });

            // Llamada a la función para calcular el riesgo y hacer update al driver del riskmatrix.
            const driverId = conversation.data.vehicle.driverId; // Obtén el driverId de la conversación
            const risk = await calculateRisk(driverId, reportType, reportLocation, mongoClient);
            const driver = await driversCollection.findOne({ _id: new ObjectId(driverId) });

            if (driver) {
              await driversCollection.updateOne({ _id: driver._id }, { $set: { riskMatrix: risk } });
              console.log(`Risk Matrix del driverid ${driverId} actualizada a ${risk}`);
            } else {
              console.log(`No se encontró ningún conductor con el driverId ${driverId}`);
            }

            conversation.isCompleted = true;
            conversation.step = 0;

          } catch (error) {
            const errWebhookUrl = 'https://webhook.site/0e7f4fcb-c0cf-4340-a29c-27e5111f3da2';
            console.error('Error al enviar los datos al webhook:', error);
            await axios.post(errWebhookUrl, error);
      
            await Whatsapp.sendText({
              recipientPhone: recipientPhone,
              message: 'Ocurrió un error al procesar tu reporte. Por favor, intenta nuevamente más tarde.',
            });
      
            conversation.step = 0;
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
      console.log('No es un mensaje válido');
    }
  } catch (error) {
    console.error('Error:', error);
  }
});

module.exports = router;
