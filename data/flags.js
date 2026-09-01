/* ── Landesflaggen ─────────────────────────────────────────────────────
   Anders als Vereinswappen und Trikots sind Nationalflaggen offizielle,
   gemeinfreie Hoheitszeichen. Sie werden deshalb **originalgetreu**
   nachgezeichnet, nicht abgewandelt: echte Farben, echte Seitenverhält-
   nisse, echte Konstruktion.

   Jeder Eintrag ist { w, h, s } — Breite und Höhe in den kanonischen
   Konstruktionseinheiten der jeweiligen Flagge und das SVG-Innere in
   genau diesem Koordinatensystem. Das Seitenverhältnis kommt also aus
   der Flagge selbst; die Schweiz ist quadratisch, Katar sehr breit.

   Wo ein Wappen zu fein für 20 px ist (Spanien, Mexiko, Ägypten …),
   steht eine bewusst reduzierte, aber lagerichtige Zeichnung. Farben,
   Streifen und Geometrie sind überall exakt.                        */

window.FKC = window.FKC || {};
FKC.data = FKC.data || {};

(function (FKC) {
  'use strict';

  /* ── Zeichenhilfen ──────────────────────────────────────────────── */

  function rect(x, y, w, h, f) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h +
           '" fill="' + f + '"/>';
  }

  /** Waagrechte Streifen gleicher Höhe */
  function hs(w, h, cols) {
    var u = h / cols.length, s = '';
    cols.forEach(function (c, i) { s += rect(0, i * u, w, u + 0.01, c); });
    return s;
  }

  /** Senkrechte Streifen gleicher Breite */
  function vs(w, h, cols) {
    var u = w / cols.length, s = '';
    cols.forEach(function (c, i) { s += rect(i * u, 0, u + 0.01, h, c); });
    return s;
  }

  /**
   * Sternpolygon. `pts` Zacken, äusserer Radius r.
   * Das Verhältnis 0.382 ist der reguläre Pentagramm-Wert; für andere
   * Zackenzahlen wird es entsprechend gestreckt.
   */
  function star(cx, cy, r, pts, fill, rot) {
    pts = pts || 5;
    var inner = r * (pts === 5 ? 0.382 : pts === 6 ? 0.577 : pts === 7 ? 0.62 : 0.5);
    var a0 = (rot || 0) * Math.PI / 180 - Math.PI / 2;
    var d = '';
    for (var i = 0; i < pts * 2; i++) {
      var a = a0 + i * Math.PI / pts;
      var rad = i % 2 ? inner : r;
      d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rad).toFixed(3) + ' ' +
           (cy + Math.sin(a) * rad).toFixed(3);
    }
    return '<path d="' + d + 'Z" fill="' + fill + '"/>';
  }

  /** Nordisches Kreuz: senkrechter Balken bei x, waagrechter mittig */
  function nordic(w, h, bg, cross, bw, x, fim, fw) {
    var y = (h - bw) / 2, s = rect(0, 0, w, h, bg);
    if (fim) {
      s += rect(x - fw, 0, bw + 2 * fw, h, fim) +
           rect(0, y - fw, w, bw + 2 * fw, fim);
    }
    s += rect(x, 0, bw, h, cross) + rect(0, y, w, bw, cross);
    return s;
  }

  /** Strahlenkranz der Sonne von Mai — abwechselnd gerade und gewellt */
  function sunRays(cx, cy, r0, r1, n, fill) {
    var s = '';
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2;
      var wdt = 0.16;
      s += '<path d="M' + (cx + Math.cos(a - wdt) * r0).toFixed(2) + ' ' +
           (cy + Math.sin(a - wdt) * r0).toFixed(2) +
           'L' + (cx + Math.cos(a) * r1).toFixed(2) + ' ' +
           (cy + Math.sin(a) * r1).toFixed(2) +
           'L' + (cx + Math.cos(a + wdt) * r0).toFixed(2) + ' ' +
           (cy + Math.sin(a + wdt) * r0).toFixed(2) + 'Z" fill="' + fill + '"/>';
    }
    return s;
  }

  /** Mondsichel als Differenz zweier Kreise */
  function crescent(cx, cy, r, off, rin, fill) {
    return '<path d="M' + (cx + r) + ' ' + cy +
      ' A' + r + ' ' + r + ' 0 1 1 ' + (cx - r) + ' ' + cy +
      ' A' + r + ' ' + r + ' 0 1 1 ' + (cx + r) + ' ' + cy + 'Z' +
      'M' + (cx + off + rin) + ' ' + cy +
      ' A' + rin + ' ' + rin + ' 0 1 0 ' + (cx + off - rin) + ' ' + cy +
      ' A' + rin + ' ' + rin + ' 0 1 0 ' + (cx + off + rin) + ' ' + cy + 'Z" ' +
      'fill="' + fill + '" fill-rule="evenodd"/>';
  }

  /* Union Jack, gezeichnet in einem 60 × 30 Feld — Grundlage für
     Australien. Die Gegenwechsel-Versetzung der roten Schrägbalken ist
     bei 10 px Kantonbreite ohnehin unsichtbar, die Lage stimmt. */
  function unionJack(w, h) {
    var k = 'scale(' + (w / 60) + ' ' + (h / 30) + ')';
    var s = '<g transform="' + k + '">';
    s += rect(0, 0, 60, 30, '#012169');
    s += '<clipPath id="ujc"><rect width="60" height="30"/></clipPath>';
    s += '<g clip-path="url(#ujc)">';
    /* Andreaskreuz weiss, darauf Patrickskreuz rot, versetzt */
    s += '<path d="M0 0 L60 30 M60 0 L0 30" stroke="#fff" stroke-width="6"/>';
    s += '<path d="M0 0 L30 15 M60 30 L30 15" stroke="#C8102E" stroke-width="2" ' +
         'transform="translate(0 1)"/>';
    s += '<path d="M60 0 L30 15 M0 30 L30 15" stroke="#C8102E" stroke-width="2" ' +
         'transform="translate(0 -1)"/>';
    /* Georgskreuz mit weisser Säumung */
    s += '<path d="M30 0 V30 M0 15 H60" stroke="#fff" stroke-width="10"/>';
    s += '<path d="M30 0 V30 M0 15 H60" stroke="#C8102E" stroke-width="6"/>';
    s += '</g></g>';
    return s;
  }

  /* ── Die Flaggen ────────────────────────────────────────────────── */

  var F = {};

  /* Europa ---------------------------------------------------------- */

  F.ENG = { w: 5, h: 3, s: rect(0, 0, 5, 3, '#fff') +
    '<path d="M2.5 0 V3 M0 1.5 H5" stroke="#CE1124" stroke-width=".6"/>' };

  F.SCO = { w: 5, h: 3, s: rect(0, 0, 5, 3, '#005EB8') +
    '<path d="M0 0 L5 3 M5 0 L0 3" stroke="#fff" stroke-width=".6"/>' };

  F.WAL = { w: 5, h: 3, s: rect(0, 0, 5, 1.5, '#fff') + rect(0, 1.5, 5, 1.5, '#00AD43') +
    /* Roter Drache — bewusst reduziert, aber in Lage und Haltung richtig */
    '<g fill="#C8102E" transform="translate(1.05 .62) scale(.031)">' +
    '<path d="M8 60 C10 44 22 40 30 42 C26 34 30 24 40 22 C36 16 40 8 50 8 ' +
    'C48 14 52 16 58 14 L62 6 L66 16 L78 14 L70 22 L84 24 L70 30 C78 34 78 44 70 46 ' +
    'C76 50 76 58 70 62 L74 74 L64 66 L58 76 L54 64 L44 70 L46 58 L34 60 L40 50 ' +
    'C30 54 18 54 8 60 Z"/></g>' };

  F.ESP = { w: 3, h: 2, s: rect(0, 0, 3, 2, '#AA151B') + rect(0, .5, 3, 1, '#F1BF00') +
    /* Wappen: Schild mit den Säulen des Herakles und Krone */
    '<g transform="translate(.75 1) scale(.0072)">' +
    '<rect x="-30" y="-36" width="60" height="66" rx="6" fill="#AD1519" ' +
      'stroke="#000" stroke-width="2"/>' +
    '<rect x="-30" y="-36" width="30" height="33" fill="#FFC400"/>' +
    '<rect x="0" y="-3" width="30" height="33" fill="#FFC400"/>' +
    '<rect x="-8" y="-4" width="16" height="34" rx="8" fill="#C8102E"/>' +
    '<path d="M-30 -46 h60 l-6 10 h-48z" fill="#FFC400" stroke="#000" stroke-width="2"/>' +
    '<rect x="-46" y="-24" width="10" height="48" rx="4" fill="#FFC400" ' +
      'stroke="#000" stroke-width="2"/>' +
    '<rect x="36" y="-24" width="10" height="48" rx="4" fill="#FFC400" ' +
      'stroke="#000" stroke-width="2"/></g>' };

  F.GER = { w: 5, h: 3, s: hs(5, 3, ['#000000', '#DD0000', '#FFCE00']) };

  F.ITA = { w: 3, h: 2, s: vs(3, 2, ['#008C45', '#F4F5F0', '#CD212A']) };

  F.FRA = { w: 3, h: 2, s: vs(3, 2, ['#002395', '#FFFFFF', '#ED2939']) };

  F.POR = { w: 3, h: 2, s: rect(0, 0, 1.2, 2, '#006600') + rect(1.2, 0, 1.8, 2, '#FF0000') +
    /* Armillarsphäre mit Schild */
    '<g transform="translate(1.2 1)">' +
    '<circle r=".44" fill="none" stroke="#FFE900" stroke-width=".08"/>' +
    '<ellipse rx=".44" ry=".17" fill="none" stroke="#FFE900" stroke-width=".06"/>' +
    '<ellipse rx=".17" ry=".44" fill="none" stroke="#FFE900" stroke-width=".06"/>' +
    '<ellipse rx=".44" ry=".30" fill="none" stroke="#FFE900" stroke-width=".05" ' +
      'transform="rotate(24)"/>' +
    '<path d="M-.20 -.26 h.40 v.30 a.20 .20 0 0 1 -.20 .20 a.20 .20 0 0 1 -.20 -.20z" ' +
      'fill="#fff" stroke="#C00" stroke-width=".05"/>' +
    '<rect x="-.09" y="-.16" width=".18" height=".30" fill="#039"/></g>' };

  F.NED = { w: 3, h: 2, s: hs(3, 2, ['#AE1C28', '#FFFFFF', '#21468B']) };

  F.BEL = { w: 15, h: 13, s: vs(15, 13, ['#000000', '#FAE042', '#ED2939']) };

  F.SUI = { w: 32, h: 32, s: rect(0, 0, 32, 32, '#FF0000') +
    rect(13, 6, 6, 20, '#fff') + rect(6, 13, 20, 6, '#fff') };

  F.AUT = { w: 3, h: 2, s: hs(3, 2, ['#ED2939', '#FFFFFF', '#ED2939']) };

  F.POL = { w: 8, h: 5, s: rect(0, 0, 8, 2.5, '#fff') + rect(0, 2.5, 8, 2.5, '#DC143C') };

  F.CZE = { w: 3, h: 2, s: rect(0, 0, 3, 1, '#fff') + rect(0, 1, 3, 1, '#D7141A') +
    '<path d="M0 0 L1.5 1 L0 2 Z" fill="#11457E"/>' };

  F.HUN = { w: 2, h: 1, s: hs(2, 1, ['#CD2A3E', '#FFFFFF', '#436F4D']) };

  F.ROU = { w: 3, h: 2, s: vs(3, 2, ['#002B7F', '#FCD116', '#CE1126']) };

  F.UKR = { w: 3, h: 2, s: rect(0, 0, 3, 1, '#0057B7') + rect(0, 1, 3, 1, '#FFD700') };

  F.RUS = { w: 3, h: 2, s: hs(3, 2, ['#FFFFFF', '#0039A6', '#D52B1E']) };

  F.IRL = { w: 2, h: 1, s: vs(2, 1, ['#169B62', '#FFFFFF', '#FF883E']) };

  F.DEN = { w: 37, h: 28, s: nordic(37, 28, '#C60C30', '#fff', 4, 12) };

  F.SWE = { w: 16, h: 10, s: nordic(16, 10, '#005293', '#FECB00', 2, 5) };

  F.NOR = { w: 22, h: 16, s: nordic(22, 16, '#BA0C2F', '#00205B', 2, 6, '#fff', 1) };

  F.GRE = { w: 27, h: 18, s: (function () {
    var s = '';
    for (var i = 0; i < 9; i++) s += rect(0, i * 2, 27, 2.01, i % 2 ? '#fff' : '#0D5EAF');
    s += rect(0, 0, 10, 10, '#0D5EAF');
    s += rect(4, 0, 2, 10, '#fff') + rect(0, 4, 10, 2, '#fff');
    return s;
  })() };

  F.CRO = { w: 3, h: 1.5, s: hs(3, 1.5, ['#FF0000', '#FFFFFF', '#171796']) +
    /* Schachbrettschild mit der Kronenreihe darüber */
    '<g transform="translate(1.5 .75)">' +
    '<path d="M-.42 -.42 h.84 v.44 a.42 .48 0 0 1 -.42 .46 a.42 .48 0 0 1 -.42 -.46z" ' +
      'fill="#fff" stroke="#000" stroke-width=".02"/>' +
    '<clipPath id="hrc"><path d="M-.42 -.42 h.84 v.44 a.42 .48 0 0 1 -.42 .46 ' +
      'a.42 .48 0 0 1 -.42 -.46z"/></clipPath>' +
    '<g clip-path="url(#hrc)">' +
    (function () {
      var g = '';
      for (var r = 0; r < 5; r++) for (var c = 0; c < 5; c++) {
        if ((r + c) % 2) g += rect(-0.42 + c * 0.168, -0.42 + r * 0.19, 0.169, 0.191, '#FF0000');
      }
      return g;
    })() +
    '</g>' +
    '<path d="M-.42 -.44 h.84 v-.10 h-.84z" fill="#fff" stroke="#000" stroke-width=".015"/>' +
    '</g>' };

  F.SRB = { w: 3, h: 2, s: hs(3, 2, ['#C6363C', '#0C4076', '#FFFFFF']) +
    /* Doppeladler mit Schild, stark vereinfacht */
    '<g transform="translate(1.05 1)">' +
    '<path d="M-.34 -.34 h.68 v.36 a.34 .40 0 0 1 -.34 .38 a.34 .40 0 0 1 -.34 -.38z" ' +
      'fill="#C6363C" stroke="#FFD34F" stroke-width=".035"/>' +
    '<path d="M-.30 -.30 h.14 v.14 h.32 v-.14 h.14 v.30 h-.60z" fill="#fff"/>' +
    '<path d="M-.06 -.30 h.12 v.60 h-.12z M-.24 -.06 h.48 v.12 h-.48z" fill="#fff"/>' +
    '<path d="M-.42 -.42 q.42 -.22 .84 0 q-.16 .16 -.42 .16 q-.26 0 -.42 -.16z" ' +
      'fill="#FFD34F"/></g>' };

  F.TUR = { w: 3, h: 2, s: rect(0, 0, 3, 2, '#E30A17') +
    crescent(1.125, 1, 0.5, 0.125, 0.4, '#fff') +
    star(1.7, 1, 0.2, 5, '#fff', 0) };

  /* Amerika ---------------------------------------------------------- */

  F.USA = { w: 19, h: 10, s: (function () {
    var s = '';
    for (var i = 0; i < 13; i++) {
      s += rect(0, i * 10 / 13, 19, 10 / 13 + 0.01, i % 2 ? '#fff' : '#B31942');
    }
    s += rect(0, 0, 7.6, 70 / 13, '#0A3161');
    /* 50 Sterne in neun Reihen zu 6 / 5 */
    var dx = 7.6 / 12, dy = (70 / 13) / 10;
    for (var r = 0; r < 9; r++) {
      var n = r % 2 ? 5 : 6;
      for (var c = 0; c < n; c++) {
        var x = dx * (r % 2 ? 2 + c * 2 : 1 + c * 2);
        s += star(x, dy * (1 + r), 0.22, 5, '#fff', 0);
      }
    }
    return s;
  })() };

  F.CAN = { w: 2, h: 1, s: rect(0, 0, 2, 1, '#fff') +
    rect(0, 0, .5, 1, '#D80621') + rect(1.5, 0, .5, 1, '#D80621') +
    /* Ahornblatt, elf Spitzen */
    '<g transform="translate(1 .5) scale(.0055)" fill="#D80621">' +
    '<path d="M0 -78 L14 -50 L38 -60 L30 -28 L46 -22 L20 4 L26 16 L4 12 L6 62 ' +
    'L-6 62 L-4 12 L-26 16 L-20 4 L-46 -22 L-30 -28 L-38 -60 L-14 -50 Z"/></g>' };

  F.MEX = { w: 7, h: 4, s: vs(7, 4, ['#006847', '#FFFFFF', '#CE1126']) +
    /* Adler auf Kaktus mit Schlange — reduziert, Lage und Farben stimmen */
    '<g transform="translate(3.5 2)">' +
    '<path d="M-.52 .46 q.52 .18 1.04 0" fill="none" stroke="#A67C2A" stroke-width=".07"/>' +
    '<path d="M-.30 .40 q-.10 -.26 .06 -.42 q.10 .18 .04 .40z" fill="#2E7D32"/>' +
    '<path d="M.30 .40 q.10 -.26 -.06 -.42 q-.10 .18 -.04 .40z" fill="#2E7D32"/>' +
    '<path d="M-.02 -.34 q.22 -.06 .30 .10 q-.14 .10 -.30 .04z" fill="#6D4C25"/>' +
    '<path d="M-.04 -.28 q-.34 .04 -.44 .30 q.28 .06 .48 -.12z" fill="#5D4037"/>' +
    '<path d="M.02 -.26 q.30 .10 .34 .34 q-.26 .02 -.42 -.16z" fill="#6D4C25"/>' +
    '<path d="M-.02 -.20 q-.06 .34 .02 .58" stroke="#5D4037" stroke-width=".08" fill="none"/>' +
    '<path d="M.24 -.30 q.20 -.10 .34 .02" stroke="#2E7D32" stroke-width=".05" fill="none"/>' +
    '</g>' };

  F.BRA = { w: 20, h: 14, s: rect(0, 0, 20, 14, '#009B3A') +
    '<path d="M10 1.7 L18.3 7 L10 12.3 L1.7 7 Z" fill="#FEDF00"/>' +
    '<circle cx="10" cy="7" r="3.5" fill="#002776"/>' +
    /* Sternbild — Zahl und Verteilung nach dem Original */
    (function () {
      var pts = [[9.3, 4.4], [10.6, 4.9], [8.2, 5.3], [11.6, 5.6], [9.9, 5.9],
                 [7.4, 6.2], [12.3, 6.4], [8.8, 6.6], [10.9, 6.9], [7.9, 7.3],
                 [11.9, 7.6], [9.4, 7.8], [10.4, 8.1], [8.4, 8.4], [12.6, 8.0],
                 [7.1, 7.9], [10.0, 9.3], [11.2, 9.0], [8.9, 9.5], [9.6, 4.0],
                 [12.1, 5.0], [7.6, 5.6], [10.2, 6.3], [8.6, 7.1], [11.4, 8.4],
                 [9.1, 8.9], [10.7, 4.4]];
      return pts.map(function (p, i) {
        return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' +
               (i < 6 ? 0.22 : i < 16 ? 0.17 : 0.13) + '" fill="#fff"/>';
      }).join('');
    })() +
    /* Spruchband */
    '<path d="M4.6 8.1 A6.6 6.6 0 0 0 15.4 8.1 A6.9 6.9 0 0 1 4.6 8.1 Z" fill="#fff"/>' +
    '<text x="10" y="8.35" text-anchor="middle" font-size=".62" font-weight="700" ' +
      'font-family="Inter, sans-serif" fill="#009B3A">ORDEM E PROGRESSO</text>' };

  F.ARG = { w: 8, h: 5, s: hs(8, 5, ['#74ACDF', '#FFFFFF', '#74ACDF']) +
    sunRays(4, 2.5, 0.5, 0.85, 32, '#F6B40E') +
    '<circle cx="4" cy="2.5" r=".5" fill="#F6B40E" stroke="#85340A" stroke-width=".04"/>' +
    '<g fill="#85340A"><circle cx="3.84" cy="2.4" r=".05"/>' +
    '<circle cx="4.16" cy="2.4" r=".05"/>' +
    '<path d="M3.85 2.62 q.15 .12 .30 0" stroke="#85340A" stroke-width=".05" ' +
      'fill="none"/></g>' };

  F.URU = { w: 3, h: 2, s: (function () {
    var s = rect(0, 0, 3, 2, '#fff');
    for (var i = 0; i < 4; i++) s += rect(0, (2 * i + 1) * 2 / 9, 3, 2 / 9, '#0038A8');
    for (var j = 0; j < 4; j++) s += rect(0, (2 * j + 1) * 2 / 9, 1, 2 / 9, '#fff');
    s += rect(0, 0, 1, 8 / 9, '#fff');
    s += sunRays(0.5, 0.444, 0.20, 0.36, 16, '#FCD116');
    s += '<circle cx=".5" cy=".444" r=".20" fill="#FCD116" stroke="#85340A" stroke-width=".015"/>';
    return s;
  })() };

  F.COL = { w: 3, h: 2, s: rect(0, 0, 3, 1, '#FCD116') +
    rect(0, 1, 3, .5, '#003893') + rect(0, 1.5, 3, .5, '#CE1126') };

  F.CHI = { w: 3, h: 2, s: rect(0, 0, 3, 1, '#fff') + rect(0, 1, 3, 1, '#D52B1E') +
    rect(0, 0, 1, 1, '#0039A6') + star(0.5, 0.5, 0.3, 5, '#fff', 0) };

  F.PER = { w: 3, h: 2, s: vs(3, 2, ['#D91023', '#FFFFFF', '#D91023']) };

  F.ECU = { w: 2, h: 1, s: rect(0, 0, 2, .5, '#FCD116') +
    rect(0, .5, 2, .25, '#0033A0') + rect(0, .75, 2, .25, '#EF3340') +
    '<g transform="translate(1 .5)">' +
    '<path d="M-.17 -.17 h.34 v.14 a.17 .20 0 0 1 -.17 .19 a.17 .20 0 0 1 -.17 -.19z" ' +
      'fill="#0033A0" stroke="#FCD116" stroke-width=".018"/>' +
    '<path d="M-.14 -.14 q.14 .10 .28 0 v.10 q-.14 .10 -.28 0z" fill="#fff"/>' +
    '<path d="M-.30 -.20 q.30 -.16 .60 0 q-.12 .12 -.30 .12 q-.18 0 -.30 -.12z" ' +
      'fill="#FCD116"/></g>' };

  F.PAR = { w: 11, h: 6, s: hs(11, 6, ['#D52B1E', '#FFFFFF', '#0038A8']) +
    '<circle cx="5.5" cy="3" r="1.05" fill="#fff" stroke="#0038A8" stroke-width=".08"/>' +
    star(5.5, 3, .42, 5, '#FCD116', 0) +
    '<circle cx="5.5" cy="3" r=".62" fill="none" stroke="#008000" stroke-width=".12"/>' };

  /* Afrika & Naher Osten --------------------------------------------- */

  F.MAR = { w: 3, h: 2, s: rect(0, 0, 3, 2, '#C1272D') +
    '<path d="' + (function () {
      var d = '', r = 0.52;
      for (var i = 0; i < 5; i++) {
        var a = -Math.PI / 2 + i * 4 * Math.PI / 5;
        d += (i ? 'L' : 'M') + (1.5 + Math.cos(a) * r).toFixed(3) + ' ' +
             (1 + Math.sin(a) * r).toFixed(3);
      }
      return d + 'Z';
    })() + '" fill="none" stroke="#006233" stroke-width=".085"/>' };

  F.ALG = { w: 3, h: 2, s: rect(0, 0, 1.5, 2, '#006233') + rect(1.5, 0, 1.5, 2, '#fff') +
    crescent(1.42, 1, 0.42, 0.13, 0.34, '#D21034') +
    star(1.92, 1, 0.2, 5, '#D21034', 18) };

  F.EGY = { w: 3, h: 2, s: hs(3, 2, ['#CE1126', '#FFFFFF', '#000000']) +
    /* Adler Saladins, reduziert */
    '<g transform="translate(1.5 1)" fill="#C09300">' +
    '<path d="M0 -.30 q.10 .06 .10 .18 q0 .10 -.10 .14 q-.10 -.04 -.10 -.14 ' +
      'q0 -.12 .10 -.18z"/>' +
    '<path d="M-.06 -.10 q-.34 .02 -.46 .22 q.20 .08 .46 -.02z"/>' +
    '<path d="M.06 -.10 q.34 .02 .46 .22 q-.20 .08 -.46 -.02z"/>' +
    '<path d="M-.09 .06 h.18 l-.03 .22 h-.12z"/>' +
    '<rect x="-.20" y=".30" width=".40" height=".07" rx=".03"/></g>' };

  F.GHA = { w: 3, h: 2, s: hs(3, 2, ['#CE1126', '#FCD116', '#006B3F']) +
    star(1.5, 1, .30, 5, '#000000', 0) };

  F.NGA = { w: 2, h: 1, s: vs(2, 1, ['#008751', '#FFFFFF', '#008751']) };

  F.CIV = { w: 3, h: 2, s: vs(3, 2, ['#F77F00', '#FFFFFF', '#009E60']) };

  F.SEN = { w: 3, h: 2, s: vs(3, 2, ['#00853F', '#FDEF42', '#E31B23']) +
    star(1.5, 1, .28, 5, '#00853F', 0) };

  F.CMR = { w: 3, h: 2, s: vs(3, 2, ['#007A5E', '#CE1126', '#FCD116']) +
    star(1.5, 1, .28, 5, '#FCD116', 0) };

  F.KSA = { w: 3, h: 2, s: rect(0, 0, 3, 2, '#165D31') +
    '<text x="1.5" y=".95" text-anchor="middle" font-size=".46" fill="#fff" ' +
      'font-family="Segoe UI, Tahoma, sans-serif" direction="rtl">' +
      'لا إله إلا الله</text>' +
    '<text x="1.5" y="1.38" text-anchor="middle" font-size=".38" fill="#fff" ' +
      'font-family="Segoe UI, Tahoma, sans-serif" direction="rtl">' +
      'محمد رسول الله</text>' +
    '<path d="M.55 1.62 h1.9 l.18 .09 l-.18 .09 h-1.9z" fill="#fff"/>' };

  F.QAT = { w: 28, h: 11, s: rect(0, 0, 28, 11, '#8A1538') +
    '<path d="M0 0 H7.5 ' + (function () {
      var d = '';
      for (var i = 0; i < 9; i++) {
        d += 'L10.5 ' + ((i + 0.5) * 11 / 9).toFixed(2) +
             'L7.5 ' + ((i + 1) * 11 / 9).toFixed(2);
      }
      return d;
    })() + ' H0 Z" fill="#fff"/>' };

  F.IRN = { w: 7, h: 4, s: hs(7, 4, ['#239F40', '#FFFFFF', '#DA0000']) +
    /* Emblem: stilisierte Tulpe aus vier Sicheln und einem Schwert */
    '<g transform="translate(3.5 2)" fill="#DA0000">' +
    '<path d="M-.03 -.32 h.06 v.52 h-.06z"/>' +
    '<path d="M-.26 -.14 q-.10 .22 .04 .34 q.10 -.14 .04 -.34z"/>' +
    '<path d="M.26 -.14 q.10 .22 -.04 .34 q-.10 -.14 -.04 -.34z"/>' +
    '<path d="M-.42 .02 q-.06 .18 .08 .26 q.06 -.12 -.02 -.26z"/>' +
    '<path d="M.42 .02 q.06 .18 -.08 .26 q-.06 -.12 .02 -.26z"/>' +
    '<path d="M-.30 .22 q.30 .22 .60 0 q-.30 .34 -.60 0z"/></g>' +
    (function () {
      /* 22 mal Takbir am Rand der Mittelbahn */
      var s = '';
      for (var i = 0; i < 11; i++) {
        var x = 0.42 + i * 0.6;
        s += '<path d="M' + x + ' 1.42 v.20 M' + (x + .1) + ' 1.42 v.20 M' +
             (x + .2) + ' 1.42 v.20" stroke="#fff" stroke-width=".05"/>';
        s += '<path d="M' + x + ' 2.38 v.20 M' + (x + .1) + ' 2.38 v.20 M' +
             (x + .2) + ' 2.38 v.20" stroke="#fff" stroke-width=".05"/>';
      }
      return s;
    })() };

  /* Asien & Ozeanien -------------------------------------------------- */

  F.JPN = { w: 3, h: 2, s: rect(0, 0, 3, 2, '#fff') +
    '<circle cx="1.5" cy="1" r=".6" fill="#BC002D"/>' };

  F.KOR = { w: 3, h: 2, s: rect(0, 0, 3, 2, '#fff') +
    /* Taegeuk: zwei ineinandergreifende Kommaformen. Rot gehört nach
       oben — der erste Pfad deckt nach der Drehung die obere Hälfte. */
    '<g transform="translate(1.5 1) rotate(-33.69)">' +
    '<path d="M0 .4 A.4 .4 0 0 1 0 -.4 A.2 .2 0 0 1 0 0 A.2 .2 0 0 0 0 .4Z" fill="#CD2E3A"/>' +
    '<path d="M0 -.4 A.4 .4 0 0 1 0 .4 A.2 .2 0 0 1 0 0 A.2 .2 0 0 0 0 -.4Z" fill="#0047A0"/>' +
    '</g>' +
    /* Vier Trigramme: oben links Geon ☰, unten links Ri ☲,
       oben rechts Gam ☵, unten rechts Gon ☷ — 3 = durchgehend,
       1 = unterbrochen.                                            */
    (function () {
      var pos = { tl: [-1, -1], tr: [1, -1], bl: [-1, 1], br: [1, 1] };
      var pattern = { tl: [3, 3, 3], tr: [1, 3, 1], bl: [3, 1, 3], br: [1, 1, 1] };
      var s = '', k;
      for (k in pattern) {
        var p = pos[k];
        s += '<g transform="translate(' + (1.5 + p[0] * 0.72) + ' ' + (1 + p[1] * 0.48) +
             ') rotate(' + (p[0] * p[1] > 0 ? -56.31 : 56.31) + ')" fill="#000">';
        pattern[k].forEach(function (seg, i) {
          var y = -0.14 + i * 0.14;
          if (seg === 3) s += '<rect x="-.24" y="' + y + '" width=".48" height=".08"/>';
          else s += '<rect x="-.24" y="' + y + '" width=".20" height=".08"/>' +
                    '<rect x=".04" y="' + y + '" width=".20" height=".08"/>';
        });
        s += '</g>';
      }
      return s;
    })() };

  F.AUS = { w: 2, h: 1, s: rect(0, 0, 2, 1, '#012169') +
    unionJack(1, 0.5) +
    star(0.5, 0.75, 0.16, 7, '#fff', 0) +
    star(1.62, 0.30, 0.07, 7, '#fff', 0) +
    star(1.45, 0.55, 0.09, 7, '#fff', 0) +
    star(1.62, 0.80, 0.09, 7, '#fff', 0) +
    star(1.80, 0.58, 0.08, 7, '#fff', 0) +
    star(1.66, 0.55, 0.045, 5, '#fff', 0) };

  FKC.data.flags = F;

  /** Seitenverhältnis Breite/Höhe — für Layouts, die es brauchen */
  FKC.data.flagRatio = function (code) {
    var f = F[code];
    return f ? f.w / f.h : 1.5;
  };

})(window.FKC);
