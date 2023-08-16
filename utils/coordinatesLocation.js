const axios = require('axios');

async function getCoordinatesFromLocation(locationText) {
  try {
    const mapboxApiKey = process.env.MapboxApiKey; // Reemplaza con tu API key de Mapbox
    const geocodingEndpoint = 'https://api.mapbox.com/geocoding/v5/mapbox.places/';
    const encodedLocation = encodeURIComponent(locationText);
    const url = `${geocodingEndpoint}${encodedLocation}.json?access_token=${mapboxApiKey}&limit=1`;

    const response = await axios.get(url);
    const features = response.data.features;

    if (features.length > 0) {
      const coordinates = features[0].center;
      const address = features[0].place_name;
      return [coordinates, address]; // Return both coordinates and address as an array
    } else {
      console.log(`No se encontraron coordenadas para: ${locationText}`);
      return null;
    }
  } catch (error) {
    console.error('Error al obtener coordenadas:', error.message);
    return null;
  }
}

module.exports = getCoordinatesFromLocation;


// EL SIGUIENTE CODIGO PARA HACER LA CONSULTA EN BASE A LOS LIMITES DEL PAIS QUE CONSULTA. 
// PRIMERO DEBEMOS CREAR UN ARCHIVO EL CUAL OBTENGA VIA EL PREFIX DEL NUMERO EL PAIS Y LUEGO BUSCAR LOS LIMITES DEL PAIS Y LIMITARLO EN LA CONSULTA DE MAPBOX.
// help ref: https://github.com/arash16/countries-languages 
// OR BETTER WITH THIS CSV https://github.com/datasets/country-codes/blob/master/data/country-codes.csv TO GET LANGUAGE AND NUMBER ISO3166-1-Alpha-3	

// -------------------------------------------------------------------------------------------------------------------------

// const axios = require('axios');

// async function getCoordinatesFromLocation(locationText) {
//   try {
//     const mapboxApiKey = process.env.MapboxApiKey; // Reemplaza con tu API key de Mapbox
//     const geocodingEndpoint = 'https://api.mapbox.com/geocoding/v5/mapbox.places/';
//     const encodedLocation = encodeURIComponent(locationText);
//     const latitudeMin = 17.5; // Límite mínimo de latitud para la República Dominicana
//     const latitudeMax = 19.5; // Límite máximo de latitud para la República Dominicana
//     const longitudeMin = -72.0; // Límite mínimo de longitud para la República Dominicana
//     const longitudeMax = -68.5; // Límite máximo de longitud para la República Dominicana

//     // Agregar restricciones de latitud y longitud en la consulta a la API de Mapbox
//     const url = `${geocodingEndpoint}${encodedLocation}.json?access_token=${mapboxApiKey}&limit=1&bbox=${longitudeMin},${latitudeMin},${longitudeMax},${latitudeMax}`;

//     const response = await axios.get(url);
//     const features = response.data.features;

//     if (features.length > 0) {
//       const coordinates = features[0].center;
//       const address = features[0].place_name;
//       return [coordinates, address]; // Return both coordinates and address as an array
//     } else {
//       console.log(`No se encontraron coordenadas para: ${locationText}`);
//       return null;
//     }
//   } catch (error) {
//     console.error('Error al obtener coordenadas:', error.message);
//     return null;
//   }
// }

// module.exports = getCoordinatesFromLocation;

