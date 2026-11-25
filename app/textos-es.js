/* Textos de la aplicación en español. Otro idioma: copiar este archivo como textos-en.js, etc., y traducir los valores. */
window.TEXTOS = {
  idioma: 'es',
  locale: 'es',
  // nombres completos de las traducciones, sobre el pasaje
  nombresTraduccion: { NVI: 'Nueva Versión Internacional', NTV: 'Nueva Traducción Viviente', DHH: 'Dios Habla Hoy' },

  // navegación
  todasSemanas: 'Todas las semanas',
  todasSeries: 'Todas las series',
  volverSemana: 'Volver a la semana',
  volver: 'Volver',
  tamano: 'Cambiar el tamaño del texto',
  dia: d => `Día ${d}`,
  semana: n => `Semana ${n}`,
  semanaDe: (n, total) => `Semana ${n} de ${total}`,
  semanaTitulo: (n, titulo) => `Semana ${n} · ${titulo}`,
  noDisponible: 'Esta semana todavía no está disponible.',

  // página de la serie
  comenzar: 'Comenzar',
  continuar: 'Continuar',
  repasar: 'Repasar',
  continuarDetalle: (n, d, titulo) => `Semana ${n} · Día ${d} · ${titulo}`,
  comenzarDetalle: (n, titulo) => `Semana ${n} · ${titulo}`,
  comoFunciona: 'Cómo funciona',
  lasSemanas: n => `Las ${n} semanas`,
  enCurso: 'En curso',
  completa: 'Completa',
  proximamente: 'Próximamente',
  comoMeditar: 'Cómo meditar: preguntas guía de Lectio Divina',
  guiaTitulo: 'Preguntas guía de Lectio Divina',

  // tus notas
  tusNotas: 'Tus notas',
  // El primer paso de «Cómo funciona» en todas las series, y una línea al pie de cada semana (aprobados 2026-11-24/25)
  elegirComo: ['Elige cómo leer:', 'en pantalla, donde puedes resaltar, subrayar y escribir notas junto al pasaje; o en papel, imprimiendo cada semana o guardándola como PDF.'],
  semanaPapel: '¿Prefieres el papel? Toca «Imprimir la semana» arriba para imprimir esta semana o guardarla como PDF.',
  notasDispositivo: 'Tus notas, tus marcas y los días que terminaste se guardan solo en este dispositivo, no en internet. Si cambias de teléfono o se borran los datos del navegador, se pierden. Guarda una copia de vez en cuando.',
  notasSemana: 'Tus notas se guardan solo en este dispositivo.',
  notasSemanaEnlace: 'Cómo guardar una copia',
  avisoTitulo: 'Te recomendamos agregar el estudio a tu pantalla de inicio.',
  comoHacerlo: 'Cómo hacerlo',
  avisoPorQue: 'Así se abre como una app, y tus notas no se pierden.',
  pasosIOS: [
    'Toca el botón Compartir {compartir}: el cuadrado con una flecha hacia arriba. En Safari está abajo; en Chrome, arriba a la derecha.',
    'Baja en el menú y toca «Agregar a inicio».',
    'Toca «Agregar». El estudio aparecerá en tu pantalla de inicio. Ábrelo siempre desde ahí.'
  ],
  pasosAndroid: [
    'Toca el menú ⋮ arriba a la derecha.',
    'Toca «Agregar a la pantalla principal» (o «Instalar app»).',
    'Confirma. El estudio aparecerá en tu pantalla de inicio. Ábrelo siempre desde ahí.'
  ],
  avisoIOSNota: 'Hazlo antes de empezar: en iPhone, el estudio de la pantalla de inicio guarda sus notas aparte del navegador. Si ya empezaste, guarda una copia de tus notas en «Tus notas», más abajo, y restáurala desde el estudio de la pantalla de inicio.',
  ahoraNo: 'Ahora no',
  compartir: 'Compartir',
  enInicio: 'Estás usando el estudio desde tu pantalla de inicio.',
  avisoEnlace: 'Cómo agregar el estudio a la pantalla de inicio',
  guardarCopia: 'Guardar una copia',
  restaurarPregunta: '¿Cambiaste de teléfono o de computadora, o se borraron tus notas?',
  restaurarCopia: 'Restaurar una copia',
  borrarTodo: 'Borrar todo y empezar de nuevo',
  borrarConfirmar: 'Toca otra vez para borrar todo',
  copiaLista: 'Copia lista.',
  copiaExplica: 'Se guarda como un archivo para el estudio, no para leerlo. Para recuperar tus notas, ábrelo con «Restaurar una copia».',
  copiaTitulo: 'Copia de mis notas',
  archivoNotas: 'notas',
  copiaNoValida: 'Ese archivo no es una copia de este estudio.',
  copiaVacia: 'La copia no tiene notas para restaurar.',
  copiaPregunta: fecha => `¿Restaurar la copia del ${fecha}? Lo que tengas aquí para los mismos días se reemplazará.`,
  copiaRestaurada: 'Listo: tus notas y marcas se restauraron.',

  // semana
  estaSemana: 'Esta semana',
  preguntasN: n => `${n} preguntas`,
  alFinalSemana: 'Al final de la semana',
  destinoTexto: n => `${n} preguntas para conversar con tu grupo sobre lo que Dios te habló esta semana.`,
  imprimirSemana: 'Imprimir la semana',

  // día
  prepNota: 'Vas a leer este pasaje tres veces, en tres traducciones, con silencio después de cada lectura.',
  traduccion: 'Traducción',
  escribirNota: 'Escribir una nota',
  loQueRecibiste: 'Lo que recibiste en esta lectura',
  notaPrivada: 'Solo tú la ves. Se guarda en este dispositivo.',
  notasEnPasaje: 'Notas en el pasaje',
  atras: 'Atrás',
  terminar: 'Terminar',
  diaCompleto: d => `Día ${d} completo`,
  tusNotasHoy: 'Tus notas de hoy',
  sigueDia: (d, ref) => `Sigue el día ${d}: ${ref}.`,
  irDia: d => `Ir al día ${d}`,
  terminaste: titulo => `Terminaste los cinco días. Ahora sigue «${titulo}»: seis preguntas para conversar con tu grupo sobre lo que Dios te habló esta semana.`,
  verPreguntas: 'Ver las preguntas',

  // grupo
  pasajesSemana: 'Pasajes de la semana',
  nNotas: n => n === 1 ? '1 nota' : `${n} notas`,
  notaGrupo: 'Tus notas se guardan solo en este dispositivo. El grupo no las ve.',

  // marcas
  marcar: 'Marcar el pasaje',
  herramientas: {
    r: ['Resaltar', 'Arrastra sobre las palabras.'],
    l: ['Línea', 'Arrastra: la línea queda recta, horizontal o vertical.'],
    e: ['Encerrar', 'Arrastra sobre las palabras para encerrarlas, o toca una palabra.'],
    w: ['Flecha', 'Arrastra desde una palabra hasta otra.'],
    n: ['Nota', 'Toca una palabra o arrastra sobre una frase. Tu nota se escribe debajo del pasaje.'],
    b: ['Borrar', 'Toca una marca para quitarla.']
  },
  colores: ['amarillo', 'verde', 'azul', 'rosa'],
  color: nombre => `Color ${nombre}`,
  deshacer: 'Deshacer',
  listo: 'Listo',
  eligeHerramienta: 'Elige una herramienta.',
  escribeNota: 'Escribe tu nota',
  notaN: (n, frase) => `Nota ${n}: ${frase}`,

  // silencio
  terminarAntes: 'Terminar antes',
  terminoSilencio: 'Terminó el silencio.',
  sigueCuandoQuieras: 'Sigue cuando quieras.',
  minutosSilencio: 'Minutos de silencio',
  iniciarSilencio: 'Iniciar silencio',
  minutos: m => `${m} min`,

  // impresión
  imprimirTexto: 'Se imprime en tamaño carta, en blanco y negro: unas 13 páginas. Imprime a doble cara para que cada día quede en dos páginas enfrentadas: el pasaje a la izquierda y las lecturas a la derecha.',
  imprimir: 'Imprimir',
  imprimirConsejo: 'Si en las esquinas aparecen la fecha o la dirección de la página, desactiva «Encabezados y pies de página» en la ventana de impresión.',
  paraElGrupo: 'Para el grupo',
  continuacion: ref => `${ref} (continuación)`,
  comoUsar: 'Cómo usar esta semana',
  comoUsarTexto: titulo => [
    'Cada día, un pasaje. Antes de empezar, cálmate y pide al Espíritu Santo que proteja y guíe tu meditación.',
    'Lee el pasaje tres veces, cada vez en otra traducción. Después de cada lectura, guarda silencio y escribe lo que recibiste.',
    `Al final de la semana, «${titulo}» te ayuda a conversarlo con tu grupo.`
  ]
};
