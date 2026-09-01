/* ── Entwicklung ───────────────────────────────────────────────────────
   Ein Jahr Entwicklung = ein Punktebudget, verteilt auf die Attribute.
   Budget = Alterskurve × Restpotenzial × Umfeld × Arbeitseinstellung.
   Ab ca. 30 dreht das Budget ins Negative — Tempo und Physis zuerst. */

window.FKC = window.FKC || {};

(function (FKC) {
  'use strict';

  var G = {};

  /* Punktebudget nach Alter (Summe über alle Attribute) */
  var CURVE = [
    [6, 18], [8, 20], [10, 22], [12, 24], [14, 23], [16, 20],
    [18, 17], [20, 14], [22, 11], [24, 8], [26, 5], [28, 2.5],
    [30, -2.5], [32, -6], [34, -10], [36, -14], [40, -18]
  ];

  /**
   * Punktebudget eines Jahres. Der Archetyp verschiebt den Beginn des
   * Abbaus und dämpft ihn: Ausnahmetalente halten ihr Niveau länger,
   * normale Spieler fallen nach dem Zenit deutlicher ab.
   */
  G.ageBudget = function (age, profile) {
    var p = profile || PROFILE.standard;
    /* Nur der Abbau wird verschoben, der Aufbau bleibt unangetastet */
    var lookAge = age >= 27 ? age - (p.declineFrom - 29) : age;
    var v = lookup(CURVE, lookAge);
    if (v < 0) v *= p.declineMult;
    /* Ausnahmetalente machen die grossen Sprünge früher */
    else if (age <= 19 && p.youthMult) v *= p.youthMult;
    return v;
  };

  /* Wie viel des Potenzials in welchem Alter überhaupt erreichbar ist.
     Verhindert, dass ein Spieler mit 18 schon ausentwickelt ist —
     das Potenzial ist der Wert am Zenit, nicht der beim Profidebüt. */
  /* Startrating der Karriere. Die Alterskurve interpoliert von hier
     aus zum Potenzial (= Rating am Zenit).                         */
  var FLOOR = 50;

  G.reach = function (age, profile) {
    return lookup((profile || PROFILE.standard).reach, age);
  };

  /** Erreichbares Rating in diesem Alter */
  G.ceiling = function (game, age) {
    var pot = game.hidden.potential;
    return FLOOR + (pot - FLOOR) * G.reach(age == null ? game.identity.age : age,
                                           G.profileOf(game));
  };

  /* ── Talent-Archetypen ──────────────────────────────────────────────
     Nicht jeder entwickelt sich gleich. Der Normalfall ist die klassische
     Peak-Kurve: Aufbau in der Jugend, Höhepunkt zwischen 25 und 31,
     davor und danach spürbar schwächer. Ausnahmetalente sind schon mit
     16 nahe an ihrem Niveau und halten es bis Anfang dreissig.
     Der Archetyp hängt am Potenzial (siehe data/traits.js).        */

  /* Anteil des Potenzials, der in diesem Alter erreichbar ist */
  var REACH_STANDARD = [
    [6, 0.05], [8, 0.12], [10, 0.20], [12, 0.30], [14, 0.42], [16, 0.55],
    [18, 0.66], [20, 0.78], [22, 0.89], [24, 0.97], [26, 1.0]
  ];

  var REACH_PRODIGY = [
    [6, 0.10], [8, 0.20], [10, 0.34], [12, 0.50], [14, 0.68], [16, 0.83],
    [17, 0.88], [18, 0.92], [19, 0.95], [20, 0.98], [22, 1.0]
  ];

  var PROFILE = {
    standard: { reach: REACH_STANDARD, declineFrom: 29, declineMult: 1.2, youthMult: 1.0 },
    prodigy:  { reach: REACH_PRODIGY,  declineFrom: 32, declineMult: 0.85, youthMult: 1.3 }
  };
  G.PROFILE = PROFILE;

  G.profileOf = function (game) {
    var a = game && game.hidden && game.hidden.archetype;
    return PROFILE[a] || PROFILE.standard;
  };

  function lookup(table, age) {
    if (age <= table[0][0]) return table[0][1];
    for (var i = 1; i < table.length; i++) {
      if (age <= table[i][0]) {
        var a = table[i - 1], b = table[i];
        return FKC.util.lerp(a[1], b[1], (age - a[0]) / (b[0] - a[0]));
      }
    }
    return table[table.length - 1][1];
  }

  /* ── Körpergrösse ───────────────────────────────────────────────────
     Anteil der Endgrösse nach Alter. Ein 16-Jähriger ist noch nicht
     ausgewachsen, mit ~19 ist die Endgrösse erreicht.              */
  var HEIGHT_CURVE = [
    [6, 0.655], [7, 0.685], [8, 0.715], [9, 0.745], [10, 0.775], [11, 0.805],
    [12, 0.835], [13, 0.868], [14, 0.902], [15, 0.940], [16, 0.966],
    [17, 0.984], [18, 0.995], [19, 1.0]
  ];

  G.heightFactor = function (age) {
    if (age <= HEIGHT_CURVE[0][0]) return HEIGHT_CURVE[0][1];
    for (var i = 1; i < HEIGHT_CURVE.length; i++) {
      if (age <= HEIGHT_CURVE[i][0]) {
        var a = HEIGHT_CURVE[i - 1], b = HEIGHT_CURVE[i];
        return FKC.util.lerp(a[1], b[1], (age - a[0]) / (b[0] - a[0]));
      }
    }
    return 1;
  };

  G.heightAt = function (adultHeight, age) {
    return Math.round(adultHeight * G.heightFactor(age));
  };

  /**
   * Ein Entwicklungsjahr.
   * ctx = { quality:0-100, playtime:0-1, focus:key, secondary:key,
   *         intensity:'light'|'balanced'|'hard', bonusPoints:Zahl }
   */
  G.yearly = function (game, ctx) {
    ctx = ctx || {};
    var r = FKC.rng;
    var keys = FKC.data.keysFor(game.identity.isGK);
    var pos = FKC.data.positionById(game.identity.position);
    var before = {}; keys.forEach(function (k) { before[k] = game.attributes[k]; });
    var ovrBefore = game.ovr;

    var age = game.identity.age;
    var profile = G.profileOf(game);
    var budget = G.ageBudget(age, profile);

    /* Charakterzüge verschieben die Kurve */
    var early = FKC.data.traitBonus(game, 'growthEarly');
    var late  = FKC.data.traitBonus(game, 'growthLate');
    var flat  = FKC.data.traitBonus(game, 'growth');
    if (age <= 19 && early) budget *= (1 + early);
    if (age >= 20 && late)  budget *= (1 + late);
    if (flat) budget *= (1 + flat);

    if (budget > 0) {
      /* ── Wachstum ─────────────────────────────────────────────── */
      var ceiling = G.ceiling(game, age);
      var gap = ceiling - game.ovr;
      var gapFactor = FKC.util.clamp(gap / 7, 0.02, 1.4);
      /* Wer für sein Alter schon weit ist, wächst kaum noch weiter —
         und wer klar über der Grenze liegt (etwa nach starken
         Ereignissen), gar nicht mehr. Sonst verliert das Potenzial
         seine Bedeutung als Obergrenze.                            */
      if (gap <= -2) gapFactor = 0;
      else if (gap <= 0) gapFactor *= 0.12;

      var quality = ctx.quality != null ? ctx.quality : 55;
      var qualityFactor = 0.55 + (quality / 100) * 0.75;          // 0.55 - 1.30

      var playtime = ctx.playtime != null ? ctx.playtime : 1;
      var playFactor = 0.45 + playtime * 0.65;                     // 0.45 - 1.10

      var work = game.hidden.workRate;
      var workFactor = 0.7 + (work / 100) * 0.6;

      var moraleFactor = 0.85 + (game.condition.morale / 100) * 0.3;

      var intensityFactor = ctx.intensity === 'hard' ? 1.15
                          : (ctx.intensity === 'light' ? 0.85 : 1);

      /* Entwicklungsboni aus Ereignissen zählen zum Grundbudget und
         unterliegen damit derselben Potenzialgrenze. Vorher wurden sie
         danach addiert und hebelten die Grenze aus.                 */
      budget += ctx.bonusPoints || 0;
      budget *= gapFactor * qualityFactor * playFactor * workFactor * moraleFactor * intensityFactor;
      budget *= r.float(0.85, 1.18);

      /* Verteilung: Positionsgewicht + Trainingsfokus + Zufall.
         Die Positionsgewichte werden abgeflacht, sonst laufen die
         Werte über zehn Jahre extrem auseinander.                  */
      var avg = 0;
      keys.forEach(function (k) { avg += game.attributes[k]; });
      avg /= keys.length;

      var style = game.hidden.playstyle;
      /* Der Mentor arbeitet gezielt an zwei Werten — solange die
         Bindung stimmt.                                            */
      var mentorAttrs = FKC.data.mentorAttrs(game);
      var mentorDef = game.career.mentor ? FKC.data.mentorById(game.career.mentor.id) : null;
      var mentorPush = mentorDef
        ? 1 + (mentorDef.boost - 1) * FKC.data.mentorStrength(game) : 1;

      var weights = {};
      keys.forEach(function (k) {
        var w = (pos.w[k] || 0.06) * 0.55 + 0.10;
        if (ctx.focus === k) w *= 2.4;
        if (ctx.secondary === k) w *= 1.6;
        if (k === style) w *= 1.7;              // Signaturstärke zieht davon
        if (mentorAttrs.indexOf(k) >= 0) w *= mentorPush;
        // Weit abgeschlagene Werte holen etwas auf
        if (game.attributes[k] < avg - 12) w *= 1.5;
        // Sehr hohe Werte wachsen langsamer
        if (game.attributes[k] >= 85) w *= 0.45;
        else if (game.attributes[k] >= 78) w *= 0.7;
        w *= r.float(0.6, 1.4);
        weights[k] = w;
      });
      /* Kein Einzelwert läuft der Altersgrenze davon — ausser dem
         Playstyle, der aber ebenfalls bei 99 endet.               */
      var cap = FKC.util.clamp(Math.round(ceiling) + 7, 55, 99);
      var styleCap = Math.min(99, cap + 6);
      distribute(game, keys, weights, budget, +1, cap, style, styleCap);

      /* Das Rating soll sich jedes Jahr nachvollziehbar bewegen: solange
         Luft nach oben ist, gibt es mindestens einen Punkt.          */
      FKC.attributes.recalc(game);
      if (game.ovr === ovrBefore && game.ovr < Math.round(ceiling)) {
        var main = style || keys[0];
        keys.forEach(function (k) { if ((pos.w[k] || 0) > (pos.w[main] || 0)) main = k; });
        for (var t = 0; t < 6 && game.ovr === ovrBefore; t++) {
          game.attributes[main] = FKC.util.clamp(game.attributes[main] + 1, 5, 99);
          FKC.attributes.recalc(game);
        }
      }

    } else if (budget < 0) {
      /* ── Rückgang ─────────────────────────────────────────────── */
      var loss = -budget;
      // Profis mit guter Physis und wenig Verletzungen altern langsamer
      loss *= 1 - FKC.util.clamp((game.hidden.workRate - 55) / 260, -0.12, 0.18);
      loss *= r.float(0.8, 1.25);

      var declineBias = game.identity.isGK
        ? { reflexes: 1.3, positioning: 0.4, handling: 0.7, distribution: 0.5, aerial: 0.9, physical: 1.4 }
        : { pace: 2.1, physical: 1.7, dribbling: 1.1, defending: 0.7, shooting: 0.6, passing: 0.35 };

      var lweights = {};
      keys.forEach(function (k) { lweights[k] = (declineBias[k] || 1) * r.float(0.7, 1.3); });
      distribute(game, keys, lweights, loss, -1);
    }

    /* Körpergrösse folgt der Wachstumskurve, nicht dem Zufall */
    game.identity.height = G.heightAt(game.identity.heightAdult, age);

    FKC.attributes.recalc(game);

    var deltas = {};
    keys.forEach(function (k) {
      var d = game.attributes[k] - before[k];
      if (d !== 0) deltas[k] = d;
    });

    return { deltas: deltas, ovrBefore: ovrBefore, ovrAfter: game.ovr, budget: budget };
  };

  /** Punktebudget ganzzahlig auf die Attribute verteilen */
  function distribute(game, keys, weights, amount, sign, cap, styleKey, styleCap) {
    var total = 0;
    keys.forEach(function (k) { total += weights[k]; });
    if (total <= 0) return;

    var max = cap || 99;
    var rest = 0;
    keys.forEach(function (k) {
      var share = (weights[k] / total) * amount + rest;
      var whole = Math.floor(share);
      rest = share - whole;
      if (whole <= 0) return;
      var limit = Math.min(99, (styleKey && k === styleKey) ? (styleCap || max) : max);
      var v = game.attributes[k] + sign * whole;
      game.attributes[k] = FKC.util.clamp(v, 5, sign > 0 ? limit : 99);
    });
  }

  /** Einmalige Anpassung, z. B. durch Ereignisse */
  G.bump = function (game, key, delta) {
    if (game.attributes[key] == null) return 0;
    var before = game.attributes[key];
    game.attributes[key] = FKC.util.clamp(before + delta, 5, 99);
    FKC.attributes.recalc(game);
    return game.attributes[key] - before;
  };

  /** Umfeldqualität des aktuellen Vereins (0-100) */
  G.envQuality = function (game) {
    var club = FKC.state.club();
    if (!club) return 45;
    var lg = FKC.data.leagueOf(club);
    var q = club.facilities * 0.65 + (lg ? lg.strength : 50) * 0.2 + club.youthTrust * 0.15;
    return FKC.util.clamp(Math.round(q), 20, 99);
  };

  FKC.growth = G;

})(window.FKC);
