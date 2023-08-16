const imprudences = require('./imprudences'); // Importamos la lista de tipos de imprudencias

const generateSummary = (score, imprudenceType, vecesReportadas) => {
  // Buscamos la sección correspondiente al tipo de imprudencia en la lista
  const section = imprudences.find((sec) => sec.rows.some((row) => row.title === imprudenceType));
  
  if (!section) {
    return `Resumen del Conductor:\n\n` +
      `Según nuestros registros, el conductor ha sido reportado en ${vecesReportadas} ocasiones ` +
      `por ${imprudenceType}. El puntaje de riesgo de accidente es de ${score} en una escala del 1 al 100.`;
  }

  // Buscamos la fila correspondiente al tipo de imprudencia en la sección
  const imprudenceRow = section.rows.find((row) => row.title === imprudenceType);

  // Generamos recomendaciones en base al puntaje
  let recommendation = "";
  if (score >= 1 && score <= 10) {
    recommendation = "Recomendamos mantener al conductor retroalimentado sobre las consecuencias que puede traer este comportamiento para garantizar la seguridad vial.";
  } else if (score >= 11 && score <= 30) {
    recommendation = "Es importante abordar este comportamiento de manera proactiva para evitar situaciones más peligrosas en el futuro. Se recomienda tomar medidas correctivas y continuar respetando las señales de tránsito y las reglas viales.";
  } else if (score >= 31 && score <= 60) {
    recommendation = "Sugerimos implementar medidas educativas y de sensibilización para concientizar al conductor sobre la importancia de una conducción responsable y segura.";
  } else if (score >= 61 && score <= 80) {
    recommendation = "Es fundamental proporcionar retroalimentación constante sobre su desempeño al volante y seguir de cerca su comportamiento en la vía.";
  } else if (score >= 81 && score <= 100) {
    recommendation = "Prioricemos la seguridad vial. Recomendamos tomar acciones inmediatas y coordinar con las autoridades pertinentes para abordar esta situación con la mayor prontitud posible.";
  }

  // Generamos el resumen
  const summary = `Resumen del Conductor:\n\n` +
    `Según nuestros registros, el conductor ha sido reportado en ${vecesReportadas} ocasiones ` +
    `por ${imprudenceType}. El puntaje de riesgo de accidente es de ${score} en una escala del 1 al 100. ` +
    `${imprudenceRow.description}\n\n${recommendation}`;

  // Verificar que el resumen no supere los 400 caracteres
  if (summary.length > 400) {
    return summary.substring(0, 400) + "...";
  }

  return summary;
};

// Ejemplo de uso
const score = 85; // Puntaje del 1 al 100
const imprudenceType = "Exceso de velocidad"; // Tipo de imprudencia más reportada
const vecesReportadas = 20; // Cantidad de veces reportadas

const resumen = generateSummary(score, imprudenceType, vecesReportadas);
console.log(resumen);
