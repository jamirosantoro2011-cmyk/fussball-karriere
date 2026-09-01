/* ── Saisonsimulation ──────────────────────────────────────────────────
   Eine Saison = Team-Abschneiden (Liga, Pokal, international) plus die
   persönliche Bilanz des Spielers, die sich daraus ableitet.        */

window.FKC = window.FKC || {};

(function (FKC) {
  'use strict';

  var S = {};
  var clamp = function (v, a, b) { return FKC.util.clamp(v, a, b); };

  /* Tore und Vorlagen pro 90 Minuten je Position [Tore, Vorlagen] */
  var RATE = {
    ST:  [0.55, 0.16], LW: [0.32, 0.26], RW: [0.32, 0.26], CAM: [0.30, 0.33],
    CM:  [0.15, 0.24], CDM: [0.06, 0.13], CB: [0.055, 0.045],
    LB:  [0.04, 0.14], RB: [0.04, 0.14], GK: [0.002, 0.012]
  };

  /** Zufallswert um einen Erwartungswert herum, nie negativ */
  function spread(mean) {
    if (mean <= 0) return 0;
    return Math.max(0, Math.round(FKC.rng.gauss(mean, Math.sqrt(mean + 1) * 0.95)));
  }

  /* ── Einsatzanteil ──────────────────────────────────────────────── */

  S.minutesShare = function (game, club) {
    var level = FKC.data.clubLevel(club);
    var standing = game.ovr - level;
    var role = game.status.contract ? game.status.contract.squadRole : 'rotation';
    var roleBonus = role === 'star' ? 0.14 : role === 'starter' ? 0.08
                  : role === 'talent' ? -0.10 : 0;

    /* Auch wer unter dem Vereinsniveau liegt, kommt zu Einsätzen —
       sonst sitzt ein schwächerer Spieler jahrelang nur da.        */
    var share = 0.55 + standing * 0.030 + roleBonus;
    share += (game.condition.form - 60) / 420;
    share += (game.condition.morale - 60) / 800;

    var age = game.identity.age;
    if (age <= 19) share -= 0.14;
    else if (age <= 21) share -= 0.06;
    else if (age >= 34) share -= 0.10;
    else if (age >= 32) share -= 0.05;

    if (game.status.isCaptain) share += 0.08;
    share += FKC.data.traitBonus(game, 'consistency') / 400;

    return clamp(share, 0.02, 0.97);
  };

  /* ── Tabelle ────────────────────────────────────────────────────── */

  S.simulateTable = function (league, playerClub, boost) {
    var clubs = FKC.data.clubsOf(league.id);
    var rows = clubs.map(function (c) {
      var r = c.strength + FKC.rng.gauss(0, 4.3);
      if (playerClub && c.id === playerClub.id) r += boost || 0;
      return { club: c, rating: r };
    });
    rows.sort(function (a, b) { return b.rating - a.rating; });

    var avg = FKC.util.sum(rows.map(function (r) { return r.rating; })) / rows.length;
    var games = (clubs.length - 1) * 2;
    var rng = FKC.rng;

    rows.forEach(function (r) {
      var pts = clamp(Math.round(games * 1.42 + (r.rating - avg) * 1.9 + rng.gauss(0, 2.5)),
                      Math.round(games * 0.25), Math.round(games * 2.6));
      /* Siege/Unentschieden/Niederlagen aus den Punkten ableiten.
         Die Punktzahl wird danach neu berechnet, statt sie zu erzwingen —
         sonst kommen ungeschlagene Saisons am Fliessband heraus.    */
      var d = clamp(Math.round(games * 0.22 + rng.gauss(0, 2)), 0, games);
      var w = clamp(Math.round((pts - d) / 3), 0, games - d);
      var l = games - w - d;

      var gd = Math.round((r.rating - avg) * 1.7 + rng.gauss(0, 3.5));
      var gf = clamp(Math.round(games * 1.28 + gd * 0.6 + rng.gauss(0, 4)), 8, 160);

      r.played = games; r.w = w; r.d = d; r.l = l;
      r.points = w * 3 + d;
      r.gf = gf;
      r.ga = clamp(gf - gd, 4, 170);
    });

    /* Nach Punkten, dann Tordifferenz sortieren — wie eine echte Tabelle */
    rows.sort(function (a, b) {
      if (b.points !== a.points) return b.points - a.points;
      return (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf;
    });
    rows.forEach(function (r, i) { r.position = i + 1; });
    return rows;
  };

  /** Kompakte, speicherbare Form der Tabelle */
  S.packTable = function (rows) {
    return rows.map(function (r) {
      return { c: r.club.id, pos: r.position, p: r.played, w: r.w, d: r.d, l: r.l,
               gf: r.gf, ga: r.ga, pts: r.points };
    });
  };

  /* Noch kompakter, weil alle 32 Ligen gespeichert werden:
     [vereinId, platz, spiele, s, u, n, tore, gegentore, punkte]     */
  S.packTight = function (rows) {
    return rows.map(function (r) {
      return [r.club.id, r.position, r.played, r.w, r.d, r.l, r.gf, r.ga, r.points];
    });
  };

  S.unpackTight = function (row) {
    return { c: row[0], pos: row[1], p: row[2], w: row[3], d: row[4],
             l: row[5], gf: row[6], ga: row[7], pts: row[8] };
  };

  /* ── Weg durch einen K.-o.-Wettbewerb ───────────────────────────── */

  var KO_ORDER = ['r16', 'quarter', 'semi', 'final'];

  /**
   * Baut den Turnierweg mit Gegnern und Ergebnissen nach.
   * result ist das Ergebnis aus runKnockout().
   */
  S.buildRun = function (club, pool, result, order) {
    var rng = FKC.rng;
    var ko = order || KO_ORDER;
    var reached = (['early'].concat(ko, ['won'])).indexOf(result);
    var rounds = [];
    if (reached <= 0) return rounds;

    var used = [club.id];
    for (var i = 0; i < ko.length; i++) {
      var stage = ko[i];
      var stageIndex = i + 1;                    // erste Runde = 1
      var letzte = ko.length;
      if (stageIndex > reached && !(result === 'won' && stageIndex <= letzte)) break;
      if (stageIndex > Math.min(reached, letzte)) break;

      /* Im nationalen Pokal ist der Gegner der ersten Runde ein
         Unterklassiger — deshalb bewusst *unter* der eigenen Stärke
         gesucht statt in einem Fenster darum herum. */
      var cand;
      if (stage === 'r64') {
        cand = pool.filter(function (c) {
          return used.indexOf(c.id) < 0 && c.strength < club.strength - 4;
        });
      } else {
        cand = pool.filter(function (c) {
          return used.indexOf(c.id) < 0 && Math.abs(c.strength - club.strength) <= 12 + i * 3;
        });
      }
      if (!cand.length) cand = pool.filter(function (c) { return used.indexOf(c.id) < 0; });
      if (!cand.length) break;
      var opp = rng.pick(cand);
      used.push(opp.id);

      /* Gewonnen, wenn der Spielerverein mindestens die nächste Runde
         erreicht hat. K.-o.-Spiele brauchen immer einen Sieger.    */
      var won = (result === 'won') || (stageIndex < reached);
      var a, b;
      if (won) { a = rng.int(1, 4); b = rng.int(0, a - 1); }
      else { a = rng.int(0, 2); b = rng.int(a + 1, a + 2); }
      rounds.push({ round: stage, opp: opp.id, a: a, b: b, won: won });
      if (!won) break;
    }
    return rounds;
  };

  /* ── K.-o.-Wettbewerb ───────────────────────────────────────────── */
  /* Liefert 'won' | 'final' | 'semi' | 'quarter' | 'r16' | 'early'   */

  /** Stufen des nationalen Pokals — eine Runde mehr als im Europapokal,
      weil dort auch die unteren Ligen mitspielen. */
  S.CUP_STAGES = ['early', 'r64', 'r16', 'quarter', 'semi', 'final', 'won'];
  S.CUP_ORDER = ['r64', 'r16', 'quarter', 'semi', 'final'];

  S.runKnockout = function (strengthPct, rounds, stageList) {
    var stages = stageList || ['early', 'r16', 'quarter', 'semi', 'final', 'won'];
    var start = Math.max(0, stages.length - 1 - (rounds || 5));
    var at = start;
    for (var i = start; i < stages.length - 1; i++) {
      /* Die Schwierigkeit hängt daran, wie nah das Finale ist — nicht am
         Listenindex. Sonst würde der nationale Pokal allein dadurch
         schwerer, dass er eine Runde mehr hat. */
      var bisFinale = stages.length - 2 - i;          // 0 = Finale
      var p = clamp(0.28 + strengthPct * 0.52 - (4 - bisFinale) * 0.045, 0.06, 0.88);
      /* Erste Pokalrunde: Gegner kommt meist aus einer tieferen Liga.
         Genau deshalb überstehen Favoriten sie fast immer — und genau
         deshalb ist ein Ausscheiden dort eine Schlagzeile. */
      if (i === start && stages.length > 6) p = clamp(p + 0.34, 0.1, 0.95);
      if (FKC.rng.chance(p)) at = i + 1; else break;
    }
    return stages[at];
  };

  /** Anteil der Vereine, die schwächer sind (0..1) */
  S.strengthPercentile = function (club, pool) {
    var list = pool || FKC.data.clubs;
    var weaker = 0;
    for (var i = 0; i < list.length; i++) if (list[i].strength < club.strength) weaker++;
    return weaker / Math.max(1, list.length);
  };

  /* ── Eine komplette Saison ──────────────────────────────────────── */

  S.run = function (game) {
    var club = FKC.state.club();
    var league = FKC.data.leagueOf(club);
    var rng = FKC.rng;
    var season = FKC.i18n.season(game.identity.year);

    /* 1 — Verletzungen während der Saison */
    var injury = S.rollInjury(game);

    /* 2 — Einsatzzeit */
    var share = S.minutesShare(game, club);
    var leagueSize = Math.max(6, FKC.data.clubsOf(league.id).length);
    var leagueGames = (leagueSize - 1) * 2;

    /* „Alles geben": bessere Chance in den K.-o.-Wettbewerben und ein
       stärkerer Beitrag zur Ligaplatzierung — das ist der Gegenwert
       für das erhöhte Verletzungsrisiko. */
    var allin = game.status.seasonPlan === 'allin';
    var kickerBoost = allin ? 0.10 : 0;

    /* Nationaler Pokal: reines K.-o.-System über sechs Runden, und im
       Teilnehmerfeld stehen **alle** Vereine des Landes, auch die aus
       der zweiten Liga. Ein Erstligist trifft in der ersten Runde
       deshalb fast immer auf einen deutlich schwächeren Gegner — das
       Perzentil gegen das ganze Land bildet genau das ab und liegt
       höher als das gegen die eigene Liga. Zusätzlich ein kleiner
       Zufallsanteil: der Pokal hat seine eigenen Gesetze, ein
       Zweitligist wirft auch mal einen Favoriten raus. */
    var cupField = FKC.data.clubsOfCountry(league.country);
    var cupPct = clamp(S.strengthPercentile(club, cupField) + kickerBoost
                       + rng.float(-0.12, 0.06), 0, 1);
    var cupResult = S.runKnockout(cupPct, 6, S.CUP_STAGES);
    var cupGames = S.CUP_STAGES.indexOf(cupResult) + 1;

    var contComp = game.status.contComp ? FKC.data.compById(game.status.contComp) : null;
    var contResult = null, contGames = 0, contDetail = null;
    if (contComp) {
      var contPool = FKC.data.clubs.filter(function (c) {
        var lg = FKC.data.leagueOf(c);
        return lg && lg.conf === contComp.conf && lg.tier === 1;
      });
      var contPct = clamp(S.strengthPercentile(club, contPool) + kickerBoost, 0, 1);
      /* Je tiefer der Wettbewerb, desto schwächer das Feld */
      if (contComp.tier === 2) contPct = clamp(contPct + 0.18, 0, 1);
      else if (contComp.tier === 3) contPct = clamp(contPct + 0.32, 0, 1);
      contResult = S.runKnockout(contPct, 5);
      contGames = 6 + ['early', 'r16', 'quarter', 'semi', 'final', 'won'].indexOf(contResult);

      /* Ligaphase + K.-o.-Weg für die Tabellenansicht */
      var teams = contComp.tier === 1 ? 36 : 36;
      var lpPos = clamp(Math.round((1 - contPct) * teams + FKC.rng.gauss(0, 4)), 1, teams);
      contDetail = {
        compId: contComp.id, teams: teams,
        leaguePhase: { pos: lpPos, played: 8,
                       pts: clamp(Math.round(24 - lpPos * 0.5 + FKC.rng.gauss(0, 2)), 1, 24) },
        rounds: S.buildRun(club, contPool, contResult),
        result: contResult
      };
    }

    var totalGames = leagueGames + cupGames + contGames;
    var missed = Math.round(clamp(injury.weeks, 0, 44) / 44 * totalGames);
    var available = Math.max(0, totalGames - missed);

    var apps = Math.round(available * clamp(share * 1.12, 0, 1));
    var starts = Math.round(apps * clamp(share * 1.05, 0, 1));
    var minutes = starts * 84 + (apps - starts) * 24;

    /* 3 — Team-Abschneiden: die ganze Fussballwelt spielt mit,
           danach steigen Vereine auf und ab. */
    var boost = clamp((game.ovr - FKC.data.clubLevel(club)) * share * 0.4, -2, 4.5)
              + (allin ? 1.6 : 0);
    var world = FKC.world.runSeason(game, club, boost);
    var table = world.tables[league.id] || [];
    var own = null;
    table.forEach(function (r) { if (r.club.id === club.id) own = r; });
    var position = own ? own.position : Math.ceil(leagueSize / 2);

    var ownMove = FKC.world.moveFor(world.moves, club.id);

    /* Tabellen sichern — alle Ligen, damit man überall nachschauen kann */
    var allTables = {};
    Object.keys(world.tables).forEach(function (lid) {
      allTables[lid] = S.packTight(world.tables[lid]);
    });

    game.tables = {
      season: season, leagueId: league.id, clubId: club.id,
      league: S.packTable(table),
      all: allTables,
      cont: contDetail,
      cup: { compId: league.domesticCup, result: cupResult,
             rounds: S.buildRun(club, cupField, cupResult, S.CUP_ORDER) },
      tournament: null,
      moves: world.moves.filter(function (m) {
        var lg = FKC.data.leagueById(m.to);
        return lg && lg.country === league.country;
      }),
      ownMove: ownMove
    };

    /* 4 — Persönliche Bilanz */
    var pos = game.identity.position;
    var rate = RATE[pos] || RATE.CM;
    var per90 = minutes / 90;

    var shootQ = game.identity.isGK ? 0.2 : (game.attributes.shooting || 40) / 68;
    var passQ = game.identity.isGK
      ? (game.attributes.distribution || 40) / 68
      : (game.attributes.passing || 40) / 68;
    var teamAtt = clamp(club.strength / 78, 0.6, 1.35);
    var formF = 0.75 + game.condition.form / 200;

    var goals = spread(rate[0] * per90 * Math.pow(shootQ, 1.35) * teamAtt * formF);
    var assists = spread(rate[1] * per90 * passQ * teamAtt * formF *
                         (1 + FKC.data.traitBonus(game, 'assists')));

    var cleanSheets = game.identity.isGK
      ? spread(starts * clamp(0.16 + (club.strength - 60) / 130, 0.05, 0.55)) : 0;

    /* Torbeteiligung pro 90 — bei sehr wenigen Minuten würde die
       Division sonst absurde Noten erzeugen (2 Tore in 24 Minuten).  */
    var per90safe = Math.max(3, per90);
    var contribution = Math.min(2.2, (goals * 0.9 + assists * 0.55) / per90safe * 1.35);

    /* Positionsgrundwert: Verteidiger und Torhüter sammeln keine
       Torbeteiligungen und bräuchten sonst nie auf eine gute Note. */
    var posBase = { GK: 0.55, CB: 0.50, LB: 0.32, RB: 0.32, CDM: 0.34,
                    CM: 0.18, CAM: 0.06, LW: 0.02, RW: 0.02, ST: 0 }[pos] || 0.1;
    if (pos === 'GK' || pos === 'CB' || pos === 'LB' || pos === 'RB' || pos === 'CDM') {
      posBase += clamp((club.strength - 70) / 55, -0.25, 0.35);
    }

    var ratingBase = 6.35 + posBase
      + (game.ovr - FKC.data.clubLevel(club)) * 0.022
      + (minutes > 0 ? contribution : 0)
      + (game.identity.isGK && starts > 0 ? Math.min(0.9, cleanSheets / starts * 0.9) : 0)
      + (game.hidden.consistency - 55) / 320
      + (allin ? 0.16 : 0);          // wer alles gibt, spielt auch besser
    var avgRating = apps > 0
      ? clamp(FKC.util.round(rng.gauss(ratingBase, 0.22), 2), 4.8, 9.6) : 0;

    var yellows = spread(apps * (0.14 + (100 - game.hidden.discipline) / 420 +
                                 FKC.data.traitBonus(game, 'cards') * 0.06));
    var reds = rng.chance(clamp(apps * 0.004 + (100 - game.hidden.discipline) / 1600, 0, 0.35)) ? 1 : 0;
    var motm = Math.max(0, Math.round(apps * (avgRating - 6.5) * 0.28));

    /* 5 — Titel.
       Anzeige und Eintrag laufen über dieselbe Stelle, damit nie wieder
       ein "Sieg" gemeldet wird, der im Schrank fehlt. Gewertet wird ab
       einem Pflichtspiel in der Saison; ohne Einsatz erscheint der Titel
       im Rückblick, wird aber als nicht gewertet ausgewiesen.        */
    var titles = [];
    if (position === 1) {
      titles.push(S.recordTrophy(game, {
        compId: 'league.' + league.id, name: league.name,
        clubId: club.id, season: season
      }, apps));
    }
    if (cupResult === 'won') {
      titles.push(S.recordTrophy(game, {
        compId: league.domesticCup, name: FKC.data.compName(league.domesticCup),
        clubId: club.id, season: season
      }, apps));
    }
    if (contResult === 'won' && contComp) {
      titles.push(S.recordTrophy(game, {
        compId: contComp.id, name: contComp.name,
        clubId: club.id, season: season
      }, apps));
    }
    var trophies = titles.filter(function (x) { return x.counted; });

    /* 6 — Auszeichnungen */
    /* Elfmetertore werden nicht eigens simuliert — für das Gleichstands-
       kriterium des Goldenen Schuhs reicht der übliche Anteil von rund
       einem Achtel der Tore. */
    var penaltyGoals = Math.round(goals * 0.12);
    /* Das letzte gespielte Turnier gehört zur eben beendeten Saison —
       das Turnier dieses Jahres läuft erst danach. */
    var letztesTurnier = (game.national.tournaments || [])
      [game.national.tournaments.length - 1] || null;

    var awards = S.rollAwards(game, league, { goals: goals, assists: assists,
      avgRating: avgRating, position: position, apps: apps, season: season,
      trophies: trophies, minutes: minutes, yellows: yellows, reds: reds,
      penaltyGoals: penaltyGoals, injury: injury,
      leagueShare: totalGames > 0 ? leagueGames / totalGames : 0.72,
      tournament: letztesTurnier });

    /* 7 — Auswirkungen auf den Spieler */
    var perf = apps > 0 ? (avgRating - 6.6) : -0.9;
    /* Ein mentaler Mentor dämpft die Ausschläge und hebt den Boden */
    var mDef = game.career.mentor ? FKC.data.mentorById(game.career.mentor.id) : null;
    var steady = mDef && mDef.stability ? FKC.data.mentorStrength(game) : 0;
    game.condition.form = clamp(
      Math.round(60 + perf * (22 - steady * 5) + rng.gauss(0, 6 - steady * 2.5)),
      Math.round(15 + steady * 12), 96);
    game.condition.morale = clamp(Math.round(game.condition.morale + perf * 14 +
      (position <= 3 ? 6 : position >= league.clubCount - 3 ? -8 : 0)), 5, 99);
    game.status.fanRelation = clamp(Math.round(game.status.fanRelation + perf * 9 +
      (trophies.length ? 8 : 0) + (apps > totalGames * 0.6 ? 3 : -2)), 0, 100);

    var repGain = (avgRating > 0 ? (avgRating - 6.5) * 5 : -2)
      + trophies.length * 4
      + (league.prestige - 60) / 22
      + awards.length * 6;
    game.status.reputation = clamp(Math.round(game.status.reputation + repGain), 0, 100);

    /* 8 — Gesamtstatistik */
    var t = game.career.totals;
    t.apps += apps; t.goals += goals; t.assists += assists;
    t.minutes += minutes; t.yellows += yellows; t.reds += reds; t.motm += motm;
    if (game.identity.isGK) t.cleanSheets = (t.cleanSheets || 0) + cleanSheets;

    var stint = null;
    for (var i = game.career.clubsPlayed.length - 1; i >= 0; i--) {
      if (game.career.clubsPlayed[i].clubId === club.id) { stint = game.career.clubsPlayed[i]; break; }
    }
    if (stint) { stint.apps += apps; stint.goals += goals; stint.assists += assists; }

    /* 9 — Qualifikation für die nächste Saison.
           Ein Absteiger nimmt seinen Europapokalplatz nicht mit. */
    game.status.contComp = (ownMove && ownMove.dir === 'down')
      ? null : S.qualification(league, position, cupResult, contResult);

    if (ownMove) {
      FKC.state.logTimeline({
        text: { key: ownMove.dir === 'up' ? 'tl.promoted' : 'tl.relegated',
                params: { club: club.name,
                          league: (FKC.data.leagueById(ownMove.to) || {}).name || '' } },
        mark: ownMove.dir === 'up' ? 'good' : 'bad'
      });
    }

    /* 10 — Gehalt gutschreiben */
    if (game.status.contract) {
      game.career.finances.balance += Math.round(game.status.contract.salary *
        (1 - clamp(game.career.finances.lifestyle, 0, 100) / 165));
    }

    game.status.marketValue = FKC.attributes.marketValue(game);

    var record = {
      season: season, year: game.identity.year, age: game.identity.age,
      clubId: club.id, leagueId: league.id,
      apps: apps, starts: starts, minutes: minutes,
      goals: goals, assists: assists, cleanSheets: cleanSheets,
      avgRating: avgRating, motm: motm, yellows: yellows, reds: reds,
      leaguePos: position, leaguePoints: own ? own.points : 0,
      move: ownMove ? { dir: ownMove.dir, to: ownMove.to } : null,
      cup: cupResult, cont: contComp ? { id: contComp.id, result: contResult } : null,
      trophies: trophies, titles: titles, awards: awards,
      injury: injury.weeks > 0 ? injury : null,
      ovrStart: game.ovr, ovrEnd: game.ovr,
      salary: game.status.contract ? game.status.contract.salary : 0,
      marketValue: game.status.marketValue
    };

    game.career.seasons.push(record);
    return record;
  };

  /* ── Amateursaison ──────────────────────────────────────────────────
     Wer die Karriere bewusst beim Dorfverein ausklingen lässt, spielt
     weiter — nur eben ohne Tabelle, ohne Pokal und ohne Europa. Der
     Verein existiert nur im Spielstand, hat also keine Liga, in der
     sich eine Platzierung berechnen liesse. Statt den Spieler deshalb
     als vereinslos zu behandeln (so lief es vorher, und die Heimkehr
     wurde im selben Jahr wieder aufgelöst), bekommt dieser Fall eine
     eigene, bewusst schlichte Saison.                              */

  S.amateurSeason = function (game) {
    var rng = FKC.rng;
    var club = FKC.state.club();
    var season = FKC.i18n.season(game.identity.year);
    var injury = S.rollInjury(game);

    var games = 26;
    if (injury.weeks) games = Math.max(0, Math.round(games * (1 - clamp(injury.weeks, 0, 40) / 40)));

    /* Auf diesem Niveau spielt ein ehemaliger Profi praktisch immer */
    var apps = Math.max(0, Math.round(games * rng.float(0.82, 0.98)));
    var starts = apps;
    var minutes = apps * rng.int(76, 90);

    /* Der Klassenunterschied ist gewaltig, aber er hat eine Grenze: auch
       ein ehemaliger Weltklassestürmer schiesst im Dorffussball keine
       drei Tore pro Spiel. Mit dem ersten Faktor kamen 77 Tore in einer
       Saison heraus — 45 sind das realistische Maximum. */
    var ueber = clamp((game.ovr - 40) / 16, 0.6, 2.4);
    var pos = game.identity.position;
    var rate = { ST: 0.72, LW: 0.44, RW: 0.44, CAM: 0.42, CM: 0.24,
                 CDM: 0.10, CB: 0.09, LB: 0.07, RB: 0.07, GK: 0.005 }[pos] || 0.25;
    var aRate = { ST: 0.22, LW: 0.34, RW: 0.34, CAM: 0.42, CM: 0.32,
                  CDM: 0.18, CB: 0.05, LB: 0.20, RB: 0.20, GK: 0.01 }[pos] || 0.22;

    var goals = spread(apps * rate * ueber);
    var assists = spread(apps * aRate * ueber);
    var cleanSheets = game.identity.isGK ? spread(starts * rng.float(0.28, 0.5)) : 0;
    var avgRating = apps ? clamp(FKC.util.round(rng.gauss(7.4, 0.28), 2), 5.5, 9.6) : 0;

    if (game.status.contract) {
      game.career.finances.balance += Math.round(game.status.contract.salary);
    }
    game.status.marketValue = FKC.attributes.marketValue(game);

    var record = {
      season: season, year: game.identity.year, age: game.identity.age,
      clubId: club.id, leagueId: null, amateur: true,
      apps: apps, starts: starts, minutes: minutes,
      goals: goals, assists: assists, cleanSheets: cleanSheets,
      avgRating: avgRating, motm: spread(apps * 0.22),
      yellows: spread(apps * 0.06), reds: 0,
      leaguePos: 0, leaguePoints: 0, move: null,
      cup: null, cont: null,
      trophies: [], titles: [], awards: [],
      injury: injury.weeks > 0 ? injury : null,
      ovrStart: game.ovr, ovrEnd: game.ovr,
      salary: game.status.contract ? game.status.contract.salary : 0,
      marketValue: game.status.marketValue
    };
    game.career.seasons.push(record);
    return record;
  };

  /* ── Jugend- und Kindheitsjahr ──────────────────────────────────────
     Auch als Kind spielt man eine Saison. Sie läuft nach demselben
     Muster wie im Profibereich, nur gröber: Wie gut ist das Kind im
     Vergleich zu Gleichaltrigen, wie viel spielt es, was kommt dabei
     heraus.                                                          */

  S.youthSeason = function (game) {
    var rng = FKC.rng;
    var age = game.identity.age;
    var club = FKC.state.club();
    var pos = game.identity.position;

    /* Stärke im Vergleich zur Altersklasse. Das Potenzial ist der
       wichtigste Faktor — ein Riesentalent dominiert Juniorenfussball. */
    var ceiling = FKC.growth.ceiling(game, age);
    var standing = (game.hidden.potential - 72) * 0.6
                 + (game.ovr - ceiling) * 1.4
                 + (game.hidden.workRate - 60) / 12
                 + (game.condition.form - 60) / 14;
    /* Je besser die Ausbildungsstätte, desto härter die Konkurrenz um
       einen Platz — eine Topakademie ist kein Selbstläufer.        */
    if (club && !club.synthetic) {
      var lvl = FKC.data.clubLevel(club);
      standing -= FKC.util.clamp(2 + (lvl - 62) * 0.32, 2, 13);
    }

    var games = age <= 9 ? 16 : age <= 13 ? 20 : 24;
    if (game.condition.injury) {
      games = Math.max(0, Math.round(games * (1 - FKC.util.clamp(game.condition.injury.weeks, 0, 40) / 40)));
    }

    /* Kinder spielen fast alle. Erst mit den Jahren wird ausgesiebt. */
    var share = age <= 9 ? clamp(0.80 + standing * 0.018, 0.55, 1)
              : age <= 13 ? clamp(0.70 + standing * 0.024, 0.35, 1)
              : clamp(0.60 + standing * 0.028, 0.18, 1);
    var apps = Math.round(games * clamp(share * 1.08, 0, 1));
    var starts = Math.round(apps * share);

    /* Im Juniorenfussball fallen deutlich mehr Tore */
    var rate = { ST: 0.95, LW: 0.6, RW: 0.6, CAM: 0.55, CM: 0.3,
                 CDM: 0.12, CB: 0.1, LB: 0.08, RB: 0.08, GK: 0.01 }[pos] || 0.3;
    var aRate = { ST: 0.25, LW: 0.4, RW: 0.4, CAM: 0.5, CM: 0.38,
                  CDM: 0.2, CB: 0.06, LB: 0.22, RB: 0.22, GK: 0.02 }[pos] || 0.25;

    var quality = clamp(1 + standing / 22, 0.35, 2.2);
    var goals = spread(apps * rate * quality);
    var assists = spread(apps * aRate * quality);
    var cleanSheets = game.identity.isGK
      ? spread(starts * clamp(0.2 + standing / 60, 0.05, 0.6)) : 0;

    var rating = clamp(FKC.util.round(rng.gauss(6.5 + standing * 0.045, 0.2), 2), 4.5, 9.5);

    /* Abschneiden der Mannschaft */
    var teams = 10;
    var teamPos = clamp(Math.round(rng.gauss(
      5.5 - standing * 0.18 - ((club ? club.strength : 45) - 45) / 8, 1.7)), 1, teams);

    /* Eigene Jugendtrophäe: bester Spieler der Juniorenliga. Auch die
       Jugendjahre sollen etwas hinterlassen, das im Schrank steht.
       Keine harte Schwelle, sondern eine Wahrscheinlichkeit entlang der
       Saisonleistung: `standing` liegt im Median bei −4 und erreicht in
       der Spitze 9, die Notenskala endet faktisch bei 7,3. Feste
       Grenzwerte darauf sind entweder unerreichbar oder geschenkt. */
    var youthAward = null;
    var jugendTitel = game.career.awards.filter(function (a) {
      return a.id === 'youthPlayer';
    }).length;
    if (age >= 12 && apps >= 10 && jugendTitel < 2) {
      var pJugend = clamp(0.06 + (standing + 2) * 0.055 + (rating - 6.2) * 0.30, 0, 0.62);
      if (rng.chance(pJugend)) {
        youthAward = { id: 'youthPlayer', season: FKC.i18n.season(game.identity.year),
                       age: age };
        game.career.awards.push(youthAward);
        FKC.state.logTimeline({ text: { key: 'tl.youthPlayer' }, mark: 'good' });
      }
    }

    return {
      age: age, apps: apps, games: games, starts: starts,
      goals: goals, assists: assists, cleanSheets: cleanSheets,
      avgRating: apps > 0 ? rating : 0,
      teamPos: teamPos, teams: teams,
      award: youthAward,
      standing: Math.round(standing)
    };
  };

  /* ── Titel eintragen ────────────────────────────────────────────────
     Einzige Stelle, an der ein Vereinstitel in den Trophäenschrank
     wandert. Liefert den Eintrag samt counted-Flag zurück, damit der
     Rückblick genau das anzeigen kann, was auch gespeichert wurde.  */

  S.MIN_APPS_FOR_TROPHY = 1;

  S.recordTrophy = function (game, def, apps) {
    var counted = (apps || 0) >= S.MIN_APPS_FOR_TROPHY;
    if (counted) {
      game.career.trophies.push({
        compId: def.compId, name: def.name,
        clubId: def.clubId, season: def.season
      });
    }
    return {
      compId: def.compId, name: def.name, clubId: def.clubId,
      season: def.season, counted: counted
    };
  };

  /* ── Verletzungen ───────────────────────────────────────────────── */

  S.rollInjury = function (game) {
    var rng = FKC.rng;
    /* Zielbild: rund 10 % leichtere und 5 % schwere Verletzungen pro
       Saison — zusammen 15 % statt der früheren 25 bis 35 %. Die
       Anlagen des Spielers, sein Alter und seine Frische verschieben
       das, aber nur noch in einem engen Rahmen. */
    var leicht = 0.10 + (game.hidden.injuryProneness - 45) / 900
               + Math.max(0, game.identity.age - 31) * 0.006
               + Math.max(0, 62 - game.condition.fitness) / 1100;
    var schwer = 0.05 + (game.hidden.injuryProneness - 45) / 1400
               + Math.max(0, game.identity.age - 31) * 0.004;
    /* Wer alles auf diese Saison setzt, geht auch mehr kaputt */
    if (game.status.seasonPlan === 'allin') { leicht += 0.05; schwer += 0.03; }

    leicht = clamp(leicht, 0.04, 0.22);
    schwer = clamp(schwer, 0.015, 0.14);

    var wurf = rng.next();
    if (wurf >= leicht + schwer) {
      game.condition.injury = null;
      return { weeks: 0, key: null };
    }

    var weeks, key;
    if (wurf < schwer) {
      /* Schwer: die Saison ist im Wesentlichen gelaufen */
      if (rng.chance(0.55)) { weeks = rng.int(16, 28); key = 'major'; }
      else                  { weeks = rng.int(32, 46); key = 'severe'; }
    } else {
      /* Leicht bis mittel: ein paar Wochen, kein Bruch in der Karriere */
      if (rng.chance(0.62)) { weeks = rng.int(2, 5);  key = 'minor'; }
      else                  { weeks = rng.int(6, 14); key = 'medium'; }
    }

    game.condition.injury = { key: key, weeks: weeks, severity: key };
    game.condition.fitness = clamp(game.condition.fitness - weeks, 30, 100);
    if (weeks >= 16) {
      game.hidden.injuryProneness = clamp(game.hidden.injuryProneness + 6, 5, 99);
      if (weeks >= 32) game.hidden.potential = clamp(game.hidden.potential - FKC.rng.int(1, 4), 30, 99);
    }
    return { weeks: weeks, key: key };
  };

  /* ── Auszeichnungen ─────────────────────────────────────────────── */

  /**
   * Wie viele Tore der beste Torschütze dieser Liga in dieser Saison
   * erzielt hat — ohne den Rest der Liga Spieler für Spieler zu
   * simulieren. Stärkere Ligen haben höhere Bestmarken.
   *
   * Deterministisch aus Liga und Saison: die Marke darf sich beim
   * Neuzeichnen derselben Saison nicht ändern, sonst gewänne man den
   * Goldenen Schuh je nach Aufruf mal so und mal so.
   */
  S.topScorerMark = function (league, season) {
    var h = 0, str = league.id + '|' + season;
    for (var i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    h ^= h >>> 16; h = Math.imul(h, 0x45d9f3b); h ^= h >>> 16;
    var u = ((h >>> 0) % 10000) / 10000;                       // 0 … 1
    /* Grundniveau nach Ligastärke, dazu eine Streuung von ±5 Toren */
    var base = 10 + league.strength / 5;
    var z = (u - 0.5) * 2;                                     // −1 … 1
    return Math.max(11, Math.round(base + z * 5));
  };

  /**
   * Ligafaktor für den Goldenen Schuh. Nach dem Vorbild des European
   * Golden Shoe: Tore in den stärksten Ligen zählen doppelt, in
   * mittelstarken das Anderthalbfache, im Rest einfach. Ohne diese
   * Gewichtung wäre der Torschützenkönig einer schwachen Liga
   * gleichwertig mit dem einer Spitzenliga — genau das soll die
   * Auszeichnung nicht sein.
   */
  S.shoeFactor = function (league) {
    if (!league) return 1;
    if (league.strength >= 86) return 2;      // Top-5-Niveau
    if (league.strength >= 74) return 1.5;    // starkes Mittelfeld
    return 1;
  };

  /** Punkte nach dem gewichteten System */
  S.shoePoints = function (goals, league) {
    return goals * S.shoeFactor(league);
  };

  /**
   * Bestmarke des besten Torjägers Europas in dieser Saison, in
   * gewichteten Punkten. Deterministisch aus der Saison, damit sie sich
   * beim Neuzeichnen nicht ändert.
   */
  S.shoeMark = function (season) {
    var h = 0, str = 'shoe|' + season;
    for (var i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    h ^= h >>> 16; h = Math.imul(h, 0x45d9f3b); h ^= h >>> 16;
    var u = ((h >>> 0) % 10000) / 10000;
    /* Reale Siegerwerte liegen zwischen rund 54 und 72 Punkten — also
       25 bis 34 Tore in einer Spitzenliga. Aus einer schwachen Liga ist
       der Goldene Schuh damit praktisch unerreichbar, und genau so ist
       die echte Auszeichnung auch. */
    return Math.round(48 + u * 20);
  };

  /**
   * Ballon d'Or nach den drei echten Kriterien, in dieser Gewichtung:
   *   1. individuelle Leistung (55) — Tore, Vorlagen, Note, Konstanz
   *   2. Mannschaftserfolge (33)    — Titel mit Verein und Nation
   *   3. Klasse und Fair Play (12)  — Disziplin, keine Sperren
   * Bewertet wird die ganze Saison, Verein und Nationalmannschaft
   * zusammen — nicht die reine Torstatistik.
   * @returns 0–100
   */
  S.ballonScore = function (game, line, league, national) {
    var pos = game.identity.isGK ? 'GK' : game.identity.position;

    /* ── 1. Individuelle Leistung ─────────────────────────────────── */
    var ziel = { GK: 0, CB: 4, LB: 6, RB: 6, CDM: 7, CM: 12,
                 CAM: 20, LW: 22, RW: 22, ST: 26 }[pos] || 12;
    var beteiligt = line.goals + line.assists * 0.75;
    var ertrag = ziel > 0 ? clamp(beteiligt / ziel, 0, 1.35) : 0;
    /* Torhüter und Verteidiger zählen über die Note, nicht über Tore */
    var note = clamp((line.avgRating - 6.9) / 1.5, 0, 1.2);
    var einsatz = clamp(line.apps / 34, 0, 1);
    var indiv = (ertrag * 0.5 + note * 0.42 + einsatz * 0.18) * 42;
    /* Ligastärke schlägt durch: 25 Tore in einer schwachen Liga wiegen
       weniger als 20 in einer Spitzenliga. */
    indiv *= clamp(0.55 + league.strength / 130, 0.6, 1.15);

    /* ── 2. Mannschaftserfolge ────────────────────────────────────── */
    var team = 0;
    (line.trophies || []).forEach(function (t) {
      if (t.compId.indexOf('cont.') === 0) team += 15;
      else if (t.compId.indexOf('league.') === 0) team += 11;
      else if (t.compId.indexOf('cup.') === 0) team += 5;
      else team += 4;
    });
    if (national && national.result === 'won') team += 14;
    else if (national && national.result === 'final') team += 6;
    team = Math.min(33, team);

    /* ── 3. Klasse und Fair Play ──────────────────────────────────── */
    var fair = 12;
    fair -= Math.min(6, (line.yellows || 0) * 0.4);
    fair -= (line.reds || 0) * 4;
    if (line.injury && line.injury.key === 'ban') fair -= 8;
    fair += (game.hidden.discipline - 60) / 25;
    fair = clamp(fair, 0, 12);

    return clamp(Math.round(indiv + team + fair), 0, 100);
  };

  /** Bestwert der Konkurrenz in dieser Saison, deterministisch */
  S.ballonMark = function (season) {
    var h = 0, str = 'ballon|' + season;
    for (var i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    h ^= h >>> 16; h = Math.imul(h, 0x45d9f3b); h ^= h >>> 16;
    return 72 + ((h >>> 0) % 11);              // 72 … 82
  };

  /**
   * Bestwert im Feld der unter Zwanzigjährigen. Deutlich niedriger als
   * beim Fussballer des Jahres — ein Achtzehnjähriger konkurriert mit
   * Achtzehnjährigen, nicht mit der Weltspitze.
   */
  S.kopaMark = function (season) {
    var h = 0, str = 'kopa|' + season;
    for (var i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    h ^= h >>> 16; h = Math.imul(h, 0x45d9f3b); h ^= h >>> 16;
    /* Messwerte aus 70 Karrieren: von 69 Profisaisons zwischen 16 und 19
       mit genug Einsätzen lag der beste Wert bei 55, der Median bei 23.
       Mit der ursprünglichen Marke 44–53 gewann die Auszeichnung ein
       Spieler von siebzig — für ein Riesentalent muss sie erreichbar
       sein, für alle anderen weiter unerreichbar. */
    return 38 + ((h >>> 0) % 9);               // 38 … 46
  };

  S.rollAwards = function (game, league, line) {
    var out = [];
    if (line.apps < 12) return out;
    var elite = league.strength >= 88;

    /* Goldener Schuh nach dem gewichteten System: Tore mal Ligafaktor
       gegen die europäische Bestmarke. Bei Gleichstand entscheiden der
       Reihe nach weniger Einsatzminuten, mehr Vorlagen und weniger
       Elfmetertore — wie beim echten Vorbild. */
    if (!game.identity.isGK && line.goals > 0) {
      /* Gewertet werden nur **Ligatore** — Pokal und Europapokal zählen
         beim echten Goldenen Schuh nicht mit. `line.goals` enthält alle
         Wettbewerbe, deshalb der Anteil der Ligaspiele. */
      var ligaTore = Math.round(line.goals * (line.leagueShare != null ? line.leagueShare : 0.72));
      var punkte = S.shoePoints(ligaTore, league);
      var marke = S.shoeMark(line.season);
      var gewonnen = punkte > marke;
      if (!gewonnen && punkte === marke) {
        /* Gleichstand: die drei Kriterien der Reihe nach */
        gewonnen = line.minutes < 2900
          || line.assists >= 8
          || (line.penaltyGoals || 0) <= 2;
      }
      if (gewonnen) {
        out.push({ id: 'goldenBoot', season: line.season, leagueId: league.id,
                   points: punkte, leagueGoals: ligaTore });
      }
    }

    /* Spieler der Saison (Liga) */
    if (line.avgRating >= 7.45 && line.position <= 3 && FKC.rng.chance(0.5)) {
      out.push({ id: 'teamOfSeason', season: line.season, leagueId: league.id });
    }

    /* Bester Nachwuchsspieler der Liga */
    if (game.identity.age <= 21 && line.avgRating >= 7.05 && FKC.rng.chance(0.5)) {
      out.push({ id: 'youngPlayer', season: line.season, leagueId: league.id });
    }

    /* Weltfussballer des Jahres: nach den drei echten Kriterien
       bewertet (Leistung, Titel, Klasse) und gegen den Bestwert der
       Konkurrenz gestellt. Vorher hing es an Rating und einem Würfel —
       eine überragende Saison ohne Titel konnte damit gewinnen, eine
       mit Meisterschaft und Champions League verlieren. */
    var punkteBallon = S.ballonScore(game, line, league, line.tournament || null);
    if (punkteBallon > S.ballonMark(line.season)) {
      out.push({ id: 'ballon', season: line.season, leagueId: league.id,
                 score: punkteBallon });
      FKC.state.logTimeline({ text: { key: 'tl.ballon' }, mark: 'good' });
    }

    /* Talent des Jahres — nach dem Vorbild der Kopa Trophy nur zwischen
       16 und 19 zu gewinnen und ausdrücklich **nicht** dasselbe wie der
       Fussballer des Jahres. Gemessen wird an derselben Saisonleistung,
       nur gegen ein Feld von Gleichaltrigen statt gegen die Weltspitze. */
    if (game.identity.age >= 16 && game.identity.age <= 19 &&
        punkteBallon > S.kopaMark(line.season)) {
      out.push({ id: 'kopa', season: line.season, leagueId: league.id,
                 score: punkteBallon });
      FKC.state.logTimeline({ text: { key: 'tl.kopa' }, mark: 'good' });
    }

    out.forEach(function (a) { game.career.awards.push(a); });
    return out;
  };

  /* ── Europapokal-Qualifikation für die Folgesaison ──────────────── */

  S.qualification = function (league, position, cupResult, contResult) {
    if (league.tier !== 1) return null;
    var slots = league.contSlots || { champions: 0, secondary: 0, third: 0 };
    var top = FKC.data.contFor(league.conf, 1);
    var second = FKC.data.contFor(league.conf, 2);
    var third = FKC.data.contFor(league.conf, 3);

    if (contResult === 'won' && top) return top.id;
    if (position <= slots.champions && top) return top.id;
    if (cupResult === 'won' && second) return second.id;
    if (position <= slots.champions + slots.secondary && second) return second.id;
    /* Conference League: der Platz darunter — nur dort, wo es sie gibt */
    if (position <= slots.champions + slots.secondary + slots.third && third) {
      return third.id;
    }
    return null;
  };

  FKC.season = S;

})(window.FKC);
