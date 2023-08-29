const THREE_MONTHS_MS = 3 * 30 * 24 * 60 * 60 * 1000;  // Milisegundos en 3 meses
const ObjectId = require('mongodb').ObjectId;
const haversine = require('haversine');

async function calculateRisk(driverId, reportType, reportLocation, client) {
    const db = client.db('driport');

    const reports = await db
      .collection('reports')
      .find({ "vehicle.driverId": new ObjectId(driverId) })
      .toArray();

    // Imprimir los informes obtenidos
    console.log('Informes:', reports);
  
    // Ordena los informes por fecha
    reports.sort((a, b) => new Date(a.date) - new Date(b.date));
  
    let riskScoreTotal = 0;
    const riskScore = {
      speeding: 10,
      overtaking: 20,
      violence: 30,
      accident: 40,
      running_lights: 50,
      ignoring_stop: 60,
      failure_yield: 70,
      phone_distraction: 80,
      bad_parking: 90,
      conversation_distraction: 100
    };
  
    // Si no hay informes, asignar el riskMatrix actual como primer informe
    if (reports.length === 0) {
      riskScoreTotal = riskScore[reportType];
    } else {
      for (let i = 0; i < reports.length; i++) {
        const report = reports[i];
  
        // Suma el puntaje de riesgo de la infracción
        riskScoreTotal += riskScore[report.reportType];
  
        // Compara la ubicación de este informe con los informes previos de los últimos 3 meses
        const currReportDate = new Date(report.date.$date);
        for (let j = 0; j < i; j++) {
          const prevReport = reports[j];
          const prevReportDate = new Date(prevReport.date.$date);
  
          // Si el informe anterior es mayor a 3 meses, salta este informe
          if (currReportDate - prevReportDate > THREE_MONTHS_MS) {
            continue;
          }
  
          const a = { latitude: report.reportLocation.latitude, longitude: report.reportLocation.longitude };
          const b = { latitude: prevReport.reportLocation.latitude, longitude: prevReport.reportLocation.longitude };
  
          const distance = haversine(a, b);
          if (distance <= 1000) {
            riskScoreTotal += 5;
            if (prevReport.reportType === reportType && prevReport.reportType !== report.reportType) {
              riskScoreTotal += 5;
            }
          }
        }
  
        // Si la puntuación es mayor que 100, límítala a 100
        // riskScoreTotal = Math.min(riskScoreTotal, 100);
      }
    }
  
    // Dividimos el puntaje total entre 10 para obtener un número decimal con 2 decimales
    return (riskScoreTotal / 10).toFixed(2);
  }
  
  module.exports = calculateRisk;
  