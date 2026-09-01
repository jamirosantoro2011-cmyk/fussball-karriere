/* ── Versteckte Werte, Charakterzüge & Karriere-Verdikte ──────────────
   Die versteckten Werte sieht der Spieler nie als Zahl — sie steuern
   Entwicklung, Verletzungsanfälligkeit und wie Ereignisse ausgehen.  */

window.FKC = window.FKC || {};
FKC.data = FKC.data || {};

(function (FKC) {
  'use strict';

  /* ── Charakterzüge ──────────────────────────────────────────────── */
  /* Ein Spieler bekommt 1-2 davon. Sie verschieben Wahrscheinlichkeiten,
     schalten eigene Ereignisse frei und färben den Rückblick ein.     */
  var traits = [
    { id: 'wunderkind',   weight: 5,  effects: { growthEarly: +0.25, growthLate: -0.10, reputation: +8 } },
    { id: 'latebloomer',  weight: 7,  effects: { growthEarly: -0.20, growthLate: +0.35 } },
    { id: 'glassbones',   weight: 6,  effects: { injuryRisk: +0.45 } },
    { id: 'ironman',      weight: 6,  effects: { injuryRisk: -0.40, fitness: +6 } },
    { id: 'streetballer', weight: 8,  effects: { dribbling: +3, discipline: -8, flair: +12 } },
    { id: 'professional', weight: 8,  effects: { growth: +0.12, consistency: +10, lifestyleDrift: -0.5 } },
    { id: 'showman',      weight: 6,  effects: { reputation: +12, mediaRisk: +0.3, fanBoost: +6 } },
    { id: 'teamplayer',   weight: 8,  effects: { moraleFloor: +8, assists: +0.12, captainChance: +0.2 } },
    { id: 'hothead',      weight: 6,  effects: { cards: +0.5, discipline: -12, bigGame: +5 } },
    { id: 'bigmatch',     weight: 5,  effects: { bigGame: +14, cupBonus: +0.15 } },
    { id: 'loyalheart',   weight: 6,  effects: { loyaltyGain: +0.4, homesick: +6 } },
    { id: 'globetrotter', weight: 6,  effects: { adaptability: +18, homesick: -10 } },
    { id: 'leader',       weight: 5,  effects: { captainChance: +0.35, moraleFloor: +6 } },
    { id: 'quiet',        weight: 7,  effects: { mediaRisk: -0.35, reputation: -5, consistency: +6 } }
  ];

  FKC.data.traits = traits;
  FKC.data.traitById = function (id) { return FKC.util.byId(traits, id); };

  /** Summiert einen Effektwert über alle Charakterzüge des Spielers */
  FKC.data.traitBonus = function (game, key) {
    var sum = 0;
    (game.hidden && game.hidden.traits ? game.hidden.traits : []).forEach(function (id) {
      var t = FKC.data.traitById(id);
      if (t && t.effects[key] != null) sum += t.effects[key];
    });
    return sum;
  };

  /* ── Versteckte Grundwerte würfeln ──────────────────────────────── */
  FKC.data.rollHidden = function (origin) {
    var r = FKC.rng;

    /* ── Talentklasse ──────────────────────────────────────────────────
       Zuerst fällt die Klasse, dann das Potenzial darin. Vorher lag
       über allem eine einzige Glockenkurve, und wie eine Karriere
       ausging, hing stark daran, wie man spielte — die Verteilung der
       Verläufe war damit nicht gesteuert, sondern Nebenprodukt.

       Zielverteilung über viele Karrieren: 25 % schwach, 50 % mittel,
       25 % stark. Innerhalb der Klasse entscheiden weiterhin
       Entscheidungen, Verletzungen und Glück, wo genau man landet —
       die Klasse steckt nur den Rahmen ab.                          */
    var roll = r.next();
    var tier = roll < 0.25 ? 'low' : roll < 0.75 ? 'mid' : 'high';

    var base;
    if (tier === 'low')       base = r.gaussInt(57, 5, 44, 66);
    else if (tier === 'mid')  base = r.gaussInt(70, 4, 64, 78);
    else                      base = r.gaussInt(84, 6, 77, 99);

    /* Familienrückhalt verschiebt innerhalb der Klasse, nicht darüber
       hinaus — sonst wäre die Klasse wieder ausgehebelt. */
    var supportLift = Math.round((origin.familySupport - 50) / 12);
    var potential = FKC.util.clamp(base + supportLift, 45, 99);

    var picked = [];
    var pool = traits.slice();
    var count = r.chance(0.45) ? 2 : 1;
    for (var i = 0; i < count; i++) {
      var t = r.weighted(pool, function (x) { return x.weight; });
      if (!t) break;
      picked.push(t.id);
      pool = pool.filter(function (x) { return x !== t; });
    }

    /* Entwicklungsverlauf. "prodigy" ist bewusst die Ausnahme: Es
       braucht ein sehr hohes Potenzial UND einen Würfelwurf. Damit
       bleibt der Anteil bei rund 4 % aller Karrieren — Ausnahmetalente
       sind eine Teilmenge der starken Klasse, nicht deren Regel. */
    var archetype = 'standard';
    if (potential >= 92 && r.chance(0.45)) archetype = 'prodigy';
    else if (potential >= 87 && r.chance(0.12)) archetype = 'prodigy';

    var hidden = {
      potential: potential,
      tier: tier,
      archetype: archetype,
      potentialShown: null,          // grobe Einschätzung, erst nach Sichtung
      consistency: r.gaussInt(60, 14, 25, 95),
      injuryProneness: r.gaussInt(45, 16, 10, 92),
      workRate: r.gaussInt(60, 15, 25, 98),
      mentality: r.gaussInt(58, 15, 20, 96),
      flair: r.gaussInt(55, 18, 15, 98),
      adaptability: r.gaussInt(58, 16, 18, 96),
      bigGame: r.gaussInt(55, 16, 20, 96),
      discipline: r.gaussInt(62, 15, 20, 98),
      traits: picked
    };

    // Charakterzüge wirken direkt auf die Grundwerte
    hidden.injuryProneness = FKC.util.clamp(
      hidden.injuryProneness + Math.round(sumOf(picked, 'injuryRisk') * 40), 5, 99);
    hidden.consistency = FKC.util.clamp(hidden.consistency + sumOf(picked, 'consistency'), 10, 99);
    hidden.discipline = FKC.util.clamp(hidden.discipline + sumOf(picked, 'discipline'), 5, 99);
    hidden.flair = FKC.util.clamp(hidden.flair + sumOf(picked, 'flair'), 5, 99);
    hidden.adaptability = FKC.util.clamp(hidden.adaptability + sumOf(picked, 'adaptability'), 5, 99);
    hidden.bigGame = FKC.util.clamp(hidden.bigGame + sumOf(picked, 'bigGame'), 5, 99);

    return hidden;

    function sumOf(ids, key) {
      var s = 0;
      ids.forEach(function (id) {
        var t = FKC.data.traitById(id);
        if (t && t.effects[key] != null) s += t.effects[key];
      });
      return s;
    }
  };

  /* ── Karriere-Verdikte (Rückblick am Ende) ──────────────────────── */
  /* score wird in engine/career.js berechnet; hier nur die Schwellen. */
  /* Schwellen zu den Werten aus FKC.career.scoreCareer(). Bewusst hoch
     angesetzt: eine ordentliche Karriere ist "solide", nicht Weltklasse. */
  /* minPeak verhindert, dass reine Menge über Klasse siegt: Wer nie
     wirklich zur Spitze gehörte, wird auch mit 300 Toren keine
     unsterbliche Legende.                                          */
  /* Die Grenzen zwischen den drei Stufen sind an der gemessenen
     Punkteverteilung geeicht: unter `journeyman` liegt das schwächste
     Viertel, ab `worldclass` das stärkste. Zielbild über viele
     Karrieren ist 25 % schwach, 50 % mittel, 25 % stark. */
  FKC.data.verdicts = [
    { id: 'immortal',   min: 1400, minPeak: 86 },
    { id: 'legend',     min: 1040, minPeak: 81 },
    { id: 'worldclass', min: 720,  minPeak: 76 },   // ── Grenze mittel/stark
    { id: 'star',       min: 500,  minPeak: 70 },
    { id: 'solid',      min: 340,  minPeak: 0  },
    { id: 'journeyman', min: 165,  minPeak: 0  },   // ── Grenze schwach/mittel
    { id: 'grafter',    min: 95,   minPeak: 0  },
    { id: 'unfulfilled', min: 55,  minPeak: 0  },
    { id: 'nearly',     min: 0,    minPeak: 0  }
  ];

  FKC.data.verdictFor = function (score, peakOvr) {
    var peak = peakOvr == null ? 99 : peakOvr;
    for (var i = 0; i < FKC.data.verdicts.length; i++) {
      var v = FKC.data.verdicts[i];
      if (score >= v.min && peak >= (v.minPeak || 0)) return v;
    }
    return FKC.data.verdicts[FKC.data.verdicts.length - 1];
  };

})(window.FKC);
