/* ── Karriere-Phasenmaschine ───────────────────────────────────────────
   Liefert Bild für Bild ("Szenen") und schiebt die Karriere voran:
   Kindheit (6-11) → Jugend (12-17) → Profi (ab 18) → Karriereende.
   Der aktuelle Stand liegt in game.pending und ist speicherbar.

   Profi-Saison bewusst kurz gehalten (wenige, dafür schwere
   Entscheidungen): Vorbereitung → Saison → 1 Ereignis → Transfer.  */

window.FKC = window.FKC || {};

(function (FKC) {
  'use strict';

  var C = {};

  var YOUTH_AGE = 12;
  var PRO_AGE = 18;
  var RETIRE_MIN = 31;
  var RETIRE_MAX = 41;

  /* ── Trainingsschwerpunkte einer Saison ─────────────────────────── */
  var TRAINING = [
    { id: 'technique', intensity: 'balanced',
      focus: function (g) { return g.identity.isGK ? 'handling' : 'passing'; },
      second: function (g) { return g.identity.isGK ? 'positioning' : 'dribbling'; },
      effects: [{ type: 'growthBonus', points: 3 }] },
    { id: 'athletic', intensity: 'hard',
      focus: function (g) { return 'physical'; },
      second: function (g) { return g.identity.isGK ? 'reflexes' : 'pace'; },
      effects: [{ type: 'growthBonus', points: 5 }, { type: 'fitness', delta: -8 }] },
    { id: 'finishing', intensity: 'balanced',
      focus: function (g) { return g.identity.isGK ? 'reflexes' : 'shooting'; },
      second: function (g) { return g.identity.isGK ? 'aerial' : 'dribbling'; },
      effects: [{ type: 'growthBonus', points: 3 }] },
    { id: 'recovery', intensity: 'light',
      focus: function () { return null; },
      second: function () { return null; },
      effects: [{ type: 'fitness', delta: 18 }, { type: 'form', delta: 8 },
                { type: 'hidden', key: 'injuryProneness', delta: -5 }] }
  ];
  C.TRAINING = TRAINING;

  /* ══ Start ════════════════════════════════════════════════════════ */

  C.rollOrigin = function (game, opts) {
    var r = FKC.rng;
    var country = game.identity.nationality;
    var gewaehlt = opts && opts.club;

    /* Der Heimatort kommt aus dem gewählten Dorfverein, wenn einer
       gewählt wurde — sonst stünde in der Erstellung ein Verein und im
       Text danach ein anderer Ort. */
    var village = (gewaehlt && gewaehlt.synthetic)
      ? gewaehlt : FKC.data.youth.villageClub(country);

    /* Bei der Erstellung gewählte Startbedingungen haben Vorrang */
    var wealth = opts && opts.wealth != null
      ? r.gaussInt(opts.wealth, 8, 5, 98)
      : r.gaussInt(50, 20, 8, 96);
    var support = opts && opts.support != null
      ? r.gaussInt(opts.support, 8, 5, 99)
      : FKC.util.clamp(r.gaussInt(58, 20, 8, 98) + Math.round((wealth - 50) / 10), 5, 99);

    /* Startpunkt: Dorfverein, NLZ eines Profivereins oder Topakademie —
       immer aus dem Herkunftsland. */
    var kind = (opts && opts.start) || 'village';
    var startClub = null;
    if (kind !== 'village') {
      /* Bei der Erstellung ausgewählt? Dann gilt diese Adresse. Nur wenn
         keine mitkommt (Adminpanel, Altstände), wird gezogen. */
      startClub = (gewaehlt && !gewaehlt.synthetic) ? gewaehlt
        : FKC.data.youth.startClub(FKC.data.youthCountry(country), kind);
      if (!startClub) kind = 'village';
    }

    return {
      familyWealth: wealth,
      familySupport: support,
      town: village.town,
      country: country,
      villageClubId: village.id,
      villageClubName: village.name,
      villageClub: village,
      startKind: kind,
      startClubId: startClub ? startClub.id : null,
      upbringing: 'club'
    };
  };

  C.start = function (game, opts) {
    game.origin = C.rollOrigin(game, opts);
    game.hidden = FKC.data.rollHidden(game.origin);

    /* Der Startpunkt verschiebt das Potenzial leicht: eine Topakademie
       holt über die Jahre etwas mehr aus einem Talent heraus, der
       Dorfverein etwas weniger. Bewusst klein — das Rohtalent bleibt
       die bestimmende Grösse, sonst wäre die Wahl gleich die halbe
       Karriere.                                                      */
    game.hidden.potential = FKC.util.clamp(
      game.hidden.potential + (game.origin.startKind === 'academy' ? 3
                             : game.origin.startKind === 'nlz' ? 1 : -2), 40, 99);
    /* Signaturstärke passend zur Position — muss vor den Startwerten
       feststehen, damit sie in die Kalibrierung einfliesst.        */
    game.hidden.playstyle = FKC.data.rollPlaystyle(game.identity.position);
    game.attributes = FKC.attributes.startingSet(game);

    game.condition.morale = FKC.util.clamp(50 + Math.round(game.origin.familySupport / 5), 30, 90);
    game.career.life.education = FKC.util.clamp(45 + Math.round(game.origin.familyWealth / 6), 20, 85);
    game.career.finances.balance = Math.round(game.origin.familyWealth * 60);

    FKC.world.init(game);

    /* Startverein je nach gewähltem Weg */
    var startClub = game.origin.startClubId
      ? FKC.data.clubById(game.origin.startClubId) : null;
    if (startClub) {
      FKC.effects.moveToClub(game, startClub, 'academy');
      var boost = game.origin.startKind === 'academy'
        ? [{ type: 'growthBonus', points: 7 }, { type: 'reputation', delta: 7 },
           { type: 'morale', delta: 4 }]
        : [{ type: 'growthBonus', points: 4 }, { type: 'reputation', delta: 3 }];
      FKC.effects.apply(game, boost);
      FKC.state.logTimeline({
        text: { key: 'tl.startAt', params: { club: startClub.name } }, mark: 'good'
      });
    } else {
      FKC.effects.moveToClub(game, game.origin.villageClub, 'village');
      FKC.effects.apply(game, [{ type: 'loyalty', delta: 15 }]);
    }

    /* Die erste Nummer wird bei der Erstellung gewählt; nur ohne Angabe
       (Adminpanel, Altstände) wird eine zugeteilt. */
    game.identity.shirtNo = (opts && opts.shirtNo) || FKC.rng.int(2, 19);

    FKC.attributes.recalc(game);
    FKC.attributes.pushHistory(game);

    FKC.state.logTimeline({ text: { key: 'tl.born', params: { town: game.origin.town } }, mark: 'plain' });

    C.beginYear(game);
    game.pending = { kind: 'intro' };
    return game;
  };

  /* ══ Jahresrhythmus ═══════════════════════════════════════════════ */

  C.beginYear = function (game) {
    var phase = game.career.phase;
    var plan;

    /* Einmal pro Karriere, mit sechzehn: entscheidet sich, ob überhaupt
       jemand kommt und die eine Frage stellt. 50 %. Der Wurf passiert
       genau hier und nicht in einem `when()` — Bedingungen werden bei
       jeder Prüfung neu ausgewertet und dürfen nicht würfeln. */
    if (game.identity.age >= 16 && game.flags.potQuiz == null) {
      /* Spielstände von vor Runde 16 kennen das Flag nicht. Wer da
         schon über dem Fenster liegt, hat den Moment verpasst — sonst
         bekäme ein Dreissigjähriger noch die Frage eines Sichters. */
      if (game.identity.age > 19) {
        game.flags.potQuiz = false;
      } else {
        game.flags.potQuiz = FKC.rng.chance(0.5);
        /* Und in welchem Jahr. Ohne das käme die Szene immer exakt mit
           sechzehn, sobald der eigene Slot greift. Nie später als das
           laufende Jahr, damit ein Altstand nicht leer ausgeht. */
        game.flags.potQuizAge = Math.max(game.identity.age, FKC.rng.int(16, 18));
      }
    }
    if (phase === 'childhood') plan = FKC.rng.chance(0.7) ? 1 : 0;
    else if (phase === 'youth') plan = FKC.rng.chance(0.35) ? 2 : 1;
    else {
      /* Ab 18 kommen allgemeine Ereignisse nur alle zwei bis drei Jahre,
         dafür mit harten Folgen. Vereins- und Transferentscheidungen
         laufen davon unabhängig jede Saison.                        */
      var due = game.flags.nextEventYear == null ||
                game.identity.year >= game.flags.nextEventYear;
      plan = due ? 1 : 0;
    }

    game.tick = {
      year: game.identity.year, events: 0, plan: plan,
      summaryDone: false, planDone: false, trainingDone: false,
      seasonDone: false, transferDone: false,
      /* Der Mentor meldet sich in den meisten Jugendjahren einmal */
      mentorDue: phase === 'youth' && FKC.rng.chance(0.7),
      mentorDone: false
    };
  };

  /* ══ Nächste Szene ════════════════════════════════════════════════ */

  C.nextScene = function () {
    var game = FKC.state.game;
    if (!game) return null;
    if (game.pending) return C.describePending(game);
    if (game.career.phase === 'retired') {
      game.pending = { kind: 'retire' };
      return C.describePending(game);
    }
    if (!game.tick || game.tick.year !== game.identity.year) C.beginYear(game);

    /* Anstehende Phasen-Entscheidungen */
    if (game.flags.needAcademyChoice) {
      game.pending = { kind: 'clubChoice', topic: 'academy' };
      return C.describePending(game);
    }
    if (game.flags.needMentorChoice) {
      game.pending = { kind: 'mentorChoice' };
      return C.describePending(game);
    }
    if (game.flags.needProChoice) {
      game.pending = { kind: 'clubChoice', topic: 'pro' };
      return C.describePending(game);
    }

    /* Die eine Frage bekommt einen eigenen Slot, keinen Platz im
       allgemeinen Pool. Über den gezogen kam sie nur in 35 % der
       Karrieren vor, obwohl der Wurf mit sechzehn 50 % sagt — sie
       konkurriert dort mit zwanzig anderen Ereignissen und hat nur
       zwei, drei Jahre Zeit. Genau derselbe Fall wie beim Mentor. */
    if (game.flags.potQuiz === true && !game.flags.potQuizDone &&
        game.identity.age >= (game.flags.potQuizAge || 16) &&
        game.identity.age <= 19) {
      var pq = FKC.events.draw(game, { idPrefix: 'pq_' });
      if (pq) {
        game.pending = { kind: 'scene', source: 'event', id: pq.id };
        return C.describePending(game);
      }
    }

    return game.career.phase === 'pro' ? proScene(game) : youthScene(game);
  };

  /* ── Kindheit / Jugend ──────────────────────────────────────────── */

  function youthScene(game) {
    var sp = C.dueSpine(game);
    if (sp) {
      game.pending = { kind: 'scene', source: 'spine', id: sp.id };
      return C.describePending(game);
    }
    /* Eigener Slot für den Mentor — sonst geht er zwischen den
       allgemeinen Ereignissen unter und taucht kaum je auf. */
    if (game.career.mentor && game.tick.mentorDue && !game.tick.mentorDone) {
      game.tick.mentorDone = true;
      var mev = FKC.events.draw(game, { idPrefix: 'mentor_' });
      if (mev) {
        game.pending = { kind: 'scene', source: 'event', id: mev.id };
        return C.describePending(game);
      }
    }

    if (game.tick.events < game.tick.plan) {
      var ev = FKC.events.draw(game, { notPrefix: 'mentor_' });
      game.tick.events++;
      if (ev) {
        game.pending = { kind: 'scene', source: 'event', id: ev.id };
        return C.describePending(game);
      }
      return C.nextScene();
    }
    if (!game.tick.summaryDone) {
      game.pending = C.buildSummary(game);
      game.tick.summaryDone = true;
      return C.describePending(game);
    }
    C.advanceYear(game);
    return C.nextScene();
  }

  /* ── Profisaison ────────────────────────────────────────────────── */

  function proScene(game) {
    /* Ohne Verein wird keine Saison gespielt — erst braucht es einen
       Vertrag. Ein Amateurverein ist aber sehr wohl ein Verein: wer die
       Karriere dort bewusst ausklingen lässt, spielt weiter. Vorher
       galt jeder Verein ohne Liga als „vereinslos", und die Heimkehr
       zum Dorfverein wurde noch im selben Jahr wieder aufgelöst. */
    var club = FKC.state.club();
    if (!club || (club.synthetic && !game.flags.windDown)) {
      if (game.tick.freeHandled) { C.advanceYear(game); return C.nextScene(); }
      game.pending = { kind: 'transferChoice', free: true };
      return C.describePending(game);
    }

    /* Saisonplan und Trainingsschwerpunkt stehen zusammen auf **einem**
       Bildschirm. Als eigene Szene war das eine Frage mehr pro Saison,
       und zwischen zwei Spielzeiten sollen wenige, dafür schwere
       Entscheidungen stehen. */
    if (!game.tick.trainingDone) {
      game.pending = { kind: 'training' };
      return C.describePending(game);
    }
    if (!game.tick.seasonDone) {
      game.pending = C.runSeason(game);
      game.tick.seasonDone = true;
      return C.describePending(game);
    }
    if (game.tick.events < game.tick.plan) {
      var ev = FKC.events.draw(game, {});
      game.tick.events++;
      if (ev) {
        /* Nächstes allgemeines Ereignis erst in zwei bis drei Jahren */
        game.flags.nextEventYear = game.identity.year + FKC.rng.int(2, 3);
        game.pending = { kind: 'scene', source: 'event', id: ev.id };
        return C.describePending(game);
      }
      return C.nextScene();
    }
    /* Das Transferfenster öffnet sich nur, wenn es etwas zu entscheiden
       gibt. Jede Saison danach zu fragen, obwohl der Vertrag noch drei
       Jahre läuft und kein Angebot besser ist als der eigene Verein,
       war eine Pflichtfrage ohne Inhalt. */
    if (!game.tick.transferDone && C.transferDue(game)) {
      game.tick.transferDone = true;
      /* Wer heruntergefahren hat, bekommt auch weiter kleine Vereine
         angeboten — sonst führt der erste auslaufende Vertrag direkt
         wieder in die Bundesliga zurück. */
      var runter = !!game.flags.windDown;
      var offers = runter
        ? FKC.transfer.windDownOffers(game)
        : FKC.transfer.buildOffers(game, lastRecord(game));
      if (offers.length) {
        game.pending = { kind: 'transferChoice', offers: offers, windDown: runter };
        return C.describePending(game);
      }
    }
    game.tick.transferDone = true;
    C.advanceYear(game);
    return C.nextScene();
  }

  /**
   * Steht die Vereinsfrage überhaupt an? Sie soll kommen, wenn eine
   * echte Entscheidung dahintersteht — nicht Jahr für Jahr aus Prinzip.
   */
  C.transferDue = function (game) {
    var ct = game.status.contract;
    /* Der Ausklang ist eine getroffene Entscheidung, keine Notlage. Wer
       bewusst zum kleinen Verein gegangen ist, wird dort nicht Jahr für
       Jahr gefragt, ob er nicht doch wieder höher spielen will — genau
       das hat die Heimkehr vorher im selben Jahr wieder aufgelöst. */
    if (game.flags.windDown) {
      return !ct || ct.yearsLeft <= 0 || !!game.flags.wantsOut;
    }
    if (!game.status.clubId || !ct) return true;          // vertragslos
    if (ct.yearsLeft <= 1) return true;                   // Verlängerung fällig
    if (game.flags.wantsOut || game.flags.leavingClub) return true;
    /* Ab 32 steht jedes Jahr die Frage im Raum, wie es zu Ende geht —
       oben bleiben, tiefer gehen oder aufhören. Das ist in diesen
       Jahren die einzige echte Entscheidung und ersetzt keine andere. */
    if (game.identity.age >= 32) return true;             // Karriereende möglich

    var rec = lastRecord(game);
    /* Wer kaum spielt, muss handeln dürfen */
    if (rec && rec.apps <= 8) return true;
    /* Unzufrieden genug, dass ein Angebot reizt */
    if (game.condition.morale < 42) return true;

    /* Sonst nur, wenn der Spieler seinem Verein klar entwachsen ist —
       dann ist ein Angebot von oben eine echte Versuchung. */
    var club = FKC.state.club();
    if (club && game.ovr - FKC.data.clubLevel(club) >= 5) return true;

    return false;
  };

  function lastRecord(game) {
    var s = game.career.seasons;
    return s.length ? s[s.length - 1] : null;
  }

  C.dueSpine = function (game) {
    var age = game.identity.age, phase = game.career.phase;
    for (var i = 0; i < FKC.data.spine.length; i++) {
      var s = FKC.data.spine[i];
      if (s.phase !== phase || s.age !== age) continue;
      if (game.flags['spine.' + s.id]) continue;
      /* Stationen können an einen Startpunkt gebunden sein — die Variante
         für den Dorfverein darf im NLZ nicht auftauchen. */
      if (!FKC.events.startsMatch(s, game)) { game.flags['spine.' + s.id] = 'skipped'; continue; }
      if (s.when && !s.when(game)) { game.flags['spine.' + s.id] = 'skipped'; continue; }
      return s;
    }
    return null;
  };

  C.sceneSource = function (game) {
    if (!game.pending || game.pending.kind !== 'scene') return null;
    return game.pending.source === 'spine'
      ? FKC.util.byId(FKC.data.spine, game.pending.id)
      : FKC.events.byId(game.pending.id);
  };

  /* ══ Anzeige aufbereiten ══════════════════════════════════════════ */

  C.describePending = function (game) {
    var p = game.pending;
    if (!p) return null;

    if (p.kind === 'intro') {
      return { kind: 'intro', age: game.identity.age, origin: game.origin };
    }

    if (p.kind === 'scene') {
      var def = C.sceneSource(game);
      if (!def) { game.pending = null; return C.nextScene(); }
      var view = FKC.events.present(game, def);
      view.kind = 'scene';
      view.age = game.identity.age;
      view.result = p.result ? C.describeResult(game, p.result) : null;
      return view;
    }

    if (p.kind === 'summary') {
      return {
        kind: 'summary', age: p.age, year: p.year,
        deltas: p.deltas, ovrBefore: p.ovrBefore, ovrAfter: p.ovrAfter,
        clubId: p.clubId, note: p.note, height: p.height,
        line: p.line, youthTotals: p.youthTotals
      };
    }

    if (p.kind === 'training') {
      return {
        kind: 'training', age: game.identity.age,
        /* Der Saisonplan sitzt auf demselben Bildschirm */
        plan: p.plan || 'normal',
        club: FKC.state.club(),
        season: FKC.i18n.season(game.identity.year),
        options: TRAINING.map(function (o) {
          return { id: o.id, focus: o.focus(game), second: o.second(game), intensity: o.intensity };
        }),
        result: p.result ? C.describeResult(game, p.result) : null
      };
    }

    if (p.kind === 'seasonReview') {
      return {
        kind: 'seasonReview', age: game.identity.age,
        record: p.record, deltas: p.deltas,
        national: p.national, tournament: p.tournament
      };
    }

    if (p.kind === 'clubChoice') {
      if (!p.offers) p.offers = C.buildClubOffers(game, p.topic);
      return {
        kind: 'clubChoice', topic: p.topic, age: game.identity.age,
        offers: p.offers,
        result: p.result ? C.describeResult(game, p.result) : null
      };
    }

    if (p.kind === 'transferChoice') {
      if (!p.offers) {
        p.offers = p.free
          ? FKC.transfer.freeAgentOffers(game)
          : FKC.transfer.buildOffers(game, lastRecord(game));
      }
      return {
        kind: 'transferChoice', age: game.identity.age, free: !!p.free,
        offers: p.offers,
        contract: game.status.contract,
        askingPrice: game.status.contract && game.status.contract.yearsLeft > 0
          ? FKC.transfer.askingPrice(game) : 0,
        canRetire: game.identity.age >= 35,
        /* Ab 32 darf man die Karriere bewusst herunterfahren, statt sie
           entweder oben zu halten oder ganz zu beenden. */
        canWindDown: game.identity.age >= 32 && !p.windDown,
        windDown: !!p.windDown,
        /* Wechselwunsch nur sinnvoll, solange der Vertrag noch lange läuft */
        canDemand: !!(game.status.contract && game.status.contract.yearsLeft >= 2 &&
                      !game.flags.wantsOut),
        wantsOut: !!game.flags.wantsOut,
        result: p.result ? C.describeResult(game, p.result) : null
      };
    }

    if (p.kind === 'mentorChoice') {
      if (!p.offers) p.offers = FKC.data.rollMentorOffers(game);
      return {
        kind: 'mentorChoice', age: game.identity.age, offers: p.offers,
        result: p.result ? C.describeResult(game, p.result) : null
      };
    }

    if (p.kind === 'contract') {
      var cclub = FKC.data.clubById(p.clubId);
      return {
        kind: 'contract', age: game.identity.age,
        clubId: p.clubId, clubName: p.name, short: p.short, color: p.color,
        leagueName: p.leagueName, roleKey: p.roleKey,
        offerKind: p.offerKind, fee: p.fee || 0, free: !!p.free,
        terms: p.terms, base: p.base, round: p.round || 0,
        current: game.status.contract,
        club: cclub,
        note: p.note || null,
        result: p.result ? C.describeResult(game, p.result) : null
      };
    }

    if (p.kind === 'shirtNumber') {
      var sclub = FKC.data.clubById(p.clubId);
      return {
        kind: 'shirtNumber', age: game.identity.age,
        clubId: p.clubId, club: sclub,
        renew: !!p.renew, first: !!p.first,
        current: game.identity.shirtNo || 0,
        options: FKC.kit.numberOptions(game, p.clubId),
        result: p.result ? C.describeResult(game, p.result) : null
      };
    }

    if (p.kind === 'retire') {
      if (!p.summary) p.summary = C.buildRetrospective(game);
      return { kind: 'retire', summary: p.summary };
    }

    return null;
  };

  C.describeResult = function (game, res) {
    return {
      text: (res.textKey ? FKC.t(res.textKey, res.params || {}) : (res.text || '')) +
            (res.extraKey ? ' ' + FKC.t(res.extraKey, res.params || {}) : ''),
      chips: FKC.effects.describeAll(game, res.effects || []),
      tone: res.tone || 'good'
    };
  };

  /* ══ Entscheidung treffen ═════════════════════════════════════════ */

  C.choose = function (choiceId) {
    var game = FKC.state.game;
    var p = game.pending;
    if (!p || p.result) return null;
    var res = null;

    if (p.kind === 'scene') {
      var def = C.sceneSource(game);
      res = FKC.events.resolve(game, def, choiceId);
      if (res && p.source === 'spine') game.flags['spine.' + def.id] = game.identity.age;

    } else if (p.kind === 'clubChoice') {
      res = C.chooseClub(game, choiceId);

    } else if (p.kind === 'training') {
      res = C.chooseTraining(game, choiceId);

    } else if (p.kind === 'mentorChoice') {
      res = C.chooseMentor(game, choiceId);

    } else if (p.kind === 'transferChoice') {
      res = C.chooseTransfer(game, choiceId);

    } else if (p.kind === 'contract') {
      res = C.chooseContract(game, choiceId);

    } else if (p.kind === 'shirtNumber') {
      res = C.chooseShirtNumber(game, choiceId);
    }

    if (!res) return null;
    p.result = res;
    FKC.save.write();
    return C.describeResult(game, res);
  };

  /** Quittieren — verkettete Szenen (z. B. Transfer → Vertrag) beachten */
  C.ack = function () {
    var game = FKC.state.game;
    var p = game.pending;

    /* Nach einem Gegenangebot geht dieselbe Verhandlung weiter */
    if (p && p.continueAfter) {
      p.continueAfter = false;
      p.result = null;
      FKC.save.write();
      return C.describePending(game);
    }

    game.pending = (p && p.next) ? p.next : null;
    FKC.save.write();
    return C.nextScene();
  };

  /* ── Mentor ─────────────────────────────────────────────────────── */

  C.chooseMentor = function (game, id) {
    var p = game.pending;
    var offer = null;
    (p.offers || []).forEach(function (o) { if (o.id === id) offer = o; });
    if (!offer) return null;

    var def = FKC.data.mentorById(offer.id);
    game.career.mentor = {
      id: offer.id, name: offer.name, role: offer.role,
      bond: 55, since: game.identity.year, moments: 0
    };
    game.flags.needMentorChoice = false;

    var effects = (def && def.onPick ? def.onPick.slice() : []).concat([
      { type: 'morale', delta: 8 }, { type: 'growthBonus', points: 4 }
    ]);
    FKC.effects.apply(game, effects);

    FKC.state.logTimeline({
      text: { key: 'tl.mentor', params: { name: offer.name } }, mark: 'good'
    });

    return {
      textKey: 'mentor.picked.' + offer.id,
      params: { name: offer.name, role: FKC.t(offer.role) },
      effects: effects, tone: 'good'
    };
  };

  /** Wie stark die Form von Jahr zu Jahr schwankt */
  C.formSwing = function (game) {
    var m = game.career.mentor;
    var def = m ? FKC.data.mentorById(m.id) : null;
    if (def && def.stability) {
      return Math.round(6 - 2.5 * FKC.data.mentorStrength(game));   // ~3–4
    }
    return 6;
  };

  /** Bindung zum Mentor verändern (durch Ereignisse) */
  C.mentorBond = function (game, delta) {
    var m = game.career.mentor;
    if (!m) return;
    m.bond = FKC.util.clamp(m.bond + delta, 0, 100);
    m.moments = (m.moments || 0) + 1;
  };

  /* ── Transferfenster ────────────────────────────────────────────── */

  C.chooseTransfer = function (game, key) {
    var p = game.pending;
    var T = FKC.transfer;
    var contract = game.status.contract;
    var expiring = !contract || contract.yearsLeft <= 1;

    /* Karriere beenden (ab 35 möglich) */
    if (key === 'retire') {
      C.retire(game, 'choice');
      return { textKey: 'transfer.retire_r', params: {}, effects: [], tone: 'good' };
    }

    /* Wechselwunsch hinterlegen: erhöht die Chance deutlich, kostet
       aber Ansehen beim eigenen Verein und bei den Fans. */
    if (key === 'demand') {
      game.flags.wantsOut = true;
      var fx = [
        { type: 'fanRelation', delta: -22 },
        { type: 'reputation', delta: -4 },
        { type: 'morale', delta: -6 },
        { type: 'loyalty', delta: -25 }
      ];
      FKC.effects.apply(game, fx);
      FKC.state.logTimeline({
        text: { key: 'tl.transferRequest', params: { club: (FKC.state.club() || {}).name || '' } },
        mark: 'bad'
      });
      p.continueAfter = true;      // zurück ins Transferfenster
      p.offers = null;             // Angebote mit neuer Lage neu bewerten
      return { textKey: 'transfer.demand_r',
               params: { club: (FKC.state.club() || {}).name || '' },
               effects: fx, tone: 'mixed' };
    }

    /* Vertragslos: eine Saison ohne Verein überbrücken */
    if (key === 'wait') {
      game.flags.waitingForClub = true;
      game.tick.freeHandled = true;
      game.career.freeAgentYears = (game.career.freeAgentYears || 0) + 1;
      /* Ein Jahr ohne Wettkampf kostet Substanz */
      FKC.growth.yearly(game, { quality: 35, playtime: 0.12, intensity: 'light' });
      FKC.attributes.pushHistory(game);
      C.simulateWorldYear(game);          // die Liga-Welt läuft weiter
      var fx = [{ type: 'form', delta: -14 }, { type: 'fitness', delta: -8 },
                { type: 'morale', delta: -12 }, { type: 'reputation', delta: -6 }];
      FKC.effects.apply(game, fx);
      game.status.marketValue = FKC.attributes.marketValue(game);
      return { textKey: 'transfer.wait_r', params: {}, effects: fx, tone: 'bad' };
    }

    /* Karriere ausklingen lassen: statt der üblichen Angebote treten
       bewusst kleine Vereine an — inklusive des Klubs, bei dem alles
       angefangen hat. Kein eigener Bildschirm, sondern dieselbe Liste
       mit anderem Inhalt. */
    if (key === 'winddown') {
      p.offers = T.windDownOffers(game);
      p.windDown = true;
      p.continueAfter = true;
      return { textKey: 'transfer.windDown_r', params: {}, effects: [], tone: 'plain' };
    }

    var offer = null;
    (p.offers || []).forEach(function (o) { if (o.key === key) offer = o; });
    if (!offer) return null;

    /* Der Weg nach unten braucht keine Einigung zweier Vereine — hier
       will niemand etwas verhindern. */
    if (offer.windDown) {
      if (offer.homecoming) game.flags.homecoming = true;
      game.flags.windDown = true;
      p.next = C.makeContractPending(game, offer, 'free', 0);
      p.next.free = true;
      return {
        textKey: offer.homecoming ? 'transfer.homecoming_r' : 'transfer.windDownPick_r',
        params: { club: offer.name }, effects: [], tone: 'good'
      };
    }

    /* Beim eigenen Verein bleiben */
    if (offer.stay) {
      if (!expiring) {
        return {
          textKey: 'transfer.stay.keep_r',
          params: { club: offer.name }, effects: [], tone: 'good'
        };
      }
      /* Auslaufender Vertrag → Verlängerung verhandeln */
      p.next = C.makeContractPending(game, offer, 'renew');
      return {
        textKey: 'transfer.toTable_r', params: { club: offer.name },
        effects: [], tone: 'good'
      };
    }

    /* Wechsel: erst müssen sich die Vereine einigen */
    var deal = T.clubsAgree(game, offer);
    if (!deal.ok) {
      return {
        textKey: 'transfer.noDeal_r',
        params: { club: offer.name, fee: FKC.i18n.money(deal.fee),
                  current: (FKC.state.club() || {}).name || '' },
        effects: FKC.effects.apply(game, [{ type: 'morale', delta: -6 }]),
        tone: 'bad'
      };
    }

    p.next = C.makeContractPending(game, offer, deal.free ? 'free' : 'transfer', deal.fee);
    return {
      textKey: deal.reason === 'clause' ? 'transfer.clausePaid_r'
             : deal.free ? 'transfer.freeAgreed_r' : 'transfer.agreed_r',
      params: { club: offer.name, fee: FKC.i18n.money(deal.fee) },
      effects: [], tone: 'good'
    };
  };

  C.makeContractPending = function (game, offer, offerKind, fee) {
    var terms = FKC.transfer.openingTerms(game, offer);
    return {
      kind: 'contract', offerKind: offerKind,
      clubId: offer.clubId, name: offer.name, short: offer.short, color: offer.color,
      leagueName: offer.leagueName, roleKey: offer.roleKey,
      rating: offer.rating, abroad: offer.abroad, free: offerKind === 'free',
      fee: fee || 0,
      base: { years: terms.years, salary: terms.salary },
      terms: terms, round: 0
    };
  };

  /* ── Vertragsverhandlung ────────────────────────────────────────── */

  C.chooseContract = function (game, key) {
    var p = game.pending;
    var T = FKC.transfer;

    if (key === 'accept') {
      var res = T.signContract(game, p, lastRecord(game));
      game.flags.wantsOut = false;
      game.flags.waitingForClub = false;
      /* Nach der Unterschrift wird die Rückennummer gewählt — aber nur
         bei einem Vereinswechsel. Bei einer Verlängerung behält man
         seine Nummer ohnehin; danach zu fragen war eine Frage ohne
         Entscheidung. */
      if (p.offerKind !== 'renew') {
        p.next = { kind: 'shirtNumber', clubId: p.clubId, renew: false };
      }
      return res;
    }

    if (key === 'decline') {
      /* Beim eigenen Verein abgelehnt = der Vertrag läuft aus */
      if (p.offerKind === 'renew') {
        game.flags.leavingClub = true;
        return {
          textKey: 'contract.declined.renew', params: { club: p.name },
          effects: FKC.effects.apply(game, [{ type: 'fanRelation', delta: -10 }]),
          tone: 'mixed'
        };
      }
      /* Vertragslos abgelehnt: das Jahr ist damit gelaufen */
      if (!game.status.clubId) game.tick.freeHandled = true;
      return {
        textKey: 'contract.declined.other', params: { club: p.name },
        effects: [], tone: 'mixed'
      };
    }

    /* Gegenangebot */
    var what = key === 'years' ? 'years' : 'money';
    var out = T.negotiate(game, p, what, lastRecord(game));
    p.round = (p.round || 0) + 1;
    p.terms = out.terms;

    if (out.outcome === 'withdrawn') {
      p.withdrawn = true;
      if (p.offerKind === 'renew') game.flags.leavingClub = true;
      if (!game.status.clubId) game.tick.freeHandled = true;
      return {
        textKey: 'contract.counter.withdrawn', params: { club: p.name },
        effects: FKC.effects.apply(game, [{ type: 'morale', delta: -12 }]),
        tone: 'bad'
      };
    }

    /* Nach dem Gegenangebot geht dieselbe Verhandlung weiter */
    p.continueAfter = true;
    var keyOut = 'contract.counter.' + out.outcome + '.' + what;
    return {
      textKey: keyOut,
      params: { club: p.name, salary: FKC.i18n.money(p.terms.salary), years: p.terms.years },
      effects: [], tone: out.outcome === 'refused' ? 'mixed' : 'good'
    };
  };

  /* ── Saisonvorbereitung ─────────────────────────────────────────────
     Zwei Wege in die Saison. „Alles geben" hebt Leistung und
     Titelchance spürbar, erhöht aber das Verletzungsrisiko deutlich —
     die Wirkung sitzt in season.js (rollInjury und der Team-Boost). */

  /** Umschalten auf dem Trainingsbildschirm — noch keine Auflösung */
  C.setSeasonPlan = function (game, key) {
    if (!game.pending || game.pending.kind !== 'training') return null;
    game.pending.plan = key === 'allin' ? 'allin' : 'normal';
    return game.pending.plan;
  };

  /** Wirkung des Saisonplans, angewandt zusammen mit dem Training */
  function applySeasonPlan(game, plan) {
    var alles = plan === 'allin';
    game.status.seasonPlan = alles ? 'allin' : 'normal';
    return alles
      ? [{ type: 'form', delta: 7 }, { type: 'fitness', delta: -6 },
         { type: 'hidden', key: 'workRate', delta: 3 }]
      : [{ type: 'fitness', delta: 5 }, { type: 'hidden', key: 'consistency', delta: 2 }];
  }

  /* ── Trainingswahl ──────────────────────────────────────────────── */

  C.chooseTraining = function (game, id) {
    var opt = FKC.util.byId(TRAINING, id);
    if (!opt) return null;
    game.training = {
      focus: opt.focus(game),
      secondary: opt.second(game),
      intensity: opt.intensity
    };
    game.tick.trainingDone = true;

    /* Saisonplan und Trainingsschwerpunkt werden zusammen aufgelöst —
       eine Entscheidung, zwei Wirkungen. */
    var plan = (game.pending && game.pending.plan) || 'normal';
    var fx = opt.effects.concat(applySeasonPlan(game, plan));
    FKC.effects.apply(game, fx);

    return {
      textKey: 'training.' + id + '_r',
      params: {},
      effects: fx,
      /* Der Saisonplan bekommt seinen eigenen Satz dazu */
      extraKey: plan === 'allin' ? 'plan.allin_r' : 'plan.normal_r',
      tone: plan === 'allin' ? 'mixed' : 'good'
    };
  };

  /* ══ Saison ═══════════════════════════════════════════════════════ */

  C.runSeason = function (game) {
    var before = {};
    var keys = FKC.data.keysFor(game.identity.isGK);
    keys.forEach(function (k) { before[k] = game.attributes[k]; });
    var ovrBefore = game.ovr;

    var amateur = (FKC.state.club() || {}).synthetic;
    var record = amateur ? FKC.season.amateurSeason(game) : FKC.season.run(game);
    record.ovrStart = ovrBefore;

    /* Nationalmannschaft */
    var nat = FKC.national.update(game, record);
    var tournament = null;
    var comp = FKC.national.tournamentThisYear(game);
    if (comp) tournament = FKC.national.playTournament(game, comp);

    /* Entwicklung — Spielzeit und Umfeld entscheiden */
    var totalGames = Math.max(1, record.apps + 10);
    var playtime = FKC.util.clamp(record.minutes / (totalGames * 90) * 1.4, 0.1, 1);
    var bonus = game.flags.growthBonus || 0;
    game.flags.growthBonus = 0;

    var grow = FKC.growth.yearly(game, {
      quality: FKC.growth.envQuality(game),
      playtime: playtime,
      focus: game.training.focus,
      secondary: game.training.secondary,
      intensity: game.training.intensity,
      bonusPoints: bonus
    });

    record.ovrEnd = game.ovr;
    record.marketValue = game.status.marketValue = FKC.attributes.marketValue(game);
    FKC.attributes.pushHistory(game);

    /* Titel und Turniersiege in den Zeitstrahl */
    record.trophies.forEach(function (tr) {
      FKC.state.logTimeline({ text: { key: 'tl.trophy', params: { name: tr.name } }, mark: 'good' });
    });
    if (nat && nat.debut) {
      FKC.state.logTimeline({
        text: { key: 'tl.natDebut', params: { nation: FKC.data.nationName(game.identity.nationality) } },
        mark: 'good'
      });
    }
    if (tournament && tournament.result === 'won') {
      FKC.state.logTimeline({
        text: { key: 'tl.tournamentWon', params: { name: FKC.data.compName(tournament.compId) } },
        mark: 'good'
      });
    }

    return {
      kind: 'seasonReview', record: record, deltas: grow.deltas,
      national: nat, tournament: tournament
    };
  };

  /* ══ Jahresabschluss Kindheit/Jugend ══════════════════════════════ */

  C.buildSummary = function (game) {
    var bonus = game.flags.growthBonus || 0;
    game.flags.growthBonus = 0;

    var quality = FKC.growth.envQuality(game);
    if (game.flags.atSupportCentre) quality += 6;
    if (game.flags.sportSchool) quality += 5;

    /* Auch als Kind wird eine Saison gespielt — die Bilanz daraus
       fliesst in die Entwicklung ein und wird angezeigt. */
    var line = FKC.season.youthSeason(game);
    var playtime = FKC.util.clamp(line.games ? line.apps / line.games : 0.5, 0.15, 1);

    var yt = game.career.youthTotals || (game.career.youthTotals =
      { apps: 0, goals: 0, assists: 0, cleanSheets: 0 });
    yt.apps += line.apps; yt.goals += line.goals; yt.assists += line.assists;
    yt.cleanSheets += line.cleanSheets;

    var before = game.ovr;
    var grow = FKC.growth.yearly(game, {
      quality: quality, playtime: playtime,
      focus: game.training.focus, secondary: game.training.secondary,
      intensity: game.training.intensity, bonusPoints: bonus
    });

    if (game.condition.injury) {
      game.condition.injury.weeks -= 40;
      if (game.condition.injury.weeks <= 0) game.condition.injury = null;
    }
    game.condition.fitness = FKC.util.clamp(game.condition.fitness + 12, 0, 100);
    /* Ein mentaler Mentor glättet die Ausschläge */
    var swing = C.formSwing(game);
    game.condition.form = FKC.util.clamp(
      game.condition.form + FKC.rng.int(-swing, swing + 4), 20, 95);
    game.status.marketValue = FKC.attributes.marketValue(game);
    FKC.attributes.pushHistory(game);

    /* Die Profiwelt spielt weiter, auch während der Spieler noch Kind
       ist. Dadurch gibt es von Anfang an echte Tabellen zum Nachschauen
       — und die Ligen entwickeln sich über die ganze Karriere.      */
    C.simulateWorldYear(game);

    var note = null;
    if (grow.ovrAfter - before >= 4) note = 'summary.note.leap';
    else if (grow.ovrAfter - before <= 0 && game.career.phase !== 'pro') note = 'summary.note.stall';

    return {
      kind: 'summary',
      age: game.identity.age, year: game.identity.year,
      deltas: grow.deltas, ovrBefore: before, ovrAfter: grow.ovrAfter,
      clubId: game.status.clubId, note: note, height: game.identity.height,
      line: line, youthTotals: { apps: yt.apps, goals: yt.goals, assists: yt.assists }
    };
  };

  /**
   * Eine Saison der Profiwelt ohne eigene Beteiligung — für Kindheit,
   * Jugend und vertragslose Jahre. Füllt game.tables, damit die
   * Tabellenansicht durchgehend etwas zu zeigen hat.
   */
  C.simulateWorldYear = function (game) {
    var club = FKC.state.club();
    var inLeague = club && !club.synthetic ? club : null;
    var world = FKC.world.runSeason(game, inLeague, 0);

    /* Standardansicht: die Liga des eigenen Vereins, sonst die erste
       Liga des Herkunftslandes. */
    var ownLeagueId = inLeague ? FKC.data.leagueIdOf(inLeague) : null;
    if (!ownLeagueId) {
      var home = FKC.data.leaguesOf(FKC.data.youthCountry(game.identity.nationality));
      ownLeagueId = home.length ? home[0].id : FKC.data.leagues[0].id;
    }

    var all = {};
    Object.keys(world.tables).forEach(function (lid) {
      all[lid] = FKC.season.packTight(world.tables[lid]);
    });

    var ownCountry = (FKC.data.leagueById(ownLeagueId) || {}).country;
    game.tables = {
      season: FKC.i18n.season(game.identity.year),
      leagueId: ownLeagueId,
      clubId: inLeague ? inLeague.id : null,
      league: FKC.season.packTable(world.tables[ownLeagueId] || []),
      all: all,
      cont: null, cup: null, tournament: null,
      moves: world.moves.filter(function (m) {
        var lg = FKC.data.leagueById(m.to);
        return lg && lg.country === ownCountry;
      }),
      ownMove: inLeague ? FKC.world.moveFor(world.moves, inLeague.id) : null
    };
  };

  /* ══ Jahreswechsel ════════════════════════════════════════════════ */

  C.advanceYear = function (game) {
    FKC.state.advanceCalendar(game, 1);
    game.status.seasonsAtClub += 1;
    game.status.loyalty = FKC.util.clamp(
      game.status.loyalty + 4 + FKC.data.traitBonus(game, 'loyaltyGain') * 8, 0, 100);

    if (game.status.contract && game.career.phase === 'pro') {
      game.status.contract.yearsLeft = Math.max(0, game.status.contract.yearsLeft - 1);
    }

    /* Vertrag ausgelaufen und nicht verlängert → vertragslos */
    if (game.career.phase === 'pro' && game.flags.leavingClub) {
      var old = FKC.state.club();
      game.flags.leavingClub = false;
      var stint = null;
      for (var i = game.career.clubsPlayed.length - 1; i >= 0; i--) {
        if (game.career.clubsPlayed[i].clubId === game.status.clubId) {
          stint = game.career.clubsPlayed[i]; break;
        }
      }
      if (stint && stint.to == null) stint.to = game.identity.year;
      game.status.clubId = null;
      game.status.contract = null;
      game.status.isCaptain = false;
      game.status.seasonsAtClub = 0;
      FKC.state.logTimeline({
        text: { key: 'tl.released', params: { club: old ? old.name : '' } }, mark: 'bad'
      });
    }

    if (game.flags.adaptationTrouble > 0) game.flags.adaptationTrouble -= 1;
    game.flags.wantsOut = false;

    if (game.career.phase === 'childhood' && game.identity.age >= YOUTH_AGE) {
      game.career.phase = 'youth';
      game.flags.needAcademyChoice = true;
      FKC.state.logTimeline({ text: { key: 'tl.toYouth' }, mark: 'plain' });
    } else if (game.career.phase === 'youth' && game.identity.age >= PRO_AGE) {
      game.flags.needProChoice = true;
    } else if (game.career.phase === 'pro' && C.shouldRetire(game)) {
      C.retire(game, 'age');
    }

    C.beginYear(game);
    FKC.save.write();
  };

  /* ══ Karriereende ═════════════════════════════════════════════════ */

  C.shouldRetire = function (game) {
    var age = game.identity.age;
    if (age >= RETIRE_MAX) return true;
    if (age < RETIRE_MIN) return false;

    var last = lastRecord(game);
    var p = (age - RETIRE_MIN) * 0.07;
    if (game.ovr < 55) p += 0.18;
    if (last && last.apps < 10) p += 0.22;
    if (game.condition.injury && game.condition.injury.weeks >= 24) p += 0.25;
    if (game.hidden.injuryProneness > 75) p += 0.08;
    if (game.ovr >= 78) p -= 0.12;
    return FKC.rng.chance(FKC.util.clamp(p, 0, 0.95));
  };

  C.retire = function (game, reason) {
    game.career.phase = 'retired';
    game.career.retiredAt = game.identity.age;
    game.career.retireReason = reason || 'age';
    var club = FKC.state.club();
    FKC.state.logTimeline({
      text: { key: 'tl.retired', params: { club: club ? club.name : '', age: game.identity.age } },
      mark: 'plain'
    });
    game.pending = { kind: 'retire' };
    FKC.save.write();
  };

  /* ── Karrierewertung ──────────────────────────────────────────────
     Das Verdikt soll nachvollziehbar sein. Deshalb wird der Wert aus
     fünf benannten Bereichen zusammengesetzt, die der Rückblick
     einzeln ausweist.                                               */

  var TROPHY_WEIGHT = { national: 90, cont1: 55, cont2: 25, league: 30, cup: 14 };
  var CONT_TOP = ['cont.ucl', 'cont.lib', 'cont.ccc', 'cont.acl'];
  var AWARD_WEIGHT = {
    ballon: 60, goldenBallTournament: 40, goldenBootTournament: 35,
    goldenBall: 30, goldenBoot: 25, youngPlayer: 15, teamOfSeason: 12
  };

  C.scoreCareer = function (game) {
    var t = game.career.totals;
    var n = game.national;

    /* 1 — Höchstes je erreichtes Rating, überproportional gewichtet */
    var rating = Math.pow(Math.max(0, game.peakOvr - 55), 1.35) * 3.2;

    /* 2 — Titel nach Art */
    var trophies = 0;
    game.career.trophies.forEach(function (tr) {
      if (tr.national) trophies += TROPHY_WEIGHT.national;
      else if (tr.compId.indexOf('cont.') === 0) {
        trophies += CONT_TOP.indexOf(tr.compId) >= 0 ? TROPHY_WEIGHT.cont1 : TROPHY_WEIGHT.cont2;
      } else if (tr.compId.indexOf('league.') === 0) trophies += TROPHY_WEIGHT.league;
      else trophies += TROPHY_WEIGHT.cup;
    });

    /* 3 — Nationalmannschaft: Einsätze plus Turniererfolge */
    var national = n.caps * 1.2 + n.goals * 2.5;
    (n.tournaments || []).forEach(function (x) {
      if (!x.qualified) return;
      national += x.result === 'won' ? 60 : x.result === 'final' ? 30
                : x.result === 'semi' ? 15 : 5;
    });

    /* 4 — Karrierestatistik */
    var stats = t.apps * 0.22 + t.goals * 0.7 + t.assists * 0.35
              + (t.cleanSheets || 0) * 0.5;

    /* 5 — Individuelle Auszeichnungen */
    var awards = 0;
    game.career.awards.forEach(function (a) {
      awards += AWARD_WEIGHT[a.id] != null ? AWARD_WEIGHT[a.id] : 12;
    });
    if (game.flags.legendAt) awards += 30;

    var parts = {
      rating: Math.round(rating), trophies: Math.round(trophies),
      national: Math.round(national), stats: Math.round(stats),
      awards: Math.round(awards)
    };
    return {
      parts: parts,
      total: parts.rating + parts.trophies + parts.national + parts.stats + parts.awards
    };
  };

  /* ── Stimmen zur Karriere ─────────────────────────────────────────
     Kennzahlen, auf die die Bedingungen in data/voices.js zugreifen. */

  C.voiceContext = function (game) {
    var t = game.career.totals;
    var pos = FKC.data.positionById(game.identity.position) || {};
    var natTitles = game.career.trophies.filter(function (tr) { return tr.national; }).length;
    var proClubs = game.career.clubsPlayed.filter(function (st) { return st.apps > 0; }).length;
    var injurySeasons = game.career.seasons.filter(function (s) { return !!s.injury; }).length;

    return {
      peakOvr: game.peakOvr,
      shortfall: game.hidden.potential - game.peakOvr,
      trophies: game.career.trophies.length,
      natTitles: natTitles,
      caps: game.national.caps,
      apps: t.apps, goals: t.goals, assists: t.assists,
      clubs: Math.max(1, proClubs),
      fanRelation: game.status.fanRelation,
      legend: !!game.flags.legendAt,
      chasedMoney: !!game.flags.chasedMoney,
      movedAbroad: !!game.flags.movedAbroad,
      wasCaptain: !!game.status.isCaptain || !!game.flags.captain,
      retiredAt: game.career.retiredAt || game.identity.age,
      injurySeasons: injurySeasons,
      freeAgentYears: game.career.freeAgentYears || 0,
      isGK: game.identity.isGK,
      group: pos.group || 'MID',
      workRate: game.hidden.workRate,
      flair: game.hidden.flair,
      bigGame: game.hidden.bigGame,
      reputation: game.status.reputation
    };
  };

  C.buildVoices = function (game) {
    var ctx = C.voiceContext(game);
    var rng = FKC.rng;
    var data = FKC.data.voices;

    function eligible(list) {
      return list.filter(function (v) {
        try { return v.when(ctx); } catch (e) { return false; }
      });
    }

    /* Eine Fan-Stimme */
    var fanPool = eligible(data.fans);
    var fan = rng.weighted(fanPool, function (v) { return v.weight; }) || data.fans[data.fans.length - 1];

    /* Je eine Stimme aus den drei Lagern, damit die Perspektiven variieren */
    var pool = eligible(data.pundits);
    var quotes = [];
    ['pundit', 'teammate', 'coach'].forEach(function (kind) {
      var sub = pool.filter(function (v) { return v.kind === kind; });
      var pick = rng.weighted(sub, function (v) { return v.weight; });
      if (pick) quotes.push(pick);
    });
    while (quotes.length < 2 && pool.length) {
      var extra = rng.weighted(pool, function (v) {
        return quotes.indexOf(v) >= 0 ? 0 : v.weight;
      });
      if (!extra) break;
      quotes.push(extra);
    }

    var homeNation = game.identity.nationality;
    return {
      fans: { id: fan.id, tone: fan.tone },
      quotes: quotes.map(function (v) {
        var nat = v.kind === 'pundit'
          ? FKC.rng.pick(FKC.data.leagueNations()).id : homeNation;
        var n = FKC.data.randomName(nat);
        return {
          id: v.id, kind: v.kind,
          speaker: n.first + ' ' + n.last,
          role: rng.pick(FKC.data.voiceRoles[v.kind] || ['role.journalist'])
        };
      }),
      ctx: ctx
    };
  };

  /**
   * Karrierenote 0–100. Die Punktzahl allein sagt niemandem etwas —
   * sie reicht von 0 bis über 3000 und ist nach oben offen. Die Note
   * bildet sie auf eine Skala ab, an der man ablesen kann, wo eine
   * Karriere in der Bandbreite aller Karrieren steht.
   *
   * Die Stützpunkte entsprechen den Verdikt-Schwellen: 25 Punkte ist
   * die Grenze schwach/mittel, 75 die Grenze mittel/stark.
   */
  C.careerRating = function (score, peakOvr) {
    var stuetzen = [[0, 0], [95, 12], [165, 25], [340, 42], [500, 58],
                    [720, 75], [1040, 86], [1400, 93], [2600, 99]];
    var note = 100;
    for (var i = 1; i < stuetzen.length; i++) {
      if (score <= stuetzen[i][0]) {
        var a = stuetzen[i - 1], b = stuetzen[i];
        note = a[1] + (score - a[0]) / (b[0] - a[0]) * (b[1] - a[1]);
        break;
      }
    }
    /* Ohne entsprechendes Höchstrating ist die Spitze nicht erreichbar —
       dieselbe Regel, die auch die Verdikte deckelt. */
    if (peakOvr != null) {
      if (peakOvr < 70) note = Math.min(note, 62);
      else if (peakOvr < 76) note = Math.min(note, 74);
      else if (peakOvr < 81) note = Math.min(note, 85);
      else if (peakOvr < 86) note = Math.min(note, 92);
    }
    return FKC.util.clamp(Math.round(note), 0, 100);
  };

  C.buildRetrospective = function (game) {
    var t = game.career.totals;
    var trophies = game.career.trophies;

    var byComp = {};
    trophies.forEach(function (tr) {
      var key = tr.compId;
      if (!byComp[key]) byComp[key] = { name: tr.name, count: 0, national: !!tr.national };
      byComp[key].count++;
    });

    var scored = C.scoreCareer(game);
    var score = scored.total;
    var verdict = FKC.data.verdictFor(score, game.peakOvr);

    /* Wer sein Potenzial klar verfehlt hat, bekommt das auch gesagt —
       unabhängig davon, wie ordentlich die Zahlen aussehen. Die Hürde
       liegt bewusst hoch: mit `>= 12 && < 500` fiel jede zweite solide
       Mittelfeldkarriere in diese Schublade und die Verteilung kippte
       nach unten. Gemeint sind die wirklich verlorenen Talente.     */
    var shortfall = game.hidden.potential - game.peakOvr;
    if (shortfall >= 15 && score < 300) verdict = { id: 'unfulfilled' };

    return {
      score: score, rated: C.careerRating(score, game.peakOvr),
      parts: scored.parts, verdictId: verdict.id,
      shortfall: shortfall, voices: C.buildVoices(game),
      peakOvr: game.peakOvr, retiredAt: game.career.retiredAt || game.identity.age,
      seasons: game.career.seasons.length,
      totals: t,
      clubs: game.career.clubsPlayed.slice(),
      trophies: Object.keys(byComp).map(function (k) { return byComp[k]; })
                 .sort(function (a, b) { return b.count - a.count; }),
      awards: game.career.awards.slice(),
      national: {
        caps: game.national.caps, goals: game.national.goals,
        tournaments: game.national.tournaments.slice(),
        status: game.national.status
      },
      finances: game.career.finances.balance
    };
  };

  /* ══ Vereinsangebote (Akademie / erster Profivertrag) ═════════════ */

  C.buildClubOffers = function (game, topic) {
    var r = FKC.rng;
    /* Der erste Jugendverein kommt immer aus dem Herkunftsland */
    var country = FKC.data.youthCountry(game.identity.nationality);

    if (topic === 'pro') return FKC.transfer.firstProOffers(game);

    var offers = [];
    var grade = game.flags.trialGrade || 'solid';
    var talent = game.ovr + (grade === 'strong' ? 12 : grade === 'weak' ? -8 : 0)
                 + Math.round(game.status.reputation / 4);
    var home = FKC.state.club();
    var homeReal = !!(home && !home.synthetic);

    var clubs = FKC.data.youth.academyOffers(country, talent).filter(function (c) {
      return !homeReal || c.id !== home.id;      // der eigene Verein steht schon als „bleiben"
    });

    clubs.forEach(function (c, i) {
      var lg = FKC.data.leagueOf(c);
      offers.push({
        key: 'a' + i, clubId: c.id, clubType: 'academy',
        name: c.name, leagueName: lg ? lg.name : '',
        color: c.color, short: c.short,
        level: FKC.data.clubLevel(c),
        facilities: c.facilities, youthTrust: c.youthTrust, prestige: c.prestige,
        tagKeys: buildTags(c, game),
        far: i === 0 && r.chance(0.6)
      });
    });

    /* „Bleiben" — wer schon in einem echten NLZ steckt, bleibt dort auch
       mit dessen Zahlen. Sonst wäre die Wahl beim Start bedeutungslos,
       weil mit zwölf ohnehin alle im selben Nachwuchsbetrieb landen.  */
    if (homeReal) {
      var hlg = FKC.data.leagueOf(home);
      offers.push({
        key: 'home', clubId: home.id, clubType: 'academy',
        name: home.name, leagueName: hlg ? hlg.name : '',
        color: home.color, short: home.short,
        level: FKC.data.clubLevel(home),
        facilities: home.facilities, youthTrust: home.youthTrust, prestige: home.prestige,
        tagKeys: ['tag.home'].concat(buildTags(home, game)).slice(0, 3),
        home: true, stayReal: true
      });
    } else {
      offers.push({
        key: 'home', clubId: home ? home.id : null, clubType: 'village',
        name: home ? home.name : game.origin.villageClubName,
        leagueName: null, color: home ? home.color : '#3f6f5a',
        short: home ? home.short : '',
        level: 40, facilities: home ? home.facilities : 40,
        youthTrust: 95, prestige: 30,
        tagKeys: ['tag.home', 'tag.noPressure'], home: true
      });
    }
    return offers;

    function buildTags(c, g) {
      var tags = [];
      if (c.facilities >= 82) tags.push('tag.topFacilities');
      if (c.youthTrust >= 82) tags.push('tag.youthPath');
      else if (c.youthTrust <= 60) tags.push('tag.hardPath');
      if (c.prestige >= 80) tags.push('tag.bigName');
      if (FKC.data.clubLevel(c) > g.ovr + 30) tags.push('tag.longShot');
      return tags.slice(0, 3);
    }
  };

  C.chooseClub = function (game, key) {
    var p = game.pending;
    var offer = null;
    (p.offers || []).forEach(function (o) { if (o.key === key) offer = o; });
    if (!offer) return null;

    var effects = [], textKey;

    if (p.topic === 'academy') {
      game.flags.needAcademyChoice = false;
      if (offer.home && offer.stayReal) {
        /* Im eigenen NLZ bleiben: keine Eingewöhnung, volle Ausbildung */
        var hclub = FKC.data.clubById(offer.clubId);
        textKey = 'clubChoice.academy.stay_r';
        effects = [
          { type: 'loyalty', delta: 18 }, { type: 'morale', delta: 10 },
          { type: 'growthBonus', points: Math.round((hclub.facilities - 55) / 6) + 4 }
        ];
      } else if (offer.home) {
        textKey = 'clubChoice.academy.home_r';
        effects = [
          { type: 'loyalty', delta: 20 }, { type: 'morale', delta: 8 },
          { type: 'growthBonus', points: -6 }, { type: 'education', delta: 8 }
        ];
      } else {
        var club = FKC.data.clubById(offer.clubId);
        textKey = 'clubChoice.academy.join_r';
        effects = [
          { type: 'club', club: club, clubType: 'academy' },
          { type: 'growthBonus', points: Math.round((club.facilities - 55) / 6) + 4 },
          { type: 'reputation', delta: 5 }, { type: 'morale', delta: 8 }
        ];
        if (offer.far) {
          game.flags.movedAway = true;
        }
        FKC.state.logTimeline({
          text: { key: 'tl.academy', params: { club: club.name } }, mark: 'good'
        });
      }
      /* Im neuen Umfeld wartet jemand, der sich kümmert */
      if (!game.career.mentor) game.flags.needMentorChoice = true;
      FKC.effects.apply(game, effects);
      return { textKey: textKey, params: { club: offer.name }, effects: effects, tone: 'good' };
    }

    /* Erster Profivertrag */
    game.flags.needProChoice = false;
    game.career.phase = 'pro';
    var pclub = FKC.data.clubById(offer.clubId);
    textKey = offer.stay ? 'clubChoice.pro.stay_r'
            : (offer.abroad ? 'clubChoice.pro.abroad_r' : 'clubChoice.pro.join_r');

    effects = [
      { type: 'club', club: pclub, clubType: 'pro' },
      { type: 'morale', delta: 12 }, { type: 'reputation', delta: 6 }
    ];
    if (offer.kind === 'money') effects.push({ type: 'form', delta: -6 });
    if (offer.kind === 'step') effects.push({ type: 'growthBonus', points: 6 });
    if (offer.abroad) {
      game.flags.movedAbroad = true;
    }

    game.status.contract = {
      salary: offer.salary || 40000,
      yearsLeft: FKC.rng.int(3, 5),
      signedYear: game.identity.year,
      releaseClause: FKC.transfer.rollReleaseClause(game, pclub, offer.salary || 40000),
      squadRole: (offer.roleKey || 'role.talent').replace('role.', '')
    };
    FKC.effects.apply(game, effects);
    FKC.attributes.recalc(game);
    game.status.marketValue = FKC.attributes.marketValue(game);
    FKC.state.logTimeline({
      text: { key: 'tl.turnedPro', params: { club: pclub.name } }, mark: 'good'
    });

    /* Auch die erste Profinummer wird selbst gewählt */
    p.next = { kind: 'shirtNumber', clubId: pclub.id, first: true };

    return {
      textKey: textKey,
      params: { club: offer.name, salary: FKC.i18n.money(offer.salary || 0),
                league: offer.leagueName },
      effects: effects, tone: 'good'
    };
  };

  /* ── Rückennummer ───────────────────────────────────────────────── */

  C.chooseShirtNumber = function (game, key) {
    var p = game.pending;
    var n = parseInt(key, 10);
    var opts = FKC.kit.numberOptions(game, p.clubId);
    var pick = null;
    opts.forEach(function (o) { if (o.n === n && o.free) pick = o; });
    if (!pick) return null;

    var before = game.identity.shirtNo || 0;
    game.identity.shirtNo = pick.n;

    var club = FKC.data.clubById(p.clubId);
    FKC.state.logTimeline({
      text: { key: 'tl.shirtNo', params: { n: pick.n, club: club ? club.name : '' } },
      mark: 'plain'
    });

    /* Wer sich die klassische Nummer seiner Position sichert, tritt mit
       einem Anspruch an — das sehen Fans und Umfeld. */
    var fx = [];
    if (pick.typical) fx.push({ type: 'morale', delta: 4 });
    if (pick.n === before) fx.push({ type: 'loyalty', delta: 4 });
    if (fx.length) FKC.effects.apply(game, fx);

    return {
      textKey: pick.n === before ? 'shirt.kept_r'
             : pick.typical ? 'shirt.classic_r' : 'shirt.picked_r',
      params: { n: pick.n, club: club ? club.name : '' },
      effects: fx, tone: 'good'
    };
  };

  C.YOUTH_AGE = YOUTH_AGE;
  C.PRO_AGE = PRO_AGE;

  FKC.career = C;

})(window.FKC);
