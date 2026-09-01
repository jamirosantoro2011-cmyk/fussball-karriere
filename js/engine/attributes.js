/* ── Attribute & Overall-Rating ────────────────────────────────────────
   Attribute laufen intern von 1 bis 99. In der Kindheit sind sie
   naturgemäss niedrig — die Oberfläche zeigt dort "Entwicklungsstand"
   statt OVR. Ab dem Profibereich ist das Rating auf 40-99 begrenzt,
   wie in EA FC.                                                      */

window.FKC = window.FKC || {};

(function (FKC) {
  'use strict';

  var A = {};

  /** Jede Karriere startet exakt hier. */
  A.START_OVR = 50;

  /* ── Startwerte ─────────────────────────────────────────────────────
     Die Attribute werden so kalibriert, dass das Overall-Rating am
     Karrierestart genau A.START_OVR ergibt. Der Playstyle-Wert liegt
     dabei spürbar über dem Rest.                                    */
  A.startingSet = function (game) {
    var r = FKC.rng;
    var keys = FKC.data.keysFor(game.identity.isGK);
    var pos = FKC.data.positionById(game.identity.position);
    var style = game.hidden.playstyle;
    var out = {};

    /* Positionsprofil. Der Abstand zwischen dem wichtigsten und dem
       unwichtigsten Attribut ist für **jede** Position gleich gross
       (SPREAD), dazwischen wird nach Gewicht interpoliert. Vorher lief
       die Neigung über einen festen Faktor auf das Rohgewicht und ergab
       nur ±5 Punkte — weniger als das Rauschen und weniger als der
       Playstyle-Bonus. Ergebnis: in zwei von drei Karrieren war das
       stärkste Attribut nicht das der Position, Innenverteidiger waren
       vor allem physisch stark und Torhüter vor allem gute Passgeber. */
    var SPREAD = 24;
    var ws = keys.map(function (k) { return pos.w[k] || 0.05; });
    var lo = Math.min.apply(null, ws), hi = Math.max.apply(null, ws);
    var span = hi - lo || 1;

    keys.forEach(function (k) {
      var norm = ((pos.w[k] || 0.05) - lo) / span;          // 0 … 1
      out[k] = r.gaussInt(50 + (norm - 0.5) * SPREAD, 3, 24, 78);
    });

    /* Signaturstärke hebt sich weiter ab — sie färbt das Profil, statt
       es umzudrehen. Deshalb schwächer als der Positionsabstand. */
    if (style && out[style] != null) out[style] += r.int(7, 10);

    if (game.origin && game.origin.upbringing === 'street' && out.dribbling != null) {
      out.dribbling += 4;
    }

    A.calibrate(out, game.identity.position, A.START_OVR, keys);
    return out;
  };

  /**
   * Verschiebt alle Attribute so, dass das Rating den Zielwert trifft.
   * Nötig, weil der Spezialisten-Bonus nicht linear ist.
   */
  A.calibrate = function (attrs, positionId, target, keys) {
    keys = keys || Object.keys(attrs);
    for (var pass = 0; pass < 8; pass++) {
      var diff = target - A.ovrOf(attrs, positionId);
      if (diff === 0) break;
      var step = diff > 0 ? Math.max(1, Math.round(diff * 0.9)) : Math.min(-1, Math.round(diff * 0.9));
      keys.forEach(function (k) {
        attrs[k] = FKC.util.clamp(attrs[k] + step, 12, 92);
      });
    }
    // Letzter Feinschliff über das am stärksten gewichtete Attribut
    var pos = FKC.data.positionById(positionId);
    var main = keys[0];
    keys.forEach(function (k) { if ((pos.w[k] || 0) > (pos.w[main] || 0)) main = k; });
    for (var i = 0; i < 12; i++) {
      var d = target - A.ovrOf(attrs, positionId);
      if (d === 0) break;
      attrs[main] = FKC.util.clamp(attrs[main] + (d > 0 ? 1 : -1), 12, 95);
    }
    return attrs;
  };

  /* ── Overall-Rating ─────────────────────────────────────────────── */
  A.ovrOf = function (attrs, positionId) {
    var pos = FKC.data.positionById(positionId);
    if (!pos) return 0;
    var sum = 0, wsum = 0;
    for (var k in pos.w) {
      if (attrs[k] == null) continue;
      sum += attrs[k] * pos.w[k];
      wsum += pos.w[k];
    }
    var base = wsum > 0 ? sum / wsum : 0;

    // Spezialisten-Bonus: ein herausragender Wert hebt das Rating leicht
    var vals = Object.keys(pos.w).map(function (k) { return attrs[k] || 0; });
    var top = Math.max.apply(null, vals);
    var bonus = top > base + 12 ? Math.min(2.5, (top - base - 12) / 6) : 0;

    /* Harte Obergrenze: 99, wie in EA FC */
    return Math.min(99, Math.round(base + bonus));
  };

  /** Sicherheitsnetz: kappt alle wachsenden Werte bei 99 */
  A.enforceCaps = function (game) {
    var keys = FKC.data.keysFor(game.identity.isGK);
    keys.forEach(function (k) {
      if (game.attributes[k] > 99) game.attributes[k] = 99;
    });
    if (game.hidden) {
      if (game.hidden.potential > 99) game.hidden.potential = 99;
      ['consistency', 'injuryProneness', 'workRate', 'mentality', 'flair',
       'adaptability', 'bigGame', 'discipline'].forEach(function (k) {
        if (game.hidden[k] > 99) game.hidden[k] = 99;
      });
    }
    if (game.ovr > 99) game.ovr = 99;
    if (game.peakOvr > 99) game.peakOvr = 99;
  };

  /** Rating neu berechnen und Historie fortschreiben */
  A.recalc = function (game) {
    A.enforceCaps(game);
    var raw = A.ovrOf(game.attributes, game.identity.position);
    game.ovr = game.career.phase === 'pro' || game.career.phase === 'retired'
      ? FKC.util.clamp(raw, 40, 99)
      : FKC.util.clamp(raw, 1, 99);
    if (game.ovr > game.peakOvr) game.peakOvr = game.ovr;
    return game.ovr;
  };

  /* Für die Verlaufsdiagramme wird pro Jahr Rating, Form und Marktwert
     festgehalten — nicht nur der aktuelle Stand. */
  A.pushHistory = function (game) {
    game.ovrHistory.push({
      age: game.identity.age,
      ovr: game.ovr,
      form: Math.round(game.condition.form),
      mv: game.status.marketValue || 0
    });
  };

  /** Bestes Attribut (für Erzähltexte und Auszeichnungen) */
  A.strongest = function (game) {
    var keys = FKC.data.keysFor(game.identity.isGK), best = keys[0];
    keys.forEach(function (k) { if (game.attributes[k] > game.attributes[best]) best = k; });
    return best;
  };
  A.weakest = function (game) {
    var keys = FKC.data.keysFor(game.identity.isGK), worst = keys[0];
    keys.forEach(function (k) { if (game.attributes[k] < game.attributes[worst]) worst = k; });
    return worst;
  };

  /** Farbstufe für die Balken */
  A.level = function (v) { return v >= 75 ? 'high' : (v >= 45 ? 'mid' : 'low'); };

  /* ── Marktwert ──────────────────────────────────────────────────── */
  A.marketValue = function (game) {
    if (game.career.phase !== 'pro') {
      // Jugendspieler: symbolischer Wert, erst ab der B-Jugend spürbar
      var ageF = game.identity.age >= 15 ? 9000 : game.identity.age >= 12 ? 3000 : 400;
      return Math.round(Math.max(0, game.ovr - 48) * ageF + game.status.reputation * 1200);
    }
    var ovr = game.ovr;
    /* Kurve an echten Marktwerten geeicht (Grössenordnung Transfermarkt):
         OVR 60 → rund 1 Mio.      OVR 80 → rund 30 Mio.
         OVR 70 → rund 6 Mio.      OVR 90 → rund 120 Mio.
       Der Exponent war mit 1.19 zu steil — ein Spieler mit 90 kam auf
       fast 300 Mio., während der reale Spitzenwert bei etwa 200 Mio.
       liegt. Über 88 flacht die Kurve zusätzlich ab: ganz oben wird der
       Markt dünn, weil nur noch eine Handvoll Vereine zahlen kann. */
    var base = Math.pow(1.163, ovr - 40) * 38000;
    if (ovr > 88) base *= 1 - (ovr - 88) * 0.045;

    // Alterskurve
    var age = game.identity.age, ageFactor;
    if (age <= 21)      ageFactor = 1.5;
    else if (age <= 25) ageFactor = 1.3;
    else if (age <= 28) ageFactor = 1.0;
    else if (age <= 31) ageFactor = 0.68;
    else if (age <= 34) ageFactor = 0.36;
    else                ageFactor = 0.15;

    // Restpotenzial hebt junge Spieler an
    var gap = Math.max(0, game.hidden.potential - ovr);
    if (age <= 23) ageFactor += Math.min(0.6, gap * 0.035);

    var lg = FKC.state.league();
    var leagueFactor = lg ? 0.75 + (lg.strength / 100) * 0.5 : 0.8;

    var contractFactor = 1;
    if (game.status.contract) {
      var yl = game.status.contract.yearsLeft;
      contractFactor = yl <= 0 ? 0.35 : (yl === 1 ? 0.62 : (yl >= 4 ? 1.1 : 1));
    }

    var v = base * ageFactor * leagueFactor * contractFactor;
    v *= 0.9 + (game.condition.form / 100) * 0.25;
    return Math.round(v / 50000) * 50000;
  };

  /* ── Potenzialanzeige ───────────────────────────────────────────────
     Der genaue Wert bleibt verborgen. Angezeigt wird eine Spanne, die
     mit dem Alter und einer guten Nachwuchsabteilung schmaler wird —
     wie die Potenzialanzeige bei Jugendspielern in EA FC.          */

  A.potentialRange = function (game) {
    var age = game.identity.age;
    var width = age <= 9 ? 12 : age <= 13 ? 9 : age <= 16 ? 6 : age <= 18 ? 4 : 2;

    /* Gute Bedingungen und Sichtung machen die Einschätzung genauer */
    var club = FKC.state.club();
    if (club && !club.synthetic && club.facilities >= 78) width -= 1;
    if (game.flags && game.flags.scouted) width -= 1;
    if (game.status.reputation >= 55) width -= 1;
    width = Math.max(1, width);

    var pot = game.hidden.potential;
    /* Leichter, aber über die Karriere stabiler Versatz */
    var seedShift = ((pot * 7 + age) % 5) - 2;
    var low = FKC.util.clamp(Math.round(pot - width + seedShift * 0.4), game.ovr, 99);
    var high = FKC.util.clamp(Math.round(pot + width + seedShift * 0.4), low + 1, 99);
    return { low: low, high: high, width: width };
  };

  /** Grobe Einordnung des Potenzials — für Sterne oder Farbstufen */
  A.potentialTier = function (game) {
    var p = game.hidden.potential;
    return p >= 88 ? 'elite' : p >= 78 ? 'high' : p >= 68 ? 'good'
         : p >= 58 ? 'mid' : 'low';
  };

  /** Rating-Stufe für die Optik der OVR-Plakette */
  A.tier = function (ovr) {
    if (ovr >= 85) return 'elite';
    if (ovr >= 68) return 'good';
    if (ovr >= 50) return 'mid';
    return 'low';
  };

  FKC.attributes = A;

})(window.FKC);
