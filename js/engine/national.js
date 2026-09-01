/* ── Nationalmannschaft ────────────────────────────────────────────────
   Berufung, Stammplatzkampf und die grossen Turniere. Wie schwer der
   Weg ist, hängt an der Konkurrenzdichte des Landes (nation.depth). */

window.FKC = window.FKC || {};

(function (FKC) {
  'use strict';

  var N = {};
  var clamp = function (v, a, b) { return FKC.util.clamp(v, a, b); };

  var ORDER = ['none', 'u19', 'u21', 'squad', 'starter', 'captain'];

  /** Wie gut man sein muss, um überhaupt in den Kader zu kommen */
  N.threshold = function (nation) {
    return 44 + nation.depth * 0.42;
  };

  /** Effektive Stärke im Wettbewerb um den Kaderplatz */
  N.standing = function (game, record) {
    var v = game.ovr + game.status.reputation / 12;
    if (record) {
      v += (record.avgRating - 6.6) * 2.5;
      v += record.awards.length * 2;
      if (record.apps < 12) v -= 10;
      else if (record.apps < 22) v -= 4;
    }
    var lg = FKC.state.league();
    if (lg) v += (lg.strength - 70) / 16;      // grosse Liga = mehr Sichtbarkeit
    if (game.condition.injury && game.condition.injury.weeks > 18) v -= 8;
    if (game.identity.age >= 33) v -= (game.identity.age - 32) * 2.5;
    return v;
  };

  /* ── Jahresupdate nach der Saison ───────────────────────────────── */

  N.update = function (game, record) {
    var nation = FKC.data.nationById(game.identity.nationality);
    if (!nation) return null;

    var base = N.threshold(nation);
    var v = N.standing(game, record);
    var age = game.identity.age;
    var prev = game.national.status;

    var target;
    if (age < 17) target = 'none';
    else if (v < base - 8) target = 'none';
    else if (v < base - 3) target = age <= 21 ? 'u21' : 'none';
    else if (v < base + 4) target = 'squad';
    else if (v < base + 10) target = 'starter';
    else target = 'starter';

    // Kapitän nur mit Erfahrung, Persönlichkeit und Stammplatz
    if (target === 'starter' && age >= 27 && game.national.caps >= 35 &&
        game.hidden.mentality >= 68 && (prev === 'starter' || prev === 'captain')) {
      if (prev === 'captain' || FKC.rng.chance(0.35)) target = 'captain';
    }

    // Torhüter: nur eine Nummer eins, entsprechend härter
    if (game.identity.isGK && target === 'starter' && v < base + 7) target = 'squad';

    var changed = target !== prev;
    game.national.status = target;

    /* Einsätze sammeln */
    var caps = 0, goals = 0;
    if (target === 'captain') caps = FKC.rng.int(7, 11);
    else if (target === 'starter') caps = FKC.rng.int(5, 9);
    else if (target === 'squad') caps = FKC.rng.int(1, 4);
    else if (target === 'u21' || target === 'u19') caps = 0;

    if (caps > 0 && !game.identity.isGK) {
      var rate = { ST: 0.45, LW: 0.24, RW: 0.24, CAM: 0.22, CM: 0.10,
                   CDM: 0.04, CB: 0.05, LB: 0.03, RB: 0.03 }[game.identity.position] || 0.1;
      goals = Math.max(0, Math.round(FKC.rng.gauss(caps * rate, Math.sqrt(caps * rate + 1) * 0.8)));
    }
    game.national.caps += caps;
    game.national.goals += goals;

    /* Debüt = erstmals im A-Kader. Vorher hing das an `prev === 'none'`
       und ging deshalb jedes Mal verloren, wenn der Weg über die U21
       lief — also im Normalfall. */
    var senior = target === 'squad' || target === 'starter' || target === 'captain';
    var debut = senior && !game.national.debutYear;
    if (debut) game.national.debutYear = game.identity.year;

    return { status: target, prev: prev, changed: changed, caps: caps, goals: goals,
             debut: debut };
  };

  /* ── Turniere ───────────────────────────────────────────────────── */

  N.tournamentThisYear = function (game) {
    var nation = FKC.data.nationById(game.identity.nationality);
    if (!nation) return null;
    var list = FKC.data.tournamentIn(game.identity.year, nation.conf);
    if (!list.length) return null;
    // WM hat Vorrang vor dem Kontinentalturnier
    for (var i = 0; i < list.length; i++) if (list[i].id === 'nat.wc') return list[i];
    return list[0];
  };

  /**
   * Simuliert Qualifikation und Turnier.
   * Gibt null zurück, wenn der Spieler nicht dabei ist.
   */
  /**
   * Qualifikationschance einer Nation für ein Turnier.
   * Grundlage ist `FKC.data.qualRate` — der Anteil der letzten
   * Endrunden, bei denen das Land dabei war. Ohne Eintrag wird aus der
   * Mannschaftsstärke geschätzt.
   */
  N.qualChance = function (nation, comp) {
    var wm = comp.id === 'nat.wc';
    var rate = FKC.data.qualRate[nation.id];
    if (rate) return clamp(wm ? rate[0] : rate[1], 0.05, 0.99);
    var geschaetzt = clamp((nation.strength - 50) / 40, 0.08, 0.9);
    return wm ? clamp(geschaetzt * 0.85, 0.05, 0.9) : geschaetzt;
  };

  N.playTournament = function (game, comp) {
    var nation = FKC.data.nationById(game.identity.nationality);
    var status = game.national.status;
    if (status !== 'squad' && status !== 'starter' && status !== 'captain') return null;

    /* Qualifikation der Nation: an der echten historischen Häufigkeit
       dieses Landes, nicht aus der Mannschaftsstärke abgeleitet. Sonst
       hätte Norwegen dieselbe WM-Chance wie Dänemark, obwohl es seit
       1998 bei keiner Endrunde mehr dabei war. */
    var qualChance = N.qualChance(nation, comp);
    if (!FKC.rng.chance(qualChance)) {
      return { compId: comp.id, season: FKC.i18n.season(game.identity.year),
               qualified: false, result: 'noQual', apps: 0, goals: 0 };
    }

    /* Turnierverlauf */
    var pool = FKC.data.nations.filter(function (n) {
      return comp.conf === '*' || n.conf === comp.conf;
    });
    var weaker = pool.filter(function (n) { return n.strength < nation.strength; }).length;
    var pct = weaker / Math.max(1, pool.length);
    var result = FKC.season.runKnockout(pct, 5);
    if (result === 'early') result = 'group';

    var stageGames = { group: 3, r16: 4, quarter: 5, semi: 6, final: 7, won: 7 }[result] || 3;
    var playShare = status === 'captain' ? 1 : status === 'starter' ? 0.85 : 0.35;
    var apps = Math.max(1, Math.round(stageGames * playShare));

    var rate = game.identity.isGK ? 0 :
      ({ ST: 0.42, LW: 0.22, RW: 0.22, CAM: 0.2, CM: 0.09,
         CDM: 0.04, CB: 0.05, LB: 0.03, RB: 0.03 }[game.identity.position] || 0.09);
    var goals = Math.max(0, Math.round(FKC.rng.gauss(apps * rate, 0.8)));

    game.national.caps += apps;
    game.national.goals += goals;

    var entry = {
      compId: comp.id, season: FKC.i18n.season(game.identity.year),
      year: game.identity.year, qualified: true,
      result: result, apps: apps, goals: goals, awards: []
    };
    game.national.tournaments.push(entry);

    /* Gruppentabelle und K.-o.-Weg für die Tabellenansicht */
    entry.detail = N.buildDetail(nation, pool, result);
    if (game.tables) {
      game.tables.tournament = {
        compId: comp.id, season: entry.season, nationId: nation.id,
        result: result, detail: entry.detail
      };
    }

    /* Turnier-Auszeichnungen: Torschützenkönig und Spieler des Turniers */
    /* Goldener Schuh und Goldener Ball des Turniers — eigene
       Auszeichnungen, unabhängig von den Liga-Versionen.         */
    var deep = ['semi', 'final', 'won'].indexOf(result) >= 0;

    /* Torschützenkönig des Turniers: wer mehr trifft als der beste
       Schütze des Feldes, bekommt ihn — dasselbe Prinzip wie in der
       Liga. Bei einem WM/EM-Turnier reichen historisch 5 bis 7 Tore. */
    var turnierMarke = (function () {
      var h = 0, str = comp.id + '|' + entry.season;
      for (var i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
      h ^= h >>> 16; h = Math.imul(h, 0x45d9f3b); h ^= h >>> 16;
      return 4 + ((h >>> 0) % 4);                    // 4 … 7
    })();
    if (!game.identity.isGK && goals > turnierMarke) {
      entry.awards.push('goldenBootTournament');
      game.career.awards.push({ id: 'goldenBootTournament', season: entry.season,
                                compId: comp.id });
    }
    if (deep && (status === 'starter' || status === 'captain') &&
        FKC.rng.chance(result === 'won' ? 0.4 : 0.18)) {
      entry.awards.push('goldenBallTournament');
      game.career.awards.push({ id: 'goldenBallTournament', season: entry.season,
                                compId: comp.id });
    }

    if (result === 'won') {
      game.career.trophies.push({
        compId: comp.id, name: FKC.data.compName(comp.id),
        nationId: nation.id, season: entry.season, national: true
      });
      game.status.reputation = clamp(game.status.reputation + 14, 0, 100);
      game.condition.morale = clamp(game.condition.morale + 15, 0, 100);
    } else if (result === 'final' || result === 'semi') {
      game.status.reputation = clamp(game.status.reputation + 7, 0, 100);
    }

    return entry;
  };

  /**
   * Gruppenphase (vier Teams, drei Spiele) plus K.-o.-Weg.
   * Wer weiterkommt, steht in der Gruppe oben.
   */
  N.buildDetail = function (nation, pool, result) {
    var rng = FKC.rng;
    var advanced = result !== 'group';

    /* Drei Gruppengegner mit halbwegs passender Stärke */
    var cand = pool.filter(function (n) {
      return n.id !== nation.id && Math.abs(n.strength - nation.strength) <= 18;
    });
    if (cand.length < 3) cand = pool.filter(function (n) { return n.id !== nation.id; });
    var rivals = rng.sample(cand, 3);

    var rows = [{ n: nation.id, own: true }].concat(rivals.map(function (r) {
      return { n: r.id, own: false };
    }));

    rows.forEach(function (row, i) {
      var strength = row.own ? nation.strength : (FKC.data.nationById(row.n) || {}).strength || 65;
      var base = (strength - 65) / 9 + rng.gauss(0, 1.1);
      if (row.own) base += advanced ? 1.6 : -1.2;
      var pts = FKC.util.clamp(Math.round(4 + base), 0, 9);
      var w = FKC.util.clamp(Math.floor(pts / 3), 0, 3);
      var d = FKC.util.clamp(pts - w * 3, 0, 3 - w);
      row.p = 3; row.w = w; row.d = d; row.l = 3 - w - d; row.pts = w * 3 + d;
      row.gf = FKC.util.clamp(Math.round(3 + base * 0.8 + rng.gauss(0, 1)), 0, 12);
      row.ga = FKC.util.clamp(Math.round(row.gf - base * 0.9 + rng.gauss(0, 1)), 0, 12);
    });
    rows.sort(function (a, b) {
      return b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf;
    });
    rows.forEach(function (r, i) { r.pos = i + 1; });

    /* K.-o.-Runden */
    var stages = ['r16', 'quarter', 'semi', 'final'];
    var reached = ['group', 'r16', 'quarter', 'semi', 'final', 'won'].indexOf(result);
    var rounds = [], used = [nation.id];
    for (var i = 0; i < stages.length && i + 1 <= Math.min(reached, 4); i++) {
      var c2 = pool.filter(function (n) { return used.indexOf(n.id) < 0; });
      if (!c2.length) break;
      var opp = rng.pick(c2);
      used.push(opp.id);
      var won = (result === 'won') || (i + 1 < reached);
      var a, b;
      if (won) { a = rng.int(1, 4); b = rng.int(0, a - 1); }
      else { a = rng.int(0, 2); b = rng.int(a + 1, a + 2); }
      rounds.push({ round: stages[i], opp: opp.id, a: a, b: b, won: won });
      if (!won) break;
    }

    return { group: rows, rounds: rounds };
  };

  N.statusRank = function (status) { return ORDER.indexOf(status); };

  FKC.national = N;

})(window.FKC);
