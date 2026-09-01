/* ── Trikot: Rückennummern und Trikotdesign ────────────────────────────
   Zwei Dinge, die zusammengehören: welche Nummer man bekommen kann und
   wie das Trikot aussieht, auf dem sie steht.

   Das Design ist bewusst **kein** Nachbau echter Trikots — das wäre
   geschütztes Design. Abgeleitet werden nur Vereinsfarbe und ein grober
   Stil (Streifen, Ringel, Schrägband …), deterministisch aus der
   Vereins-ID, genau wie bei den Wappen.                             */

window.FKC = window.FKC || {};

(function (FKC) {
  'use strict';

  var K = {};

  /* ══ Rückennummern ════════════════════════════════════════════════ */

  /* Positionstypische Nummern — die erste ist die klassischste */
  K.TYPICAL = {
    GK:  [1, 12, 13, 22],
    CB:  [4, 5, 3, 6, 15],
    LB:  [3, 5, 15, 18],
    RB:  [2, 12, 16, 24],
    CDM: [6, 8, 5, 16],
    CM:  [8, 14, 18, 20],
    CAM: [10, 7, 21, 23],
    LW:  [11, 7, 17, 19],
    RW:  [7, 11, 17, 22],
    ST:  [9, 19, 17, 20]
  };

  /* Nummern, die in jedem Kader jemandem gehören, der sie nicht hergibt */
  var ICONIC = [7, 9, 10, 11];

  /**
   * Auswahlliste für die Nummernvergabe.
   * Belegt/frei wird deterministisch aus Verein, Jahr und Vereins-ID
   * gewürfelt — nicht aus dem laufenden RNG, sonst ändert sich die
   * Liste beim Neuzeichnen derselben Szene.
   */
  K.numberOptions = function (game, clubId) {
    var pos = game.identity.isGK ? 'GK' : game.identity.position;
    var typical = K.TYPICAL[pos] || K.TYPICAL.CM;
    var keep = game.identity.shirtNo || 0;

    /* Wie stark man sich durchsetzt: gegenüber dem Vereinsniveau */
    var club = FKC.data.clubById(clubId);
    var standing = game.ovr - (club ? FKC.data.clubLevel(club) : 60) +
                   (game.status.reputation - 50) / 8;

    var list = [];
    for (var n = 1; n <= 45; n++) list.push(n);
    /* Drei hohe Nummern zur Auswahl, damit auch 70 oder 99 möglich ist */
    [50, 70, 99].forEach(function (n) { list.push(n); });

    /* Belegung pro Nummer einzeln gehasht. Der Mix-Schritt ist nötig:
       `hashOf` unterscheidet sich zwischen "…#7" und "…#8" nur um eins,
       ohne Durchmischung wären belegte Nummern also ein zusammenhängender
       Block statt einer Streuung. Ein Kader hat rund 25 Spieler,
       entsprechend dicht ist der Stammnummernbereich besetzt. */
    function takenRoll(n, pct) {
      var h = hashOf(String(clubId) + '#' + game.identity.year + '#' + n);
      h ^= h >>> 16; h = Math.imul(h, 0x45d9f3b); h ^= h >>> 16;
      return (h >>> 0) % 100 < pct;
    }

    var out = list.map(function (n) {
      var free = true, why = null;

      if (n === keep) {
        /* Die eigene Nummer behält man bei einer Verlängerung immer */
        why = 'keep';
      } else if (n === 1 && pos !== 'GK') {
        free = false; why = 'keeper';
      } else if (ICONIC.indexOf(n) >= 0) {
        /* Die grossen Nummern bekommt nur, wer sie sich verdient hat —
           und auch dann nur, wenn sie im Kader gerade frei ist. */
        free = standing >= (n === 10 ? 4 : 0) && !takenRoll(n, 45);
        why = free ? 'iconic' : 'taken';
      } else {
        var pct = n <= 11 ? 60 : n <= 25 ? 46 : n <= 45 ? 16 : 7;
        free = !takenRoll(n, pct);
        why = free ? null : 'taken';
      }

      return {
        n: n, free: free, why: why,
        typical: typical.indexOf(n) >= 0,
        keep: n === keep
      };
    });

    /* Sicherheitsnetz: mindestens eine positionstypische Nummer muss frei
       sein. Sonst kann ein Stürmer in einem dicht besetzten Kader keine
       einzige Neunerreihe bekommen — das liest sich wie ein Fehler. */
    var anyTypical = false;
    out.forEach(function (o) { if (o.typical && o.free) anyTypical = true; });
    if (!anyTypical) {
      for (var i = 0; i < typical.length; i++) {
        var hit = null;
        out.forEach(function (o) { if (o.n === typical[i]) hit = o; });
        if (hit && hit.why !== 'keeper') { hit.free = true; hit.why = null; break; }
      }
    }
    return out;
  };

  /** Fällt eine Wahl aus (Admin, Altstand), nimm die beste freie Nummer */
  K.autoNumber = function (game, clubId) {
    var opts = K.numberOptions(game, clubId);
    var best = null;
    opts.forEach(function (o) {
      if (!o.free) return;
      if (!best || (o.typical && !best.typical)) best = o;
    });
    return best ? best.n : 33;
  };

  /* ══ Trikotdesign ═════════════════════════════════════════════════ */

  K.PATTERNS = ['plain', 'stripes', 'hoops', 'sash', 'halves', 'shoulders', 'chest'];

  function hashOf(str) {
    var h = 0;
    for (var i = 0; i < String(str).length; i++) {
      h = (Math.imul(31, h) + String(str).charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }

  function rgb(hex) {
    var h = String(hex).replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function lum(hex) {
    var c = rgb(hex);
    return (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
  }

  function shade(hex, amount) {
    var c = rgb(hex);
    var target = amount < 0 ? 0 : 255, p = Math.abs(amount);
    var mix = function (v) { return Math.round((target - v) * p + v); };
    return 'rgb(' + mix(c.r) + ',' + mix(c.g) + ',' + mix(c.b) + ')';
  }
  K.shade = shade;

  /* ── Heimtrikots bekannter Vereine ───────────────────────────────────
     `clubs.js` kennt pro Verein nur **eine** Farbe — die reicht für das
     Wappen, nicht für ein Trikot. Fast jedes echte Heimtrikot hat zwei
     Farben, und bei manchen Vereinen ist die gespeicherte Farbe gar
     nicht die Trikotfarbe (Real Madrid steht dort auf Gold, spielt aber
     in Weiss). Ohne diese Tabelle kam Juventus in Grau statt in
     Schwarz-Weiss und Inter in zwei Blautönen statt Blau-Schwarz.

     Format: [Grundfarbe, Zweitfarbe, Muster]. Weiterhin ein eigenes
     Design — nur die Farbwelt stimmt jetzt.                          */
  var HOME = {
    /* England */
    'eng.1.liv': ['#C8102E', '#FFFFFF', 'plain'],
    'eng.1.mci': ['#6CABDD', '#FFFFFF', 'plain'],
    'eng.1.mun': ['#DA291C', '#FFFFFF', 'plain'],
    'eng.1.ars': ['#EF0107', '#FFFFFF', 'shoulders'],
    'eng.1.che': ['#034694', '#FFFFFF', 'plain'],
    'eng.1.tot': ['#FFFFFF', '#132257', 'plain'],
    'eng.1.new': ['#241F20', '#FFFFFF', 'stripes'],
    'eng.1.avl': ['#95BFE5', '#670E36', 'chest'],
    'eng.1.eve': ['#003399', '#FFFFFF', 'plain'],
    'eng.1.whu': ['#7A263A', '#1BB1E7', 'chest'],
    'eng.1.bha': ['#0057B8', '#FFFFFF', 'stripes'],
    'eng.1.cry': ['#1B458F', '#C4122E', 'stripes'],
    'eng.1.ful': ['#FFFFFF', '#000000', 'plain'],
    'eng.1.bre': ['#E30613', '#FFFFFF', 'stripes'],
    'eng.1.nfo': ['#DD0000', '#FFFFFF', 'plain'],
    'eng.1.bou': ['#DA291C', '#000000', 'stripes'],
    'eng.1.wol': ['#FDB913', '#000000', 'plain'],
    'eng.1.lee': ['#FFFFFF', '#1D428A', 'plain'],
    'eng.1.sun': ['#EB172B', '#FFFFFF', 'stripes'],
    'eng.1.bur': ['#6C1D45', '#87CEEB', 'plain'],

    /* Spanien */
    'esp.1.rma': ['#FFFFFF', '#FEBE10', 'plain'],
    'esp.1.bar': ['#A50044', '#004D98', 'stripes'],
    'esp.1.atm': ['#CB3524', '#FFFFFF', 'stripes'],
    'esp.1.ath': ['#EE2523', '#FFFFFF', 'stripes'],
    'esp.1.rso': ['#0067B1', '#FFFFFF', 'stripes'],
    'esp.1.vil': ['#FFE667', '#005187', 'plain'],
    'esp.1.bet': ['#00954C', '#FFFFFF', 'stripes'],
    'esp.1.sev': ['#FFFFFF', '#D9042B', 'plain'],
    'esp.1.val': ['#FFFFFF', '#F5820D', 'plain'],
    'esp.1.cel': ['#8AC3EE', '#FFFFFF', 'plain'],
    'esp.1.osa': ['#0A346F', '#D91A21', 'plain'],
    'esp.1.ray': ['#FFFFFF', '#E53027', 'sash'],
    'esp.1.mal': ['#E20613', '#000000', 'plain'],
    'esp.1.get': ['#005999', '#FFFFFF', 'plain'],
    'esp.1.esp': ['#FFFFFF', '#007FC8', 'stripes'],

    /* Deutschland */
    'ger.1.bay': ['#DC052D', '#FFFFFF', 'plain'],
    'ger.1.bvb': ['#FDE100', '#000000', 'plain'],
    'ger.1.b04': ['#E32221', '#000000', 'plain'],
    'ger.1.rbl': ['#FFFFFF', '#DD0741', 'plain'],
    'ger.1.sge': ['#E1000F', '#000000', 'plain'],
    'ger.1.vfb': ['#FFFFFF', '#E32219', 'chest'],
    'ger.1.scf': ['#000000', '#E1000F', 'plain'],
    'ger.1.m05': ['#C3141E', '#FFFFFF', 'plain'],
    'ger.1.svw': ['#1D9053', '#FFFFFF', 'plain'],
    'ger.1.wob': ['#65B32E', '#FFFFFF', 'plain'],
    'ger.1.bmg': ['#FFFFFF', '#000000', 'plain'],
    'ger.1.fcu': ['#EB1923', '#FFFFFF', 'plain'],
    'ger.1.fca': ['#FFFFFF', '#BA3733', 'stripes'],
    'ger.1.tsg': ['#1C63B7', '#FFFFFF', 'plain'],
    'ger.1.hsv': ['#FFFFFF', '#0A2D6E', 'chest'],
    'ger.1.koe': ['#FFFFFF', '#ED1C24', 'plain'],
    'ger.1.stp': ['#614C3E', '#FFFFFF', 'plain'],

    /* Italien */
    'ita.1.juv': ['#FFFFFF', '#000000', 'stripes'],
    'ita.1.int': ['#0068A8', '#000000', 'stripes'],
    'ita.1.mil': ['#FB090B', '#000000', 'stripes'],
    'ita.1.nap': ['#12A0D7', '#FFFFFF', 'plain'],
    'ita.1.ata': ['#1D4E9C', '#000000', 'stripes'],
    'ita.1.rom': ['#8E1F2F', '#F0BC42', 'plain'],
    'ita.1.laz': ['#87D8F7', '#FFFFFF', 'plain'],
    'ita.1.fio': ['#592C82', '#FFFFFF', 'plain'],
    'ita.1.bol': ['#1A2F48', '#B01B24', 'stripes'],
    'ita.1.tor': ['#8A1B1B', '#FFFFFF', 'plain'],
    'ita.1.udi': ['#000000', '#FFFFFF', 'stripes'],
    'ita.1.gen': ['#B01B24', '#0B3B7A', 'halves'],
    'ita.1.com': ['#0B3B7A', '#FFFFFF', 'plain'],

    /* Frankreich */
    'fra.1.psg': ['#004170', '#E30613', 'chest'],
    'fra.1.mar': ['#FFFFFF', '#2FAEE0', 'plain'],
    'fra.1.mon': ['#E63946', '#FFFFFF', 'halves'],
    'fra.1.lil': ['#E01E13', '#FFFFFF', 'plain'],
    'fra.1.lyo': ['#FFFFFF', '#2B4C9B', 'plain'],
    'fra.1.nic': ['#C8102E', '#000000', 'halves'],
    'fra.1.len': ['#FFD700', '#E30613', 'stripes'],
    'fra.1.ren': ['#E23C34', '#000000', 'stripes'],
    'fra.1.str': ['#0072BB', '#FFFFFF', 'plain'],
    'fra.1.nan': ['#FCD800', '#0B7A3B', 'plain'],

    /* Portugal, Niederlande, Türkei */
    'por.1.ben': ['#E30613', '#FFFFFF', 'plain'],
    'por.1.spo': ['#008057', '#FFFFFF', 'hoops'],
    'por.1.fcp': ['#0033A0', '#FFFFFF', 'stripes'],
    'por.1.sbr': ['#E30613', '#FFFFFF', 'plain'],
    'ned.1.aja': ['#FFFFFF', '#D2122E', 'chest'],
    'ned.1.psv': ['#EE2A24', '#FFFFFF', 'plain'],
    'ned.1.fey': ['#FFFFFF', '#E30613', 'halves'],
    'ned.1.az': ['#E30613', '#FFFFFF', 'plain'],
    'ned.1.twe': ['#E30613', '#FFFFFF', 'plain'],
    'tur.1.gal': ['#A90432', '#FFC300', 'stripes'],
    'tur.1.fen': ['#FFED00', '#00246D', 'stripes'],
    'tur.1.bjk': ['#FFFFFF', '#000000', 'stripes'],
    'tur.1.tra': ['#7A1B2B', '#00A3E0', 'stripes'],

    /* Südamerika */
    'bra.1.fla': ['#E30613', '#000000', 'hoops'],
    'bra.1.pal': ['#0B7A3B', '#FFFFFF', 'plain'],
    'bra.1.cor': ['#FFFFFF', '#000000', 'plain'],
    'bra.1.sao': ['#FFFFFF', '#E30613', 'chest'],
    'bra.1.flu': ['#7A1B2B', '#0B7A3B', 'stripes'],
    'bra.1.gre': ['#0B3B7A', '#000000', 'stripes'],
    'bra.1.int': ['#E30613', '#FFFFFF', 'plain'],
    'bra.1.cam': ['#000000', '#FFFFFF', 'stripes'],
    'bra.1.cru': ['#0B3B7A', '#FFFFFF', 'plain'],
    'bra.1.vas': ['#FFFFFF', '#000000', 'sash'],
    'bra.1.san': ['#FFFFFF', '#000000', 'plain'],
    'bra.1.bot': ['#000000', '#FFFFFF', 'stripes'],
    'arg.1.riv': ['#FFFFFF', '#E30613', 'sash'],
    'arg.1.boc': ['#0B3B7A', '#FFD700', 'chest'],
    'arg.1.rac': ['#7EC0EE', '#FFFFFF', 'stripes'],
    'arg.1.ind': ['#E30613', '#FFFFFF', 'plain'],
    'arg.1.sl': ['#0B3B7A', '#E30613', 'stripes'],
    'arg.1.vel': ['#FFFFFF', '#0B3B7A', 'sash'],
    'arg.1.est': ['#FFFFFF', '#E30613', 'stripes']
  };

  /**
   * Trikotdesign eines Vereins.
   * @returns { base, second, pattern, ink, trim }
   */
  K.design = function (club) {
    if (!club) return K.fallbackDesign('#3f6f5a', 'x');
    var h = HOME[club.id];
    if (h) {
      var bright = lum(h[0]);
      return {
        base: h[0], second: h[1], pattern: h[2],
        ink: bright > 0.55 ? '#14201c' : '#ffffff',
        trim: h[1]
      };
    }
    return K.fallbackDesign(club.color || '#3f6f5a', club.id || club.name || 'x');
  };

  K.fallbackDesign = function (color, seedKey) {
    var h = hashOf(seedKey);
    var bright = lum(color);

    /* Zweitfarbe: Weiss auf dunklem Grund, Schwarz auf hellem. Ein
       echtes Heimtrikot hat fast immer zwei **verschiedene** Farben —
       mit einer blossen Helligkeitsvariante derselben Farbe sahen alle
       Vereine ohne Eintrag in HOME einfarbig-verwaschen aus. */
    var second = bright > 0.55 ? '#101010' : '#ffffff';
    var pattern = K.PATTERNS[h % K.PATTERNS.length];

    return {
      base: color,
      second: second,
      pattern: pattern,
      /* Beschriftung: heller Stoff braucht dunkle Schrift */
      ink: bright > 0.55 ? '#14201c' : '#ffffff',
      trim: bright > 0.55 ? shade(color, -0.5) : shade(color, 0.55)
    };
  };

  /**
   * Nationaltrikot — Farben aus der Flagge des Landes, damit es
   * erkennbar zum Herkunftsland gehört, ohne ein echtes Trikot zu sein.
   */
  K.nationalDesign = function (nationId) {
    var f = (FKC.ui && FKC.ui.art && FKC.ui.art.flagColors
      ? FKC.ui.art.flagColors(nationId) : null) || [];

    /* Als Grundfarbe taugt kein Schwarz und kein Weiss — sonst spielt
       Deutschland im schwarzen Trikot. Beide bleiben als Akzent nutzbar. */
    var base = null;
    f.forEach(function (c) {
      if (base) return;
      var l = lum(c);
      if (l > 0.12 && l < 0.88) base = c;
    });
    if (!base) base = f[0] || '#e8e8e8';

    var accent = null;
    f.forEach(function (c) { if (!accent && c !== base) accent = c; });
    if (!accent) accent = lum(base) > 0.55 ? '#2a2a2a' : '#f2f2f2';

    var bright = lum(base);
    return {
      base: base,
      second: accent,
      pattern: 'chest',
      ink: bright > 0.55 ? '#14201c' : '#ffffff',
      trim: accent,
      national: true
    };
  };

  FKC.kit = K;

})(window.FKC);
