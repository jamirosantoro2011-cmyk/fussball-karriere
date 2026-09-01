/* ── Ligen ─────────────────────────────────────────────────────────────
   16 Länder mit je erster und zweiter Liga (32 Ligen).
   strength : Niveau der Liga (40-99) — steuert Gehalt, Sichtbarkeit,
              Scouting-Reichweite und wie schwer ein Stammplatz ist.
   prestige : Medienpräsenz / Renommee — steuert Reputationsgewinn.
   Auf- und Abstieg verknüpft die Ebenen (up/down).                   */

window.FKC = window.FKC || {};
FKC.data = FKC.data || {};

(function (FKC) {
  'use strict';

  // [id, name, country, tier, strength, prestige, clubs, cup, up, down, conf]
  var rows = [
    ['eng.1', 'Premier League',            'ENG', 1, 95, 98, 20, 'cup.eng', null,    'eng.2', 'UEFA'],
    ['eng.2', 'EFL Championship',          'ENG', 2, 76, 74, 24, 'cup.eng', 'eng.1', null,    'UEFA'],

    ['esp.1', 'LaLiga',                    'ESP', 1, 92, 95, 20, 'cup.esp', null,    'esp.2', 'UEFA'],
    ['esp.2', 'LaLiga Hypermotion',        'ESP', 2, 72, 68, 20, 'cup.esp', 'esp.1', null,    'UEFA'],

    ['ger.1', 'Bundesliga',                'GER', 1, 90, 93, 18, 'cup.ger', null,    'ger.2', 'UEFA'],
    ['ger.2', '2. Bundesliga',             'GER', 2, 73, 70, 18, 'cup.ger', 'ger.1', null,    'UEFA'],

    ['ita.1', 'Serie A',                   'ITA', 1, 90, 92, 20, 'cup.ita', null,    'ita.2', 'UEFA'],
    ['ita.2', 'Serie B',                   'ITA', 2, 71, 66, 20, 'cup.ita', 'ita.1', null,    'UEFA'],

    ['fra.1', 'Ligue 1',                   'FRA', 1, 86, 87, 18, 'cup.fra', null,    'fra.2', 'UEFA'],
    ['fra.2', 'Ligue 2',                   'FRA', 2, 67, 62, 18, 'cup.fra', 'fra.1', null,    'UEFA'],

    ['por.1', 'Liga Portugal',             'POR', 1, 81, 82, 18, 'cup.por', null,    'por.2', 'UEFA'],
    ['por.2', 'Liga Portugal 2',           'POR', 2, 61, 55, 16, 'cup.por', 'por.1', null,    'UEFA'],

    ['ned.1', 'Eredivisie',                'NED', 1, 80, 81, 18, 'cup.ned', null,    'ned.2', 'UEFA'],
    ['ned.2', 'Keuken Kampioen Divisie',   'NED', 2, 59, 54, 18, 'cup.ned', 'ned.1', null,    'UEFA'],

    ['tur.1', 'Süper Lig',                 'TUR', 1, 78, 79, 18, 'cup.tur', null,    'tur.2', 'UEFA'],
    ['tur.2', 'TFF 1. Lig',                'TUR', 2, 59, 53, 18, 'cup.tur', 'tur.1', null,    'UEFA'],

    ['bel.1', 'Jupiler Pro League',        'BEL', 1, 77, 76, 16, 'cup.bel', null,    'bel.2', 'UEFA'],
    ['bel.2', 'Challenger Pro League',     'BEL', 2, 57, 51, 16, 'cup.bel', 'bel.1', null,    'UEFA'],

    ['sui.1', 'Credit Suisse Super League', 'SUI', 1, 71, 70, 12, 'cup.sui', null,   'sui.2', 'UEFA'],
    ['sui.2', 'Challenge League',          'SUI', 2, 53, 47, 10, 'cup.sui', 'sui.1', null,    'UEFA'],

    ['sco.1', 'Scottish Premiership',      'SCO', 1, 72, 74, 12, 'cup.sco', null,    'sco.2', 'UEFA'],
    ['sco.2', 'Scottish Championship',     'SCO', 2, 51, 46, 10, 'cup.sco', 'sco.1', null,    'UEFA'],

    ['bra.1', 'Brasileirão Série A',       'BRA', 1, 83, 84, 20, 'cup.bra', null,    'bra.2', 'CONMEBOL'],
    ['bra.2', 'Brasileirão Série B',       'BRA', 2, 65, 58, 20, 'cup.bra', 'bra.1', null,    'CONMEBOL'],

    ['arg.1', 'Liga Profesional',          'ARG', 1, 80, 80, 20, 'cup.arg', null,    'arg.2', 'CONMEBOL'],
    ['arg.2', 'Primera Nacional',          'ARG', 2, 61, 54, 16, 'cup.arg', 'arg.1', null,    'CONMEBOL'],

    ['mex.1', 'Liga MX',                   'MEX', 1, 78, 79, 18, 'cup.mex', null,    'mex.2', 'CONCACAF'],
    ['mex.2', 'Liga de Expansión MX',      'MEX', 2, 58, 50, 16, 'cup.mex', 'mex.1', null,    'CONCACAF'],

    ['usa.1', 'Major League Soccer',       'USA', 1, 75, 78, 20, 'cup.usa', null,    'usa.2', 'CONCACAF'],
    ['usa.2', 'USL Championship',          'USA', 2, 57, 50, 16, 'cup.usa', 'usa.1', null,    'CONCACAF'],

    ['ksa.1', 'Saudi Pro League',          'KSA', 1, 77, 74, 18, 'cup.ksa', null,    'ksa.2', 'AFC'],
    ['ksa.2', 'Saudi First Division',      'KSA', 2, 54, 42, 16, 'cup.ksa', 'ksa.1', null,    'AFC']
  ];

  /* Startplätze für die kontinentalen Wettbewerbe: [Königsklasse, zweiter
     Wettbewerb]. Nur erste Ligen. Ohne diese Angabe qualifiziert sich
     niemand über die Tabellenplatzierung — genau das war lange der Fall. */
  var CONT_SLOTS = {
    'eng.1': [4, 2, 1], 'esp.1': [4, 2, 1], 'ger.1': [4, 2, 1], 'ita.1': [4, 2, 1],
    'fra.1': [3, 2, 1], 'por.1': [2, 2, 1], 'ned.1': [2, 2, 1], 'bel.1': [2, 1, 1],
    'tur.1': [2, 1, 1], 'sui.1': [1, 1, 1], 'sco.1': [1, 1, 1],
    'bra.1': [4, 4], 'arg.1': [4, 4],
    'mex.1': [3, 2], 'usa.1': [3, 2], 'ksa.1': [3, 1]
  };

  FKC.data.leagues = rows.map(function (r) {
    var slots = CONT_SLOTS[r[0]] || [0, 0, 0];
    return {
      id: r[0], name: r[1], country: r[2], tier: r[3],
      strength: r[4], prestige: r[5], clubCount: r[6],
      domesticCup: r[7], up: r[8], down: r[9], conf: r[10],
      /* `third` ist der Conference-League-Platz — nur in Europa besetzt */
      contSlots: { champions: slots[0], secondary: slots[1], third: slots[2] || 0 }
    };
  });

  var leagueIndex = {};
  FKC.data.leagues.forEach(function (l) { leagueIndex[l.id] = l; });

  FKC.data.leagueById = function (id) { return leagueIndex[id] || null; };

  FKC.data.leaguesOf = function (country) {
    return FKC.data.leagues.filter(function (l) { return l.country === country; });
  };

  FKC.data.topLeagues = function () {
    return FKC.data.leagues.filter(function (l) { return l.tier === 1; });
  };

  /** Ligen im Stärkefenster — Basis für passende Transferangebote */
  FKC.data.leaguesInRange = function (min, max) {
    return FKC.data.leagues.filter(function (l) {
      return l.strength >= min && l.strength <= max;
    });
  };

})(window.FKC);
