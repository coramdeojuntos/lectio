/* Experimentando a Dios juntos: la misma aplicación para cada serie, idioma y semana.
   El contenido llega de serie.js (lo que se repite cada semana) y de semanas/semana-NN.js (lo propio de cada semana);
   los textos de la interfaz, de textos-xx.js. */
const T = window.TEXTOS;
const SERIE = window.SERIE;
const TRADUCCIONES = SERIE.traducciones;
const ESCALAS = [1, 1.15, 1.3];
const PREFIJO = `${SERIE.clave}:`;
const TOTAL = SERIE.semanas.length;
const app = document.getElementById('app');
let SEM = null, NUM = 0;

const memoria = {};
function leer(clave, porDefecto) {
  if (clave in memoria) return memoria[clave];
  try {
    const v = localStorage.getItem(PREFIJO + clave);
    return v === null ? porDefecto : JSON.parse(v);
  } catch (e) { return porDefecto; }
}
function guardar(clave, valor) {
  memoria[clave] = valor;
  try { localStorage.setItem(PREFIJO + clave, JSON.stringify(valor)); } catch (e) {}
}
function borrarTodo() {
  Object.keys(memoria).forEach(k => delete memoria[k]);
  Object.keys(deshacerPila).forEach(k => delete deshacerPila[k]);
  try {
    Object.keys(localStorage).filter(k => k.startsWith(PREFIJO)).forEach(k => localStorage.removeItem(k));
  } catch (e) {}
}

const enPantallaInicio = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

/* Copia de seguridad: un archivo con todo lo guardado, para llevarlo a otro dispositivo o navegador */
const CLAVE_VALIDA = /^(s\d+:.+|color|aviso-inicio|ultimo)$/;
function datosGuardados() {
  const datos = {};
  // Solo lo de la app (notas, marcas, avances…): reading.js guarda Claro/Oscuro con la misma etiqueta de la serie,
  // como texto simple, y no va en la copia. Cada clave por separado, para que una que falle no corte la copia.
  try {
    Object.keys(localStorage).filter(k => k.startsWith(PREFIJO) && CLAVE_VALIDA.test(k.slice(PREFIJO.length))).forEach(k => {
      try { datos[k.slice(PREFIJO.length)] = JSON.parse(localStorage.getItem(k)); } catch (e) {}
    });
  } catch (e) {}
  Object.assign(datos, memoria);
  return datos;
}
async function exportarCopia() {
  const hoy = new Date().toISOString().slice(0, 10);
  const contenido = JSON.stringify({ app: SERIE.clave, version: 1, fecha: hoy, datos: datosGuardados() });
  const archivo = new File([contenido], `${SERIE.clave}-${T.archivoNotas}-${hoy}.json`, { type: 'application/json' });
  // En el teléfono, el menú de compartir permite guardarla en Archivos, enviarla o pasarla por AirDrop
  if (matchMedia('(pointer: coarse)').matches && navigator.canShare && navigator.canShare({ files: [archivo] })) {
    try { await navigator.share({ files: [archivo], title: T.copiaTitulo }); return true; }
    catch (e) { if (e.name === 'AbortError') return false; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(archivo);
  a.download = archivo.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  return true;
}
function fechaLegible(iso) {
  const f = new Date(iso + 'T12:00:00');
  return isNaN(f) ? iso : f.toLocaleDateString(T.locale, { day: 'numeric', month: 'long', year: 'numeric' });
}
async function importarCopia(archivo) {
  let copia;
  try { copia = JSON.parse(await archivo.text()); } catch (e) { copia = null; }
  if (!copia || copia.app !== SERIE.clave || !copia.datos || typeof copia.datos !== 'object') {
    return T.copiaNoValida;
  }
  const claves = Object.keys(copia.datos).filter(k => CLAVE_VALIDA.test(k));
  if (!claves.length) return T.copiaVacia;
  if (!confirm(T.copiaPregunta(fechaLegible(copia.fecha)))) return '';
  claves.forEach(k => guardar(k, copia.datos[k]));
  Object.keys(deshacerPila).forEach(k => delete deshacerPila[k]);
  return T.copiaRestaurada;
}

function esc(t) {
  return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
const enfasis = t => esc(t).replace(/\*(.+?)\*/g, '<em>$1</em>');
const dos = n => String(n).padStart(2, '0');
const claveHecho = (d, n = NUM) => `s${n}:d${d}:hecho`;
const claveNota = (d, l) => `s${NUM}:d${d}:l${l}:nota`;
const claveGrupo = p => `s${NUM}:grupo:${p}`;
const claveMarcas = (d, t) => `s${NUM}:d${d}:${t}:marcas`;
const estaHecho = (d, n = NUM) => leer(claveHecho(d, n), false) === true;
const siguienteDia = () => {
  for (let d = 1; d <= SEM.pasajes.length; d++) if (!estaHecho(d)) return d;
  return 0;
};
const infoSemana = n => SERIE.semanas.find(s => s.numero === n);
const diasDe = n => (infoSemana(n) || {}).dias || 5;
// Algunas series agrupan sus semanas en tramos (la de la salvación sigue La línea de tiempo del evangelio)
// y ponen bajo cada título la palabra teológica
const TRAMOS = SERIE.tramos || [];
const tramoDe = n => TRAMOS.find(t => n >= t.desde && n <= t.hasta);
const terminoDe = n => (infoSemana(n) || {}).termino || '';
const colorTramo = n => { const t = tramoDe(n); return t ? ` tramo-${t.color}` : ''; };
function estadoSemana(n) {
  let hechos = 0;
  for (let d = 1; d <= diasDe(n); d++) if (estaHecho(d, n)) hechos++;
  return hechos === diasDe(n) ? 'hecha' : hechos ? 'curso' : '';
}

/* Cada semana se carga solo cuando se abre. Lleva la misma versión que serie.js en index.html,
   así que al subir ese número los navegadores también piden de nuevo las semanas. */
const VERSION = (document.querySelector('script[src*="serie.js"]')?.src.match(/[?&]v=([^&]+)/) || [])[1];
const cargas = {};
function cargarSemana(n) {
  const info = infoSemana(n);
  if (!info || !info.disponible) return Promise.resolve(false);
  const lista = () => window.SEMANAS && window.SEMANAS[n];
  if (!lista()) {
    cargas[n] = cargas[n] || new Promise(listo => {
      const s = document.createElement('script');
      s.src = `semanas/semana-${dos(n)}.js${VERSION ? `?v=${VERSION}` : ''}`;
      s.onload = () => listo();
      s.onerror = () => { delete cargas[n]; listo(); };
      document.head.appendChild(s);
    });
  }
  return (cargas[n] || Promise.resolve()).then(() => {
    if (!lista()) return false;
    SEM = window.SEMANAS[n];
    NUM = n;
    return true;
  });
}

const ICONO = {
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  volver: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  resaltar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 21h7M6 17l10-10 3 3-10 10H6z"/></svg>',
  linea: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 12h16"/></svg>',
  borrar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 20h11M4.5 15L13 6l6.5 5.5-7.5 8.5H8z"/></svg>',
  deshacer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 5L4 9l4 4M4 9h10a5 5 0 010 10h-3"/></svg>',
  encerrar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="7" width="18" height="10" rx="4"/></svg>',
  flecha: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 18C6 10 11 6.5 19 6.5M15 3l4 3.5-3.5 4"/></svg>',
  nota: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h9M4 13h11M4 18h7"/><path d="M17.5 4.5l1.5-1.5v6"/></svg>',
  compartir: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4M6 11H5v10h14V11h-1"/></svg>'
};

/* Cada palabra lleva su número para que las marcas sigan al texto cuando cambia el tamaño o se gira el teléfono */
function escritura(lineas) {
  let n = 0, aclaracion = false;
  // [corchetes] sin números son una aclaración nuestra (quién habla o actúa), no texto de la traducción: van en un tono más suave
  const clasePal = x => {
    if (/^…?\[(?!\d)/.test(x)) aclaracion = true;
    const clase = aclaracion ? 'pal aclaracion' : 'pal';
    if (aclaracion && x.includes(']')) aclaracion = false;
    return clase;
  };
  const parrafos = lineas.map(l => {
    let clase = '', t = l;
    if (t.startsWith('=')) { clase = 'prosa'; t = t.slice(1); }
    else if (t.startsWith('>>')) { clase = 'sangria2'; t = t.slice(2); }
    else if (t.startsWith('>')) { clase = 'sangria'; t = t.slice(1); }
    // lo que no lleva espacio entre sí (número de versículo y palabra, palabras unidas por raya) no se separa al final del renglón
    const html = t.split(/(\s+)/).filter(Boolean).map(trozo => {
      if (/^\s+$/.test(trozo)) return ' ';
      const partes = trozo.split(/(\[\d+(?:-\d+)?\]|—)/).filter(Boolean).map(x => {
        const v = x.match(/^\[(\d+(?:-\d+)?)\]$/);
        return v ? `<sup class="v">${v[1]}</sup>` : `<span class="${clasePal(x)}" data-i="${n++}">${esc(x)}</span>`;
      });
      return partes.length > 1 ? `<span class="junto">${partes.join('')}</span>` : partes[0];
    }).join('');
    return `<p${clase ? ` class="${clase}"` : ''}>${html}</p>`;
  }).join('');
  return `<svg class="capa-marcas bajo" aria-hidden="true"></svg>${parrafos}<svg class="capa-marcas sobre" aria-hidden="true"></svg>`;
}

const estado = { vista: 'serie', dia: 1, paso: 0, traduccion: {}, minutos: {}, herramienta: null, panel: false, tradGrupo: {}, anterior: '', aNotas: false, aviso: '' };

/* Vistas */
// ruta: una vista de la app; o, si empieza con «../», una página fuera de la serie (la lista de series)
function barra(titulo, ruta, etiqueta) {
  const destino = ruta.startsWith('../') ? `data-accion="salir" data-href="${ruta}"` : `data-accion="ir" data-ruta="${ruta}"`;
  return `<div class="topbar"><div class="topbar-inner">
    <button class="atras" ${destino} aria-label="${esc(etiqueta)}"><b class="flecha" aria-hidden="true">‹</b><span>${esc(titulo)}</span></button>
    ${enlaceIdioma()}
    <button class="text-size" type="button" data-text-size>Aa</button>
    ${NUM && estado.vista === 'semana' ? `<button class="print-button" data-accion="ir" data-ruta="${rutaSemana('/imprimir')}" aria-label="${esc(T.imprimirSemana)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/></svg><span class="word">${esc(T.imprimirSemana)}</span></button>` : ''}
    <button class="theme-toggle" type="button" data-theme-toggle></button>
  </div></div>`;
}
const rutaSemana = (sufijo = '') => `semana-${NUM}${sufijo}`;

/* Direcciones en el idioma de la serie (2026-11-25): por dentro las rutas siempre usan las palabras en español
   (semana-1/dia-2, grupo, imprimir, guia); en la dirección se ven con las palabras de T.rutas (en inglés, week-1/day-2…).
   Una dirección con las palabras en español sirve en cualquier idioma: así el enlace al otro idioma lleva al mismo lugar. */
const RUTAS = T.rutas || {};
const aUrl = r => r.replace(/[a-z]+/g, w => RUTAS[w] || w);
const deUrl = h => { const inv = {}; for (const k in RUTAS) inv[RUTAS[k]] = k; return h.replace(/[a-z]+/g, w => inv[w] || w); };
const rutaActual = () => deUrl(location.hash.slice(1));
/* El mismo lugar en el otro idioma (Design.md: «English» / «Español» en la barra), solo si la serie tiene pareja */
function enlaceIdioma() {
  const o = SERIE.otroIdioma;
  if (!o) return '';
  const r = rutaActual();
  return `<a class="lang" href="${esc(o.ruta)}${location.protocol === 'file:' ? 'index.html' : ''}${r ? '#' + esc(r) : ''}" lang="${esc(o.idioma)}" hreflang="${esc(o.idioma)}">${esc(o.etiqueta)}</a>`;
}

// a dónde lleva «Continuar»: el primer día sin terminar de las semanas disponibles
// «Continuar» retoma donde el lector se quedó (2026-11-24): el primer día sin terminar después del último día que terminó
// («ultimo»). Un día que se saltó no lo hace volver atrás: sigue sin ✓ en su semana, que dice «En curso».
// Si no hay nada sin terminar después, va al primer día pendiente de la serie. Quien empezó antes de este cambio
// no tiene «ultimo»: se toma el día terminado más avanzado.
function siguientePaso() {
  const disponibles = SERIE.semanas.filter(s => s.disponible);
  const dias = [];
  disponibles.forEach(s => { for (let d = 1; d <= diasDe(s.numero); d++) dias.push({ s: s.numero, d, titulo: s.titulo, hecho: estaHecho(d, s.numero) }); });
  if (!dias.length) return null;
  if (!dias.some(x => x.hecho)) {
    const p = disponibles[0];
    return { texto: T.comenzar, detalle: T.comenzarDetalle(p.numero, p.titulo), ruta: `semana-${p.numero}` };
  }
  const u = leer('ultimo', null);
  let i = u ? dias.findIndex(x => x.s === u.s && x.d === u.d && x.hecho) : -1;
  if (i < 0) i = dias.map(x => x.hecho).lastIndexOf(true);
  const sig = dias.find((x, j) => j > i && !x.hecho) || dias.find(x => !x.hecho);
  if (sig) return { texto: T.continuar, detalle: T.continuarDetalle(sig.s, sig.d, sig.titulo), ruta: `semana-${sig.s}/dia-${sig.d}` };
  const ult = disponibles[disponibles.length - 1];
  return { texto: T.repasar, detalle: T.comenzarDetalle(ult.numero, ult.titulo), ruta: `semana-${ult.numero}` };
}

/* Agregar a la pantalla de inicio: los pasos del teléfono que se está usando, cerca del principio hasta que se haga o se descarte */
// Android primero (2026-11-25): la vista de teléfono de Chrome en una computadora dice «Android» y también tiene pantalla táctil
// con plataforma «MacIntel», así que la prueba del iPad la tomaba por iPhone. Un iPhone o iPad de verdad nunca dice «Android».
const esAndroid = /Android/i.test(navigator.userAgent);
const esIOS = !esAndroid && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
function pasosInicio() {
  const lista = pasos => `<ol class="pasos-inicio">${pasos.map(p =>
    `<li>${esc(p).replace('{compartir}', `<span class="icono-en-linea" role="img" aria-label="${esc(T.compartir)}">${ICONO.compartir}</span>`)}</li>`).join('')}</ol>`;
  if (esAndroid) return lista(T.pasosAndroid);
  if (esIOS) return lista(T.pasosIOS) + `<p class="tenue">${esc(T.avisoIOSNota)}</p>`;
  return `<h4>iPhone</h4>${lista(T.pasosIOS)}<h4>Android</h4>${lista(T.pasosAndroid)}<p class="tenue">${esc(T.avisoIOSNota)}</p>`;
}
function avisoInicio() {
  if (enPantallaInicio() || !(esIOS || esAndroid) || leer('aviso-inicio', false)) return '';
  // una tarjeta corta (2026-11-25): los pasos aparecen solo al tocar «Cómo hacerlo»
  return `<section class="aviso">
      <h3>${esc(T.avisoTitulo)}</h3>
      <p>${esc(T.avisoPorQue)}</p>
      <div class="aviso-pasos" hidden>${pasosInicio()}</div>
      <div class="aviso-botones">
        <button class="listo" data-accion="aviso-pasos">${esc(T.comoHacerlo)}</button>
        <button class="listo" data-accion="aviso">${esc(T.ahoraNo)}</button>
      </div>
    </section>`;
}

// «Tus notas» (2026-11-24): primero qué se guarda y dónde, luego una sola acción clara (guardar una copia),
// restaurar para quien cambió de teléfono, la pantalla de inicio solo en teléfonos, y al final, discreto, borrar todo.
function seccionNotas() {
  // desde la pantalla de inicio ya está hecho; en un teléfono, los pasos quedan a mano, plegados; en una computadora, nada
  const ayuda = enPantallaInicio()
    ? `<p class="hecho-inicio">${ICONO.check}<span>${esc(T.enInicio)}</span></p>`
    : (esIOS || esAndroid) ? `<details class="ayuda-inicio"><summary>${esc(T.avisoEnlace)}</summary><p>${esc(T.avisoPorQue)}</p>${pasosInicio()}</details>` : '';
  return `<section class="notas-serie" id="notas">
      <h2>${esc(T.tusNotas)}</h2>
      <p class="notas-explica">${esc(T.notasDispositivo)}</p>
      <div class="notas-acciones">
        <button class="boton secundario" data-accion="exportar">${esc(T.guardarCopia)}</button>
        <p class="copia-explica">${esc(T.copiaExplica)}</p>
        <p class="restaurar">${esc(T.restaurarPregunta)} <button class="enlace en-linea" data-accion="importar">${esc(T.restaurarCopia)}</button></p>
        <input type="file" id="archivo-copia" accept=".json,application/json" hidden>
        <p role="status" id="estado-copia"></p>
      </div>
      ${ayuda}
      <button class="enlace borrar-todo" data-accion="borrar" id="borrar">${esc(T.borrarTodo)}</button>
    </section>`;
}

// «Cómo funciona» (2026-11-25): primero «Elige cómo leer» (en pantalla o en papel, igual para todas las series),
// luego los pasos de la serie. Abierto para quien todavía no termina ningún día; después, una línea plegada.
function comoFunciona() {
  const pasos = `<ol class="pasos"><li><b>${esc(T.elegirComo[0])}</b> ${esc(T.elegirComo[1])}</li>${SERIE.comoFunciona.map(t => `<li>${enfasis(t)}</li>`).join('')}</ol>
        <button class="enlace" data-accion="ir" data-ruta="guia">${esc(T.comoMeditar)}</button>`;
  const empezado = SERIE.semanas.some(s => s.disponible && estadoSemana(s.numero));
  return empezado
    ? `<details class="como-funciona plegado"><summary>${esc(T.comoFunciona)}</summary>${pasos}</details>`
    : `<section class="como-funciona"><h2>${esc(T.comoFunciona)}</h2>${pasos}</section>`;
}

function vistaSerie() {
  const sig = siguientePaso();
  const fila = s => {
    const est = s.disponible ? estadoSemana(s.numero) : '';
    const marca = !s.disponible ? T.proximamente : est === 'hecha' ? `<span class="sr">${T.completa}</span>${ICONO.check}` : est === 'curso' ? T.enCurso : '';
    const termino = s.termino ? `<small class="termino">${esc(s.termino)}</small>` : '';
    return `<li><button class="fila${est === 'hecha' ? ' hecho' : ''}${est === 'curso' ? ' siguiente' : ''}${s.disponible ? '' : ' pronto'}" data-accion="ir" data-ruta="semana-${s.numero}"${s.disponible ? '' : ' disabled'}>
      <span class="dia">${s.numero}</span><span class="ref">${esc(s.titulo)}${termino}</span><span class="estado">${marca}</span></button></li>`;
  };
  // con tramos, cada uno lleva su encabezado y su propia lista; sin ellos, una sola lista
  const semanas = TRAMOS.length
    ? TRAMOS.map(t => `<div class="tramo tramo-${t.color}"><h3>${esc(t.titulo)}</h3><p>${esc(t.detalle)}</p></div>
        <ol class="lista semanas">${SERIE.semanas.filter(s => s.numero >= t.desde && s.numero <= t.hasta).map(fila).join('')}</ol>`).join('')
    : `<ol class="lista semanas">${SERIE.semanas.map(fila).join('')}</ol>`;
  return `
    <div class="contenido barra-serie">${barra(T.todasSeries, SERIE.inicio || '../../', T.todasSeries)}</div>
    ${SERIE.portada ? `<figure class="portada"><img src="${esc(SERIE.portada.src)}" alt="${esc(SERIE.portada.alt)}" onerror="this.parentNode.hidden=true"></figure>` : ''}
    <div class="contenido">
      <header class="encabezado">
        <a class="atributo coleccion" href="../../">${esc(SERIE.coleccion.titulo)}</a>
        <h1>${esc(SERIE.titulo)}</h1>
        <p class="curso">${esc(SERIE.coleccion.lema)}</p>
      </header>
      ${estado.aviso ? `<p class="aviso-breve" role="status">${esc(estado.aviso)}</p>` : ''}
      <div class="definicion">${SERIE.introduccion.map(t => `<p>${enfasis(t)}</p>`).join('')}</div>
      ${sig ? `<button class="boton principal continuar" data-accion="ir" data-ruta="${sig.ruta}">${esc(sig.texto)}<span>${esc(sig.detalle)}</span></button>` : ''}
      ${avisoInicio()}
      ${comoFunciona()}
      <section>
        <h2>${esc(T.lasSemanas(TOTAL))}</h2>
        ${semanas}
      </section>
      ${seccionNotas()}
      <footer class="pie">
        <p>${SERIE.creditos.map(esc).join('<br>')}</p>
      </footer>
    </div>`;
}

function vistaSemana() {
  const sig = siguienteDia();
  const camino = SERIE.semanas.map(s =>
    `<span class="${s.numero === NUM ? 'actual' : s.disponible && estadoSemana(s.numero) === 'hecha' ? 'hecha' : ''}${colorTramo(s.numero)}"></span>`).join('');
  const tramo = tramoDe(NUM), termino = terminoDe(NUM);
  const filas = SEM.pasajes.map((p, i) => {
    const d = i + 1, hecho = estaHecho(d), esSig = d === sig;
    const marca = hecho ? ICONO.check : (esSig ? T.continuar : '');
    return `<li><button class="fila${hecho ? ' hecho' : ''}${esSig ? ' siguiente' : ''}" data-accion="ir" data-ruta="${rutaSemana(`/dia-${d}`)}">
      <span class="dia">${esc(T.dia(d))}</span><span class="ref">${esc(p.ref)}</span>
      <span class="estado">${hecho ? `<span class="sr">${esc(T.completa)}</span>${ICONO.check}` : marca}</span></button></li>`;
  }).join('');
  return `<div class="contenido">
      ${barra(T.todasSemanas, '', T.todasSemanas)}
      <header class="encabezado">
        <div>
          <p class="tenue pequeno">${esc(T.semanaDe(NUM, TOTAL))}${tramo ? ` · ${esc(tramo.titulo)}` : ''}</p>
          <div class="camino" aria-hidden="true" style="grid-template-columns:repeat(${TOTAL},1fr)">${camino}</div>
        </div>
        <div><h1>${esc(SEM.titulo)}</h1>${termino ? `<p class="termino">${esc(termino)}</p>` : ''}</div>
      </header>
      <div class="definicion">${SEM.definicion.map(t => `<p>${enfasis(t)}</p>`).join('')}</div>
      <section>
        <h2>${esc(T.estaSemana)}</h2>
        <ol class="lista">${filas}</ol>
      </section>
      <section class="destino">
        <p class="destino-etiqueta">${esc(T.alFinalSemana)}</p>
        <h2 class="destino-titulo">${esc(SERIE.respuesta.titulo)}</h2>
        <p class="destino-texto">${esc(T.destinoTexto(SERIE.preguntas.length))}</p>
        <button class="boton principal" data-accion="ir" data-ruta="${rutaSemana('/grupo')}">${esc(T.verPreguntas)}</button>
      </section>
      <footer class="pie">
        <p>${esc(T.semanaPapel)}</p>
        <p>${esc(T.notasSemana)} <button class="enlace en-linea" data-accion="ir-notas">${esc(T.notasSemanaEnlace)}</button></p>
        <p>${SERIE.creditos.map(esc).join('<br>')}</p>
      </footer>
    </div>`;
}

function barraDia(detalle) {
  const p = SEM.pasajes[estado.dia - 1];
  return barra(`${T.semana(NUM)} · ${SEM.titulo}`, rutaSemana(), T.volverSemana);
}

function vistaPreparacion() {
  const p = SEM.pasajes[estado.dia - 1];
  return `<div class="contenido">
    ${barraDia()}
    <header class="encabezado" style="gap:.25rem">
      <p class="atributo">${esc(SEM.titulo)} · ${esc(T.dia(estado.dia))}</p>
      <h1>${esc(p.ref)}</h1>
    </header>
    <div class="hilos" aria-hidden="true"><span class="lleno"></span><span></span><span></span><span></span></div>
    <p class="guia" style="border-top:0;padding-top:0;font-size:1.375rem">${esc(SERIE.preparacion)}</p>
    <p class="tenue">${esc(T.prepNota)}</p>
    <nav class="navegacion sola"><button class="boton principal" data-accion="paso" data-paso="1">${esc(T.comenzar)}</button></nav>
  </div>`;
}

function vistaLectura() {
  const i = estado.paso - 1;
  const lec = SERIE.lecturas[i];
  const p = SEM.pasajes[estado.dia - 1];
  const trad = estado.traduccion[i] || lec.traduccion;
  const nota = leer(claveNota(estado.dia, i + 1), '');
  const hilos = '<span class="lleno"></span>' + SERIE.lecturas.map((_, n) => `<span${n <= i ? ' class="lleno"' : ''}></span>`).join('');
  const botones = TRADUCCIONES.map(t =>
    `<button data-accion="traduccion" data-trad="${t}" aria-pressed="${t === trad}">${t}</button>`).join('');
  const siguiente = i < SERIE.lecturas.length - 1 ? SERIE.lecturas[i + 1].nombre : T.terminar;
  return `<div class="contenido">
    ${barraDia(lec.nombre)}
    <header class="encabezado">
      <p class="atributo">${esc(SEM.titulo)} · ${esc(T.dia(estado.dia))}</p><h1>${esc(p.ref)}</h1>
    </header>
    <div class="hilos" aria-hidden="true">${hilos}</div>
    <p class="atributo paso-nombre">${esc(lec.nombre)}</p>
    <div class="fila-lectura">
      <div class="traducciones" role="group" aria-label="${esc(T.traduccion)}">${botones}</div>
      ${vistaMarcador()}
    </div>
    <p class="trans-nombre">${esc(T.nombresTraduccion[trad] || trad)}</p>
    <article class="escritura" id="escritura" data-marcas="${claveMarcas(estado.dia, trad)}">${escritura(p[trad])}</article>
    <ol class="notas-pie" aria-label="${esc(T.notasEnPasaje)}"></ol>
    <p class="guia"><b>${esc(lec.duracion)}</b>${esc(lec.guia)}</p>
    <div class="acciones">
    <section class="silencio" id="silencio" aria-live="polite"></section>
    <details${nota ? ' open' : ''}>
      <summary>${esc(T.escribirNota)}</summary>
      <label for="nota">${esc(T.loQueRecibiste)}</label>
      <textarea id="nota" data-clave="${claveNota(estado.dia, i + 1)}">${esc(nota)}</textarea>
      <p class="nota-privada">${esc(T.notaPrivada)}</p>
    </details>
    </div>
    <nav class="navegacion">
      <button class="boton secundario" data-accion="paso" data-paso="${estado.paso - 1}">${esc(T.atras)}</button>
      <button class="boton principal" data-accion="paso" data-paso="${estado.paso + 1}">${esc(siguiente)}</button>
    </nav>
  </div>`;
}

function notasDelDia(d) {
  return SERIE.lecturas.map((l, n) => {
    const t = leer(claveNota(d, n + 1), '');
    return t ? `<div><p class="tenue pequeno" style="font-family:var(--sans)">${esc(l.nombre)}</p><p>${esc(t)}</p></div>` : '';
  }).join('');
}
function palabrasDe(lineas) {
  const out = [];
  lineas.forEach(l => l.replace(/^(=|>>|>)/, '').split(/(\[\d+(?:-\d+)?\]|\s+|—)/).filter(Boolean).forEach(x => {
    if (!/^\[\d+(?:-\d+)?\]$/.test(x) && !/^\s+$/.test(x)) out.push(x);
  }));
  return out;
}
function notasPieDelDia(d) {
  const p = SEM.pasajes[d - 1];
  return TRADUCCIONES.map(t => {
    const pals = palabrasDe(p[t]);
    return notasOrdenadas(marcasDe(claveMarcas(d, t))).filter(k => (k.s || '').trim()).map(k =>
      `<div><p class="tenue pequeno" style="font-family:var(--sans)">${t} · ${esc(frase(pals, k.a, k.b))}</p><p style="white-space:pre-wrap">${esc(k.s.trim())}</p></div>`).join('');
  }).join('');
}
const cuantasNotas = d => SERIE.lecturas.filter((_, n) => leer(claveNota(d, n + 1), '')).length
  + TRADUCCIONES.reduce((s, t) => s + marcasDe(claveMarcas(d, t)).filter(k => k.t === 'n' && (k.s || '').trim()).length, 0);
const tradConMasMarcas = d => TRADUCCIONES.reduce((m, t) => marcasDe(claveMarcas(d, t)).length > marcasDe(claveMarcas(d, m)).length ? t : m, TRADUCCIONES[0]);
function botonesGrupo(i, trad) {
  return TRADUCCIONES.map(t => `<button data-accion="trad-grupo" data-p="${i}" data-trad="${t}" aria-pressed="${t === trad}"${marcasDe(claveMarcas(i + 1, t)).length ? ' class="con-marcas"' : ''}>${t}</button>`).join('');
}

function vistaFin() {
  const notas = notasDelDia(estado.dia) + notasPieDelDia(estado.dia);
  // el siguiente día sin terminar después de este; si no hay, el primero que falte en la semana (como «Continuar»)
  const pendientes = SEM.pasajes.map((_, i) => i + 1).filter(d => !estaHecho(d));
  const sig = pendientes.find(d => d > estado.dia) || pendientes[0] || 0;
  return `<div class="contenido">
    ${barraDia()}
    <header class="encabezado">
      <p class="tenue pequeno">${esc(SEM.titulo)}</p>
      <h1>${esc(T.diaCompleto(estado.dia))}</h1>
    </header>
    ${notas ? `<section><h2 style="margin-bottom:.75rem">${esc(T.tusNotasHoy)}</h2><div class="mis-notas">${notas}</div></section>` : ''}
    <p class="tenue">${sig ? esc(T.sigueDia(sig, SEM.pasajes[sig - 1].ref)) : esc(T.terminaste(SERIE.respuesta.titulo))}</p>
    <nav class="navegacion sola"><button class="boton principal" data-accion="ir" data-ruta="${rutaSemana(sig ? `/dia-${sig}` : '/grupo')}">${esc(sig ? T.irDia(sig) : T.verPreguntas)}</button>
      <button class="enlace" data-accion="ir" data-ruta="${rutaSemana()}">${esc(T.volverSemana)}</button></nav>
  </div>`;
}

function vistaGrupo() {
  const pasajes = SEM.pasajes.map((p, i) => {
    const notas = notasDelDia(i + 1), cuantas = cuantasNotas(i + 1);
    const trad = estado.tradGrupo[i] || tradConMasMarcas(i + 1);
    return `
    <details class="pasaje">
      <summary>${esc(p.ref)}${cuantas ? `<span class="cuantas">${esc(T.nNotas(cuantas))}</span>` : ''}</summary>
      <div class="version">
        <div class="traducciones" role="group" aria-label="${esc(T.traduccion)}">${botonesGrupo(i, trad)}</div>
        <div class="escritura" data-marcas="${claveMarcas(i + 1, trad)}">${escritura(p[trad])}</div>
        <ol class="notas-pie" aria-label="${esc(T.notasEnPasaje)}"></ol>
      </div>
      ${notas ? `<div class="notas-pasaje"><h3>${esc(T.tusNotas)}</h3><div class="mis-notas">${notas}</div></div>` : ''}
    </details>`;
  }).join('');
  const preguntas = SERIE.preguntas.map((q, i) => `
    <li>
      <p class="pregunta">${esc(q.texto)}</p>
      <p class="tema">${esc(q.tema)}</p>
      <div class="campo">
        <label for="grupo${i + 1}" class="sr-label">${esc(T.tusNotas)}</label>
        <textarea id="grupo${i + 1}" data-clave="${claveGrupo(i + 1)}">${esc(leer(claveGrupo(i + 1), ''))}</textarea>
      </div>
    </li>`).join('');
  return `<div class="contenido">
    ${barra(T.semanaTitulo(NUM, SEM.titulo), rutaSemana(), T.volverSemana)}
    <header class="encabezado">
      <h1>${esc(SERIE.respuesta.titulo)}</h1>
    </header>
    <p class="definicion">${esc(SERIE.respuesta.explicacion)}</p>
    <section>
      <h2 style="margin-bottom:.5rem">${esc(T.pasajesSemana)}</h2>
      <div>${pasajes}</div>
    </section>
    <ol class="preguntas">${preguntas}</ol>
    <p class="nota-privada">${esc(T.notaGrupo)}</p>
  </div>`;
}

function vistaGuia() {
  const lecturas = SERIE.lecturas.map(l => `
    <section class="lectura-guia">
      <h2>${esc(l.nombre)}</h2>
      <p class="duracion">${esc(l.duracion)}</p>
      <p>${esc(l.guia)}</p>
    </section>`).join('');
  return `<div class="contenido">
    ${barra(T.guiaTitulo, estado.anterior, T.volver)}
    <h1>${esc(T.guiaTitulo)}</h1>
    <p class="guia" style="border-top:0;padding-top:0">${esc(SERIE.preparacion)}</p>
    ${lecturas}
  </div>`;
}

/* Imprimir la semana: el lector imprime (o guarda en PDF) desde su propio navegador */
function vistaImprimir() {
  return `<div class="contenido">
    ${barra(T.semanaTitulo(NUM, SEM.titulo), rutaSemana(), T.volverSemana)}
    <h1>${esc(T.imprimirSemana)}</h1>
    <p>${esc(T.imprimirTexto)}</p>
    <button class="boton principal" data-accion="imprimir">${esc(T.imprimir)}</button>
    <p class="tenue pequeno">${esc(T.imprimirConsejo)}</p>
  </div>
  <div class="impresion" aria-hidden="true">${hojasImpresion()}</div>`;
}
function escrituraImpresa(lineas) {
  return lineas.map(l => {
    let clase = '';
    if (l.startsWith('=')) { clase = 'prosa'; l = l.slice(1); }
    else if (l.startsWith('>>')) { clase = 'sangria2'; l = l.slice(2); }
    else if (l.startsWith('>')) { clase = 'sangria'; l = l.slice(1); }
    return `<p${clase ? ` class="${clase}"` : ''}>${esc(l).replace(/\[(\d+(?:-\d+)?)\]/g, '<sup class="vh">$1</sup>').replace(/\[(?!\d)[^\]]*\]/g, '<span class="aclaracion">$&</span>')}</p>`;
  }).join('');
}
function hojasImpresion() {
  const R = SERIE.respuesta;
  const caja = '<span class="caja"></span>';
  // más renglones de los que caben; el espacio disponible corta los que sobran sin dejar uno a medias
  const renglones = `<div class="renglones">${'<i></i>'.repeat(34)}</div>`;
  const cabeza = derecha => `<header class="cabeza-h"><span>${esc(T.semanaTitulo(NUM, SEM.titulo))}</span><span>${derecha}</span></header>`;
  const pie = n => `<footer class="pie-h">${n}</footer>`;
  const camino = SERIE.semanas.map(s => `<span${s.numero === NUM ? ' class="actual"' : ''}></span>`).join('');
  const dias = SEM.pasajes.map((p, i) => `<li>${caja}<span class="dia-h">${esc(T.dia(i + 1))}</span><span>${esc(p.ref)}</span></li>`).join('');
  const hojas = [`<section class="hoja portada-h">
    <p class="curso-h">${esc(SERIE.nombreCompleto)}</p>
    <div class="semana-h"><span>${esc(T.semanaDe(NUM, TOTAL))}${tramoDe(NUM) ? ` · ${esc(tramoDe(NUM).titulo)}` : ''}</span><div class="camino-h" style="grid-template-columns:repeat(${TOTAL},1fr)">${camino}</div></div>
    <h1>${esc(SEM.titulo)}</h1>
    ${terminoDe(NUM) ? `<p class="termino-h">${esc(terminoDe(NUM))}</p>` : ''}
    <div class="definicion-h">${SEM.definicion.map(t => `<p>${enfasis(t)}</p>`).join('')}</div>
    <div class="dos-h">
      <section><h2>${esc(T.estaSemana)}</h2><ol class="dias-h">${dias}</ol></section>
      <section class="como-h"><h2>${esc(T.comoUsar)}</h2>${T.comoUsarTexto(R.titulo).map(t => `<p>${esc(t)}</p>`).join('')}</section>
    </div>
    ${pie(1)}
  </section>`];
  let n = 2;
  SEM.pasajes.forEach((p, i) => {
    const versiones = TRADUCCIONES.map(t =>
      `<section class="version-h" data-t="${t}"><p class="etiqueta-h">${t}</p><div class="texto-h">${escrituraImpresa(p[t])}</div></section>`).join('');
    hojas.push(`<section class="hoja pasaje-h" data-ref="${esc(p.ref)}">
      ${cabeza(esc(T.dia(i + 1)))}
      <h1 class="ref-h">${esc(p.ref)}</h1>
      <div class="cuerpo-h"><div class="versiones-h">${versiones}</div><aside class="margen-h"><span>${esc(T.tusNotas)}</span></aside></div>
      ${pie(n++)}
    </section>`);
    const bloques = SERIE.lecturas.map(l => `<section class="lectura-h">
        <h3><span>${esc(l.nombre)} · ${l.traduccion}</span><span class="silencio-h">${caja}${esc(l.duracion)}</span></h3>
        <p class="guia-h">${esc(l.guia)}</p>${renglones}
      </section>`).join('');
    hojas.push(`<section class="hoja">
      ${cabeza(`${esc(T.dia(i + 1))} · ${esc(p.ref)}`)}
      <p class="prep-h">${esc(SERIE.preparacion)}</p>
      ${bloques}
      <p class="hecho-h">${caja}${esc(T.diaCompleto(i + 1))}</p>
      ${pie(n++)}
    </section>`);
  });
  const pregunta = (q, num) => `<section class="pregunta-h"><p><span class="num">${num}</span>${esc(q.texto)}</p><p class="tema-h">${esc(q.tema)}</p>${renglones}</section>`;
  hojas.push(`<section class="hoja">
    ${cabeza(esc(T.paraElGrupo))}
    <h1 class="ref-h">${esc(R.titulo)}</h1>
    <p class="explicacion-h">${esc(R.explicacion)}</p>
    ${SERIE.preguntas.slice(0, 3).map((q, i) => pregunta(q, i + 1)).join('')}
    ${pie(n++)}
  </section>`);
  hojas.push(`<section class="hoja">
    ${cabeza(esc(T.paraElGrupo))}
    ${SERIE.preguntas.slice(3).map((q, i) => pregunta(q, i + 4)).join('')}
    <p class="creditos-h">${SERIE.creditos.map(esc).join('<br>')}</p>
    ${pie(n++)}
  </section>`);
  return hojas.join('');
}
/* Un pasaje largo primero se achica un poco; si aun así no cabe, sigue en otra página, renglón por renglón, sin dejar
   el nombre de una traducción con menos de tres renglones al pie. La página de las lecturas y las de las preguntas
   nunca se parten ni se corren */
function ajustarImpresion() {
  const imp = document.querySelector('.impresion');
  if (!imp) return;
  imp.innerHTML = hojasImpresion();
  const desborda = h => h.scrollHeight > h.clientHeight + 1;
  const letra = (h, t, a) => h.querySelectorAll('.texto-h p').forEach(p => {
    p.style.fontSize = t ? `calc(var(--pt) * ${t})` : '';
    p.style.lineHeight = a || '';
  });
  const continuacion = hoja => {
    const c = hoja.cloneNode(true);
    c.querySelector('.versiones-h').innerHTML = '';
    c.querySelector('.ref-h').textContent = T.continuacion(hoja.dataset.ref);
    return c;
  };
  imp.querySelectorAll('.hoja.pasaje-h').forEach(hoja => {
    let t = 11.5, a = 1.62;
    while (desborda(hoja) && t > 10) { t -= .25; a = Math.max(1.5, a - .02); letra(hoja, t, a); }
    if (!desborda(hoja)) return;
    letra(hoja);
    let actual = hoja;
    while (desborda(actual)) {
      const sig = continuacion(actual), destino = sig.querySelector('.versiones-h');
      actual.after(sig);
      const origen = actual.querySelector('.versiones-h');
      // el último renglón pasa a la página siguiente, bajo el nombre de su traducción, hasta que todo quepa
      const pasarAlFrente = (version, p) => {
        let parte = destino.firstElementChild;
        if (!parte || parte.dataset.t !== version.dataset.t) {
          parte = version.cloneNode(true);
          parte.querySelector('.texto-h').innerHTML = '';
          destino.prepend(parte);
        }
        parte.querySelector('.texto-h').prepend(p);
        if (!version.querySelector('.texto-h p')) version.remove();
      };
      while (desborda(actual) && origen.querySelector('.texto-h p')) {
        const ultima = origen.lastElementChild, lineas = ultima.querySelectorAll('.texto-h p');
        if (origen.children.length === 1 && lineas.length === 1) break;
        pasarAlFrente(ultima, lineas[lineas.length - 1]);
      }
      const ultima = origen.lastElementChild;
      if (ultima && origen.children.length > 1 && destino.firstElementChild && destino.firstElementChild.dataset.t === ultima.dataset.t) {
        const lineas = [...ultima.querySelectorAll('.texto-h p')];
        if (lineas.length < 3) lineas.reverse().forEach(p => pasarAlFrente(ultima, p));
      }
      if (!destino.children.length) { sig.remove(); break; }
      actual = sig;
    }
  });
  imp.querySelectorAll('.pie-h').forEach((p, i) => { p.textContent = i + 1; });
}

/* Marcas sobre la Escritura: todas se guardan como palabras (de la palabra a hasta la b), así siguen al texto en cualquier pantalla, tamaño o vista */
// Cuatro herramientas (2026-11-24). Encerrar (e) y Flecha (w) ya no se ofrecen, pero se siguen dibujando y borrando:
// los lectores que ya las usaron no pierden sus marcas (por eso siguen en TIPOS).
const HERRAMIENTAS = [['r', ICONO.resaltar], ['l', ICONO.linea], ['n', ICONO.nota], ['b', ICONO.borrar]]
  .map(([h, icono]) => [h, T.herramientas[h][0], icono, T.herramientas[h][1]]);
const TIPOS = new Set(['r', 's', 'v', 'e', 'w', 'n']);
const COLORES = T.colores;
const deshacerPila = {};
let trazo = null;

// Las marcas dibujadas a mano de versiones anteriores no sabían a qué palabras apuntaban; se descartan
const marcasDe = clave => leer(clave, []).filter(k => k && TIPOS.has(k.t));
try {
  Object.keys(localStorage).filter(k => k.startsWith(PREFIJO) && k.endsWith(':marcas')).forEach(k => {
    const clave = k.slice(PREFIJO.length), todas = leer(clave, []);
    if (Array.isArray(todas) && marcasDe(clave).length !== todas.length) guardar(clave, marcasDe(clave));
  });
} catch (e) {}

function vistaMarcador() {
  const botones = HERRAMIENTAS.map(([h, nombre, icono]) =>
    `<button data-accion="herramienta" data-h="${h}" aria-pressed="false">${icono}<span>${nombre}</span></button>`).join('');
  const colores = COLORES.map((nombre, i) =>
    `<button class="c${i}" data-accion="color" data-color="${i}" aria-label="${esc(T.color(nombre))}" aria-pressed="false"><span></span></button>`).join('');
  return `<div class="marcador" id="marcador">
    <button class="abrir-marcador" id="abrir-marcador" data-accion="marcador" aria-expanded="false">${ICONO.resaltar}<span>${esc(T.marcar)}</span></button>
    <div class="panel" id="panel" role="toolbar" aria-label="${esc(T.marcar)}" hidden>
      <div class="herramientas">${botones}</div>
      <div class="opciones">
        <div class="colores" id="colores" role="group" aria-label="Color">${colores}</div>
        <button class="icono" data-accion="deshacer" id="deshacer" aria-label="${esc(T.deshacer)}" title="${esc(T.deshacer)}">${ICONO.deshacer}</button>
        <button class="listo" data-accion="marcador">${esc(T.listo)}</button>
      </div>
      <p class="pista" id="pista"></p>
    </div>
  </div>`;
}
function actualizarMarcador() {
  const caja = document.getElementById('marcador'), c = document.getElementById('escritura');
  if (!caja || !c) return;
  const h = estado.herramienta, color = leer('color', 0);
  caja.classList.toggle('activo', !!h);
  c.classList.toggle('marcando', !!h);
  document.getElementById('panel').hidden = !estado.panel;
  const abrir = document.getElementById('abrir-marcador');
  abrir.hidden = estado.panel;
  abrir.setAttribute('aria-expanded', estado.panel);
  caja.querySelectorAll('[data-h]').forEach(b => b.setAttribute('aria-pressed', b.dataset.h === h));
  caja.querySelectorAll('[data-color]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.color === color));
  document.getElementById('colores').classList.toggle('apagado', h === 'b' || h === 'n');
  const def = HERRAMIENTAS.find(x => x[0] === h);
  document.getElementById('pista').textContent = def ? def[3] : T.eligeHerramienta;
  document.getElementById('deshacer').disabled = !(deshacerPila[c.dataset.marcas] || []).length;
}

const n1 = v => +v.toFixed(1);
function medir(c) {
  const b = c.getBoundingClientRect();
  const pals = [...c.querySelectorAll('.pal')].map(s => {
    const r = s.getBoundingClientRect();
    return { x: r.left - b.left, y: r.top - b.top, w: r.width, h: r.height };
  });
  return { em: parseFloat(getComputedStyle(c).fontSize), ancho: b.width, pals };
}
function tramos(g, a, b) {
  const out = [];
  for (let i = Math.max(a, 0); i <= Math.min(b, g.pals.length - 1); i++) {
    const p = g.pals[i], u = out[out.length - 1];
    if (u && Math.abs(u.y - p.y) < p.h / 2) u.fin = p.x + p.w;
    else out.push({ ini: p.x, fin: p.x + p.w, y: p.y, h: p.h });
  }
  return out;
}
/* Flecha de palabra a palabra: una curva suave que sale del borde de una y llega al borde de la otra */
function flecha(g, k) {
  const A = g.pals[k.a], B = k.px == null ? g.pals[k.b] : null;
  if (!A || (k.px == null && !B)) return null;
  const ca = [A.x + A.w / 2, A.y + A.h / 2];
  const cb = B ? [B.x + B.w / 2, B.y + B.h / 2] : [k.px, k.py];
  const dx = cb[0] - ca[0], dy = cb[1] - ca[1], largo = Math.hypot(dx, dy);
  if (largo < .5 * g.em) return null;
  // se curva hacia arriba si va de lado y hacia la derecha si va de arriba abajo
  let nx = -dy / largo, ny = dx / largo;
  if (Math.abs(dx) >= Math.abs(dy) ? ny > 0 : nx < 0) { nx = -nx; ny = -ny; }
  const curva = Math.min(.3 * largo, 3 * g.em) + (Math.abs(dy) < A.h / 2 ? .5 * g.em : 0);
  const C = [(ca[0] + cb[0]) / 2 + nx * curva, (ca[1] + cb[1]) / 2 + ny * curva];
  const borde = (c, w, h, pad) => {
    const vx = C[0] - c[0], vy = C[1] - c[1];
    const t = Math.min((w / 2 + pad) / (Math.abs(vx) || 1e-6), (h / 2 + pad) / (Math.abs(vy) || 1e-6), 1);
    return [c[0] + vx * t, c[1] + vy * t];
  };
  const S = borde(ca, A.w, A.h, .06 * g.em);
  const E = B ? borde(cb, B.w, B.h, .1 * g.em) : cb;
  const ang = Math.atan2(E[1] - C[1], E[0] - C[0]), punta = .5 * g.em;
  const ala = d => [n1(E[0] - punta * Math.cos(ang + d)), n1(E[1] - punta * Math.sin(ang + d))];
  return { S, C, E, alas: [ala(-.45), ala(.45)] };
}
function puntoCurva(f, t) {
  const u = 1 - t;
  return [u * u * f.S[0] + 2 * u * t * f.C[0] + t * t * f.E[0], u * u * f.S[1] + 2 * u * t * f.C[1] + t * t * f.E[1]];
}
function dibujarMarca(g, k) {
  const color = `c${k.c}`;
  if (k.t === 'r') return tramos(g, k.a, k.b).map(s =>
    `<rect class="r ${color}" x="${n1(s.ini - .08 * g.em)}" y="${n1(s.y)}" width="${n1(s.fin - s.ini + .16 * g.em)}" height="${n1(s.h)}" rx="${n1(.12 * g.em)}"/>`).join('');
  if (k.t === 's') return tramos(g, k.a, k.b).map(s => {
    const y = n1(s.y + s.h - .1 * g.em);
    return `<line class="l ${color}" x1="${n1(s.ini)}" y1="${y}" x2="${n1(s.fin)}" y2="${y}"/>`;
  }).join('');
  if (k.t === 'v') {
    const a = g.pals[k.a], b = g.pals[k.b];
    return a && b ? `<line class="l ${color}" x1="${n1(k.x * g.em)}" y1="${n1(a.y)}" x2="${n1(k.x * g.em)}" y2="${n1(b.y + b.h)}"/>` : '';
  }
  if (k.t === 'e') return tramos(g, k.a, k.b).map(s =>
    `<rect class="l ${color}" x="${n1(s.ini - .15 * g.em)}" y="${n1(s.y + .02 * g.em)}" width="${n1(s.fin - s.ini + .3 * g.em)}" height="${n1(s.h - .04 * g.em)}" rx="${n1(.3 * g.em)}"/>`).join('');
  if (k.t === 'n') return tramos(g, k.a, k.b).map(s => {
    const y = n1(s.y + s.h - .06 * g.em);
    return `<line class="pie-linea" x1="${n1(s.ini)}" y1="${y}" x2="${n1(s.fin)}" y2="${y}"/>`;
  }).join('');
  if (k.t === 'w') {
    const f = flecha(g, k);
    return f ? `<path class="l ${color}" d="M${n1(f.S[0])} ${n1(f.S[1])}Q${n1(f.C[0])} ${n1(f.C[1])} ${n1(f.E[0])} ${n1(f.E[1])}M${f.alas[0].join(' ')}L${n1(f.E[0])} ${n1(f.E[1])}L${f.alas[1].join(' ')}"/>` : '';
  }
  return '';
}

/* Notas al pie: un número junto a la palabra y la nota, siempre visible, debajo del pasaje */
const notasOrdenadas = lista => lista.filter(k => k.t === 'n').sort((x, y) => x.a - y.a || x.b - y.b);
function frase(pals, a, b) {
  const w = pals.slice(a, b + 1);
  const t = w.length > 8 ? `${w.slice(0, 4).join(' ')} … ${w.slice(-3).join(' ')}` : w.join(' ');
  return t.replace(/^[«¿¡"“(]+/, '').replace(/[,.;:»"”?!)]+$/, '');
}
function ponerLlamadas(c, lista) {
  const porPalabra = {};
  notasOrdenadas(lista).forEach((k, i) => (porPalabra[k.b] = porPalabra[k.b] || []).push(i + 1));
  const firma = JSON.stringify(porPalabra);
  if (c.dataset.llamadas === firma && c.querySelectorAll('.llamada').length === Object.keys(porPalabra).length) return;
  c.dataset.llamadas = firma;
  c.querySelectorAll('.llamada').forEach(s => s.remove());
  Object.entries(porPalabra).forEach(([b, nums]) => {
    const w = c.querySelector(`.pal[data-i="${b}"]`);
    if (w) w.insertAdjacentHTML('afterend', `<sup class="llamada">${nums.join(',')}</sup>`);
  });
}
function ajustarAlto(t) {
  t.style.height = 'auto';
  t.style.height = `${t.scrollHeight + 2}px`;
}
// Todas las cajas donde se escribe crecen con el texto (2026-11-24): al abrir la vista, al escribir,
// al cambiar el tamaño del texto (Aa) o el ancho de la ventana, y al abrir «Escribir una nota».
// Las que están ocultas (dentro de un <details> cerrado) esperan a verse.
function ajustarAltos() {
  app.querySelectorAll('textarea').forEach(t => { if (t.offsetParent) ajustarAlto(t); });
}
function pintarNotasPie(c, lista) {
  const ol = c.nextElementSibling;
  if (!ol || !ol.classList.contains('notas-pie')) return;
  const editable = c.id === 'escritura', notas = notasOrdenadas(lista);
  const firma = JSON.stringify(notas.map(k => [k.id, k.a, k.b, editable ? '' : k.s]));
  if (ol.dataset.firma === firma) return;
  ol.dataset.firma = firma;
  const activo = document.activeElement, foco = activo && ol.contains(activo) ? activo.dataset.pieId : null;
  const pals = [...c.querySelectorAll('.pal')].map(s => s.textContent);
  ol.innerHTML = notas.map((k, i) => {
    const f = esc(frase(pals, k.a, k.b)), texto = (k.s || '').trim();
    if (!editable && !texto) return '';
    return `<li><span class="num">${i + 1}</span><div><p class="frase">${f}</p>${editable
      ? `<textarea rows="1" data-pie-id="${k.id}" aria-label="${T.notaN(i + 1, f)}" placeholder="${esc(T.escribeNota)}">${esc(k.s || '')}</textarea>`
      : `<p class="texto">${esc(texto)}</p>`}</div></li>`;
  }).join('');
  ol.querySelectorAll('textarea').forEach(ajustarAlto);
  if (foco) { const t = ol.querySelector(`[data-pie-id="${foco}"]`); if (t) t.focus({ preventScroll: true }); }
}
function enfocarNota(c, id) {
  const t = c.nextElementSibling && c.nextElementSibling.querySelector(`[data-pie-id="${id}"]`);
  if (!t) return;
  t.focus({ preventScroll: true });
  t.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
// Una nota que se dejó en blanco no deja número en el pasaje
function limpiarNotasVacias(todas) {
  const c = document.getElementById('escritura');
  if (!c) return;
  const activo = document.activeElement, foco = !todas && activo && activo.dataset ? activo.dataset.pieId : null;
  const lista = marcasDe(c.dataset.marcas);
  const quedan = lista.filter(k => k.t !== 'n' || (k.s || '').trim() || k.id === foco);
  if (quedan.length === lista.length) return;
  guardar(c.dataset.marcas, quedan);
  pintarMarcas(c);
  actualizarMarcador();
}

/* El resaltado va debajo del texto, como tinta de marcador; lo demás va encima, como pluma */
function pintarMarcas(c, g, extra) {
  const bajo = c.querySelector('.capa-marcas.bajo'), sobre = c.querySelector('.capa-marcas.sobre');
  if (!bajo || !sobre) return;
  const lista = (trazo && trazo.c === c ? trazo.lista : marcasDe(c.dataset.marcas)).concat(extra ? [extra] : []);
  if (!g) { ponerLlamadas(c, lista); pintarNotasPie(c, lista); }
  if (!c.offsetWidth) return;
  const medida = g || medir(c);
  bajo.innerHTML = lista.filter(k => k.t === 'r').map(k => dibujarMarca(medida, k)).join('');
  sobre.innerHTML = lista.filter(k => k.t !== 'r').map(k => dibujarMarca(medida, k)).join('');
}
const observador = 'ResizeObserver' in window
  ? new ResizeObserver(es => { if (!trazo) es.forEach(e => pintarMarcas(e.target)); }) : null;
function prepararMarcas() {
  if (observador) observador.disconnect();
  document.querySelectorAll('[data-marcas]').forEach(c => {
    pintarMarcas(c);
    if (observador) observador.observe(c);
  });
  actualizarMarcador();
}
if (document.fonts) {
  document.fonts.ready.then(prepararMarcas);
  if (document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', prepararMarcas);
}

function palabraEn(g, x, y) {
  let mejor = 0, dist = Infinity;
  g.pals.forEach((p, i) => {
    const dx = Math.max(p.x - x, 0, x - p.x - p.w), dy = Math.max(p.y - y, 0, y - p.y - p.h);
    const d = Math.hypot(dx, dy * 2);
    if (d < dist) { dist = d; mejor = i; }
  });
  return mejor;
}
function marcaEn(g, lista, x, y) {
  const holgura = .3 * g.em, cerca = .6 * g.em;
  const dentro = (bx, by, bw, bh) => x > bx - holgura && x < bx + bw + holgura && y > by - holgura && y < by + bh + holgura;
  for (let i = lista.length - 1; i >= 0; i--) {
    const k = lista[i];
    if (k.t === 'v') {
      const a = g.pals[k.a], b = g.pals[k.b];
      if (a && b && Math.abs(x - k.x * g.em) < cerca && y > a.y - holgura && y < b.y + b.h + holgura) return i;
    } else if (k.t === 'w') {
      const f = flecha(g, k);
      if (f && Array.from({ length: 17 }, (_, n) => puntoCurva(f, n / 16)).some(([px, py]) => Math.hypot(px - x, py - y) < cerca)) return i;
    } else if (tramos(g, k.a, k.b).some(s => dentro(s.ini, s.y, s.fin - s.ini, s.h))) return i;
  }
  return -1;
}
function recordarDeshacer(clave, lista) {
  (deshacerPila[clave] = deshacerPila[clave] || []).push(lista);
}
function unirResaltado(lista, m) {
  const nueva = { ...m };
  const resto = lista.filter(o => {
    if (o.t !== 'r' || o.b < nueva.a || o.a > nueva.b) return true;
    if (o.c === nueva.c) { nueva.a = Math.min(nueva.a, o.a); nueva.b = Math.max(nueva.b, o.b); return false; }
    return !(o.a >= nueva.a && o.b <= nueva.b);
  });
  return resto.concat([nueva]);
}
function marcaLinea(t, x, y) {
  const g = t.g, dx = x - t.x0, dy = y - t.y0;
  if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > .3 * g.em) {
    const e = palabraEn(g, t.x0, y);
    const xEm = t.x0 / g.em;
    return { t: 'v', c: t.color, a: Math.min(t.a, e), b: Math.max(t.a, e), x: +(xEm < .6 ? -.45 : xEm).toFixed(2) };
  }
  const y0 = g.pals[t.a].y, h = g.pals[t.a].h;
  const izq = Math.min(t.x0, x), der = Math.max(t.x0, x);
  let a = t.a, b = t.a;
  g.pals.forEach((p, i) => {
    if (Math.abs(p.y - y0) < h / 2 && p.x + p.w > izq && p.x < der) { a = Math.min(a, i); b = Math.max(b, i); }
  });
  return { t: 's', c: t.color, a, b };
}
function moverTrazo(x, y) {
  const t = trazo, g = t.g;
  if (t.h === 'b') {
    const i = marcaEn(g, t.lista, x, y);
    if (i >= 0) {
      if (!t.cambio) recordarDeshacer(t.c.dataset.marcas, t.lista);
      t.lista = t.lista.filter((_, n) => n !== i);
      t.cambio = true;
      pintarMarcas(t.c, g);
    }
    return;
  }
  const e = palabraEn(g, x, y), a = Math.min(t.a, e), b = Math.max(t.a, e);
  if (t.h === 'l') t.marca = marcaLinea(t, x, y);
  else if (t.h === 'w') t.marca = Math.hypot(x - t.x0, y - t.y0) < .4 * g.em ? null : { t: 'w', c: t.color, a: t.a, b: e, px: x, py: y };
  else if (t.h === 'n') t.marca = { t: 'n', a, b };
  else t.marca = { t: t.h, c: t.color, a, b };
  pintarMarcas(t.c, g, t.marca);
}

function puntoEn(c, ev) {
  const b = c.getBoundingClientRect();
  return [ev.clientX - b.left, ev.clientY - b.top];
}
app.addEventListener('pointerdown', ev => {
  if (!estado.herramienta || !ev.isPrimary) return;
  const c = ev.target.closest('#escritura');
  if (!c) return;
  const g = medir(c);
  if (!g.pals.length) return;
  const [x, y] = puntoEn(c, ev);
  // fuera de las palabras se deja desplazar la página; Borrar también acepta tocar una marca
  if (!ev.target.closest('.pal') && !(estado.herramienta === 'b' && marcaEn(g, marcasDe(c.dataset.marcas), x, y) >= 0)) return;
  ev.preventDefault();
  try { c.setPointerCapture(ev.pointerId); } catch (e) {}
  trazo = { c, g, h: estado.herramienta, x0: x, y0: y, a: palabraEn(g, x, y), color: leer('color', 0), lista: marcasDe(c.dataset.marcas), marca: null, cambio: false };
  moverTrazo(x, y);
});
app.addEventListener('pointermove', ev => {
  if (!trazo || !ev.isPrimary) return;
  const [x, y] = puntoEn(trazo.c, ev);
  moverTrazo(x, y);
});
function cerrarTrazo(confirmar) {
  const t = trazo;
  if (!t) return;
  const clave = t.c.dataset.marcas, antes = marcasDe(clave), m = t.marca;
  trazo = null;
  if (confirmar && t.h === 'b' && t.cambio) guardar(clave, t.lista);
  else if (confirmar && m && m.t === 'n') {
    // tocar una frase que ya tiene nota abre esa nota
    const previa = antes.find(k => k.t === 'n' && k.a <= m.b && k.b >= m.a);
    let id = previa && previa.id;
    if (!id) {
      id = Date.now().toString(36);
      const sinVacias = antes.filter(k => k.t !== 'n' || (k.s || '').trim());
      recordarDeshacer(clave, antes);
      guardar(clave, sinVacias.concat([{ t: 'n', id, a: m.a, b: m.b, s: '' }]));
    }
    pintarMarcas(t.c);
    actualizarMarcador();
    enfocarNota(t.c, id);
    return;
  } else if (confirmar && m && !(m.t === 'w' && m.a === m.b)) {
    const nueva = m.t === 'w' ? { t: 'w', c: m.c, a: m.a, b: m.b } : m;
    recordarDeshacer(clave, antes);
    guardar(clave, m.t === 'r' ? unirResaltado(antes, nueva) : antes.concat([nueva]));
  }
  pintarMarcas(t.c);
  actualizarMarcador();
}
app.addEventListener('pointerup', ev => { if (ev.isPrimary) cerrarTrazo(true); });
app.addEventListener('pointercancel', () => cerrarTrazo(false));
app.addEventListener('contextmenu', ev => { if (estado.herramienta && ev.target.closest('#escritura')) ev.preventDefault(); });

/* Temporizador de silencio */
const silencio = { fin: 0, total: 0, intervalo: null, terminado: false, audio: null, bloqueo: null };

function formatoReloj(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
function pintarSilencio() {
  const caja = document.getElementById('silencio');
  if (!caja) return;
  const i = estado.paso - 1, lec = SERIE.lecturas[i];
  if (silencio.intervalo) {
    caja.innerHTML = `
      <div class="fila-reloj">
        <span class="reloj" id="reloj" role="timer">${formatoReloj(silencio.fin - Date.now())}</span>
        <button class="boton secundario" data-accion="detener">${esc(T.terminarAntes)}</button>
      </div>
      <div class="progreso"><span id="avance"></span></div>`;
    actualizarReloj();
    return;
  }
  if (silencio.terminado) {
    caja.innerHTML = `<p style="font-family:var(--serif);font-size:1.1875rem">${esc(T.terminoSilencio)}</p>
      <p class="tenue pequeno">${esc(T.sigueCuandoQuieras)}</p>`;
    return;
  }
  const min = estado.minutos[i] || lec.minutos[0];
  const opciones = lec.minutos.length > 1
    ? `<div class="minutos" role="group" aria-label="${esc(T.minutosSilencio)}">${lec.minutos.map(m =>
        `<button data-accion="minutos" data-min="${m}" aria-pressed="${m === min}">${esc(T.minutos(m))}</button>`).join('')}</div>`
    : '';
  caja.innerHTML = `
    <div class="fila-reloj">
      ${opciones}
      <button class="boton secundario" data-accion="iniciar" style="flex:1">${esc(T.iniciarSilencio)}${lec.minutos.length > 1 ? '' : ` (${esc(T.minutos(min))})`}</button>
    </div>`;
}
function actualizarReloj() {
  const resta = silencio.fin - Date.now();
  if (resta <= 0) { terminarSilencio(true); return; }
  const r = document.getElementById('reloj'), a = document.getElementById('avance');
  if (r) r.textContent = formatoReloj(resta);
  if (a) a.style.width = `${(1 - resta / silencio.total) * 100}%`;
}
function iniciarSilencio() {
  const i = estado.paso - 1, lec = SERIE.lecturas[i];
  const min = estado.minutos[i] || lec.minutos[0];
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) { silencio.audio = silencio.audio || new Ctx(); silencio.audio.resume(); }
  } catch (e) {}
  silencio.total = min * 60000;
  silencio.fin = Date.now() + silencio.total;
  silencio.terminado = false;
  silencio.intervalo = setInterval(actualizarReloj, 500);
  pedirBloqueo();
  pintarSilencio();
}
function pedirBloqueo() {
  try {
    if (navigator.wakeLock) navigator.wakeLock.request('screen').then(b => { silencio.bloqueo = b; }).catch(() => {});
  } catch (e) {}
}
function soltarBloqueo() {
  try { if (silencio.bloqueo) silencio.bloqueo.release(); } catch (e) {}
  silencio.bloqueo = null;
}
function campana() {
  const ctx = silencio.audio;
  if (!ctx) return;
  try {
    const t = ctx.currentTime;
    [[528, .16, 3], [1056, .05, 2]].forEach(([f, v, d]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + .03);
      g.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t + d);
    });
  } catch (e) {}
}
function terminarSilencio(conCampana) {
  clearInterval(silencio.intervalo);
  silencio.intervalo = null;
  silencio.terminado = conCampana;
  soltarBloqueo();
  if (conCampana) campana();
  pintarSilencio();
}
function reiniciarSilencio() {
  clearInterval(silencio.intervalo);
  silencio.intervalo = null;
  silencio.terminado = false;
  soltarBloqueo();
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && silencio.intervalo) { pedirBloqueo(); actualizarReloj(); }
});

/* Navegación: la dirección guarda dónde estás (#semana-1/dia-2), así funcionan el botón Atrás y los enlaces */
function pintar() {
  let html;
  if (estado.vista === 'grupo') html = vistaGrupo();
  else if (estado.vista === 'guia') html = vistaGuia();
  else if (estado.vista === 'imprimir') html = vistaImprimir();
  else if (estado.vista === 'dia') {
    html = estado.paso === 0 ? vistaPreparacion() : estado.paso === 4 ? vistaFin() : vistaLectura();
  } else if (estado.vista === 'semana') html = vistaSemana();
  else html = vistaSerie();
  limpiarNotasVacias(true);
  trazo = null;
  estado.herramienta = null;
  app.innerHTML = `<div id="vista">${html}</div>`;
  estado.aviso = '';
  pintarSilencio();
  prepararMarcas();
  ajustarAltos();
  if (estado.vista === 'imprimir') (document.fonts ? document.fonts.ready : Promise.resolve()).then(ajustarImpresion);
  const notas = estado.aNotas && document.getElementById('notas');
  estado.aNotas = false;
  if (notas) notas.scrollIntoView();
  else window.scrollTo(0, 0);
}
function ir(ruta) {
  const actual = rutaActual();
  if (ruta !== 'guia') estado.anterior = '';
  else if (actual !== 'guia') estado.anterior = actual;
  if (actual === ruta) desdeUrl();
  else location.hash = aUrl(ruta);
}
let turno = 0;
async function desdeUrl() {
  const h = rutaActual(), mio = ++turno;
  // una dirección con las palabras del otro idioma se muestra con las de esta serie
  if (h && aUrl(h) !== location.hash.slice(1)) { try { history.replaceState(null, '', '#' + aUrl(h)); } catch (e) {} }
  reiniciarSilencio();
  // direcciones de la primera versión (#dia1, #grupo)
  const viejo = h.match(/^dia(\d)$/);
  if (viejo || h === 'grupo') { location.replace(`#semana-1/${viejo ? `dia-${viejo[1]}` : 'grupo'}`); return; }
  const m = h.match(/^semana-(\d+)(?:\/(?:dia-(\d+)|(grupo|imprimir)))?$/);
  if (m) {
    const ok = await cargarSemana(+m[1]);
    if (mio !== turno) return;
    if (!ok) estado.aviso = T.noDisponible;
    else if (m[2] && +m[2] >= 1 && +m[2] <= SEM.pasajes.length) {
      estado.vista = 'dia'; estado.dia = +m[2]; estado.paso = 0; estado.traduccion = {}; estado.minutos = {};
    } else estado.vista = m[3] || 'semana';
    if (!ok) {
      estado.vista = 'serie';
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    }
  } else estado.vista = h === 'guia' ? 'guia' : 'serie';
  pintar();
}
window.addEventListener('hashchange', desdeUrl);

// Aa y Claro/Oscuro son del lector, no de la serie (2026-11-25): reading.js los guarda una sola vez para toda la biblioteca
// («biblioteca:text-size», «biblioteca:theme»), y el tamaño de todo el texto sigue a --text-scale.
// Una sola vez, el tamaño que el lector tenía guardado en esta serie («escala») pasa a la biblioteca, para que nadie lo pierda.
function llevarEscala() {
  let vieja = null;
  try { vieja = localStorage.getItem(PREFIJO + 'escala'); } catch (e) {}
  if (vieja === null) return;
  try {
    const n = parseInt(vieja, 10);
    if (localStorage.getItem('biblioteca:text-size') === null && n > 0 && n < ESCALAS.length) {
      localStorage.setItem('biblioteca:text-size', String(n));
      // reading.js ya leyó el tamaño al cargar: se le avisa como si viniera de otra pestaña, para que vuelva a leerlo
      const avisar = () => setTimeout(() => window.dispatchEvent(new StorageEvent('storage', { key: 'biblioteca:text-size' })));
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avisar); else avisar();
    }
    localStorage.removeItem(PREFIJO + 'escala');
  } catch (e) {}
  delete memoria.escala;
}

app.addEventListener('click', ev => {
  const b = ev.target.closest('[data-accion]');
  if (!b) return;
  const accion = b.dataset.accion;
  if (accion === 'ir') ir(b.dataset.ruta);
  else if (accion === 'salir') location.href = b.dataset.href + (location.protocol === 'file:' ? 'index.html' : '');
  else if (accion === 'ir-notas') { estado.aNotas = true; ir(''); }
  else if (accion === 'imprimir') { ajustarImpresion(); window.print(); }
  else if (accion === 'paso') {
    reiniciarSilencio();
    const n = +b.dataset.paso;
    if (n < 0) { ir(rutaSemana()); return; }
    estado.paso = n;
    if (n === 4) { guardar(claveHecho(estado.dia), true); guardar('ultimo', { s: NUM, d: estado.dia }); }
    pintar();
  } else if (accion === 'traduccion') {
    const i = estado.paso - 1, t = b.dataset.trad, p = SEM.pasajes[estado.dia - 1];
    estado.traduccion[i] = t;
    const c = document.getElementById('escritura');
    limpiarNotasVacias(true);
    c.dataset.marcas = claveMarcas(estado.dia, t);
    c.innerHTML = escritura(p[t]);
    pintarMarcas(c);
    actualizarMarcador();
    b.parentNode.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
    const tn = document.querySelector('.trans-nombre'); if (tn) tn.textContent = T.nombresTraduccion[t] || t;
  } else if (accion === 'herramienta') {
    limpiarNotasVacias(true);
    estado.herramienta = b.dataset.h !== estado.herramienta ? b.dataset.h : null;
    actualizarMarcador();
  } else if (accion === 'marcador') {
    limpiarNotasVacias(true);
    estado.panel = !estado.panel;
    estado.herramienta = null;
    actualizarMarcador();
  } else if (accion === 'color') {
    guardar('color', +b.dataset.color);
    actualizarMarcador();
  } else if (accion === 'deshacer') {
    const c = document.getElementById('escritura'), pila = deshacerPila[c.dataset.marcas];
    if (pila && pila.length) {
      guardar(c.dataset.marcas, pila.pop());
      pintarMarcas(c);
      actualizarMarcador();
    }
  } else if (accion === 'minutos') {
    estado.minutos[estado.paso - 1] = +b.dataset.min;
    pintarSilencio();
  } else if (accion === 'iniciar') iniciarSilencio();
  else if (accion === 'detener') terminarSilencio(false);
  else if (accion === 'borrar') {
    if (b.dataset.confirmar) { borrarTodo(); pintar(); }
    else { b.dataset.confirmar = '1'; b.textContent = T.borrarConfirmar; }
  } else if (accion === 'trad-grupo') {
    const i = +b.dataset.p, t = b.dataset.trad, c = b.closest('.version').querySelector('.escritura');
    estado.tradGrupo[i] = t;
    c.dataset.marcas = claveMarcas(i + 1, t);
    c.innerHTML = escritura(SEM.pasajes[i][t]);
    pintarMarcas(c);
    b.parentNode.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
  } else if (accion === 'aviso-pasos') {
    const c = b.closest('.aviso');
    c.querySelector('.aviso-pasos').hidden = false;
    b.remove();
  } else if (accion === 'aviso') {
    guardar('aviso-inicio', true);
    b.closest('.aviso').remove();
  } else if (accion === 'exportar') {
    exportarCopia().then(ok => {
      if (ok) document.getElementById('estado-copia').textContent = T.copiaLista;
    });
  } else if (accion === 'importar') {
    document.getElementById('archivo-copia').click();
  }
});
app.addEventListener('input', ev => {
  const d = ev.target.dataset || {};
  if (d.clave) {
    guardar(d.clave, ev.target.value);
    if (ev.target.tagName === 'TEXTAREA') ajustarAlto(ev.target);
  } else if (d.pieId) {
    const clave = document.getElementById('escritura').dataset.marcas;
    guardar(clave, marcasDe(clave).map(k => k.id === d.pieId ? { ...k, s: ev.target.value } : k));
    ajustarAlto(ev.target);
  }
});
app.addEventListener('toggle', ev => { if (ev.target.open) ajustarAltos(); }, true);
let anchoAntes = innerWidth;
window.addEventListener('resize', () => { if (innerWidth !== anchoAntes) { anchoAntes = innerWidth; ajustarAltos(); } });
app.addEventListener('focusout', ev => {
  if (ev.target.dataset && ev.target.dataset.pieId) setTimeout(() => limpiarNotasVacias(false), 0);
});
app.addEventListener('change', async ev => {
  if (ev.target.id !== 'archivo-copia' || !ev.target.files[0]) return;
  const mensaje = await importarCopia(ev.target.files[0]);
  ev.target.value = '';
  if (!mensaje) return;
  estado.aNotas = true;
  pintar();
  const s = document.getElementById('estado-copia');
  if (s) { s.textContent = mensaje; s.scrollIntoView({ block: 'center' }); }
});

// cuando cambia el tamaño del texto (Aa aquí, en otra pestaña, o al volver con Atrás), las cajas de escribir se ajustan
document.addEventListener('click', ev => { if (ev.target.closest && ev.target.closest('[data-text-size]')) setTimeout(ajustarAltos); });
window.addEventListener('storage', () => setTimeout(ajustarAltos, 50));
window.addEventListener('pageshow', ev => { if (ev.persisted) setTimeout(ajustarAltos, 50); });

llevarEscala();
desdeUrl();
