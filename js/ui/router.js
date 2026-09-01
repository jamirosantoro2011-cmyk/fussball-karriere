/* ── Router & App-Rahmen ───────────────────────────────────────────────
   Screens melden sich mit render() (HTML-String) und optional bind()
   an. Sprachwechsel rendert einfach den aktuellen Screen neu.        */

window.FKC = window.FKC || {};
FKC.ui = FKC.ui || {};

(function (FKC) {
  'use strict';

  var screens = {};
  var current = { name: null, params: null };

  var R = {

    register: function (name, def) { screens[name] = def; },

    go: function (name, params) {
      if (!screens[name]) { console.warn('[router] unbekannter Screen:', name); return; }
      current = { name: name, params: params || {} };
      R.render();
      window.scrollTo(0, 0);
    },

    reload: function () { R.render(); },

    current: function () { return current.name; },

    /**
     * Wichtig: Der Screen-Knoten wird bei jedem Render ERSETZT, nicht nur
     * neu befüllt. Sonst sammeln sich die in bind() gesetzten Listener am
     * immer gleichen Element an — nach N Renders läuft ein Klick N-mal.
     */
    render: function () {
      var def = screens[current.name];
      if (!def) return;
      if (R._rendering) { R._again = true; return; }   // Re-Entrance abfangen
      R._rendering = true;

      try {
        var old = document.getElementById('screen');
        var root = document.createElement('main');
        root.id = 'screen';
        root.className = 'screen screen-' + current.name;

        /* Ein Fehler in einem Screen darf nie die ganze Seite leer lassen —
           stattdessen bleibt die Hülle stehen und zeigt die Meldung an. */
        var html;
        try {
          html = def.render(current.params) || '';
        } catch (e) {
          FKC.showError({ where: 'Screen "' + current.name + '"',
                          message: e && e.message, stack: e && e.stack });
          html = R.errorCard(e);
        }
        root.innerHTML = html;
        old.parentNode.replaceChild(root, old);

        if (def.bind) {
          try { def.bind(root, current.params); }
          catch (e2) {
            FKC.showError({ where: 'bind "' + current.name + '"',
                            message: e2 && e2.message, stack: e2 && e2.stack });
          }
        }
        try { R.topbar(def.topbar !== false); }
        catch (e3) {
          FKC.showError({ where: 'Kopfzeile', message: e3 && e3.message, stack: e3 && e3.stack });
        }
      } finally {
        R._rendering = false;
      }

      if (R._again) { R._again = false; R.render(); }
    },

    /** Ersatzinhalt, wenn ein Screen nicht gerendert werden konnte */
    errorCard: function (e) {
      var msg = (e && e.message) ? e.message : String(e);
      return '<div class="card" style="border-color:#6b3b3b">' +
        '<h2 style="color:#f4595f">' + FKC.t('error.screenTitle') + '</h2>' +
        '<p class="u-dim" style="margin-top:10px">' + FKC.t('error.screenText') + '</p>' +
        '<pre style="white-space:pre-wrap;word-break:break-word;font-size:.78rem;' +
        'background:var(--bg-2);padding:10px;border-radius:8px;margin:12px 0">' +
        FKC.ui.c.esc(msg) + '</pre>' +
        '<button class="btn btn-block" data-act="to-menu">' + FKC.t('error.toMenu') + '</button>' +
        '</div>';
    },

    /* ── Kopfzeile ────────────────────────────────────────────────── */
    topbar: function (show) {
      var bar = document.getElementById('topbar');
      var g = FKC.state.game;
      bar.hidden = !show || !g;
      if (bar.hidden) return;

      document.getElementById('tb-player').textContent = FKC.state.fullName();
      document.getElementById('tb-lang').textContent = FKC.i18n.lang.toUpperCase();

      /* OVR und Marktwert sind immer präsent, nicht weggeklickt */
      var mid = [];
      mid.push('<span>' + FKC.t('top.age') + ' <b>' + FKC.state.age() + '</b></span>');
      mid.push('<span>' + FKC.t('card.ovr') + ' <b>' + g.ovr + '</b></span>');
      if (g.career.phase !== 'childhood') {
        mid.push('<span class="tb-mv"><b>' + FKC.i18n.money(g.status.marketValue || 0) + '</b></span>');
      }
      document.getElementById('tb-mid').innerHTML = mid.join('');
    },

    /* ── Navigationsmenü (☰) ──────────────────────────────────────────
       Einziger verlässlicher Weg zu Tabellen und Trophäenschrank —
       vorher hingen die nur an einem Knopf im Hub, den man während der
       Jugendphase praktisch nie zu Gesicht bekam.                   */
    navMenu: function () {
      var g = FKC.state.game;
      var phase = g ? g.career.phase : null;
      var items = [];

      if (g) {
        if (phase !== 'retired') {
          items.push(['story', 'nav.play']);
          items.push(['hub', 'nav.overview']);
        } else {
          items.push(['retire', 'nav.retrospective']);
        }
        items.push(['tables', 'nav.tables']);
        items.push(['trophies', 'nav.trophies']);
      }
      items.push(['settings', 'nav.settings']);
      items.push(['menu', 'nav.mainMenu']);

      var html = '<h2>' + FKC.t('nav.title') + '</h2><div class="stack-sm" style="margin-top:16px">';
      items.forEach(function (it) {
        html += '<button class="btn btn-block" style="justify-content:flex-start" ' +
          'data-nav="' + it[0] + '">' + FKC.t(it[1]) + '</button>';
      });
      html += '</div>';

      R.sheet(html).addEventListener('click', function (e) {
        var b = e.target.closest('[data-nav]');
        if (!b) return;
        R.closeSheet();
        R.go(b.getAttribute('data-nav'));
      });
    },

    /* ── Bottom-Sheet ─────────────────────────────────────────────── */
    sheet: function (html) {
      var ov = document.getElementById('overlay');
      var sh = document.getElementById('overlay-sheet');
      sh.innerHTML = html;
      ov.hidden = false;
      return sh;
    },

    closeSheet: function () {
      document.getElementById('overlay').hidden = true;
      document.getElementById('overlay-sheet').innerHTML = '';
    },

    /* ── Toast ────────────────────────────────────────────────────── */
    toast: function (text, tone) {
      var wrap = document.getElementById('toasts');
      var el = document.createElement('div');
      el.className = 'toast';
      if (tone) el.setAttribute('data-tone', tone);
      el.textContent = text;
      wrap.appendChild(el);
      setTimeout(function () {
        el.style.transition = 'opacity .3s';
        el.style.opacity = '0';
        setTimeout(function () { el.remove(); }, 320);
      }, 2200);
    },

    /* ── Bestätigungsdialog ───────────────────────────────────────── */
    confirm: function (title, text, onYes, danger) {
      var c = FKC.ui.c;
      R.sheet(
        '<h2>' + c.esc(title) + '</h2>' +
        '<p class="u-dim" style="margin-top:8px">' + c.esc(text) + '</p>' +
        '<div class="row" style="margin-top:20px">' +
        '<button class="btn btn-ghost btn-block" data-act="no">' + FKC.t('ui.cancel') + '</button>' +
        '<button class="btn ' + (danger ? 'btn-danger' : 'btn-primary') +
        ' btn-block" data-act="yes">' + FKC.t('ui.confirm') + '</button></div>'
      ).addEventListener('click', function (e) {
        var b = e.target.closest('[data-act]');
        if (!b) return;
        R.closeSheet();
        if (b.getAttribute('data-act') === 'yes') onYes();
      });
    }
  };

  /* ── Globale Klicks ─────────────────────────────────────────────── */
  document.addEventListener('click', function (e) {
    var ov = e.target.closest('#overlay');
    if (ov && !e.target.closest('#overlay-sheet')) { R.closeSheet(); return; }

    if (e.target.closest('#tb-lang')) {
      FKC.i18n.setLang(FKC.i18n.lang === 'de' ? 'en' : 'de');
      return;
    }
    if (e.target.closest('[data-act="to-menu"]')) { FKC.ui.router.go('menu'); return; }
    if (e.target.closest('#tb-menu')) { FKC.ui.router.navMenu(); return; }
    if (e.target.closest('#tb-home')) {
      if (FKC.state.exists()) FKC.ui.router.go('hub');
      return;
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !document.getElementById('overlay').hidden) R.closeSheet();
  });

  FKC.ui.router = R;
  FKC.ui.screens = screens;

})(window.FKC);
