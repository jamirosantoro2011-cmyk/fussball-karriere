/* ── Transfers ─────────────────────────────────────────────────────────
   Angebote entstehen aus einem breiten Vereinspool mit echter Streuung.
   Jedes Angebot hat drei sichtbare Achsen: sportliche Logik, Geld und
   Anpassungsrisiko. Ein reiner Geldwechsel wird bestraft, ein sportlich
   sinnvoller belohnt, Vereinstreue zahlt sich langfristig aus.      */

window.FKC = window.FKC || {};

(function (FKC) {
  'use strict';

  var T = {};
  var clamp = function (v, a, b) { return FKC.util.clamp(v, a, b); };

  /* ── Marktniveau des Spielers ───────────────────────────────────── */

  /**
   * Das Marktniveau muss dicht am Rating liegen — Vereinsniveau und
   * Spielerrating laufen auf derselben Skala. Zu grosszügige Zuschläge
   * führen sonst dazu, dass ein Durchschnittsspieler Angebote von
   * Spitzenklubs bekommt.
   */
  T.marketLevel = function (game, record) {
    var v = game.ovr + (game.status.reputation - 40) / 10;
    if (record) {
      v += (record.avgRating - 6.6) * 3;
      v += record.trophies.length * 1.2;
      v += record.awards.length * 2;
      if (record.apps < 10) v -= 7;
    }
    // Restpotenzial macht junge Spieler begehrter — aber begrenzt
    if (game.identity.age <= 23) {
      v += Math.min(5, clamp(game.hidden.potential - game.ovr, 0, 30) * 0.25);
    } else if (game.identity.age >= 32) {
      v -= (game.identity.age - 31) * 2.2;
    }
    return v;
  };

  /* ── Vereinspool mit Streuung ───────────────────────────────────── */

  /**
   * Zieht n Vereine aus einem breiten Fenster um das Zielniveau.
   * Bewusst flach gewichtet und pro Liga höchstens einer — sonst
   * landet immer derselbe Verein oben.
   */
  T.sampleClubs = function (targetLevel, n, opts) {
    opts = opts || {};
    var rng = FKC.rng;
    var exclude = (opts.exclude || []).filter(Boolean);
    var lo = targetLevel + (opts.lo != null ? opts.lo : -11);
    var hi = targetLevel + (opts.hi != null ? opts.hi : 11);

    function collect(minLvl, maxLvl) {
      return FKC.data.clubs.filter(function (c) {
        if (exclude.indexOf(c.id) >= 0) return false;
        var lg = FKC.data.leagueOf(c);
        if (!lg) return false;
        if (opts.country && lg.country !== opts.country) return false;
        if (opts.notCountry && lg.country === opts.notCountry) return false;
        if (opts.tier && lg.tier !== opts.tier) return false;
        /* Ein Spitzenklub meldet sich nicht bei einem unbekannten Spieler */
        if (opts.reputation != null) {
          if (c.prestige >= 92 && opts.reputation < 74) return false;
          if (c.prestige >= 85 && opts.reputation < 58) return false;
          if (c.prestige >= 76 && opts.reputation < 38) return false;
        }
        var lvl = FKC.data.clubLevel(c);
        return lvl >= minLvl && lvl <= maxLvl;
      });
    }

    /* Fenster schrittweise öffnen — sonst gibt es unterhalb des
       schwächsten Vereins der Datenbank gar keine Angebote mehr. */
    var pool = collect(lo, hi);
    if (!pool.length) pool = collect(lo - 12, hi + 12);
    if (!pool.length) pool = collect(-999, hi + 25);
    if (!pool.length && (opts.country || opts.notCountry)) {
      opts = { exclude: exclude };
      pool = collect(lo - 12, hi + 12);
    }
    if (!pool.length) return [];

    // Streuung ja, aber das Niveau muss halbwegs passen
    var scored = pool.map(function (c) {
      var d = Math.abs(FKC.data.clubLevel(c) - targetLevel);
      return { club: c, w: (1 / (1 + d / 4)) * rng.float(0.5, 1.5) };
    });
    scored.sort(function (a, b) { return b.w - a.w; });

    var out = [], leagues = {}, countries = {};
    for (var i = 0; i < scored.length && out.length < n; i++) {
      var c = scored[i].club;
      var lg = FKC.data.leagueOf(c);
      var cLeagueId = FKC.data.leagueIdOf(c);
      if (leagues[cLeagueId]) continue;                        // max. 1 pro Liga
      if (countries[lg.country] && out.length < n - 1) continue; // Länder streuen
      leagues[cLeagueId] = 1; countries[lg.country] = 1;
      out.push(c);
    }
    // Falls die Streuregeln zu streng waren, mit dem Rest auffüllen
    for (var j = 0; j < scored.length && out.length < n; j++) {
      if (out.indexOf(scored[j].club) < 0) out.push(scored[j].club);
    }
    return out;
  };

  /* ── Gehalt schätzen ────────────────────────────────────────────── */

  T.estimateSalary = function (club, game, factor) {
    var base = Math.pow(1.155, Math.max(0, game.ovr - 38)) * 11000;
    /* Der Etat muss sich im Gehalt auch niederschlagen. Mit dem alten
       `0.5 + f/95` lagen zwischen Real Oviedo und Real Madrid nur das
       1.4-fache — bei einem Etatunterschied von 54 zu 98. Jetzt sind es
       rund 1.8; der Mittelwert (f≈72) bleibt, wo er war, damit sich das
       Gehaltsniveau insgesamt nicht verschiebt.                       */
    base *= 0.06 + club.finances / 58;
    var lg = FKC.data.leagueOf(club);
    if (lg) base *= 0.55 + lg.strength / 95;
    base *= 0.85 + game.status.reputation / 220;
    if (game.identity.age >= 32) base *= 0.8;
    return Math.max(12000, Math.round(base * (factor || 1) / 1000) * 1000);
  };

  /* ── Bewertungsachsen ───────────────────────────────────────────── */

  T.rate = function (game, club, roleKey, salary) {
    var lvl = FKC.data.clubLevel(club);
    var cur = FKC.state.club();
    var curLvl = cur ? FKC.data.clubLevel(cur) : lvl - 5;
    var curSalary = game.status.contract ? game.status.contract.salary : salary * 0.6;
    var lg = FKC.data.leagueOf(club);
    var curLg = cur ? FKC.data.leagueOf(cur) : null;

    /* Sportliche Logik: Niveau passend zum eigenen Rating, Spielzeit
       realistisch, Liga ein Schritt nach vorn statt ein Sprung ins Nichts */
    var gapToPlayer = lvl - game.ovr;
    var sport = 72 - Math.abs(gapToPlayer - 2) * 3.4;
    if (roleKey === 'role.starter') sport += 14;
    else if (roleKey === 'role.star') sport += 18;
    else if (roleKey === 'role.talent') sport -= 14;
    if (lg && curLg) sport += clamp((lg.strength - curLg.strength) * 0.5, -12, 12);
    sport += (club.facilities - 65) * 0.18;
    sport = clamp(Math.round(sport), 3, 99);

    /* Geld */
    var money = clamp(Math.round(38 + (salary / Math.max(1, curSalary) - 1) * 55), 3, 99);

    /* Anpassungsrisiko */
    var risk = 22;
    if (lg && curLg && lg.country !== curLg.country) risk += 26;
    if (lg && curLg && lg.conf !== curLg.conf) risk += 12;
    risk += Math.max(0, gapToPlayer - 4) * 2.6;
    risk += clamp((90 - game.hidden.adaptability) * 0.28, 0, 26);
    if (game.identity.age <= 20) risk += 8;
    risk -= FKC.data.traitBonus(game, 'adaptability') * 0.4;
    risk = clamp(Math.round(risk), 4, 97);

    return { sport: sport, money: money, risk: risk };
  };

  /* ── Angebote nach der Saison ───────────────────────────────────── */

  T.buildOffers = function (game, record) {
    var rng = FKC.rng;
    var cur = FKC.state.club();
    var curLg = cur ? FKC.data.leagueOf(cur) : null;
    var lvl = T.marketLevel(game, record);
    var offers = [];

    var contract = game.status.contract || { yearsLeft: 1, salary: 30000 };
    var expiring = contract.yearsLeft <= 1;

    /* Wie viel Interesse gibt es überhaupt? */
    var interest = clamp(
      (record ? (record.avgRating - 6.4) * 1.6 : 0) +
      (game.status.reputation - 40) / 22 +
      (expiring ? 0.8 : 0) +
      (game.identity.age <= 24 ? 0.5 : game.identity.age >= 33 ? -1.1 : 0) +
      rng.float(-0.7, 1.1), -1, 3.2);

    var count = interest < 0.3 ? 0 : interest < 1.2 ? 1 : interest < 2.2 ? 2 : 3;

    /* Wer kaum spielt, bekommt immer einen Ausweg angeboten — sonst
       versauert ein Spieler jahrelang auf der Tribüne eines zu grossen
       Vereins, ohne dass sich etwas bewegen kann.                    */
    var starved = !!record && record.apps < 10;
    if (starved) count = Math.max(count, 2);

    if (count > 0) {
      var kinds = starved
        ? ['step', 'step', 'sport'].slice(0, count)
        : rng.shuffle(['step', 'sport', 'money']).slice(0, count);
      var used = [cur && cur.id];

      kinds.forEach(function (kind, i) {
        var target, roleKey, salaryFactor;
        var opts = { exclude: used, reputation: game.status.reputation };

        if (kind === 'money') {
          target = lvl + rng.int(6, 12);
          roleKey = rng.chance(0.6) ? 'role.rotation' : 'role.talent';
          salaryFactor = rng.float(1.7, 3.0);
        } else if (kind === 'sport') {
          target = lvl + rng.int(1, 8);
          roleKey = rng.chance(0.55) ? 'role.starter' : 'role.rotation';
          salaryFactor = rng.float(1.1, 1.7);
        } else {
          target = lvl - rng.int(starved ? 8 : 3, starved ? 18 : 12);
          roleKey = rng.chance(0.75) ? 'role.starter' : 'role.star';
          salaryFactor = rng.float(0.8, 1.25);
        }

        var picks = T.sampleClubs(target, 1, opts);
        if (!picks.length) return;
        var club = picks[0];
        used.push(club.id);

        var salary = T.estimateSalary(club, game, salaryFactor);
        var rating = T.rate(game, club, roleKey, salary);
        var lg = FKC.data.leagueOf(club);

        offers.push({
          key: 'o' + i, kind: kind,
          clubId: club.id, name: club.name, short: club.short, color: club.color,
          leagueName: lg ? lg.name : '', country: lg ? lg.country : null,
          abroad: !!(curLg && lg && lg.country !== curLg.country),
          level: FKC.data.clubLevel(club),
          salary: salary, roleKey: roleKey,
          fee: Math.round(game.status.marketValue * rng.float(0.75, 1.9) / 100000) * 100000,
          rating: rating,
          tagKeys: T.tagsFor(kind, rating, club)
        });
      });

      /* Wechselchance je Angebot vorab berechnen und mitgeben — der
         Spieler soll vor der Entscheidung sehen, wie realistisch genau
         dieser Wechsel ist, statt es blind zu versuchen. */
      offers.forEach(function (o) {
        if (o.stay) return;
        o.chance = Math.round(T.transferChance(game, o) * 100);
      });
    }

    /* Bleiben bzw. verlängern ist immer möglich */
    if (cur) {
      var perf = record ? record.avgRating - 6.5 : 0;
      var renewSalary = expiring
        ? T.estimateSalary(cur, game, clamp(1.05 + perf * 0.35, 0.8, 2.1))
        : contract.salary;
      var stayRating = T.rate(game, cur, 'role.' + (contract.squadRole || 'rotation'), renewSalary);
      stayRating.risk = Math.max(3, Math.round(stayRating.risk * 0.25));

      offers.push({
        key: 'stay', kind: 'stay', stay: true,
        clubId: cur.id, name: cur.name, short: cur.short, color: cur.color,
        leagueName: curLg ? curLg.name : '', country: curLg ? curLg.country : null,
        level: FKC.data.clubLevel(cur),
        salary: renewSalary, roleKey: 'role.' + (contract.squadRole || 'rotation'),
        renew: expiring, rating: stayRating,
        tagKeys: T.stayTags(game)
      });
    }

    return offers;
  };

  T.tagsFor = function (kind, rating, club) {
    var tags = [];
    if (kind === 'money') tags.push('tag.money');
    if (kind === 'step') tags.push('tag.minutes');
    if (kind === 'sport') tags.push('tag.sportingStep');
    if (club.prestige >= 84) tags.push('tag.bigName');
    if (rating.risk >= 60) tags.push('tag.riskyMove');
    if (rating.sport <= 35) tags.push('tag.badFit');
    if (club.facilities >= 86) tags.push('tag.topFacilities');
    return tags.slice(0, 3);
  };

  T.stayTags = function (game) {
    var tags = ['tag.knownEnv'];
    var s = game.status.seasonsAtClub;
    if (s >= 8) tags.push('tag.legendPath');
    else if (s >= 5) tags.push('tag.captainPath');
    else if (s >= 3) tags.push('tag.fanFavourite');
    if (game.status.fanRelation >= 75) tags.push('tag.lovedHere');
    return tags.slice(0, 3);
  };

  /* ══ Vertragssystem ═══════════════════════════════════════════════
     Ein Vertrag besteht aus genau zwei Werten: Laufzeit und Gehalt.
     Wer unter Vertrag steht, kann nur wechseln, wenn sich die beiden
     Vereine einigen. Wer vertragslos ist, wechselt ablösefrei.     */

  /* Ablöseklauseln: in Spanien Standard, sonst nur manchmal.
     Sie sind der einzige Weg, einen Spieler gegen den Willen des
     Vereins mitten im Vertrag zu holen.                            */
  T.clauseChance = function (club) {
    var lg = FKC.data.leagueOf(club);
    if (!lg) return 0.2;
    if (lg.country === 'ESP') return 0.92;
    if (lg.country === 'POR' || lg.country === 'BRA' || lg.country === 'ARG') return 0.55;
    return 0.32;
  };

  /** Klausel für einen neuen Vertrag würfeln (0 = keine) */
  T.rollReleaseClause = function (game, club, salary) {
    if (!FKC.rng.chance(T.clauseChance(club))) return 0;
    /* 1.6–3.0-facher Marktwert. Vorher waren es 2.2–4.5 — Klauseln in
       dieser Höhe konnte praktisch kein Verein bezahlen, die Klausel
       war damit ein Hebel, der nie griff (gemessen: 15 % statt der
       erwarteten „nicht verhandelbar"-Wirkung). */
    var base = Math.max(game.status.marketValue || 0, salary * 8);
    return Math.round(base * FKC.rng.float(1.6, 3.0) / 100000) * 100000;
  };

  /** Was der aktuelle Verein für den Spieler verlangt */
  T.askingPrice = function (game) {
    var mv = game.status.marketValue || 1000000;
    var yl = game.status.contract ? game.status.contract.yearsLeft : 0;
    var factor = yl >= 4 ? 1.85 : yl === 3 ? 1.5 : yl === 2 ? 1.25 : yl === 1 ? 0.85 : 0.25;
    if (game.status.isCaptain) factor *= 1.25;
    if (game.flags.wantsOut) factor *= 0.8;
    return Math.max(100000, Math.round(mv * factor / 100000) * 100000);
  };

  /**
   * Einigen sich abgebender und interessierter Verein?
   *
   * Ein laufender Vertrag ist eine echte Hürde. Ohne einen dieser drei
   * Hebel bleibt ein Wechsel unwahrscheinlich:
   *   1. eine Ablöseklausel, die der Interessent bezahlen kann
   *   2. ein auslaufender Vertrag (letztes Jahr)
   *   3. ein aktiv hinterlegter Wechselwunsch des Spielers
   */
  /**
   * Wechselchance für genau dieses Angebot, ohne zu würfeln.
   * Wird sowohl für die Anzeige am Angebot als auch für die
   * Entscheidung benutzt — sonst könnte die angezeigte Prozentzahl von
   * der tatsächlich verwendeten abweichen.
   */
  T.transferChance = function (game, offer) {
    return T.clubsAgree(game, offer, true).chance;
  };

  /**
   * @param nurRechnen  true = nur die Chance bestimmen, nicht würfeln
   */
  T.clubsAgree = function (game, offer, nurRechnen) {
    var cur = FKC.state.club();
    var contract = game.status.contract;

    /* Vertragslos: ablösefreier Wechsel, kein abgebender Verein muss
       zustimmen — der einfachste Weg, aber kein sicherer. Es bleiben
       Gehaltsverhandlung und Medizincheck, und ein Verein zieht ein
       Angebot auch wieder zurück. Eine feste 100 % wäre der Grund
       gewesen, warum vier von fünf Wechseln automatisch durchgingen. */
    if (!cur || !contract || contract.yearsLeft <= 0) {
      var pFrei = 0.82;
      return { ok: nurRechnen ? false : FKC.rng.chance(pFrei),
               free: true, fee: 0, chance: pFrei, reason: 'free' };
    }

    var buyer = FKC.data.clubById(offer.clubId);
    /* Kaufkraft. Mit dem alten Grundwert (800 000) kam selbst ein
       Spitzenverein nur auf gut 80 Mio. — Ablöseklauseln von Topspielern
       lagen damit systematisch ausserhalb der Reichweite, und der Hebel
       „Klausel" griff nie. */
    var power = Math.pow(1.085, buyer.finances - 40) * 1500000;
    var clause = contract.releaseClause || 0;

    /* 1 — Ablöseklausel: der Verein hat nichts mitzureden. Bleibt der
       stärkste Hebel, nur eben nicht die Gewissheit — auch eine
       hinterlegte Klausel scheitert noch an den Vertragsgesprächen. */
    if (clause > 0 && power >= clause) {
      var pKlausel = 0.93;
      return { ok: nurRechnen ? false : FKC.rng.chance(pKlausel),
               free: false, fee: clause, chance: pKlausel,
               reason: 'clause', buyer: buyer };
    }

    var fee = T.askingPrice(game);
    var ratio = power / Math.max(1, fee);

    /* Grundbereitschaft ohne jeden Hebel bleibt niedrig — ein Vertrag
       ist ein Vertrag. Ist aber **einer der drei Hebel aus Runde 11**
       erfüllt (Klausel, letztes Vertragsjahr, Wechselwunsch), liegt die
       Chance bei rund 70 %. Vorher lag sie dort bei 23 bis 31 %, und
       ein Wechsel unter laufendem Vertrag kam kaum je zustande. */
    var p = 0.12;
    var reason = 'none';

    /* Fast bezahlte Klausel: wer nah dran ist, verhandelt den Rest.
       Sonst wäre eine Klausel entweder alles oder nichts. */
    if (clause > 0) {
      var deckung = power / clause;
      if (deckung >= 0.75) { p += 0.58; reason = 'clause'; }
      else if (deckung >= 0.5) { p += 0.30; reason = 'clause'; }
    }

    /* 2 — Auslaufender Vertrag: lieber jetzt Geld als später nichts */
    if (contract.yearsLeft <= 1) { p += 0.58; if (reason === 'none') reason = 'expiring'; }
    else if (contract.yearsLeft === 2) p += 0.18;
    else if (contract.yearsLeft >= 4) p -= 0.03;

    /* 3 — Hinterlegter Wechselwunsch. Wer den Konflikt eingeht und
       Fansympathie und Vereinstreue dafür bezahlt, muss dafür auch
       eine echte Chance bekommen. */
    if (game.flags.wantsOut) {
      p += 0.58;
      if (reason === 'none') reason = 'request';
    }

    /* Kaufkraft hilft, ersetzt aber keinen der drei Hebel */
    p += clamp((ratio - 1) * 0.18, -0.05, 0.22);
    if (game.status.isCaptain) p -= 0.08;
    p -= Math.max(0, game.ovr - FKC.data.clubLevel(cur)) * 0.009; // Leistungsträger

    p = clamp(p, 0.03, 0.95);
    return { ok: nurRechnen ? false : FKC.rng.chance(p),
             free: false, fee: fee, chance: p,
             reason: reason, clause: clause, buyer: buyer };
  };

  /** Erstangebot eines Vereins: Laufzeit und Gehalt */
  T.openingTerms = function (game, offer) {
    var age = game.identity.age;
    var years = age <= 23 ? FKC.rng.int(3, 5)
              : age <= 30 ? FKC.rng.int(3, 4)
              : age <= 33 ? FKC.rng.int(2, 3) : 1;
    return { years: years, salary: offer.salary };
  };

  /**
   * Gegenangebot. what = 'money' | 'years'
   * Liefert { outcome, terms, withdrawn }.
   */
  T.negotiate = function (game, pending, what, record) {
    var club = FKC.data.clubById(pending.clubId);
    var lvl = T.marketLevel(game, record);
    var clubLvl = club ? FKC.data.clubLevel(club) : lvl;

    /* Vereine geben nicht leichtfertig nach — auch ein guter Spieler
       bekommt nicht jede Forderung durch, und jede weitere Runde
       verschlechtert die Position deutlich.                        */
    var leverage = (lvl - clubLvl) * 0.035
      + (game.status.reputation - 45) / 180
      - pending.round * 0.34;
    if (game.identity.age >= 33) leverage -= 0.25;
    if (game.identity.age <= 20) leverage -= 0.12;
    if (!game.status.clubId) leverage -= 0.15;            // vertragslos = schwache Position
    if (record && record.avgRating >= 7.3) leverage += 0.08;

    var p = clamp(0.30 + leverage, 0.03, 0.62);
    var roll = FKC.rng.next();
    var terms = { years: pending.terms.years, salary: pending.terms.salary };

    if (roll < p) {
      /* Voll durchgesetzt */
      if (what === 'money') terms.salary = Math.round(terms.salary * 1.28 / 1000) * 1000;
      else terms.years = Math.min(6, terms.years + 2);
      return { outcome: 'full', terms: terms };
    }
    if (roll < p + 0.22) {
      /* Teilweise entgegengekommen */
      if (what === 'money') terms.salary = Math.round(terms.salary * 1.12 / 1000) * 1000;
      else terms.years = Math.min(6, terms.years + 1);
      return { outcome: 'partial', terms: terms };
    }
    /* Zu forsch: Angebot bleibt stehen oder wird zurückgezogen */
    var withdrawChance = clamp(0.10 + pending.round * 0.22 - leverage * 0.2, 0.05, 0.7);
    if (FKC.rng.chance(withdrawChance)) {
      return { outcome: 'withdrawn', terms: terms, withdrawn: true };
    }
    return { outcome: 'refused', terms: terms };
  };

  /** Vertrag tatsächlich unterschreiben */
  T.signContract = function (game, pending, record) {
    /* Über den Spielstand auflösen, damit auch ein Amateurverein aus
       der eigenen Kindheit ein gültiges Ziel ist. */
    var club = FKC.state.clubById(pending.clubId);
    if (!club) return { textKey: 'contract.signed.move', params: {}, effects: [], tone: 'plain' };
    var staying = game.status.clubId === pending.clubId;
    var effects = [];
    var textKey;

    var oldSalary = game.status.contract ? game.status.contract.salary : 0;

    if (staying) {
      textKey = 'contract.signed.stay';
      effects.push({ type: 'loyalty', delta: 12 });
      effects.push({ type: 'fanRelation', delta: 6 });
      effects.push({ type: 'morale', delta: 6 });

      var s = game.status.seasonsAtClub;
      if (s >= 5 && !game.status.isCaptain && game.hidden.mentality >= 58) {
        game.status.isCaptain = true;
        effects.push({ type: 'reputation', delta: 6 });
        FKC.state.logTimeline({ text: { key: 'tl.captain', params: { club: club.name } }, mark: 'good' });
        textKey = 'contract.signed.captain';
      }
      if (s >= 8 && !game.flags.legendAt) {
        game.flags.legendAt = club.id;
        effects.push({ type: 'fanRelation', delta: 15 });
        effects.push({ type: 'reputation', delta: 8 });
        FKC.state.logTimeline({ text: { key: 'tl.legend', params: { club: club.name } }, mark: 'good' });
        textKey = 'contract.signed.legend';
      }

    } else {
      /* Wechsel — die Geld-gegen-Sport-Abwägung schlägt hier zu */
      var r = pending.rating || { sport: 55, money: 50, risk: 30 };
      var moneyDriven = r.money - r.sport;
      effects.push({ type: 'club', club: club, clubType: 'pro' });

      /* Eingewöhnung kostet spürbar, aber sie darf keinen Einbruch
         auslösen — ein Wechsel zu einem besseren Verein soll sich nicht
         wie ein Rückschritt anfühlen.                              */
      if (moneyDriven > 25) {
        textKey = 'contract.signed.money';
        effects.push({ type: 'form', delta: -9 });
        effects.push({ type: 'morale', delta: -5 });
        effects.push({ type: 'fanRelation', delta: -10 });
        game.flags.adaptationTrouble = 1;
      } else if (r.sport >= 60 && moneyDriven < 10) {
        textKey = 'contract.signed.sport';
        effects.push({ type: 'form', delta: 6 });
        effects.push({ type: 'morale', delta: 10 });
        effects.push({ type: 'growthBonus', points: 5 });
      } else {
        textKey = 'contract.signed.move';
        effects.push({ type: 'form', delta: -3 });
        effects.push({ type: 'morale', delta: 3 });
      }

      if (FKC.rng.chance(r.risk / 200)) {
        effects.push({ type: 'form', delta: -5 });
        effects.push({ type: 'hidden', key: 'consistency', delta: -3 });
        game.flags.adaptationTrouble = (game.flags.adaptationTrouble || 0) + 1;
      }

      /* Der Schritt nach oben bringt bessere Bedingungen — das gleicht
         einen Teil der Umstellung aus. */
      var cur = FKC.state.club();
      if (cur && FKC.data.clubLevel(club) > FKC.data.clubLevel(cur)) {
        effects.push({ type: 'morale', delta: 5 });
        effects.push({ type: 'growthBonus', points: 3 });
      }
      if (pending.abroad) {
        game.flags.movedAbroad = true;
      }
      FKC.state.logTimeline({
        text: { key: pending.free ? 'tl.freeTransfer' : 'tl.transfer', params: { club: club.name } },
        mark: moneyDriven > 25 ? 'bad' : 'good'
      });
    }

    game.status.contract = {
      salary: pending.terms.salary,
      yearsLeft: pending.terms.years,
      signedYear: game.identity.year,
      releaseClause: T.rollReleaseClause(game, club, pending.terms.salary),
      squadRole: (pending.roleKey || 'role.rotation').replace('role.', '')
    };

    /* Handgeld bei ablösefreiem Wechsel */
    if (pending.free && !staying) {
      effects.push({ type: 'money', delta: Math.round(pending.terms.salary * 0.5) });
    }

    FKC.effects.apply(game, effects);
    game.status.marketValue = FKC.attributes.marketValue(game);

    return {
      textKey: textKey,
      params: { club: club.name, salary: FKC.i18n.money(pending.terms.salary),
                years: pending.terms.years, league: pending.leagueName || '',
                old: FKC.i18n.money(oldSalary) },
      effects: effects,
      tone: 'good'
    };
  };

  /* ── Angebot annehmen (nur noch: bleiben ohne Neuverhandlung) ───── */

  T.accept = function (game, offer) {
    var effects = [];
    var textKey;

    if (offer.stay) {
      textKey = offer.renew ? 'transfer.stay.renew_r' : 'transfer.stay.keep_r';
      game.status.contract = game.status.contract || {};
      if (offer.renew) {
        game.status.contract.salary = offer.salary;
        game.status.contract.yearsLeft = FKC.rng.int(3, 5);
        game.status.contract.signedYear = game.identity.year;
      }
      effects.push({ type: 'loyalty', delta: 10 });
      effects.push({ type: 'fanRelation', delta: 6 });
      effects.push({ type: 'morale', delta: 4 });

      /* Treue-Meilensteine */
      var s = game.status.seasonsAtClub;
      if (s >= 5 && !game.status.isCaptain && game.hidden.mentality >= 58) {
        game.status.isCaptain = true;
        effects.push({ type: 'flag', key: 'captain', value: true });
        effects.push({ type: 'reputation', delta: 6 });
        FKC.state.logTimeline({ text: { key: 'tl.captain', params: { club: offer.name } }, mark: 'good' });
        textKey = 'transfer.stay.captain_r';
      }
      if (s >= 8 && !game.flags.legendAt) {
        game.flags.legendAt = offer.clubId;
        effects.push({ type: 'fanRelation', delta: 15 });
        effects.push({ type: 'reputation', delta: 8 });
        FKC.state.logTimeline({ text: { key: 'tl.legend', params: { club: offer.name } }, mark: 'good' });
        textKey = 'transfer.stay.legend_r';
      }
      FKC.effects.apply(game, effects);
      return { textKey: textKey, params: { club: offer.name, salary: FKC.i18n.money(offer.salary) },
               effects: effects, tone: 'good' };
    }

    /* ── Wechsel ──────────────────────────────────────────────────── */
    var club = FKC.data.clubById(offer.clubId);
    var r = offer.rating;
    var moneyDriven = r.money - r.sport;      // > 0 = eher Geldentscheidung

    effects.push({ type: 'club', club: club, clubType: 'pro' });

    game.status.contract = {
      salary: offer.salary,
      yearsLeft: FKC.rng.int(3, 5),
      signedYear: game.identity.year,
      releaseClause: Math.round(offer.salary * FKC.rng.int(8, 20)),
      squadRole: (offer.roleKey || 'role.rotation').replace('role.', '')
    };

    if (moneyDriven > 25) {
      /* Reine Geldentscheidung: harte Landung */
      textKey = 'transfer.move.money_r';
      effects.push({ type: 'form', delta: -18 });
      effects.push({ type: 'morale', delta: -8 });
      effects.push({ type: 'fanRelation', delta: -18 });
      effects.push({ type: 'money', delta: Math.round(offer.salary * 0.4) });
      game.flags.adaptationTrouble = 2;
    } else if (r.sport >= 60 && moneyDriven < 10) {
      /* Sportlich schlüssig */
      textKey = 'transfer.move.sport_r';
      effects.push({ type: 'form', delta: 6 });
      effects.push({ type: 'morale', delta: 10 });
      effects.push({ type: 'growthBonus', points: 5 });
    } else {
      textKey = 'transfer.move.plain_r';
      effects.push({ type: 'form', delta: -6 });
      effects.push({ type: 'morale', delta: 3 });
    }

    /* Anpassungsrisiko schlägt zusätzlich zu */
    if (FKC.rng.chance(r.risk / 145)) {
      effects.push({ type: 'form', delta: -10 });
      effects.push({ type: 'hidden', key: 'consistency', delta: -4 });
      game.flags.adaptationTrouble = (game.flags.adaptationTrouble || 0) + 1;
    } else if (r.risk < 30) {
      effects.push({ type: 'hidden', key: 'adaptability', delta: 3 });
    }

    if (offer.abroad) {
      game.flags.movedAbroad = true;
    }

    FKC.effects.apply(game, effects);
    game.status.marketValue = FKC.attributes.marketValue(game);

    FKC.state.logTimeline({
      text: { key: 'tl.transfer', params: { club: club.name } },
      mark: moneyDriven > 25 ? 'bad' : 'good'
    });

    return {
      textKey: textKey,
      params: { club: offer.name, salary: FKC.i18n.money(offer.salary),
                league: offer.leagueName },
      effects: effects, tone: moneyDriven > 25 ? 'mixed' : 'good'
    };
  };

  /* ── Vertragslos: wer meldet sich noch? ─────────────────────────── */

  T.freeAgentOffers = function (game) {
    var rng = FKC.rng;
    var age = game.identity.age;
    var lvl = T.marketLevel(game, null) - 4;

    /* Je älter und je unbekannter, desto stiller wird es */
    var interest = (game.ovr - 58) / 9 + (game.status.reputation - 40) / 25;
    if (age >= 37) interest -= 2.4;
    else if (age >= 35) interest -= 1.5;
    else if (age >= 33) interest -= 0.7;
    interest += rng.float(-0.6, 0.9);

    var count = interest < -0.2 ? 0 : interest < 0.9 ? 1 : interest < 2 ? 2 : 3;
    var offers = [], used = [];

    for (var i = 0; i < count; i++) {
      var picks = T.sampleClubs(lvl - rng.int(0, 9), 1,
        { exclude: used, reputation: game.status.reputation });
      if (!picks.length) break;
      var club = picks[0];
      used.push(club.id);
      var roleKey = rng.chance(0.6) ? 'role.starter' : 'role.rotation';
      var salary = T.estimateSalary(club, game, rng.float(0.7, 1.1));
      var lg = FKC.data.leagueOf(club);
      offers.push({
        key: 'f' + i, kind: 'free', free: true,
        clubId: club.id, name: club.name, short: club.short, color: club.color,
        leagueName: lg ? lg.name : '', country: lg ? lg.country : null,
        abroad: lg && lg.country !== FKC.data.youthCountry(game.identity.nationality),
        level: FKC.data.clubLevel(club),
        salary: salary, roleKey: roleKey,
        rating: T.rate(game, club, roleKey, salary),
        tagKeys: ['tag.freeAgent'].concat(T.tagsFor('step', T.rate(game, club, roleKey, salary), club)).slice(0, 3)
      });
    }
    return offers;
  };

  /* ── Karriere ausklingen lassen ─────────────────────────────────────
     Nicht jede Laufbahn endet in der Königsklasse. Wer will, geht die
     letzten Jahre bewusst eine Etage tiefer — oder ganz zurück an den
     Anfang. Der Dorfverein aus der Kindheit steht ausdrücklich mit in
     der Liste: eine Karriere dort ausklingen zu lassen ist der
     rundeste Schluss, den das Spiel anbieten kann.               */

  T.windDownOffers = function (game) {
    var rng = FKC.rng;
    var home = FKC.data.youthCountry(game.identity.nationality);
    var offers = [], used = [game.status.clubId];

    /* Eigene Bewertung für den Weg nach unten. `T.rate` rechnet mit
       Liga und Ausstattung des Zielvereins — ein Amateurklub hat
       beides nicht, und die Karte zeigte darum überall NaN. Hier zählt
       etwas anderes: Spielzeit ist sicher, Geld ist wenig, und ein
       Risiko besteht praktisch nicht. */
    function bewerten(level, salary, heim) {
      var jetztLvl = curLevel();
      var curSalary = game.status.contract ? game.status.contract.salary : Math.max(1, salary);
      return {
        sport: clamp(Math.round(58 - Math.max(0, jetztLvl - level) * 0.55), 8, 78),
        money: clamp(Math.round(38 + (salary / Math.max(1, curSalary) - 1) * 55), 2, 99),
        risk: clamp(Math.round(heim ? 6 : 14 + Math.max(0, jetztLvl - level) * 0.12), 3, 40)
      };
    }
    function curLevel() {
      var c = FKC.state.club();
      if (!c) return game.ovr;
      return c.synthetic ? (c.strength || 30) : FKC.data.clubLevel(c);
    }

    /* 0 — Bleiben, wo man ist. Steht nur da, wenn der Ausklang schon
           begonnen hat; beim ersten Mal ist das ja gerade der Verein,
           den man verlassen will. */
    var jetzt = game.flags.windDown ? FKC.state.club() : null;
    if (jetzt) {
      offers.push({
        key: 'stay', kind: 'winddown', windDown: true, stay: true,
        clubId: jetzt.id, name: jetzt.name,
        short: jetzt.short || jetzt.name.slice(0, 3).toUpperCase(),
        color: jetzt.color || '#7a8b7f',
        leagueName: jetzt.synthetic ? FKC.t('transfer.amateurLeague')
                  : (FKC.data.leagueOf(jetzt) || {}).name || '',
        country: home, abroad: false,
        level: jetzt.synthetic ? (jetzt.strength || 30) : FKC.data.clubLevel(jetzt),
        salary: game.status.contract ? game.status.contract.salary
              : (jetzt.synthetic ? rng.int(900, 2600) : T.estimateSalary(jetzt, game, 0.6)),
        roleKey: 'role.starter',
        rating: bewerten(jetzt.synthetic ? (jetzt.strength || 30) : FKC.data.clubLevel(jetzt),
                         game.status.contract ? game.status.contract.salary : 2000, true),
        tagKeys: ['tag.windDown']
      });
    }

    /* 1 — Der Verein, mit dem alles begann. Ein Amateurklub hat keine
           Liga und keine Finanzen — sein Angebot ist symbolisch. */
    var heimat = game.origin && game.origin.villageClub;
    if (heimat && heimat.id !== game.status.clubId) {
      used.push(heimat.id);
      var heimGehalt = Math.round(rng.int(900, 2600) / 100) * 100;
      offers.push({
        key: 'home', kind: 'winddown', windDown: true, homecoming: true,
        clubId: heimat.id, name: heimat.name,
        short: heimat.short || heimat.name.slice(0, 3).toUpperCase(),
        color: heimat.color || '#7a8b7f',
        leagueName: FKC.t('transfer.amateurLeague'),
        country: game.origin.country, abroad: false,
        level: heimat.strength || 30,
        salary: heimGehalt,
        roleKey: 'role.starter',
        rating: bewerten(heimat.strength || 30, heimGehalt, true),
        tagKeys: ['tag.homecoming', 'tag.amateur']
      });
    }

    /* 2 — Der Jugendverein, falls das ein anderer war. Nur, wenn er
           auch wirklich eine Stufe tiefer liegt: Wer bei einem
           Bundesligisten ausgebildet wurde, klingt dort nicht aus. */
    var jugend = game.origin && game.origin.startClubId
      ? FKC.data.clubById(game.origin.startClubId) : null;
    if (jugend && FKC.data.clubLevel(jugend) >= curLevel() - 4) jugend = null;
    if (jugend && used.indexOf(jugend.id) < 0) {
      used.push(jugend.id);
      var lgJ = FKC.data.leagueOf(jugend);
      var jGehalt = T.estimateSalary(jugend, game, 0.55);
      offers.push({
        key: 'youth', kind: 'winddown', windDown: true, homecoming: true,
        clubId: jugend.id, name: jugend.name, short: jugend.short, color: jugend.color,
        leagueName: lgJ ? lgJ.name : '', country: lgJ ? lgJ.country : home,
        abroad: !!(lgJ && lgJ.country !== home),
        level: FKC.data.clubLevel(jugend),
        salary: jGehalt,
        roleKey: 'role.starter',
        rating: bewerten(FKC.data.clubLevel(jugend), jGehalt, true),
        tagKeys: ['tag.homecoming']
      });
    }

    /* 3 — Zwei kleine Vereine aus der Heimat, deutlich unter Niveau.
           Das Spiel kennt nur zwei Ligastufen; eine feste Obergrenze
           liefert je nach eigenem Rating entweder gar keine oder
           lauter Erstligisten. Deshalb relativ: die schwächsten
           Vereine des Landes, aus denen zwei gezogen werden. */
    /* Die Grenze ist der **aktuelle** Verein, nicht das eigene Rating.
       Sonst konnte bei einem gealterten Spieler ein Bundesligist als
       „kleiner Verein" auftauchen. */
    var grenze = Math.min(curLevel() - 8, game.ovr - 6);
    var klein = FKC.data.clubs.filter(function (cl) {
      var lg = FKC.data.leagueOf(cl);
      return lg && lg.country === home && used.indexOf(cl.id) < 0 &&
             FKC.data.clubLevel(cl) < grenze;
    }).sort(function (a, b) {
      return FKC.data.clubLevel(a) - FKC.data.clubLevel(b);
    }).slice(0, 6);
    rng.shuffle(klein).slice(0, 2).forEach(function (cl, i) {
      var lg = FKC.data.leagueOf(cl);
      var kGehalt = T.estimateSalary(cl, game, 0.75);
      offers.push({
        key: 'w' + i, kind: 'winddown', windDown: true,
        clubId: cl.id, name: cl.name, short: cl.short, color: cl.color,
        leagueName: lg ? lg.name : '', country: lg ? lg.country : home,
        abroad: false, level: FKC.data.clubLevel(cl),
        salary: kGehalt,
        roleKey: 'role.starter',
        rating: bewerten(FKC.data.clubLevel(cl), kGehalt, false),
        tagKeys: ['tag.windDown']
      });
    });

    return offers;
  };

  /* ── Erster Profivertrag ────────────────────────────────────────── */

  T.firstProOffers = function (game) {
    var rng = FKC.rng;
    var cur = FKC.state.club();
    var home = FKC.data.youthCountry(game.identity.nationality);
    var lvl = game.ovr + (game.status.reputation - 35) / 9;
    var offers = [], used = [cur && cur.id];

    /* 1 — Beim Ausbildungsverein bleiben, falls es ein Profiklub ist */
    if (cur && !cur.synthetic) {
      var lg0 = FKC.data.leagueOf(cur);
      var ready = FKC.data.clubLevel(cur) - lvl < 15;
      offers.push({
        key: 'stay', kind: 'stay', firstPro: true,
        clubId: cur.id, name: cur.name, short: cur.short, color: cur.color,
        leagueName: lg0 ? lg0.name : '', country: lg0 ? lg0.country : home,
        level: FKC.data.clubLevel(cur),
        salary: T.estimateSalary(cur, game, ready ? 1 : 0.75),
        roleKey: ready ? 'role.rotation' : 'role.talent',
        rating: { sport: ready ? 68 : 44, money: 40, risk: 10 },
        tagKeys: ready ? ['tag.knownEnv', 'tag.loyalty'] : ['tag.knownEnv', 'tag.benchRisk']
      });
    }

    /* 2 — Ein Verein mit sicherer Spielzeit, im Heimatland */
    var stepPicks = T.sampleClubs(lvl - rng.int(2, 9), 1,
      { exclude: used, country: home, reputation: game.status.reputation });
    if (stepPicks.length) {
      used.push(stepPicks[0].id);
      offers.push(T.makeFirstOffer(game, stepPicks[0], 'step', 'role.starter', rng.float(0.85, 1.2)));
    }

    /* 3 — Auslandsoption: der Sprung ins kalte Wasser. Wahrscheinlichkeit
           steigt mit Bekanntheit — ein unbekanntes Talent wird selten
           direkt aus dem Ausland geholt.                             */
    var abroadChance = clamp(0.16 + (game.status.reputation - 30) / 110 +
                             (game.flags.scouted ? 0.16 : 0), 0.08, 0.62);
    if (rng.chance(abroadChance)) {
      var abroadPicks = T.sampleClubs(lvl + rng.int(2, 12), 1,
        { exclude: used, notCountry: home, reputation: game.status.reputation });
      if (abroadPicks.length) {
        used.push(abroadPicks[0].id);
        offers.push(T.makeFirstOffer(game, abroadPicks[0], 'abroad',
          rng.chance(0.55) ? 'role.talent' : 'role.rotation', rng.float(1.3, 2.4)));
      }
    } else {
      var bigPicks = T.sampleClubs(lvl + rng.int(6, 14), 1,
        { exclude: used, country: home, reputation: game.status.reputation });
      if (bigPicks.length) {
        used.push(bigPicks[0].id);
        offers.push(T.makeFirstOffer(game, bigPicks[0], 'money', 'role.talent', rng.float(1.4, 2.3)));
      }
    }

    return offers;
  };

  T.makeFirstOffer = function (game, club, kind, roleKey, factor) {
    var lg = FKC.data.leagueOf(club);
    var salary = T.estimateSalary(club, game, factor);
    var rating = T.rate(game, club, roleKey, salary);
    var tags = T.tagsFor(kind, rating, club);
    if (kind === 'abroad') tags.unshift('tag.abroad');
    return {
      key: kind, kind: kind, firstPro: true,
      clubId: club.id, name: club.name, short: club.short, color: club.color,
      leagueName: lg ? lg.name : '', country: lg ? lg.country : null,
      abroad: lg && lg.country !== game.identity.nationality,
      level: FKC.data.clubLevel(club),
      salary: salary, roleKey: roleKey, rating: rating,
      tagKeys: tags.slice(0, 3)
    };
  };

  FKC.transfer = T;

})(window.FKC);
