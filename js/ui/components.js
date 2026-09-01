/* ── UI-Bausteine ──────────────────────────────────────────────────────
   Kleine Funktionen, die HTML-Schnipsel liefern. Die Screens setzen sie
   zusammen; Klicks laufen über Event-Delegation im Router.           */

window.FKC = window.FKC || {};
FKC.ui = FKC.ui || {};

(function (FKC) {
  'use strict';

  var U = {};
  var t = function (k, p) { return FKC.t(k, p); };

  U.esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  /* ── Vereinswappen ──────────────────────────────────────────────────
     Eigene, stilisierte Badges aus Vereinsfarbe, Initialen und einer
     Wappenform. Bewusst keine Nachbildung echter Logos — Form, Muster
     und Zweitfarbe werden deterministisch aus der Vereins-ID abgeleitet,
     damit ein Verein immer gleich aussieht.                          */

  var badgeUid = 0;

  function hexToRgb(hex) {
    var h = String(hex).replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  /** amount < 0 dunkler, > 0 heller */
  function shade(hex, amount) {
    var c = hexToRgb(hex);
    var target = amount < 0 ? 0 : 255;
    var p = Math.abs(amount);
    var mix = function (v) { return Math.round((target - v) * p + v); };
    return 'rgb(' + mix(c.r) + ',' + mix(c.g) + ',' + mix(c.b) + ')';
  }

  /** Helle Vereinsfarben brauchen dunkle Schrift */
  function readableInk(hex) {
    var c = hexToRgb(hex);
    var lum = (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
    return lum > 0.62 ? '#16211d' : '#ffffff';
  }

  function hashOf(str) {
    var h = 0;
    for (var i = 0; i < String(str).length; i++) h = (Math.imul(31, h) + String(str).charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  /* Wappenformen — Pfade im Raster 40 × 46 */
  var BADGE_SHAPES = [
    /* klassisches Spitzschild */
    'M4 4 h32 v21 c0 10.5-9.5 15.8-16 18.6C13.5 40.8 4 35.5 4 25z',
    /* Rundwappen — Mitte bewusst auf 23, sonst sitzt der Kreis neben den
       Schilden sichtbar zu hoch im Rahmen */
    'M20 5.6 a17.4 17.4 0 1 1 -.01 0z',
    /* moderner Wappenschild mit weichen Schultern */
    'M20 3.2 l15 4.4 v14.6 c0 9.6-6.4 16.4-15 20.4C11.4 38.6 5 31.8 5 22.2V7.6z',
    /* Sechseck */
    'M20 3 l15.2 8.6v17.8L20 43 4.8 29.4V11.6z'
  ];

  /* Muster im Wappenfeld. `a` ist die Zweitfarbe, `w` reines Weiss-Overlay. */
  function badgePattern(kind, a, w) {
    switch (kind) {
      case 1:  /* Längsstreifen */
        return '<rect x="8" y="0" width="5.5" height="46" fill="' + a + '"/>' +
               '<rect x="18.5" y="0" width="5.5" height="46" fill="' + a + '"/>' +
               '<rect x="29" y="0" width="5.5" height="46" fill="' + a + '"/>';
      case 2:  /* Querbänder */
        return '<rect x="0" y="6" width="40" height="6" fill="' + a + '"/>' +
               '<rect x="0" y="19" width="40" height="6" fill="' + a + '"/>' +
               '<rect x="0" y="32" width="40" height="6" fill="' + a + '"/>';
      case 3:  /* Schrägband */
        return '<path d="M-6 30 L26 -6 L38 -6 L6 42z" fill="' + a + '"/>';
      case 4:  /* geteilt */
        return '<rect x="20" y="0" width="20" height="46" fill="' + a + '"/>';
      case 5:  /* Winkel */
        return '<path d="M0 10 L20 24 L40 10 V22 L20 36 L0 22z" fill="' + a + '"/>';
      case 6:  /* Brustband */
        return '<rect x="0" y="15" width="40" height="12" fill="' + a + '"/>' +
               '<rect x="0" y="15" width="40" height="1.4" fill="' + w + '" opacity=".35"/>';
      default: /* schlicht — nur ein Lichtkeil */
        return '<path d="M0 0 H40 V13 L0 27z" fill="' + w + '" opacity=".07"/>';
    }
  }

  /**
   * Vereinswappen als SVG.
   * Form, Muster und Zweitfarbe kommen deterministisch aus der Vereins-ID —
   * ein Verein sieht damit überall gleich aus. Unter 26 px fallen Rand,
   * Gravurkante und Glanz weg, sonst wird das Wappen in der Tabelle matschig.
   */
  U.badge = function (club, size) {
    if (!club) return '';
    size = size || 34;
    var label = (club.short || FKC.util.initials(club.name || '')).slice(0, 3);
    var color = club.color || '#3f6f5a';
    var hash = hashOf(club.id || club.name || label);
    var uid = 'bd' + (++badgeUid);
    var detail = size >= 26;

    var shape = BADGE_SHAPES[hash % BADGE_SHAPES.length];
    var pattern = (hash >> 3) % 7;
    var ink = readableInk(color);

    /* Zweitfarbe: heller oder dunkler Ton derselben Farbe — nie eine fremde,
       sonst zerfällt die Farbwelt der Liga in Konfetti. */
    var second = ((hash >> 6) & 1)
      ? 'rgba(255,255,255,.16)' : shade(color, -0.3);

    var s = '<svg viewBox="0 0 40 46" width="100%" height="100%" aria-hidden="true">';

    s += '<defs>' +
      /* Feldverlauf: oben Licht, unten Schatten */
      '<linearGradient id="' + uid + 'f" x1="0.15" y1="0" x2="0.75" y2="1">' +
        '<stop offset="0%" stop-color="' + shade(color, 0.30) + '"/>' +
        '<stop offset="52%" stop-color="' + color + '"/>' +
        '<stop offset="100%" stop-color="' + shade(color, -0.42) + '"/>' +
      '</linearGradient>' +
      /* Metallrand — gibt dem Wappen Wertigkeit */
      '<linearGradient id="' + uid + 'r" x1="0" y1="0" x2="0.4" y2="1">' +
        '<stop offset="0%" stop-color="rgba(255,255,255,.95)"/>' +
        '<stop offset="38%" stop-color="rgba(255,255,255,.5)"/>' +
        '<stop offset="62%" stop-color="rgba(255,255,255,.22)"/>' +
        '<stop offset="100%" stop-color="rgba(255,255,255,.55)"/>' +
      '</linearGradient>' +
      '<clipPath id="' + uid + 'c"><path d="' + shape + '"/></clipPath>' +
      '</defs>';

    /* Feld mit Muster */
    s += '<g clip-path="url(#' + uid + 'c)">' +
      '<rect x="0" y="0" width="40" height="46" fill="url(#' + uid + 'f)"/>' +
      '<g opacity="' + (pattern === 0 ? 1 : 0.5) + '">' +
      badgePattern(pattern, second, '#fff') + '</g>';
    if (detail) {
      /* Glanzbogen über der oberen Hälfte */
      s += '<path d="M-2 -2 H42 V11 C30 21 12 21 -2 12z" fill="#fff" opacity=".13"/>';
      /* Bodenschatten innen */
      s += '<path d="M-2 34 H42 V48 H-2z" fill="#000" opacity=".16"/>';
    }
    s += '</g>';

    /* Ränder: aussen Metall, innen eine feine dunkle Gravurkante */
    if (detail) {
      s += '<path d="' + shape + '" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="3.2"/>';
    }
    s += '<path d="' + shape + '" fill="none" stroke="url(#' + uid + 'r)" stroke-width="' +
         (detail ? 1.8 : 1.4) + '"/>';

    /* Kürzel — der Kontrastsaum kommt über `paint-order`, nicht über einen
       zweiten Textknoten: zwei Knoten stünden doppelt im Textinhalt. */
    var fontSize = label.length >= 3 ? 12.5 : label.length === 2 ? 15 : 17;
    var textY = hash % BADGE_SHAPES.length === 1 ? 27.5 : 27;
    var halo = ink === '#ffffff' ? 'rgba(0,0,0,.4)' : 'rgba(255,255,255,.45)';
    s += '<text x="20" y="' + textY + '" text-anchor="middle" ' +
      'font-family="Outfit, Segoe UI, sans-serif" font-weight="800" ' +
      'font-size="' + fontSize + '" fill="' + ink + '"' +
      (detail ? ' paint-order="stroke" stroke="' + halo + '" stroke-width="2.4"' +
                ' stroke-linejoin="round"' : '') +
      '>' + U.esc(label) + '</text>';

    s += '</svg>';

    /* Für die beiden Standardgrössen steht gar nichts im style-Attribut —
       jeder Inline-Wert (auch eine Custom Property) schlägt sonst die
       Kontextregeln, und das Wappen bliebe in der Ligatabelle so gross
       wie auf der Spielerkarte. Nur echte Sondergrössen werden gesetzt. */
    var cls = 'crest' + (size === 46 ? ' crest-lg' : '');
    var style = (size === 34 || size === 46) ? '' : ' style="--crest-w:' + size + 'px"';
    return '<span class="' + cls + '"' + style + '>' + s + '</span>';
  };

  /** Bisheriger Name, damit alle vorhandenen Aufrufe weiter passen */
  U.crest = function (club, big) {
    return U.badge(club, big ? 46 : 34);
  };

  U.clubLine = function (club, sub) {
    if (!club) return '';
    return '<span class="club-line">' + U.crest(club) +
      '<span><span class="club-name">' + U.esc(club.name) + '</span>' +
      (sub ? '<br><span class="club-meta">' + U.esc(sub) + '</span>' : '') +
      '</span></span>';
  };

  /* ── Spielerkarte ───────────────────────────────────────────────── */
  U.playerCard = function (game, opts) {
    opts = opts || {};
    var id = game.identity;
    var club = FKC.state.club();
    var tier = FKC.attributes.tier(game.ovr);
    var pos = id.isGK ? 'GK' : id.position;

    var sub = [];
    sub.push(t('pos.' + pos));
    sub.push(t('card.age', { n: FKC.state.age() }));
    if (id.height) sub.push(id.height + ' cm');

    var html = '<div class="playercard"><div class="pc-top">';
    html += '<div class="pc-avatar">' + FKC.ui.art.avatar(game, 56) + '</div>';
    html += '<div class="badge-stack">';
    html += '<div class="ovr-badge" data-tier="' + tier + '">' +
      '<span class="ovr-num">' + game.ovr + '</span>' +
      '<span class="ovr-lbl">' + t('card.ovr') + '</span></div>';
    /* Potenzial als Spanne — solange sich noch etwas entwickeln kann */
    if (game.hidden && game.career.phase !== 'retired' && game.identity.age <= 24) {
      var pr = FKC.attributes.potentialRange(game);
      html += '<div class="pot-badge" data-tier="' + FKC.attributes.potentialTier(game) + '">' +
        '<span class="pot-num">' + pr.low + '–' + pr.high + '</span>' +
        '<span class="pot-lbl">' + t('card.potential') + '</span></div>';
    }
    html += '</div>';
    html += '<div class="pc-id"><div class="pc-name">' + U.esc(FKC.state.fullName()) + '</div>' +
      '<div class="pc-sub">' + FKC.ui.art.flag(id.nationality, 20) + ' ' +
      U.esc(FKC.data.nationName(id.nationality)) + '</div>' +
      '<div class="pc-sub">' + sub.map(U.esc).join(' · ') + '</div>';
    if (game.hidden && game.hidden.playstyle) {
      html += '<div class="pc-sub" style="margin-top:6px">' +
        U.chip('◆ ' + t('playstyle.' + game.hidden.playstyle), 'accent') + '</div>';
    }
    if (club) html += '<div class="pc-sub" style="margin-top:6px">' + U.crest(club) +
      '<span class="club-name">' + U.esc(club.name) + '</span></div>';
    html += '</div></div>';

    /* Karrierebilanz — was insgesamt zusammengekommen ist, nicht nur
       die laufende Saison. Erst ab dem ersten Profieinsatz sinnvoll. */
    var tot = game.career.totals || {};
    var yt = game.career.youthTotals || {};
    var apps = (tot.apps || 0) + (yt.apps || 0);
    if (apps > 0) {
      var stat = [
        [t('card.apps'), apps],
        [t('card.goals'), (tot.goals || 0) + (yt.goals || 0)],
        [t('card.assists'), (tot.assists || 0) + (yt.assists || 0)]
      ];
      html += '<div class="pc-career">' + stat.map(function (s) {
        return '<div class="pc-career-item"><b>' + s[1] + '</b><span>' + s[0] + '</span></div>';
      }).join('') + '</div>';
    }

    /* Marktwert bleibt immer sichtbar, nicht in einem Untermenü */
    var keys = [];
    keys.push([t('hub.marketValue'), FKC.i18n.money(game.status.marketValue || 0)]);
    keys.push([t('meter.form'), Math.round(game.condition.form)]);
    if (game.status.contract) {
      keys.push([t('hub.contract'), t('hub.yearsLeft', { n: game.status.contract.yearsLeft })]);
    } else {
      keys.push([t('meter.reputation'), Math.round(game.status.reputation)]);
    }
    html += '<div class="pc-keys">' + keys.map(function (k) {
      return '<div class="pc-key"><span>' + U.esc(k[0]) + '</span><b>' + U.esc(k[1]) + '</b></div>';
    }).join('') + '</div>';

    if (opts.attrs !== false) html += U.attrGrid(game, opts.deltas);
    html += '</div>';
    return html;
  };

  /* ── Attributraster ─────────────────────────────────────────────── */
  U.attrGrid = function (game, deltas) {
    var keys = FKC.data.keysFor(game.identity.isGK);
    var html = '<div class="attrs">';
    keys.forEach(function (k) {
      var v = game.attributes[k];
      var d = deltas && deltas[k];
      html += '<div class="attr" data-level="' + FKC.attributes.level(v) + '">' +
        '<span class="attr-key">' + U.esc(t('attr.short.' + k)) + '</span>' +
        '<span class="attr-bar"><i style="width:' + Math.max(3, v) + '%"></i></span>' +
        '<span class="attr-val">' + v +
        (d ? '<span class="attr-delta ' + (d > 0 ? 'u-good' : 'u-bad') + '">' +
          (d > 0 ? '+' : '') + d + '</span>' : '') +
        '</span></div>';
    });
    return html + '</div>';
  };

  /* ── Messbalken ─────────────────────────────────────────────────── */
  U.meter = function (label, value, tone, hint) {
    return '<div class="meter" data-tone="' + (tone || 'grass') + '">' +
      '<div class="meter-head"><span>' + U.esc(label) + '</span><b>' +
      (hint != null ? U.esc(hint) : Math.round(value) + '%') + '</b></div>' +
      '<div class="meter-bar"><i style="width:' + FKC.util.clamp(value, 0, 100) + '%"></i></div></div>';
  };

  /* ── Chips ──────────────────────────────────────────────────────── */
  U.chip = function (label, tone) {
    var cls = tone === 'good' ? 'chip-good' : tone === 'bad' ? 'chip-bad'
            : tone === 'warn' ? 'chip-warn' : tone === 'info' ? 'chip-info'
            : tone === 'gold' ? 'chip-gold' : tone === 'accent' ? 'chip-accent' : '';
    return '<span class="chip ' + cls + '">' + U.esc(label) + '</span>';
  };

  U.chips = function (list) {
    if (!list || !list.length) return '';
    return '<div class="effects">' + list.map(function (c) {
      return U.chip(c.label, c.tone);
    }).join('') + '</div>';
  };

  /* ── Auswahlkarte ───────────────────────────────────────────────── */
  U.choice = function (choice) {
    var riskChip = choice.risk
      ? U.chip(t('risk.' + choice.risk), choice.risk === 'low' ? 'good'
        : choice.risk === 'high' ? 'bad' : 'warn')
      : '';
    return '<button class="choice" type="button" data-choice="' + U.esc(choice.id) + '">' +
      '<div class="choice-title">' + U.esc(choice.label) + '</div>' +
      (choice.desc ? '<div class="choice-desc">' + U.esc(choice.desc) + '</div>' : '') +
      (riskChip ? '<div class="choice-foot">' + riskChip + '</div>' : '') +
      '</button>';
  };

  /* ── Statistikblock ─────────────────────────────────────────────── */
  U.stats = function (items) {
    return '<div class="stats">' + items.map(function (i) {
      return '<div class="stat"><div class="stat-v">' + U.esc(i.value) +
        '</div><div class="stat-l">' + U.esc(i.label) + '</div></div>';
    }).join('') + '</div>';
  };

  U.kv = function (rows) {
    return rows.map(function (r) {
      return '<div class="kv"><span>' + U.esc(r[0]) + '</span><span>' + r[1] + '</span></div>';
    }).join('');
  };

  U.sectionTitle = function (label) {
    return '<div class="section-title"><span class="u-up">' + U.esc(label) + '</span></div>';
  };

  /* ── Zeitstrahl ─────────────────────────────────────────────────── */
  U.timeline = function (entries) {
    if (!entries.length) return '<p class="u-muted">' + t('timeline.empty') + '</p>';
    return '<div class="timeline">' + entries.map(function (e) {
      var text = typeof e.text === 'string' ? e.text : t(e.text.key, e.text.params || {});
      return '<div class="tl-item" data-mark="' + U.esc(e.mark || 'plain') + '">' +
        '<div class="tl-when">' + t('timeline.age', { n: e.age }) + ' · ' + e.year + '</div>' +
        '<div class="tl-what">' + U.esc(text) + '</div></div>';
    }).join('') + '</div>';
  };

  /* ── OVR-Verlaufskurve (Inline-SVG) ─────────────────────────────── */
  U.ovrChart = function (history, w, h) {
    if (!history || history.length < 2) return '';
    w = w || 300; h = h || 70;
    var max = 0, min = 99;
    history.forEach(function (p) { max = Math.max(max, p.ovr); min = Math.min(min, p.ovr); });
    max = Math.max(max, min + 8);
    var pts = history.map(function (p, i) {
      var x = (i / (history.length - 1)) * (w - 6) + 3;
      var y = h - 6 - ((p.ovr - min) / (max - min)) * (h - 14);
      return x.toFixed(1) + ',' + y.toFixed(1);
    });
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" height="' + h +
      '" role="img" aria-hidden="true" style="display:block">' +
      '<polyline points="' + pts.join(' ') + '" fill="none" stroke="var(--accent)" ' +
      'stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<circle cx="' + pts[pts.length - 1].split(',')[0] + '" cy="' +
      pts[pts.length - 1].split(',')[1] + '" r="3.2" fill="var(--accent)"/></svg>';
  };

  FKC.ui.c = U;

})(window.FKC);
