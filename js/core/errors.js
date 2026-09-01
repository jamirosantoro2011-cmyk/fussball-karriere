/* ── Fehleranzeige ─────────────────────────────────────────────────────
   Wird als allererstes Skript geladen. Ein unerwarteter Fehler darf nie
   wieder zu einer stillen, leeren Seite führen — stattdessen erscheint
   eine lesbare Meldung mit Kopierknopf.
   Bewusst ohne Abhängigkeiten und mit Inline-Styles, damit die Anzeige
   auch dann funktioniert, wenn CSS oder andere Skripte fehlen.      */

window.FKC = window.FKC || {};

(function (FKC) {
  'use strict';

  var shown = [];
  var box = null;

  function css(el, styles) {
    for (var k in styles) el.style[k] = styles[k];
  }

  function build() {
    if (box) return box;
    box = document.createElement('div');
    box.id = 'fkc-error';
    css(box, {
      position: 'fixed', left: '0', right: '0', bottom: '0', zIndex: '9999',
      maxHeight: '70vh', overflowY: 'auto',
      background: '#1b100f', color: '#ffd9d9',
      borderTop: '3px solid #f4595f',
      font: '13px/1.5 ui-monospace, Consolas, monospace',
      padding: '14px 16px calc(14px + env(safe-area-inset-bottom))',
      boxShadow: '0 -8px 30px rgba(0,0,0,.6)'
    });

    var head = document.createElement('div');
    css(head, { display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' });
    var title = document.createElement('strong');
    title.textContent = 'Es ist ein Fehler aufgetreten / An error occurred';
    css(title, { fontSize: '14px', color: '#ff9b9b', flex: '1 1 auto' });
    head.appendChild(title);

    head.appendChild(button('Kopieren', function () {
      var text = shown.join('\n\n');
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        title.textContent = 'Kopiert — bitte im Chat einfügen.';
      } catch (e) {
        title.textContent = 'Kopieren nicht möglich — Text bitte markieren.';
      }
    }));

    head.appendChild(button('Spielstand löschen & neu laden', function () {
      try { localStorage.removeItem('fkc.save.v1'); } catch (e) {}
      location.reload();
    }));

    head.appendChild(button('Schliessen', function () { box.style.display = 'none'; }));

    box.appendChild(head);

    var body = document.createElement('pre');
    body.id = 'fkc-error-body';
    css(body, { margin: '0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' });
    box.appendChild(body);

    (document.body || document.documentElement).appendChild(box);
    return box;
  }

  function button(label, onClick) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    css(b, {
      background: '#2c1a19', color: '#ffd9d9', border: '1px solid #6b3b3b',
      borderRadius: '8px', padding: '6px 11px', font: 'inherit', cursor: 'pointer'
    });
    b.addEventListener('click', onClick);
    return b;
  }

  /** Fehler sichtbar machen */
  FKC.showError = function (info) {
    var text = [
      info.where ? '[' + info.where + ']' : '',
      info.message || String(info),
      info.source ? info.source + ':' + (info.line || '?') + ':' + (info.col || '?') : '',
      info.stack || ''
    ].filter(Boolean).join('\n');

    if (shown.indexOf(text) >= 0) return;       // nicht dreimal dasselbe
    shown.push(text);

    try {
      build();
      box.style.display = '';
      document.getElementById('fkc-error-body').textContent = shown.join('\n\n');
    } catch (e) {
      /* Wenn selbst das scheitert, bleibt wenigstens die Konsole */
      console.error('[FKC] Fehleranzeige fehlgeschlagen', e, text);
    }
    console.error('[FKC]', text);
  };

  /**
   * Führt fn aus und zeigt einen Fehler an, statt die Seite abstürzen
   * zu lassen. Gibt fallback zurück, wenn es schiefging.
   */
  FKC.guard = function (label, fn, fallback) {
    try {
      return fn();
    } catch (e) {
      FKC.showError({ where: label, message: e && e.message ? e.message : String(e),
                      stack: e && e.stack });
      return fallback;
    }
  };

  window.addEventListener('error', function (e) {
    FKC.showError({
      where: 'Skript', message: e.message,
      source: e.filename ? String(e.filename).split('/').pop() : '',
      line: e.lineno, col: e.colno,
      stack: e.error && e.error.stack
    });
  });

  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    FKC.showError({ where: 'Promise', message: r && r.message ? r.message : String(r),
                    stack: r && r.stack });
  });

})(window.FKC);
