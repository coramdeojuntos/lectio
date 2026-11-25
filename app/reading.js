/* The reading look: Light / Dark switch, text size (Aa) and reading progress line.
   Load it in the page's <head> (not deferred), so a saved choice applies before the page paints:
     <html lang="es" data-series="semana-santa">
     <script src="reading.js"></script>
   The page starts from the reader's device setting. Tapping the switch remembers the choice
   in this browser, labeled with the series ("semana-santa:theme"), as the library requires.
   Button: <button class="theme-toggle" type="button" data-theme-toggle></button>
   Its words follow the page language (es: Claro / Oscuro; en: Light / Dark).
   Pages that redraw themselves can add these buttons at any time; they work the same.
   Text size: <button class="text-size" type="button" data-text-size>Aa</button>
   Each tap makes the text larger (normal, larger, largest), then back to normal;
   remembered as "<series>:text-size".
   Print: <button class="print-button" type="button" data-print>Print this day</button>
   (the page writes its own words: "Imprimir este día", "Print this reading"...). reading.js adds a
   printer icon; on phones only the icon shows, and the words stay as the button's label. */
(function () {
  var html = document.documentElement;
  var series = html.getAttribute('data-series') || 'reading';
  var KEY = series + ':theme';
  try { var saved = localStorage.getItem(KEY); if (saved === 'light' || saved === 'dark') html.setAttribute('data-theme', saved); } catch (e) {}

  var SIZES = [1, 1.15, 1.3], SIZE_KEY = series + ':text-size', size = 0;
  try { size = parseInt(localStorage.getItem(SIZE_KEY), 10) || 0; } catch (e) {}
  if (!(size >= 0 && size < SIZES.length)) size = 0;
  html.style.setProperty('--text-scale', SIZES[size]);

  var es = (html.lang || '').toLowerCase().indexOf('es') === 0;
  var WORDS = es ? { light: 'Claro', dark: 'Oscuro', toLight: 'Cambiar a modo claro', toDark: 'Cambiar a modo oscuro',
                     size: ['Tamaño del texto: normal', 'Tamaño del texto: más grande', 'Tamaño del texto: el más grande'] }
                 : { light: 'Light', dark: 'Dark', toLight: 'Switch to light mode', toDark: 'Switch to dark mode',
                     size: ['Text size: normal', 'Text size: larger', 'Text size: largest'] };

  function isDark() {
    var t = html.getAttribute('data-theme');
    return t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function paint(button) {
    var dark = isDark();
    // shows the mode you'd switch to; on phones only the symbol shows
    var inner = '<span aria-hidden="true">' + (dark ? '\u2600\uFE0E' : '\u263E') + '</span><span class="word">' + (dark ? WORDS.light : WORDS.dark) + '</span>';
    if (button.getAttribute('data-painted') !== (dark ? 'dark' : 'light')) {   // only when it changes
      button.innerHTML = inner;
      button.setAttribute('data-painted', dark ? 'dark' : 'light');
    }
    button.setAttribute('aria-label', dark ? WORDS.toLight : WORDS.toDark);
  }

  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/></svg>';

  // Fill in the buttons' words and icons. Runs again whenever the page adds new buttons,
  // so pages that redraw themselves (like the study app) work the same as static pages.
  function setUp(root) {
    root.querySelectorAll('[data-theme-toggle]').forEach(paint);
    root.querySelectorAll('[data-text-size]').forEach(function (b) { b.setAttribute('aria-label', WORDS.size[size]); });
    root.querySelectorAll('[data-print]:not([data-ready])').forEach(function (b) {
      var words = b.textContent.trim();
      b.setAttribute('data-ready', '');
      b.setAttribute('aria-label', words);
      b.innerHTML = ICON + '<span class="word">' + words.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }) + '</span>';
    });
  }

  function ready() {
    setUp(document);
    // one listener for every button, now and later
    document.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-theme-toggle], [data-text-size], [data-print]') : null;
      if (!t) return;
      if (t.hasAttribute('data-theme-toggle')) {
        var next = isDark() ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        try { localStorage.setItem(KEY, next); } catch (e2) {}
        document.querySelectorAll('[data-theme-toggle]').forEach(paint);
      } else if (t.hasAttribute('data-text-size')) {
        size = (size + 1) % SIZES.length;
        html.style.setProperty('--text-scale', SIZES[size]);
        try { localStorage.setItem(SIZE_KEY, String(size)); } catch (e2) {}
        document.querySelectorAll('[data-text-size]').forEach(function (x) { x.setAttribute('aria-label', WORDS.size[size]); });
      } else {
        window.print();
      }
    });
    try {
      new MutationObserver(function (list) {
        list.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.querySelectorAll) setUp(n.parentNode || n); }); });
      }).observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
    // follow the device if it changes and the reader hasn't chosen
    try {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
        if (!html.getAttribute('data-theme')) document.querySelectorAll('[data-theme-toggle]').forEach(paint);
      });
    } catch (e) {}

    var bar = document.querySelector('.progress span');
    if (bar) {
      var update = function () {
        var max = html.scrollHeight - html.clientHeight;
        bar.style.width = (max > 0 ? html.scrollTop / max * 100 : 0) + '%';
      };
      window.addEventListener('scroll', update, { passive: true });
      update();
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
})();
