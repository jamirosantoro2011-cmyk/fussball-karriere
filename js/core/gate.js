/* ══════════════════════════════════════════════════════════════════════
   ZUGANGSCODES — hier eintragen, nirgends sonst
   ══════════════════════════════════════════════════════════════════════

   Neue Codes einfach als Zeile in die Liste schreiben, alte Zeile löschen
   entzieht den Zugang wieder — auch auf Geräten, die schon freigeschaltet
   waren (der gemerkte Code wird bei jedem Start gegen diese Liste
   geprüft).

   Gross- und Kleinschreibung sowie Leerzeichen sind egal:
   "anpfiff 2026" und "ANPFIFF-2026" gelten beide, wenn unten
   'ANPFIFF-2026' steht. Bindestriche zählen mit.
                                                                        */

var FKC_CODES = [
  '3CUU-SMZF'
];

/* ══════════════════════════════════════════════════════════════════════
   Ab hier nichts mehr ändern.
   ══════════════════════════════════════════════════════════════════════

   Diese Datei läuft **vor** dem Spiel und ohne den FKC-Namensraum — zu
   diesem Zeitpunkt ist noch kein einziges Spielskript geladen. Genau das
   ist der Sinn: Die eigentlichen Programmdateien stehen in index.html
   nur als `data-src` und werden erst geholt, wenn der Code stimmt. Wer
   keinen Code hat, bekommt den Spielcode also gar nicht erst geliefert.

   Das ist eine Hürde, keine Sicherheit. Die Codes stehen oben im
   Klartext und sind über die Entwicklerwerkzeuge auffindbar. Alles, was
   im Browser läuft, gehört dem, der den Browser bedient.            */

(function () {
  'use strict';

  var SPEICHER = 'fkc.access';

  /* ── Zwei Betriebsarten ───────────────────────────────────────────
     Quellcode  : BUENDEL ist null. Nachgeladen werden die einzelnen
                  Dateien aus der data-src-Liste in index.html und die
                  beiden restlichen Stylesheets.
     Build      : build.ps1 trägt hier den Namen der gebündelten Datei
                  ein. Dann wird nur diese eine Datei geholt; das CSS
                  steckt bereits vollständig in a.css.

     In **beiden** Fällen gilt dasselbe: Vor dem richtigen Code holt der
     Browser kein einziges Byte Spielcode. Genau deshalb liegt das
     Bündel nicht schon in derselben Datei wie diese Sperre.        */
  var BUENDEL = null;
  var CSS_NACH = ['css/layout.css', 'css/components.css'];

  /* Vergleichsform: ohne Leerzeichen, in Grossbuchstaben */
  function norm(s) {
    return String(s == null ? '' : s).replace(/\s+/g, '').toUpperCase();
  }

  function gueltig(eingabe) {
    var codes = (typeof FKC_CODES !== 'undefined' && FKC_CODES) || [];
    var n = norm(eingabe);
    if (!n) return null;
    for (var i = 0; i < codes.length; i++) {
      if (norm(codes[i]) === n) return codes[i];
    }
    return null;
  }

  /* localStorage kann fehlen (privater Modus, file:// in manchen
     Browsern). Dann läuft alles weiter, nur ohne Merken. */
  function lesen() {
    try { return window.localStorage.getItem(SPEICHER); } catch (e) { return null; }
  }
  function schreiben(v) {
    try { window.localStorage.setItem(SPEICHER, v); } catch (e) { /* egal */ }
  }
  function loeschen() {
    try { window.localStorage.removeItem(SPEICHER); } catch (e) { /* egal */ }
  }

  /* ── Spiel nachladen ──────────────────────────────────────────────
     Im Quellcode stehen die Skripte in index.html in der richtigen
     Reihenfolge als <script data-src="…"> ohne src — sie laden also
     nicht von selbst. Hier werden sie zu echten Skripten gemacht.
     `async = false` sorgt dafür, dass sie trotz dynamischem Einfügen
     **der Reihe nach** ausgeführt werden; ohne das würde career.js
     vor rng.js laufen.                                              */

  var gestartet = false;

  function spielStarten() {
    if (gestartet) return;
    gestartet = true;

    var box = document.getElementById('gate');
    if (box && box.parentNode) box.parentNode.removeChild(box);
    document.body.classList.remove('is-locked');

    CSS_NACH.forEach(function (href) {
      var l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = href;
      document.head.appendChild(l);
    });

    var frag = document.createDocumentFragment();

    if (BUENDEL) {
      var eine = document.createElement('script');
      eine.src = BUENDEL;
      eine.async = false;
      frag.appendChild(eine);
    } else {
      [].slice.call(document.querySelectorAll('script[data-src]'))
        .forEach(function (alt) {
          var s = document.createElement('script');
          s.src = alt.getAttribute('data-src');
          s.async = false;
          frag.appendChild(s);
          if (alt.parentNode) alt.parentNode.removeChild(alt);
        });
    }

    document.body.appendChild(frag);

    /* Netz: Wenn nach ein paar Sekunden kein FKC da ist, hat eine
       Skriptdatei nicht geladen. Ohne diesen Zweig bliebe genau dann
       eine weisse Seite ohne jeden Hinweis stehen — der unangenehmste
       aller Fehler, weil er nach einem kaputten Spielstand aussieht.
       Typischer Auslöser: geöffnet über file:// statt über einen
       Server, oder eine Datei fehlt beim Hochladen. */
    window.setTimeout(function () {
      if (window.FKC && window.FKC.ui) return;
      var w = document.createElement('div');
      w.className = 'gate';
      w.innerHTML =
        '<div class="gate-card">' +
        '<h1 class="gate-title">Das Spiel konnte nicht geladen werden</h1>' +
        '<p class="gate-sub">Die Programmdateien wurden nicht gefunden. ' +
        'Wenn die Seite lokal per Doppelklick geöffnet wurde, blockiert ' +
        'der Browser das Nachladen — bitte über eine Adresse mit ' +
        '<b>http://</b> aufrufen.</p>' +
        '<button class="gate-btn" type="button" ' +
        'onclick="location.reload()">Neu laden</button>' +
        '</div>';
      document.body.appendChild(w);
    }, 6000);
  }

  /* ── Sperrbildschirm ──────────────────────────────────────────── */

  function gateAufbauen() {
    var box = document.getElementById('gate');
    if (!box) { spielStarten(); return; }        // ohne Markup nicht sperren

    box.hidden = false;
    document.body.classList.add('is-locked');

    var feld = document.getElementById('gate-input');
    var knopf = document.getElementById('gate-btn');
    var meldung = document.getElementById('gate-msg');
    var karte = box.querySelector('.gate-card') || box;
    var fehlversuche = 0;
    var gesperrtBis = 0;

    function sagen(text, art) {
      if (!meldung) return;
      meldung.textContent = text || '';
      meldung.setAttribute('data-tone', art || '');
    }

    function pruefen() {
      var jetzt = Date.now();
      if (jetzt < gesperrtBis) {
        sagen('Zu viele Versuche. Bitte ' +
              Math.ceil((gesperrtBis - jetzt) / 1000) + ' Sekunden warten.', 'bad');
        return;
      }

      var treffer = gueltig(feld ? feld.value : '');
      if (treffer) {
        schreiben(treffer);
        sagen('Code erkannt. Das Spiel wird geladen …', 'good');
        if (knopf) knopf.disabled = true;
        if (feld) feld.disabled = true;
        window.setTimeout(spielStarten, 260);
        return;
      }

      fehlversuche++;
      if (feld) feld.select();
      /* Die Animation muss auch beim zweiten falschen Code wieder
         anspringen. Dafür Klasse weg, Layout erzwingen, Klasse hin —
         ohne das Auslesen von offsetWidth fasst der Browser beides zu
         einem Schritt zusammen und es passiert nichts. */
      karte.classList.remove('is-wrong');
      void karte.offsetWidth;
      karte.classList.add('is-wrong');
      if (fehlversuche >= 5) {
        gesperrtBis = Date.now() + 10000;
        fehlversuche = 0;
        sagen('Zu viele Versuche. Bitte 10 Sekunden warten.', 'bad');
      } else {
        sagen('Dieser Code stimmt nicht.', 'bad');
      }
    }

    if (knopf) knopf.addEventListener('click', pruefen);
    if (feld) {
      feld.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); pruefen(); }
      });
      feld.addEventListener('input', function () {
        if (meldung && meldung.getAttribute('data-tone') === 'bad') sagen('');
      });
      try { feld.focus(); } catch (e) { /* egal */ }
    }
  }

  /* ── Start ────────────────────────────────────────────────────────
     Ein gemerkter Code wird jedes Mal neu gegen die Liste geprüft.
     Streicht man ihn oben heraus, ist das Gerät beim nächsten Öffnen
     wieder gesperrt — sonst wäre ein einmal verteilter Code nie mehr
     zurückzunehmen. */

  function los() {
    var gemerkt = lesen();
    if (gemerkt && gueltig(gemerkt)) { spielStarten(); return; }
    if (gemerkt) loeschen();                    // zurückgezogener Code
    gateAufbauen();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', los);
  } else {
    los();
  }

})();
