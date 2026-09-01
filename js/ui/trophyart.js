/* ── Pokale & Medaillen als SVG ────────────────────────────────────────
   Selbst gezeichnet, keine echten Vorlagen. Jede Trophäenart hat eine
   eigene Silhouette, damit der Schrank auf einen Blick lesbar ist.

   Aufbau je Trophäe: Sockel (Stein mit Gravurplatte) → Korpus in einem
   Metallverlauf → Glanzkante links, Schattenkante rechts → Spitzlicht.
   Die Metallverläufe laufen über fünf Stopps, weil zwei Stopps flach
   wirken: Gold braucht die dunkle Zone zwischen zwei Lichtern, sonst
   sieht es aus wie eine gelbe Fläche.                              */

window.FKC = window.FKC || {};
FKC.ui = FKC.ui || {};

(function (FKC) {
  'use strict';

  var uid = 0;

  /* [Spitzlicht, Licht, Grundton, Schatten, Tiefe] */
  var METAL = {
    gold:   ['#fff8dd', '#ffe08a', '#f0b840', '#a86f14', '#5e3c07'],
    silver: ['#ffffff', '#eaf1f6', '#c3ced8', '#7d8996', '#454e59'],
    bronze: ['#ffe6c9', '#e9b077', '#c8813f', '#8a4f1c', '#4d2a0d'],
    plate:  ['#fffbe8', '#f6dd9a', '#dfb84e', '#96701a', '#523c07']
  };

  function defs(id, metal) {
    var c = METAL[metal] || METAL.gold;
    return '<defs>' +
      /* Körper: quer über die Rundung, damit die Wölbung entsteht */
      '<linearGradient id="g' + id + '" x1="0" y1="0.1" x2="1" y2="0.9">' +
        '<stop offset="0%"   stop-color="' + c[3] + '"/>' +
        '<stop offset="14%"  stop-color="' + c[1] + '"/>' +
        '<stop offset="34%"  stop-color="' + c[0] + '"/>' +
        '<stop offset="56%"  stop-color="' + c[2] + '"/>' +
        '<stop offset="80%"  stop-color="' + c[3] + '"/>' +
        '<stop offset="100%" stop-color="' + c[4] + '"/>' +
      '</linearGradient>' +
      /* Henkel und schmale Teile: senkrecht, sonst kippt das Licht */
      '<linearGradient id="h' + id + '" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0%"   stop-color="' + c[3] + '"/>' +
        '<stop offset="40%"  stop-color="' + c[0] + '"/>' +
        '<stop offset="100%" stop-color="' + c[3] + '"/>' +
      '</linearGradient>' +
      /* Sockelstein */
      '<linearGradient id="b' + id + '" x1="0" y1="0" x2="0.3" y2="1">' +
        '<stop offset="0%"   stop-color="#3b4a44"/>' +
        '<stop offset="45%"  stop-color="#243330"/>' +
        '<stop offset="100%" stop-color="#0e1512"/>' +
      '</linearGradient>' +
      /* Bodenschatten */
      '<radialGradient id="s' + id + '" cx="50%" cy="50%" r="50%">' +
        '<stop offset="0%"   stop-color="rgba(0,0,0,.55)"/>' +
        '<stop offset="100%" stop-color="rgba(0,0,0,0)"/>' +
      '</radialGradient>' +
      '</defs>';
  }

  /* Sockel: Stein mit abgesetzter Deckplatte und Gravurstreifen */
  function base(id, w) {
    w = w || 32;
    var x = 40 - w / 2;
    return '<ellipse cx="40" cy="88" rx="' + (w * 0.8) + '" ry="4.5" fill="url(#s' + id + ')"/>' +
      /* Deckplatte in Metall */
      '<rect x="' + (x + 2) + '" y="71" width="' + (w - 4) + '" height="4" rx="1.4" fill="url(#g' + id + ')"/>' +
      /* Steinkorpus, unten leicht breiter */
      '<path d="M' + x + ' 75 h' + w + ' l2.5 11 h-' + (w + 5) + 'z" fill="url(#b' + id + ')"/>' +
      /* Gravurplatte */
      '<rect x="' + (x + 5) + '" y="78" width="' + (w - 10) + '" height="4.4" rx="1" ' +
        'fill="url(#g' + id + ')" opacity=".55"/>' +
      /* Lichtkante oben, Schattenkante unten */
      '<path d="M' + x + ' 75.6 h' + w + '" stroke="rgba(255,255,255,.28)" stroke-width="1"/>' +
      '<path d="M' + (x - 2.5) + ' 85.6 h' + (w + 5) + '" stroke="rgba(0,0,0,.45)" stroke-width="1.4"/>';
  }

  /* Stiel zwischen Korpus und Sockel, mit Nodus */
  function stem(id, top, h, w) {
    w = w || 6;
    return '<path d="M' + (40 - w / 2) + ' ' + top + ' h' + w +
           ' l-' + (w * 0.18) + ' ' + h + ' h-' + (w * 0.64) + 'z" fill="url(#h' + id + ')"/>' +
           '<ellipse cx="40" cy="' + (top + h * 0.45) + '" rx="' + (w * 0.85) +
           '" ry="2.2" fill="url(#g' + id + ')"/>';
  }

  /* Spitzlicht auf gewölbten Körpern */
  function gleam(x, y, w, h, rot) {
    return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + w + '" ry="' + h +
           '" fill="#fff" opacity=".38"' +
           (rot ? ' transform="rotate(' + rot + ' ' + x + ' ' + y + ')"' : '') + '/>';
  }

  function wrap(inner, id, metal, size) {
    return '<svg class="trophy" viewBox="0 0 80 96" width="' + (size || 72) +
      '" height="' + Math.round((size || 72) * 96 / 80) + '" aria-hidden="true">' +
      defs(id, metal) + inner + '</svg>';
  }

  var SHAPES = {

    /* Meisterschale — flache Schale mit ausladenden Henkeln */
    league: function (id) {
      return base(id, 40) +
        /* Henkel hinter der Schale */
        '<path d="M14 40 q-9 3-9 10t9 10" fill="none" stroke="url(#h' + id + ')" ' +
          'stroke-width="4.6" stroke-linecap="round"/>' +
        '<path d="M66 40 q9 3 9 10t-9 10" fill="none" stroke="url(#h' + id + ')" ' +
          'stroke-width="4.6" stroke-linecap="round"/>' +
        /* Schalenkörper */
        '<path d="M14 34 h52 a4 4 0 0 1 4 4 v5 c0 13-11 22-30 22S10 56 10 43v-5a4 4 0 0 1 4-4z" ' +
          'fill="url(#g' + id + ')"/>' +
        /* Rand als eigener Ring, sonst wirkt die Schale wie ein Aufkleber */
        '<ellipse cx="40" cy="34.5" rx="30" ry="6" fill="url(#h' + id + ')"/>' +
        '<ellipse cx="40" cy="34.5" rx="25" ry="4.2" fill="#000" opacity=".38"/>' +
        '<ellipse cx="40" cy="35.5" rx="25" ry="4.2" fill="url(#g' + id + ')" opacity=".9"/>' +
        gleam(28, 46, 3.6, 9, -14) +
        stem(id, 64, 8, 9) +
        '<rect x="30" y="70" width="20" height="2.6" rx="1" fill="url(#g' + id + ')"/>';
    },

    /* Klassischer Pokal mit zwei Henkeln */
    cup: function (id) {
      return base(id, 30) +
        '<path d="M25 20 q-12 1-12 11t12 12" fill="none" stroke="url(#h' + id + ')" ' +
          'stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M55 20 q12 1 12 11t-12 12" fill="none" stroke="url(#h' + id + ')" ' +
          'stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M25 18 h30 v14 c0 13-6.5 21-15 21s-15-8-15-21z" fill="url(#g' + id + ')"/>' +
        '<ellipse cx="40" cy="18" rx="15" ry="3.6" fill="url(#h' + id + ')"/>' +
        '<ellipse cx="40" cy="18" rx="11.5" ry="2.4" fill="#000" opacity=".4"/>' +
        gleam(32, 30, 2.8, 8, -10) +
        stem(id, 52, 12, 7) +
        '<rect x="30" y="66" width="20" height="5" rx="1.6" fill="url(#g' + id + ')"/>';
    },

    /* Grosser Henkelpokal — der wichtigste Vereinstitel */
    contTop: function (id) {
      return base(id, 34) +
        '<path d="M22 16 q-16 3-16 15t16 15" fill="none" stroke="url(#h' + id + ')" ' +
          'stroke-width="5.5" stroke-linecap="round"/>' +
        '<path d="M58 16 q16 3 16 15t-16 15" fill="none" stroke="url(#h' + id + ')" ' +
          'stroke-width="5.5" stroke-linecap="round"/>' +
        '<path d="M22 14 h36 v17 c0 16-8 25-18 25s-18-9-18-25z" fill="url(#g' + id + ')"/>' +
        '<ellipse cx="40" cy="14" rx="18" ry="4.2" fill="url(#h' + id + ')"/>' +
        '<ellipse cx="40" cy="14" rx="14" ry="2.8" fill="#000" opacity=".42"/>' +
        /* Gravurband auf dem Bauch */
        '<path d="M24 27 q16 6 32 0" fill="none" stroke="#000" stroke-width="1.2" opacity=".22"/>' +
        '<path d="M24 30 q16 6 32 0" fill="none" stroke="#fff" stroke-width="1" opacity=".22"/>' +
        gleam(30, 28, 3.2, 9, -12) +
        stem(id, 55, 10, 8) +
        '<rect x="28" y="67" width="24" height="4.5" rx="1.6" fill="url(#g' + id + ')"/>';
    },

    /* Kleinerer Pokal — zweiter internationaler Wettbewerb */
    contSecond: function (id) {
      return base(id, 26) +
        '<path d="M29 22 q-9 1-9 8t9 9" fill="none" stroke="url(#h' + id + ')" ' +
          'stroke-width="3.2" stroke-linecap="round"/>' +
        '<path d="M51 22 q9 1 9 8t-9 9" fill="none" stroke="url(#h' + id + ')" ' +
          'stroke-width="3.2" stroke-linecap="round"/>' +
        '<path d="M29 20 h22 v12 c0 10-5 16-11 16s-11-6-11-16z" fill="url(#g' + id + ')"/>' +
        '<ellipse cx="40" cy="20" rx="11" ry="2.8" fill="url(#h' + id + ')"/>' +
        '<ellipse cx="40" cy="20" rx="8.4" ry="1.8" fill="#000" opacity=".4"/>' +
        gleam(34, 30, 2.2, 6, -10) +
        stem(id, 48, 12, 6) +
        '<rect x="31" y="65" width="18" height="4.4" rx="1.4" fill="url(#g' + id + ')"/>';
    },

    /* Weltmeisterschaft — Globus, von zwei Figuren getragen */
    world: function (id) {
      return base(id, 32) +
        /* tragende Formen */
        '<path d="M27 66 q1-22 13-30 l-3 34z" fill="url(#g' + id + ')"/>' +
        '<path d="M53 66 q-1-22-13-30 l3 34z" fill="url(#h' + id + ')"/>' +
        /* Globus */
        '<circle cx="40" cy="28" r="16" fill="url(#g' + id + ')"/>' +
        '<g fill="none" stroke="#000" opacity=".3" stroke-width="1.1">' +
          '<ellipse cx="40" cy="28" rx="16" ry="6"/>' +
          '<ellipse cx="40" cy="28" rx="16" ry="11.5"/>' +
          '<ellipse cx="40" cy="28" rx="6" ry="16"/>' +
          '<line x1="24" y1="28" x2="56" y2="28"/>' +
        '</g>' +
        '<path d="M40 12 a16 16 0 0 1 11 27" fill="none" stroke="#fff" ' +
          'stroke-width="1.2" opacity=".3"/>' +
        gleam(33, 21, 4, 5.5, -30) +
        '<rect x="30" y="66" width="20" height="5" rx="1.6" fill="url(#g' + id + ')"/>';
    },

    /* Kontinentaltitel der Nationalmannschaft — schlanke Amphore */
    nation: function (id) {
      return base(id, 28) +
        '<path d="M27 16 h26 l-3.5 20c0 11-4.5 17-9.5 17s-9.5-6-9.5-17z" fill="url(#g' + id + ')"/>' +
        '<ellipse cx="40" cy="16" rx="13" ry="3.2" fill="url(#h' + id + ')"/>' +
        '<ellipse cx="40" cy="16" rx="10" ry="2.1" fill="#000" opacity=".4"/>' +
        '<path d="M31 25 q9 4 18 0" fill="none" stroke="#fff" stroke-width="1" opacity=".26"/>' +
        gleam(33, 28, 2.4, 8, -8) +
        stem(id, 53, 11, 6.5) +
        '<rect x="30" y="65" width="20" height="4.6" rx="1.5" fill="url(#g' + id + ')"/>';
    },

    /* Goldener Ball — Weltfussballer */
    ballon: function (id) {
      var seam = '<g fill="#000" opacity=".34">' +
        '<path d="M40 20 l6.5 4.7-2.5 7.7h-8l-2.5-7.7z"/>' +
        '<path d="M23.5 30.5 l7.3 2.5-1.2 7.8-7.3 1.1z"/>' +
        '<path d="M56.5 30.5 l-7.3 2.5 1.2 7.8 7.3 1.1z"/>' +
        '<path d="M33.5 46.5 l2.4-6.4h8.2l2.4 6.4-6.5 4z"/>' +
        '</g>';
      return base(id, 28) +
        '<circle cx="40" cy="33" r="18" fill="url(#g' + id + ')"/>' +
        seam +
        '<circle cx="40" cy="33" r="18" fill="none" stroke="#000" ' +
          'stroke-width="1" opacity=".25"/>' +
        gleam(32, 25, 4.5, 6, -30) +
        stem(id, 50, 14, 7) +
        '<rect x="30" y="67" width="20" height="4.6" rx="1.5" fill="url(#g' + id + ')"/>';
    },

    /* Goldener Schuh — Torschützenkönig */
    boot: function (id) {
      return base(id, 32) +
        /* Sohle */
        '<path d="M14 56 c0-3 2-4 5-4h44c3 0 5 2 5 5s-2 5-5 5H19c-3 0-5-2-5-6z" ' +
          'fill="url(#h' + id + ')"/>' +
        /* Schaft */
        '<path d="M18 52 c0-13 5-20 14-20h7l4.5 9c9 2.5 20 6 22.5 11l1 4H18z" ' +
          'fill="url(#g' + id + ')"/>' +
        /* Schnürung */
        '<g stroke="#000" opacity=".3" stroke-width="1.3" stroke-linecap="round">' +
          '<path d="M30 36 l6 4"/><path d="M28 41 l7 3.5"/><path d="M27 46 l7 3"/>' +
        '</g>' +
        '<path d="M23 34 q4-3 9-2" fill="none" stroke="#fff" stroke-width="1.4" opacity=".35"/>' +
        '<circle cx="53" cy="47" r="2.2" fill="#fff" opacity=".35"/>';
    },

    /* Medaille am Band */
    medal: function (id) {
      return '<ellipse cx="40" cy="88" rx="20" ry="4" fill="url(#s' + id + ')"/>' +
        '<path d="M28 6 l14 30-9 4.5-16-30z" fill="#3f5d51"/>' +
        '<path d="M52 6 l-14 30 9 4.5 16-30z" fill="#2c4339"/>' +
        '<path d="M28 6 l3 6-3 1.5z" fill="#fff" opacity=".18"/>' +
        '<circle cx="40" cy="58" r="22" fill="url(#g' + id + ')"/>' +
        '<circle cx="40" cy="58" r="17.5" fill="none" stroke="#000" ' +
          'stroke-width="1.6" opacity=".28"/>' +
        '<circle cx="40" cy="58" r="15" fill="none" stroke="#fff" ' +
          'stroke-width=".9" opacity=".25"/>' +
        /* Lorbeer als Punktekranz — bleibt auch klein lesbar */
        '<g fill="#000" opacity=".22">' +
        (function () {
          var s = '';
          for (var i = 0; i < 12; i++) {
            var a = (i / 12) * Math.PI * 2;
            s += '<circle cx="' + (40 + Math.sin(a) * 15).toFixed(1) +
                 '" cy="' + (58 - Math.cos(a) * 15).toFixed(1) + '" r="1.3"/>';
          }
          return s;
        })() +
        '</g>' +
        '<path d="M40 48 l3.3 6.7 7.4 1.1-5.4 5.2 1.3 7.4L40 65l-6.6 3.5 1.3-7.4-5.4-5.2 7.4-1.1z" ' +
          'fill="#fff" opacity=".5"/>' +
        gleam(31, 49, 4.5, 6, -30);
    },

    /* Stern — Elf der Saison */
    star: function (id) {
      var pts = 'M40 12 l8.5 17.2 19 2.8-13.7 13.4 3.2 18.9L40 55.4 23 64.3l3.2-18.9L12.5 32l19-2.8z';
      return base(id, 26) +
        '<path d="' + pts + '" fill="#000" opacity=".35" transform="translate(1.5 1.5)"/>' +
        '<path d="' + pts + '" fill="url(#g' + id + ')"/>' +
        /* Facetten: jede Zacke bekommt eine helle und eine dunkle Hälfte */
        '<path d="M40 12 l8.5 17.2L40 33z" fill="#fff" opacity=".26"/>' +
        '<path d="M40 12 l-8.5 17.2L40 33z" fill="#000" opacity=".14"/>' +
        '<path d="M67.5 32 l-13.7 13.4L47 33z" fill="#000" opacity=".16"/>' +
        '<path d="M12.5 32 l13.7 13.4L33 33z" fill="#fff" opacity=".18"/>' +
        stem(id, 62, 9, 6) +
        '<rect x="31" y="70" width="18" height="2.6" rx="1" fill="url(#g' + id + ')"/>';
    }
  };

  /* ── Zuordnung Wettbewerb/Auszeichnung → Silhouette ─────────────── */

  var CONT_TOP = ['cont.ucl', 'cont.lib', 'cont.ccc', 'cont.acl'];

  FKC.ui.trophyKind = function (id, isNational) {
    if (!id) return { shape: 'star', metal: 'gold' };
    if (id.indexOf('league.') === 0) return { shape: 'league', metal: 'plate' };
    if (id.indexOf('cup.') === 0) return { shape: 'cup', metal: 'silver' };
    if (id === 'nat.wc') return { shape: 'world', metal: 'gold' };
    if (id.indexOf('nat.') === 0) return { shape: 'nation', metal: 'gold' };
    if (id.indexOf('cont.') === 0) {
      return CONT_TOP.indexOf(id) >= 0
        ? { shape: 'contTop', metal: 'gold' }
        : { shape: 'contSecond', metal: 'silver' };
    }
    /* Individuelle Auszeichnungen */
    switch (id) {
      case 'ballon': return { shape: 'ballon', metal: 'gold' };
      case 'kopa': return { shape: 'star', metal: 'gold' };
      case 'goldenBoot': return { shape: 'boot', metal: 'gold' };
      case 'goldenBootTournament': return { shape: 'boot', metal: 'plate' };
      case 'goldenBall': return { shape: 'ballon', metal: 'plate' };
      case 'goldenBallTournament': return { shape: 'ballon', metal: 'plate' };
      case 'youngPlayer': return { shape: 'medal', metal: 'silver' };
      case 'youthPlayer': return { shape: 'medal', metal: 'bronze' };
      case 'teamOfSeason': return { shape: 'star', metal: 'silver' };
      default: return { shape: 'star', metal: 'gold' };
    }
  };

  /** Liefert das fertige SVG für eine Trophäe */
  FKC.ui.trophy = function (id, size, isNational) {
    var kind = FKC.ui.trophyKind(id, isNational);
    var n = ++uid;
    var shape = SHAPES[kind.shape] || SHAPES.star;
    return wrap(shape(n), n, kind.metal, size || 64);
  };

})(window.FKC);
