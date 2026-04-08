/**
 * Cartelera Effi — Embed Loader
 * Usage: <div data-cartelera-report data-country="Colombia" data-month="10" data-year="2025"></div>
 *        <script src="https://carteleraeffi.vercel.app/embed.js" async></script>
 */
(function () {
  var BASE = 'https://carteleraeffi.vercel.app';
  var script = document.currentScript;
  if (script && script.src) {
    try { BASE = new URL(script.src).origin; } catch (e) {}
  }

  function mount(el) {
    if (el.getAttribute('data-cartelera-mounted') === '1') return;
    el.setAttribute('data-cartelera-mounted', '1');

    var country = el.getAttribute('data-country') || 'Colombia';
    var month = el.getAttribute('data-month') || '0';
    var year = el.getAttribute('data-year') || new Date().getFullYear().toString();

    var iframe = document.createElement('iframe');
    iframe.src = BASE + '/embed/reporte?country=' + encodeURIComponent(country) +
      '&month=' + encodeURIComponent(month) +
      '&year=' + encodeURIComponent(year) +
      '&saved=true';
    iframe.style.width = '100%';
    iframe.style.border = '0';
    iframe.style.display = 'block';
    iframe.style.minHeight = '1200px';
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('title', 'Cartelera ' + country + ' ' + month + '/' + year);
    iframe.setAttribute('allowfullscreen', '');
    el.appendChild(iframe);

    // Auto-resize via postMessage from the embedded page
    window.addEventListener('message', function (event) {
      if (!event.data || event.data.type !== 'cartelera:resize') return;
      if (event.source !== iframe.contentWindow) return;
      var h = Number(event.data.height);
      if (h && h > 0) iframe.style.height = h + 'px';
    });
  }

  function init() {
    var nodes = document.querySelectorAll('[data-cartelera-report]');
    for (var i = 0; i < nodes.length; i++) mount(nodes[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
