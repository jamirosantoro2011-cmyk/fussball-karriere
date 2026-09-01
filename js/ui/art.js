/* ── Generierte Grafiken ───────────────────────────────────────────────
   Alles selbst gezeichnet, im gleichen Stil wie die Vereinswappen:
   deterministisch aus Namen/IDs abgeleitet, keine echten Vorlagen.
   Enthält Spieler-Avatar, Länderflaggen und die Bausteine für
   Zeitstrahl, Schlagzeilen, Verlaufsdiagramme und Saisonposter.   */

window.FKC = window.FKC || {};
FKC.ui = FKC.ui || {};

(function (FKC) {
  'use strict';

  var A = {};
  var uid = 0;

  function hash(str) {
    var h = 0;
    for (var i = 0; i < String(str).length; i++) h = (Math.imul(31, h) + String(str).charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  /* ══ Spieler-Avatar ════════════════════════════════════════════════
     Verändert sich mit dem Alter: Kind, Jugendlicher, Erwachsener,
     Routinier. Hautton und Frisur hängen am Namen, das Trikot an den
     Vereinsfarben.                                                  */

  var SKIN = ['#f2d3b8', '#e8c09c', '#d8a877', '#bd8654', '#96603a', '#6d4126', '#4a2a18'];
  var HAIR = ['#1b1410', '#2f2118', '#4a3122', '#6b4426', '#8d6438', '#b08948', '#c9c9c9'];

  A.ageStage = function (age) {
    return age <= 11 ? 'child' : age <= 16 ? 'teen' : age <= 32 ? 'adult' : 'veteran';
  };

  /**
   * @param game   Spielstand
   * @param size   Kantenlänge in Pixeln
   * @param opts   { flat: true } ohne Hintergrund
   */
  A.avatar = function (game, size, opts) {
    opts = opts || {};
    size = size || 72;
    var id = 'av' + (++uid);
    var seed = hash((game.identity.firstName || '') + (game.identity.lastName || '') +
                    game.identity.nationality);
    var age = FKC.state.age();
    var stage = A.ageStage(age);

    var skin = SKIN[seed % SKIN.length];
    var hairIdx = (seed >> 3) % HAIR.length;
    if (stage === 'veteran' && hairIdx < 5) hairIdx = 6;          // ergraut
    var hair = HAIR[hairIdx];
    var hairStyle = (seed >> 6) % 4;

    var club = FKC.state.club();
    var shirt = club ? (club.color || '#3f6f5a') : '#3f6f5a';
    var shirtDark = shade(shirt, -0.4);

    /* Proportionen: Kinder haben relativ grössere Köpfe */
    var headR = stage === 'child' ? 17 : stage === 'teen' ? 15.5 : 14.5;
    var headY = stage === 'child' ? 27 : 26;
    var shoulderY = headY + headR + (stage === 'child' ? 8 : 11);
    var shoulderW = stage === 'child' ? 17 : stage === 'teen' ? 20 : 23;

    var s = '';
    s += '<svg class="avatar" viewBox="0 0 64 72" width="' + size + '" height="' +
         Math.round(size * 72 / 64) + '" aria-hidden="true">';
    s += '<defs><linearGradient id="' + id + 'b" x1="0" y1="0" x2="0" y2="1">' +
         '<stop offset="0%" stop-color="' + shade(shirt, 0.25) + '"/>' +
         '<stop offset="100%" stop-color="' + shirtDark + '"/></linearGradient>' +
         '<clipPath id="' + id + 'c"><rect x="0" y="0" width="64" height="72" rx="14"/></clipPath></defs>';

    if (!opts.flat) {
      s += '<g clip-path="url(#' + id + 'c)">' +
           '<rect width="64" height="72" fill="#16211d"/>' +
           '<circle cx="32" cy="18" r="26" fill="' + shade(shirt, -0.55) + '" opacity=".55"/>';
    } else {
      s += '<g>';
    }

    /* Schultern und Trikot */
    s += '<path d="M' + (32 - shoulderW) + ' 72 v-8 c0-7 ' + (shoulderW * 0.55) + '-11 ' +
         shoulderW + '-11 s' + shoulderW + ' 4 ' + shoulderW + ' 11 v8z" fill="url(#' + id + 'b)"/>';
    /* Kragen */
    s += '<path d="M' + (32 - 6) + ' ' + (shoulderY - 1) + ' q6 5 12 0 l-2 6 h-8z" fill="' +
         shade(shirt, -0.6) + '" opacity=".8"/>';

    /* Hals */
    s += '<rect x="28" y="' + (headY + headR - 4) + '" width="8" height="9" rx="3" fill="' +
         shade(skin, -0.15) + '"/>';

    /* Kopf */
    s += '<ellipse cx="32" cy="' + headY + '" rx="' + headR + '" ry="' + (headR * 1.12) +
         '" fill="' + skin + '"/>';
    /* Ohren */
    s += '<circle cx="' + (32 - headR) + '" cy="' + (headY + 2) + '" r="2.6" fill="' + skin + '"/>' +
         '<circle cx="' + (32 + headR) + '" cy="' + (headY + 2) + '" r="2.6" fill="' + skin + '"/>';

    /* Frisur */
    s += hairShape(hairStyle, stage, headR, headY, hair);

    /* Augen */
    var eyeY = headY + (stage === 'child' ? 2 : 1);
    s += '<circle cx="' + (32 - headR * 0.38) + '" cy="' + eyeY + '" r="1.7" fill="#1b2320"/>' +
         '<circle cx="' + (32 + headR * 0.38) + '" cy="' + eyeY + '" r="1.7" fill="#1b2320"/>';

    /* Mund */
    var mouthY = headY + headR * 0.55;
    s += '<path d="M' + (32 - 4) + ' ' + mouthY + ' q4 ' + (stage === 'child' ? 3.5 : 2.5) +
         ' 8 0" fill="none" stroke="' + shade(skin, -0.45) + '" stroke-width="1.5" stroke-linecap="round"/>';

    /* Routinier: Bartschatten und Falten */
    if (stage === 'veteran') {
      s += '<path d="M' + (32 - headR * 0.75) + ' ' + (headY + headR * 0.35) +
           ' q' + (headR * 0.75) + ' ' + (headR * 0.85) + ' ' + (headR * 1.5) + ' 0" ' +
           'fill="#000" opacity=".13"/>';
      s += '<path d="M' + (32 - headR * 0.62) + ' ' + (eyeY - 4) + ' h4" stroke="' +
           shade(skin, -0.3) + '" stroke-width="1" opacity=".7"/>' +
           '<path d="M' + (32 + headR * 0.3) + ' ' + (eyeY - 4) + ' h4" stroke="' +
           shade(skin, -0.3) + '" stroke-width="1" opacity=".7"/>';
    }

    s += '</g></svg>';
    return s;
  };

  function hairShape(style, stage, r, cy, color) {
    var top = cy - r * 1.12;
    if (stage === 'child') {
      /* Kinder: runde, volle Frisur */
      return '<path d="M' + (32 - r) + ' ' + (cy - r * 0.35) +
             ' a' + r + ' ' + r + ' 0 0 1 ' + (r * 2) + ' 0 q-' + r + ' -' + (r * 0.9) + ' -' +
             (r * 2) + ' 0z" fill="' + color + '"/>' +
             '<circle cx="32" cy="' + (top + r * 0.35) + '" r="' + (r * 0.95) + '" fill="' + color + '"/>';
    }
    if (style === 0) {                       // kurz
      return '<path d="M' + (32 - r) + ' ' + (cy - r * 0.3) +
             ' a' + r + ' ' + (r * 1.05) + ' 0 0 1 ' + (r * 2) + ' 0 l-2 -4 q-' + r + ' -6 -' +
             (r * 2 - 4) + ' 0z" fill="' + color + '"/>';
    }
    if (style === 1) {                       // Seitenscheitel
      return '<path d="M' + (32 - r) + ' ' + (cy - r * 0.45) + ' q2 -' + (r * 1.1) + ' ' +
             (r * 1.1) + ' -' + (r * 1.05) + ' q' + (r * 0.9) + ' -0.4 ' + (r * 0.95) + ' ' +
             (r * 0.8) + ' q-' + (r * 0.8) + ' -' + (r * 0.5) + ' -' + (r * 2) + ' ' + (r * 0.7) +
             'z" fill="' + color + '"/>';
    }
    if (style === 2) {                       // lockig
      return '<g fill="' + color + '">' +
             '<circle cx="' + (32 - r * 0.7) + '" cy="' + (cy - r * 0.72) + '" r="' + (r * 0.46) + '"/>' +
             '<circle cx="32" cy="' + (cy - r * 0.95) + '" r="' + (r * 0.52) + '"/>' +
             '<circle cx="' + (32 + r * 0.7) + '" cy="' + (cy - r * 0.72) + '" r="' + (r * 0.46) + '"/>' +
             '<circle cx="' + (32 - r * 0.95) + '" cy="' + (cy - r * 0.3) + '" r="' + (r * 0.34) + '"/>' +
             '<circle cx="' + (32 + r * 0.95) + '" cy="' + (cy - r * 0.3) + '" r="' + (r * 0.34) + '"/>' +
             '</g>';
    }
    /* style 3: sehr kurz / rasiert */
    return '<path d="M' + (32 - r * 0.98) + ' ' + (cy - r * 0.5) +
           ' a' + (r * 0.98) + ' ' + (r * 0.98) + ' 0 0 1 ' + (r * 1.96) + ' 0z" fill="' +
           color + '" opacity=".85"/>';
  }


  /* ══ Länderflaggen ═════════════════════════════════════════════════
     Originalgetreu, nicht stilisiert: Nationalflaggen sind offizielle
     Hoheitszeichen und dürfen 1:1 gezeigt werden. Die Zeichnungen
     stehen in data/flags.js, jede in ihren eigenen Konstruktions-
     einheiten — hier wird nur noch gerahmt und skaliert.            */

  /**
   * @param code   Ländercode (GER, BRA …)
   * @param width  Breite in Pixeln; die Höhe folgt dem **echten**
   *               Seitenverhältnis der Flagge (die Schweiz ist quadratisch,
   *               Katar sehr breit).
   */
  A.flag = function (code, width) {
    var f = (FKC.data.flags || {})[code];
    var w = width || 26;
    var id = 'fl' + (++uid);

    if (!f) {
      /* Kein Eintrag: neutrales Feld mit Kürzel statt einer erfundenen
         Flagge — lieber sichtbar leer als sichtbar falsch. */
      var h0 = Math.round(w * 2 / 3);
      return '<span class="flag" style="width:' + w + 'px;height:' + h0 + 'px">' +
        '<svg viewBox="0 0 30 20" width="100%" height="100%" aria-label="' +
        FKC.ui.c.esc(code) + '" role="img">' +
        '<rect width="30" height="20" rx="2" fill="#33413c"/>' +
        '<text x="15" y="14" text-anchor="middle" font-family="Outfit, sans-serif" ' +
        'font-weight="800" font-size="9" fill="#fff">' + FKC.ui.c.esc(code) + '</text>' +
        '</svg></span>';
    }

    var h = Math.round(w * f.h / f.w);
    var r = Math.min(f.w, f.h) * 0.05;          // Eckenradius massstäblich

    return '<span class="flag" style="width:' + w + 'px;height:' + h + 'px">' +
      '<svg viewBox="0 0 ' + f.w + ' ' + f.h + '" width="100%" height="100%" ' +
      'preserveAspectRatio="none" aria-label="' + FKC.ui.c.esc(code) + '" role="img">' +
      '<defs><clipPath id="' + id + '"><rect width="' + f.w + '" height="' + f.h +
      '" rx="' + r + '"/></clipPath></defs>' +
      '<g clip-path="url(#' + id + ')">' + f.s + '</g>' +
      '<rect width="' + f.w + '" height="' + f.h + '" rx="' + r +
      '" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="' + (r * 0.6) + '"/>' +
      '</svg></span>';
  };

  /** Hauptfarben einer Flagge — für das Nationaltrikot */
  A.flagColors = function (code) {
    var f = (FKC.data.flags || {})[code];
    if (!f) return null;
    /* Farben aus der Zeichnung lesen: dieselbe Quelle wie die Flagge,
       damit Trikot und Flagge nicht auseinanderlaufen. `stroke` muss mit
       hinein — bei England und Schottland steckt die Landesfarbe im
       Kreuz, nicht in einer Fläche. */
    var seen = [], re = /(?:fill|stroke|stop-color)="(#[0-9a-fA-F]{3,6})"/g, m;
    while ((m = re.exec(f.s))) {
      var c = m[1].toLowerCase();
      if (c.length === 4) c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
      if (c.length === 7 && seen.indexOf(c) < 0) seen.push(c);
    }
    return seen.length ? seen : null;
  };

  /* ══ Karriere-Zeitstrahl mit Vereinswappen ═════════════════════════ */

  A.clubTimeline = function (game) {
    var stints = (game.career.clubsPlayed || []).filter(function (st) {
      return st.apps > 0 || st.phase === 'pro';
    });
    if (!stints.length) return '';

    var endYear = game.identity.year;
    return '<div class="ctl"><div class="ctl-line"></div><div class="ctl-items">' +
      stints.map(function (st) {
        var club = FKC.data.clubById(st.clubId);
        var syn = !club && game.flags.syntheticClubs && game.flags.syntheticClubs[st.clubId];
        var c = club || syn;
        if (!c) return '';
        var to = st.to || endYear;
        return '<div class="ctl-item">' +
          '<div class="ctl-badge">' + FKC.ui.c.crest(c) + '</div>' +
          '<div class="ctl-years">' + st.from + '<br>' + (to === st.from ? '' : to) + '</div>' +
          '<div class="ctl-stats">' + st.apps + '/' + st.goals + '</div>' +
          '</div>';
      }).join('') + '</div></div>';
  };

  /* ══ Schlagzeilen-Karte im Zeitungslook ════════════════════════════ */

  /**
   * @param o { kicker, title, sub, tone, badge, comment, reporter }
   * comment ist die wertende Stimme des Reporters — Lob oder Kritik.
   */
  A.headline = function (o) {
    var esc = FKC.ui.c.esc;
    return '<div class="paper" data-tone="' + (o.tone || 'neutral') + '">' +
      '<div class="paper-masthead">' +
      '<span>' + esc(o.kicker || '') + '</span>' +
      '<span class="paper-rule"></span>' +
      '<span>' + esc(o.date || '') + '</span>' +
      '</div>' +
      '<h2 class="paper-title">' + esc(o.title) + '</h2>' +
      (o.sub ? '<p class="paper-sub">' + esc(o.sub) + '</p>' : '') +
      (o.comment
        ? '<div class="paper-take" data-take="' + (o.takeTone || 'neutral') + '">' +
          '<span class="paper-take-label">' + esc(FKC.t('paper.commentLabel')) + '</span>' +
          '<p>' + esc(o.comment) + '</p>' +
          (o.reporter ? '<footer>— ' + esc(o.reporter) + '</footer>' : '') +
          '</div>'
        : '') +
      (o.badge ? '<div class="paper-badge">' + o.badge + '</div>' : '') +
      '</div>';
  };

  /**
   * Reportername aus einem Startwert — bewusst ohne RNG, damit dieselbe
   * Schlagzeile beim Neuzeichnen nicht plötzlich jemand anderem gehört.
   */
  A.reporterFor = function (seed, nation) {
    var n = FKC.data.nationById(nation);
    var pool = FKC.data.names[(n && n.nameRegion) || 'en'] || FKC.data.names.en;
    var h = hash('rep' + seed);
    return pool.first[h % pool.first.length] + ' ' +
           pool.last[(h >> 5) % pool.last.length];
  };

  /**
   * Wählt eine von mehreren Meinungsvarianten — stabil über Renders,
   * abgeleitet aus Schlüssel und Saison.
   */
  A.pickTake = function (kind, seed, count) {
    return (hash(kind + '|' + seed) % count) + 1;
  };

  /* ══ Verlaufsdiagramm mit mehreren Reihen ══════════════════════════ */

  /**
   * @param series [{ values:[{x,y}], color, label, dashed }]
   * @param opts   { w, h, xLabels:[links,rechts] }
   */
  A.historyChart = function (series, opts) {
    opts = opts || {};
    var w = opts.w || 320, h = opts.h || 96, pad = 4;
    var live = series.filter(function (s) { return s.values && s.values.length > 1; });
    if (!live.length) return '';

    var xs = [], id = 'hc' + (++uid);
    live.forEach(function (s) { s.values.forEach(function (p) { xs.push(p.x); }); });
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
    if (maxX === minX) maxX = minX + 1;

    var body = live.map(function (s) {
      var ys = s.values.map(function (p) { return p.y; });
      var lo = Math.min.apply(null, ys), hi = Math.max.apply(null, ys);
      if (s.min != null) lo = Math.min(lo, s.min);
      if (s.max != null) hi = Math.max(hi, s.max);
      if (hi === lo) hi = lo + 1;

      var pts = s.values.map(function (p) {
        var x = pad + (p.x - minX) / (maxX - minX) * (w - pad * 2);
        var y = h - pad - (p.y - lo) / (hi - lo) * (h - pad * 2 - 6);
        return x.toFixed(1) + ',' + y.toFixed(1);
      });
      var last = pts[pts.length - 1].split(',');
      return '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + s.color +
        '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"' +
        (s.dashed ? ' stroke-dasharray="4 3"' : '') + '/>' +
        '<circle cx="' + last[0] + '" cy="' + last[1] + '" r="3" fill="' + s.color + '"/>';
    }).join('');

    var legend = live.map(function (s) {
      return '<span class="chart-key"><i style="background:' + s.color + '"></i>' +
        FKC.ui.c.esc(s.label) + '</span>';
    }).join('');

    return '<div class="chart"><svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" height="' + h +
      '" role="img" aria-hidden="true">' +
      '<line x1="0" y1="' + (h - 1) + '" x2="' + w + '" y2="' + (h - 1) +
      '" stroke="var(--line-soft)" stroke-width="1"/>' + body + '</svg>' +
      '<div class="chart-legend">' + legend + '</div></div>';
  };

  /* ══ Saison-Poster ═════════════════════════════════════════════════ */

  A.seasonPoster = function (game, r) {
    var esc = FKC.ui.c.esc, t = FKC.t;
    var club = FKC.data.clubById(r.clubId);
    var accent = club ? (club.color || '#9ef25b') : '#9ef25b';
    var isGK = game.identity.isGK;
    var diff = r.ovrEnd - r.ovrStart;

    var marks = [];
    (r.titles || r.trophies || []).forEach(function (x) {
      if (x.counted !== false) marks.push('🏆 ' + x.name);
    });
    (r.awards || []).forEach(function (a) { marks.push('★ ' + t('award.' + a.id)); });
    if (r.move) marks.push((r.move.dir === 'up' ? '▲ ' : '▼ ') +
      t(r.move.dir === 'up' ? 'tables.up' : 'tables.down'));
    if (r.injury) marks.push('✚ ' + t('effect.injuryWeeks', { n: r.injury.weeks }));

    return '<div class="poster" style="--poster-accent:' + esc(accent) + '">' +
      '<div class="poster-head">' +
      (club ? FKC.ui.c.crest(club, true) : '') +
      '<div><div class="poster-season">' + esc(r.season) + '</div>' +
      '<div class="poster-club">' + esc(club ? club.name : '') + '</div></div>' +
      '<div class="poster-ovr"><b>' + r.ovrEnd + '</b><span>' + t('card.ovr') +
      (diff ? ' ' + (diff > 0 ? '+' : '') + diff : '') + '</span></div>' +
      '</div>' +
      '<div class="poster-grid">' +
      posterCell(r.apps, t('stat.apps')) +
      posterCell(isGK ? r.cleanSheets : r.goals, isGK ? t('stat.cleanSheets') : t('stat.goals')) +
      posterCell(r.assists, t('stat.assists')) +
      posterCell(r.avgRating ? r.avgRating.toFixed(2) : '–', t('stat.avgRating')) +
      '</div>' +
      '<div class="poster-foot">' +
      '<span>' + t('season.positionValue', { n: r.leaguePos }) + '</span>' +
      '<span>' + FKC.i18n.money(r.marketValue) + '</span>' +
      '</div>' +
      (marks.length ? '<div class="poster-marks">' +
        marks.slice(0, 4).map(function (m) { return '<span>' + esc(m) + '</span>'; }).join('') +
        '</div>' : '') +
      '</div>';
  };

  function posterCell(v, label) {
    return '<div class="poster-cell"><b>' + FKC.ui.c.esc(String(v)) + '</b><span>' +
      FKC.ui.c.esc(label) + '</span></div>';
  }

  /* ══ Trikot von hinten ═════════════════════════════════════════════
     Eigenes Design, kein Nachbau: übernommen werden nur Vereinsfarbe
     und ein grober Musterstil, beides deterministisch aus der
     Vereins-ID (siehe js/engine/kit.js). Beschriftet mit Spielername
     und Rückennummer.                                              */

  /* Rumpf mit Ärmeln, Rückenansicht. Raster 200 × 210. */
  var SHIRT_BODY =
    'M78 20 C82 33 118 33 122 20 L146 25 C160 28 170 34 178 46 ' +
    'L190 84 C191 89 188 93 183 94 L156 100 C151 101 148 99 147 95 ' +
    'L143 80 L149 186 C149 190 147 192 143 192 L57 192 ' +
    'C53 192 51 190 51 186 L57 80 L53 95 C52 99 49 101 44 100 ' +
    'L17 94 C12 93 9 89 10 84 L22 46 C30 34 40 28 54 25 Z';

  /* Muster im Trikot. `a` ist die Zweitfarbe. */
  function shirtPattern(kind, a) {
    switch (kind) {
      case 'stripes':
        var s = '';
        for (var x = -10; x < 200; x += 34) {
          s += '<rect x="' + x + '" y="0" width="17" height="210" fill="' + a + '"/>';
        }
        return s;
      case 'hoops':
        var h = '';
        for (var y = 30; y < 210; y += 40) {
          h += '<rect x="0" y="' + y + '" width="200" height="20" fill="' + a + '"/>';
        }
        return h;
      case 'sash':
        return '<path d="M-20 150 L120 0 L168 0 L28 210 Z" fill="' + a + '"/>';
      case 'halves':
        return '<rect x="100" y="0" width="100" height="210" fill="' + a + '"/>';
      case 'shoulders':
        return '<path d="M0 0 H200 V56 C160 40 40 40 0 56 Z" fill="' + a + '"/>';
      case 'chest':
        return '<rect x="0" y="62" width="200" height="26" fill="' + a + '"/>';
      default:
        return '';
    }
  }

  /**
   * @param o { design, number, name, size, label }
   *   design — aus FKC.kit.design() / nationalDesign()
   */
  A.shirtBack = function (o) {
    o = o || {};
    var d = o.design || FKC.kit.fallbackDesign('#3f6f5a', 'x');
    var id = 'sh' + (++uid);
    var w = o.size || 210;
    var esc = FKC.ui.c.esc;
    var name = String(o.name || '').toUpperCase();
    var num = o.number != null ? String(o.number) : '';

    /* Der Namensbogen ist rund 104 Einheiten lang — so breit ist der Rumpf
       auf Schulterblatthöhe, die Ärmel zählen nicht mit. Die Schriftgrösse
       wird danach aufgelöst, inklusive Sperrung; ohne die käme
       „SCHWEINSTEIGER" links und rechts über den Trikotrand hinaus.
       (`textLength` auf einem <textPath> wirkt nicht zuverlässig, deshalb
       die Rechnung statt der Angabe.)                                  */
    var ARC = 104;
    var len = Math.max(1, name.length);
    var track = len <= 8 ? 1.5 : len <= 12 ? 0.8 : 0.4;         // Sperrung
    /* 0.7 em ist die gemessene mittlere Zeichenbreite von Outfit in
       Versalien — mit 0.6 wurden elfstellige Namen 15 % zu breit. */
    var nameSize = FKC.util.clamp(Math.floor((ARC / len - track) / 0.7), 9, 20);

    /* Dreistellige Nummern gibt es nicht, aber ein Altstand oder das
       Adminpanel kann eine liefern — dann muss sie trotzdem passen. */
    var numSize = num.length > 2 ? 44 : num.length > 1 ? 62 : 70;

    var s = '<svg class="shirt" viewBox="0 0 200 210" width="' + w + '" height="' +
            Math.round(w * 210 / 200) + '" role="img" aria-label="' +
            esc(o.label || (name + ' ' + num)) + '">';

    s += '<defs>' +
      '<clipPath id="' + id + 'c"><path d="' + SHIRT_BODY + '"/></clipPath>' +
      /* Stoff: Licht von oben links, Schatten in den Flanken */
      '<linearGradient id="' + id + 'g" x1="0.1" y1="0" x2="0.9" y2="1">' +
        '<stop offset="0%" stop-color="rgba(255,255,255,.22)"/>' +
        '<stop offset="42%" stop-color="rgba(255,255,255,0)"/>' +
        '<stop offset="100%" stop-color="rgba(0,0,0,.3)"/>' +
      '</linearGradient>' +
      /* Namensbogen */
      '<path id="' + id + 'p" d="M48 80 Q100 62 152 80" fill="none"/>' +
      '</defs>';

    /* Schlagschatten des ganzen Trikots */
    s += '<path d="' + SHIRT_BODY + '" transform="translate(2 4)" fill="rgba(0,0,0,.35)"/>';

    /* Grundfarbe + Muster */
    s += '<g clip-path="url(#' + id + 'c)">' +
      '<rect x="0" y="0" width="200" height="210" fill="' + d.base + '"/>' +
      shirtPattern(d.pattern, d.second) +
      /* Falten: zwei weiche Bahnen, damit der Stoff nicht wie Papier wirkt */
      '<path d="M70 40 C64 100 68 150 62 192" stroke="rgba(0,0,0,.13)" ' +
        'stroke-width="9" fill="none"/>' +
      '<path d="M132 40 C138 100 134 150 140 192" stroke="rgba(0,0,0,.10)" ' +
        'stroke-width="8" fill="none"/>' +
      '<rect x="0" y="0" width="200" height="210" fill="url(#' + id + 'g)"/>' +
      '</g>';

    /* Kragen und Ärmelabschlüsse in der Trimfarbe */
    s += '<path d="M78 20 C82 33 118 33 122 20" fill="none" stroke="' + d.trim +
         '" stroke-width="7" stroke-linecap="round"/>';
    s += '<path d="M17 94 L44 100" stroke="' + d.trim + '" stroke-width="6" ' +
         'stroke-linecap="round"/>';
    s += '<path d="M183 94 L156 100" stroke="' + d.trim + '" stroke-width="6" ' +
         'stroke-linecap="round"/>';

    /* Aussenkante */
    s += '<path d="' + SHIRT_BODY + '" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="2"/>';

    /* Name im Bogen über der Nummer */
    if (name) {
      s += '<text font-family="Outfit, Segoe UI, sans-serif" font-weight="800" ' +
        'font-size="' + nameSize + '" letter-spacing="' + track + '" fill="' + d.ink + '" ' +
        'paint-order="stroke" stroke="rgba(0,0,0,.28)" stroke-width="2.4" ' +
        'stroke-linejoin="round">' +
        '<textPath href="#' + id + 'p" startOffset="50%" text-anchor="middle">' +
        esc(name) + '</textPath></text>';
    }

    /* Rückennummer */
    if (num) {
      s += '<text x="100" y="160" text-anchor="middle" ' +
        'font-family="Outfit, Segoe UI, sans-serif" font-weight="800" ' +
        'font-size="' + numSize + '" fill="' + d.ink + '" ' +
        'paint-order="stroke" stroke="rgba(0,0,0,.3)" stroke-width="4" ' +
        'stroke-linejoin="round">' + esc(num) + '</text>';
    }

    return s + '</svg>';
  };

  /* ══ Spielfeld mit Positionen ══════════════════════════════════════
     Ersetzt die frühere Positionsliste: ein gezeichnetes Feld, auf dem
     jede Position an ihrem Platz steht und direkt angeklickt wird.
     Koordinaten in Feldprozent, eigenes Tor unten.                  */

  A.PITCH_SPOTS = [
    { id: 'GK',  x: 50, y: 90.5 },
    { id: 'LB',  x: 15, y: 74 }, { id: 'CB', x: 50, y: 78 }, { id: 'RB', x: 85, y: 74 },
    { id: 'CDM', x: 50, y: 61 },
    { id: 'CM',  x: 50, y: 49 },
    { id: 'CAM', x: 50, y: 37 },
    { id: 'LW',  x: 15, y: 27 }, { id: 'RW', x: 85, y: 27 },
    { id: 'ST',  x: 50, y: 20 }
  ];

  /**
   * @param selected  aktuell gewählte Positions-ID
   * @param opts      { interactive:true, label:fn(id) }
   */
  A.pitch = function (selected, opts) {
    opts = opts || {};
    var interactive = opts.interactive !== false;
    var label = opts.label || function (id) { return id; };
    var esc = FKC.ui.c.esc;
    var id = 'pi' + (++uid);
    var W = 300, H = 420;                     // Zeichenfläche, hochkant
    var px = function (v) { return (v / 100) * W; };
    var py = function (v) { return (v / 100) * H; };

    var s = '<svg class="pitch" viewBox="0 0 ' + W + ' ' + H + '" ' +
            'preserveAspectRatio="xMidYMid meet" role="group">';

    /* Rasen: zwei Grüntöne als Mähstreifen, dazu ein weicher Verlauf */
    s += '<defs>' +
      '<linearGradient id="' + id + 'g" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="var(--pitch-far)"/>' +
        '<stop offset="100%" stop-color="var(--pitch-near)"/></linearGradient>' +
      '<radialGradient id="' + id + 'v" cx="50%" cy="45%" r="72%">' +
        '<stop offset="55%" stop-color="rgba(0,0,0,0)"/>' +
        '<stop offset="100%" stop-color="rgba(0,0,0,.28)"/></radialGradient>' +
      '</defs>';

    s += '<rect x="0" y="0" width="' + W + '" height="' + H + '" rx="10" fill="url(#' + id + 'g)"/>';
    for (var b = 0; b < 8; b += 2) {
      s += '<rect x="0" y="' + (b * H / 8) + '" width="' + W + '" height="' + (H / 8) +
           '" fill="rgba(255,255,255,.035)"/>';
    }
    s += '<rect x="0" y="0" width="' + W + '" height="' + H + '" rx="10" fill="url(#' + id + 'v)"/>';

    /* Linien */
    var m = 12;                                                   // Randabstand
    s += '<g fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.6">';
    s += '<rect x="' + m + '" y="' + m + '" width="' + (W - 2 * m) + '" height="' + (H - 2 * m) + '"/>';
    s += '<line x1="' + m + '" y1="' + (H / 2) + '" x2="' + (W - m) + '" y2="' + (H / 2) + '"/>';
    s += '<circle cx="' + (W / 2) + '" cy="' + (H / 2) + '" r="46"/>';
    /* Strafräume oben und unten */
    var paW = 152, gaW = 68;
    ['top', 'bottom'].forEach(function (side) {
      var top = side === 'top';
      var paY = top ? m : H - m - 62, gaY = top ? m : H - m - 22;
      s += '<rect x="' + ((W - paW) / 2) + '" y="' + paY + '" width="' + paW + '" height="62"/>';
      s += '<rect x="' + ((W - gaW) / 2) + '" y="' + gaY + '" width="' + gaW + '" height="22"/>';
      /* Strafstosskreis — nur der Bogen ausserhalb des Raums */
      var spotY = top ? m + 42 : H - m - 42;
      s += '<path d="' + (top
        ? 'M' + (W / 2 - 26) + ' ' + (m + 62) + ' A 30 30 0 0 0 ' + (W / 2 + 26) + ' ' + (m + 62)
        : 'M' + (W / 2 - 26) + ' ' + (H - m - 62) + ' A 30 30 0 0 1 ' + (W / 2 + 26) + ' ' + (H - m - 62)) + '"/>';
      s += '<circle cx="' + (W / 2) + '" cy="' + spotY + '" r="1.6" fill="rgba(255,255,255,.55)"/>';
    });
    s += '<circle cx="' + (W / 2) + '" cy="' + (H / 2) + '" r="1.6" fill="rgba(255,255,255,.55)"/>';
    s += '</g>';

    /* Positionsmarken */
    s += '<g class="pitch-spots">';
    A.PITCH_SPOTS.forEach(function (p) {
      var on = p.id === selected;
      s += '<g class="pitch-spot' + (on ? ' is-on' : '') + '"' +
           (interactive ? ' data-pos="' + p.id + '" tabindex="0" role="button"' +
                          ' aria-pressed="' + on + '"' : '') +
           ' aria-label="' + esc(label(p.id)) + '">';
      s += '<circle class="pitch-hit" cx="' + px(p.x) + '" cy="' + py(p.y) + '" r="26" fill="transparent"/>';
      s += '<circle class="pitch-ring" cx="' + px(p.x) + '" cy="' + py(p.y) + '" r="21"/>';
      s += '<circle class="pitch-dot" cx="' + px(p.x) + '" cy="' + py(p.y) + '" r="16"/>';
      s += '<text class="pitch-label" x="' + px(p.x) + '" y="' + (py(p.y) + 4.5) + '" ' +
           'text-anchor="middle">' + esc(label(p.id)) + '</text>';
      s += '</g>';
    });
    s += '</g></svg>';
    return s;
  };

  /* ── Farbhilfen ─────────────────────────────────────────────────── */

  function shade(hex, amount) {
    var h = String(hex).replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    var target = amount < 0 ? 0 : 255, p = Math.abs(amount);
    var mix = function (v) { return Math.round((target - v) * p + v); };
    return 'rgb(' + mix(r) + ',' + mix(g) + ',' + mix(b) + ')';
  }
  A.shade = shade;
  A.hash = hash;

  FKC.ui.art = A;

})(window.FKC);
