/* ── Titelfeier ────────────────────────────────────────────────────────
   Ein Titel soll nicht als Zeile durchrutschen. Beim Saisonrückblick
   legt sich einmal eine kurze Inszenierung über den Bildschirm:
   Lichtkegel, Strahlenkranz, der Pokal aus js/ui/trophyart.js, Konfetti
   und ein kurzer Klang.

   Alles selbst gebaut — SVG, CSS-Animationen und ein per WebAudio
   erzeugter Dreiklang. Keine fremden Assets, keine Audiodateien.   */

window.FKC = window.FKC || {};
FKC.ui = FKC.ui || {};

(function (FKC) {
  'use strict';

  var KONFETTI = ['#9ef25b', '#35e3ac', '#f2c94c', '#ffffff', '#63b3ed', '#f5a524'];
  var offen = null;

  function reduziert() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (e) { return false; }
  }

  /* Kurzer Dreiklang statt einer Audiodatei — nichts nachzuladen, und
     unter file:// funktioniert es genauso. Fehler bleiben still: ohne
     Ton ist die Feier immer noch eine Feier. */
  function klang() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      var ctx = new AC();
      if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
      var t0 = ctx.currentTime;
      [0, 0.10, 0.20, 0.34].forEach(function (dt, i) {
        var f = [523.25, 659.25, 783.99, 1046.5][i];
        var osc = ctx.createOscillator(), g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = f;
        g.gain.setValueAtTime(0, t0 + dt);
        g.gain.linearRampToValueAtTime(i === 3 ? 0.14 : 0.10, t0 + dt + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + (i === 3 ? 0.9 : 0.4));
        osc.connect(g); g.connect(ctx.destination);
        osc.start(t0 + dt); osc.stop(t0 + dt + 1.0);
      });
      setTimeout(function () { try { ctx.close(); } catch (e) {} }, 1600);
    } catch (e) { /* Ton ist Zugabe, kein Muss */ }
  }

  function konfetti(n) {
    var s = '';
    for (var i = 0; i < n; i++) {
      var links = Math.round((i / n) * 100 + (i * 37 % 11) - 5);
      var farbe = KONFETTI[i % KONFETTI.length];
      var verzug = ((i * 53) % 900) / 1000;
      var dauer = 2.2 + ((i * 31) % 900) / 1000;
      var dreh = (i % 2 ? 1 : -1) * (240 + (i * 47) % 400);
      var breite = 6 + (i % 3) * 3;
      s += '<i class="cf" style="left:' + links + '%;background:' + farbe +
           ';width:' + breite + 'px;height:' + (breite * 1.6) + 'px' +
           ';animation-delay:' + verzug.toFixed(2) + 's' +
           ';animation-duration:' + dauer.toFixed(2) + 's' +
           ';--spin:' + dreh + 'deg' +
           (i % 4 === 0 ? ';border-radius:50%' : '') + '"></i>';
    }
    return s;
  }

  /**
   * @param items  [{ id, name, sub }] — id ist die Wettbewerbs-/Award-ID
   *               für FKC.ui.trophy(), name die Überschrift.
   */
  FKC.ui.celebrate = function (items) {
    if (!items || !items.length) return;
    if (offen) return;                       // nie zwei übereinander
    var sanft = reduziert();

    var el = document.createElement('div');
    el.className = 'celebrate' + (sanft ? ' is-calm' : '');
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', items[0].name);

    var haupt = items[0];
    /* **Alle** weiteren Titel dieser Saison, nicht die ersten drei. Ein
       Triple mit Pokal und Auszeichnung sind fünf Trophäen — davon zwei
       stillschweigend wegzulassen war der Fehler. Die Zeile umbricht. */
    var weitere = items.slice(1);

    el.innerHTML =
      '<div class="cel-scrim"></div>' +
      (sanft ? '' : '<div class="cel-confetti">' + konfetti(46) + '</div>') +
      '<div class="cel-stage">' +
        '<div class="cel-rays" aria-hidden="true"></div>' +
        '<div class="cel-trophy">' + FKC.ui.trophy(haupt.id, 132) + '</div>' +
        '<div class="cel-kicker">' + FKC.ui.c.esc(FKC.t('celebrate.kicker')) + '</div>' +
        '<h2 class="cel-name">' + FKC.ui.c.esc(haupt.name) + '</h2>' +
        (haupt.sub ? '<p class="cel-sub">' + FKC.ui.c.esc(haupt.sub) + '</p>' : '') +
        (weitere.length
          ? '<div class="cel-more">' + weitere.map(function (x) {
              return '<span class="cel-more-item">' + FKC.ui.trophy(x.id, 34) +
                     '<span>' + FKC.ui.c.esc(x.name) + '</span></span>';
            }).join('') + '</div>'
          : '') +
        '<button class="btn btn-primary cel-close" type="button">' +
          FKC.ui.c.esc(FKC.t('celebrate.close')) + '</button>' +
      '</div>';

    document.body.appendChild(el);
    offen = el;
    if (!sanft) klang();

    function zu() {
      if (!offen) return;
      offen.classList.add('is-leaving');
      var weg = offen;
      offen = null;
      setTimeout(function () { if (weg.parentNode) weg.parentNode.removeChild(weg); }, 260);
      document.removeEventListener('keydown', taste);
    }
    function taste(e) { if (e.key === 'Escape' || e.key === 'Enter') zu(); }

    el.addEventListener('click', zu);
    document.addEventListener('keydown', taste);
    /* Von selbst wieder weg, falls niemand klickt — aber lang genug,
       dass man den Pokal auch anschaut. */
    setTimeout(zu, sanft ? 2600 : 6000);

    var btn = el.querySelector('.cel-close');
    if (btn) setTimeout(function () { try { btn.focus(); } catch (e) {} }, 60);
  };

  FKC.ui.celebrateOpen = function () { return !!offen; };

})(window.FKC);
