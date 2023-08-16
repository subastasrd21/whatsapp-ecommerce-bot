const listOfSections = [
  {
    title: 'Conducción temeraria',
    rows: [
      {
        title: 'Exceso de velocidad',
        description: 'El conductor excede los limites de velocidad.',
        id: 'speeding',
      },
      {
        title: 'Adelantam. inseguros',
        description: 'Adelantamientos sin visibilidad, cruce de lineas.',
        id: 'overtaking',
      },
      {
        title: 'Violencia',
        description: 'Violencia verbal, insultos/amenazas o violencia fisica del conductor.',
        id: 'violence',
      },
      {
        title: 'Accidente',
        description: 'Si el conductor estuvo involucrado en un accidente por negligencia.',
        id: 'accident',
      },
    ],
  },
  {
    title: 'Desatención a señales',
    rows: [
      {
        title: 'Saltar semáforos',
        description: 'Ignorar semáforos en rojo puede causar colisiones graves.',
        id: 'running_lights',
      },
      {
        title: 'Ignorar señales alto',
        description: 'No hacer alto en señales puede resultar en choques severos.',
        id: 'ignoring_stop',
      },
      {
        title: 'No Ceder paso',
        description: 'Omitir ceder el paso puede generar accidentes de tráfico.',
        id: 'failure_yield',
      },
    ],
  },
  {
    title: 'Distracciones al volante',
    rows: [
      {
        title: 'Uso de teléfono',
        description: 'El teléfono al volante reduce concentración en la vía.',
        id: 'phone_distraction',
      },
      {
        title: 'Mal estacionado',
        description: 'Estacionado en un lugar que obstruye el paso.',
        id: 'bad_parking',
      },
      {
        title: 'Alcohol o sustancias',
        description: 'Conductor tiene comportamiento posiblemente bajo efectos de sustancias.',
        id: 'conversation_distraction',
      },
    ],
  },
];

module.exports = listOfSections;
