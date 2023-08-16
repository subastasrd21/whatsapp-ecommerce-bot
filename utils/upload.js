const axios = require('axios');
const mime = require('mime-types');
const {
  Upload
} = require('@aws-sdk/lib-storage');
const {
  S3
} = require('@aws-sdk/client-s3');

// Configura las credenciales de AWS.
const s3 = new S3({
  region: 'us-east-2',
  credentials: {
  accessKeyId: process.env.AWS_KeyId,
  secretAccessKey: process.env.AWS_secretAccessKey,
  }
});

async function downloadAndUploadToS3(id) {
  try {
    // Realiza una solicitud GET a la URL de la API de Facebook para obtener la URL del archivo.
    const response = await axios.get(`https://graph.facebook.com/v17.0/${id}`, {
      headers: {
        Authorization: `Bearer ${process.env.Meta_WA_accessToken}`,
      },
    });

    // Extrae la URL del archivo y el tipo MIME de la respuesta.
    const fileUrl = response.data.url;
    const mimeType = response.data.mime_type;

    // Obtiene la extensión del archivo a partir del tipo MIME.
    const extension = mime.extension(mimeType);

    // Realiza una solicitud GET a la URL del archivo para descargar el archivo.
    const fileResponse = await axios.get(fileUrl, {
      responseType: 'arraybuffer',
      headers: {
        Authorization: `Bearer ${process.env.Meta_WA_accessToken}`,
      },
    });

    const fileData = fileResponse.data;

    // Define el nombre del archivo que se almacenará en Amazon S3.
    const fileName = `${id}.${extension}`;

    // Configura los parámetros para la subida a S3.
    const uploadParams = {
      Bucket: 'driports-files',
      Key: fileName,
      Body: fileData,
    };

    // Sube el archivo a Amazon S3.
    await new Upload({
      client: s3,
      params: uploadParams
    }).done();

    console.log(`Archivo ${fileName} cargado exitosamente en Amazon S3.`);
  } catch (error) {
    console.error('Error al descargar el archivo:', error.message);
    console.error('Código de estado HTTP:', error.response?.status);
    
    // Convierte la respuesta a una cadena si es un objeto Buffer.
    if (Buffer.isBuffer(error.response.data)) {
      console.error('Datos de respuesta:', error.response.data.toString('utf-8'));
    } else {
      console.error('Datos de respuesta:', error.response?.data);
    }
  }
}

// Exporta la función para que pueda ser utilizada en otros módulos.
module.exports = downloadAndUploadToS3;
