/* The app's words in English (approved by the user on 2026-11-25). Same keys as textos-es.js; written natively, not word for word. */
window.TEXTOS = {
  idioma: 'en',
  locale: 'en-US',
  // full names of the translations, above the passage
  nombresTraduccion: { NIV: 'New International Version', NLT: 'New Living Translation', MSG: 'The Message' },
  // words in the page address (#week-1/day-2); inside the app the routes keep their Spanish names
  rutas: { semana: 'week', dia: 'day', grupo: 'group', imprimir: 'print', guia: 'guide' },

  // moving around
  todasSemanas: 'All weeks',
  todasSeries: 'All series',
  volverSemana: 'Back to the week',
  volver: 'Back',
  tamano: 'Change text size',
  dia: d => `Day ${d}`,
  semana: n => `Week ${n}`,
  semanaDe: (n, total) => `Week ${n} of ${total}`,
  semanaTitulo: (n, titulo) => `Week ${n} · ${titulo}`,
  noDisponible: "This week isn't available yet.",

  // series page
  comenzar: 'Begin',
  continuar: 'Continue',
  repasar: 'Review',
  continuarDetalle: (n, d, titulo) => `Week ${n} · Day ${d} · ${titulo}`,
  comenzarDetalle: (n, titulo) => `Week ${n} · ${titulo}`,
  comoFunciona: 'How it works',
  lasSemanas: n => `The ${n} weeks`,
  enCurso: 'In progress',
  completa: 'Done',
  proximamente: 'Coming soon',
  comoMeditar: 'How to meditate: Lectio Divina guide questions',
  guiaTitulo: 'Lectio Divina guide questions',

  // your notes
  tusNotas: 'Your notes',
  elegirComo: ['Choose how to read:', 'on screen, where you can highlight, underline and write notes beside the passage; or on paper, printing each week or saving it as a PDF.'],
  semanaPapel: 'Prefer paper? Tap “Print the week” above to print this week or save it as a PDF.',
  notasDispositivo: "Your notes, your markings and the days you've finished are saved only on this device, not online. If you change phones or your browser data is cleared, they're lost. Save a copy now and then.",
  notasSemana: 'Your notes are saved only on this device.',
  notasSemanaEnlace: 'How to save a copy',
  avisoTitulo: 'We recommend adding the study to your Home Screen.',
  comoHacerlo: 'Show me how',
  avisoPorQue: 'It opens like an app, and your notes stay safe.',
  pasosIOS: [
    "Tap the Share button {compartir}: the square with an arrow pointing up. In Safari it's at the bottom; in Chrome, at the top right.",
    'Scroll down the menu and tap “Add to Home Screen.”',
    'Tap “Add.” The study will appear on your Home Screen. Always open it from there.'
  ],
  pasosAndroid: [
    'Tap the ⋮ menu at the top right.',
    'Tap “Add to Home screen” (or “Install app”).',
    'Confirm. The study will appear on your Home Screen. Always open it from there.'
  ],
  avisoIOSNota: "Do this before you begin: on iPhone, the study on your Home Screen keeps its notes separate from the browser. If you've already started, save a copy of your notes under “Your notes” below, then restore it from the study on your Home Screen.",
  ahoraNo: 'Not now',
  compartir: 'Share',
  enInicio: "You're using the study from your Home Screen.",
  avisoEnlace: 'How to add the study to your Home Screen',
  guardarCopia: 'Save a copy',
  restaurarPregunta: 'New phone or computer, or did your notes get erased?',
  restaurarCopia: 'Restore a copy',
  borrarTodo: 'Erase everything and start over',
  borrarConfirmar: 'Tap again to erase everything',
  copiaLista: 'Copy saved.',
  copiaExplica: "It's saved as a file for the study to read, not for you to read. To get your notes back, open it with “Restore a copy.”",
  copiaTitulo: 'My study notes',
  archivoNotas: 'notes',
  copiaNoValida: "That file isn't a copy from this study.",
  copiaVacia: 'That copy has no notes to restore.',
  copiaPregunta: fecha => `Restore the copy from ${fecha}? Whatever you have here for the same days will be replaced.`,
  copiaRestaurada: 'Done: your notes and markings are back.',

  // week
  estaSemana: 'This week',
  preguntasN: n => `${n} questions`,
  alFinalSemana: 'At the end of the week',
  destinoTexto: n => `${n} questions to talk over with your group about what God said to you this week.`,
  imprimirSemana: 'Print the week',

  // day
  prepNota: "You'll read this passage three times, in three translations, with silence after each reading.",
  traduccion: 'Translation',
  escribirNota: 'Write a note',
  loQueRecibiste: 'What you received in this reading',
  notaPrivada: "Only you can see it. It's saved on this device.",
  notasEnPasaje: 'Notes on the passage',
  atras: 'Back',
  terminar: 'Finish',
  diaCompleto: d => `Day ${d} complete`,
  tusNotasHoy: "Today's notes",
  sigueDia: (d, ref) => `Next is Day ${d}: ${ref}.`,
  irDia: d => `Go to Day ${d}`,
  terminaste: titulo => `You've finished all five days. Next comes “${titulo}”: six questions to talk over with your group about what God said to you this week.`,
  verPreguntas: 'See the questions',

  // group
  pasajesSemana: "This week's passages",
  nNotas: n => n === 1 ? '1 note' : `${n} notes`,
  notaGrupo: "Your notes are saved only on this device. The group doesn't see them.",

  // markings
  marcar: 'Mark the passage',
  herramientas: {
    r: ['Highlight', 'Drag across the words.'],
    l: ['Line', 'Drag: the line stays straight, across or down.'],
    e: ['Circle', 'Drag across the words to circle them, or tap a word.'],
    w: ['Arrow', 'Drag from one word to another.'],
    n: ['Note', 'Tap a word or drag across a phrase. Your note goes below the passage.'],
    b: ['Erase', 'Tap a marking to remove it.']
  },
  colores: ['yellow', 'green', 'blue', 'pink'],
  color: nombre => nombre.charAt(0).toUpperCase() + nombre.slice(1),
  deshacer: 'Undo',
  listo: 'Done',
  eligeHerramienta: 'Choose a tool.',
  escribeNota: 'Write your note',
  notaN: (n, frase) => `Note ${n}: ${frase}`,

  // silence
  terminarAntes: 'End early',
  terminoSilencio: 'The silence is over.',
  sigueCuandoQuieras: "Go on when you're ready.",
  minutosSilencio: 'Minutes of silence',
  iniciarSilencio: 'Start silence',
  minutos: m => `${m} min`,

  // printing
  imprimirTexto: 'It prints on letter-size paper, in black and white: about 13 pages. Print double-sided so each day sits on two facing pages, the passage on the left and the readings on the right.',
  imprimir: 'Print',
  imprimirConsejo: 'If the date or the page address shows up in the corners, turn off “Headers and footers” in the print window.',
  paraElGrupo: 'For the group',
  continuacion: ref => `${ref} (continued)`,
  comoUsar: 'How to use this week',
  comoUsarTexto: titulo => [
    'One passage a day. Before you begin, quiet your heart and ask the Holy Spirit to guard and guide your meditation.',
    'Read the passage three times, in a different translation each time. After each reading, keep a moment of silence and write down what you received.',
    `At the end of the week, “${titulo}” helps you talk it over with your group.`
  ]
};
