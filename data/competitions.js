/* ── Wettbewerbe ───────────────────────────────────────────────────────
   Nationale Pokale, kontinentale Vereinswettbewerbe und die grossen
   Nationalmannschaftsturniere. Echte Namen, wie bei den Ligen.      */

window.FKC = window.FKC || {};
FKC.data = FKC.data || {};

(function (FKC) {
  'use strict';

  /* ── Nationale Pokalwettbewerbe ─────────────────────────────────── */
  var cups = [
    ['cup.eng', 'FA Cup', 'ENG'],
    ['cup.esp', 'Copa del Rey', 'ESP'],
    ['cup.ger', 'DFB-Pokal', 'GER'],
    ['cup.ita', 'Coppa Italia', 'ITA'],
    ['cup.fra', 'Coupe de France', 'FRA'],
    ['cup.por', 'Taça de Portugal', 'POR'],
    ['cup.ned', 'KNVB Beker', 'NED'],
    ['cup.tur', 'Türkiye Kupası', 'TUR'],
    ['cup.bel', 'Croky Cup', 'BEL'],
    ['cup.sui', 'Schweizer Cup', 'SUI'],
    ['cup.sco', 'Scottish Cup', 'SCO'],
    ['cup.bra', 'Copa do Brasil', 'BRA'],
    ['cup.arg', 'Copa Argentina', 'ARG'],
    ['cup.mex', 'Copa MX', 'MEX'],
    ['cup.usa', 'US Open Cup', 'USA'],
    ['cup.ksa', "King's Cup", 'KSA']
  ].map(function (r) {
    return { id: r[0], name: r[1], country: r[2], type: 'cup' };
  });

  /* ── Kontinentale Vereinswettbewerbe ────────────────────────────── */
  var continental = [
    { id: 'cont.ucl',  name: 'UEFA Champions League',        conf: 'UEFA',     tier: 1, prestige: 99 },
    { id: 'cont.uel',  name: 'UEFA Europa League',           conf: 'UEFA',     tier: 2, prestige: 78 },
    { id: 'cont.uecl', name: 'UEFA Conference League',       conf: 'UEFA',     tier: 3, prestige: 58 },
    { id: 'cont.lib',  name: 'Copa Libertadores',            conf: 'CONMEBOL', tier: 1, prestige: 88 },
    { id: 'cont.sud',  name: 'Copa Sudamericana',            conf: 'CONMEBOL', tier: 2, prestige: 68 },
    { id: 'cont.ccc',  name: 'CONCACAF Champions Cup',       conf: 'CONCACAF', tier: 1, prestige: 70 },
    { id: 'cont.cc2',  name: 'CONCACAF Central American Cup', conf: 'CONCACAF', tier: 2, prestige: 55 },
    { id: 'cont.acl',  name: 'AFC Champions League Elite',   conf: 'AFC',      tier: 1, prestige: 72 },
    { id: 'cont.ac2',  name: 'AFC Champions League Two',     conf: 'AFC',      tier: 2, prestige: 56 }
  ];

  /* ── Nationalmannschaft ─────────────────────────────────────────── */
  /* cycle: alle vier Jahre, offset bestimmt das Turnierjahr.
     2026 WM, 2028 EM/Copa, 2030 WM, 2032 EM/Copa …                  */
  var national = [
    { id: 'nat.wc',    name: 'FIFA-Weltmeisterschaft', nameEn: 'FIFA World Cup',
      conf: '*',        cycle: 4, offset: 2, prestige: 100, teams: 48 },
    { id: 'nat.euro',  name: 'UEFA-Europameisterschaft', nameEn: 'UEFA European Championship',
      conf: 'UEFA',     cycle: 4, offset: 0, prestige: 92, teams: 24 },
    { id: 'nat.copa',  name: 'Copa América', nameEn: 'Copa América',
      conf: 'CONMEBOL', cycle: 4, offset: 0, prestige: 88, teams: 16 },
    { id: 'nat.gold',  name: 'CONCACAF Gold Cup', nameEn: 'CONCACAF Gold Cup',
      conf: 'CONCACAF', cycle: 4, offset: 0, prestige: 66, teams: 16 },
    { id: 'nat.afcon', name: 'Afrika-Cup', nameEn: 'Africa Cup of Nations',
      conf: 'CAF',      cycle: 4, offset: 0, prestige: 74, teams: 24 },
    { id: 'nat.asian', name: 'AFC Asian Cup', nameEn: 'AFC Asian Cup',
      conf: 'AFC',      cycle: 4, offset: 0, prestige: 66, teams: 24 }
  ];

  var all = {};
  cups.forEach(function (c) { all[c.id] = c; });
  continental.forEach(function (c) { c.type = 'continental'; all[c.id] = c; });
  national.forEach(function (c) { c.type = 'national'; all[c.id] = c; });

  FKC.data.cups = cups;
  FKC.data.continental = continental;
  FKC.data.nationalComps = national;

  FKC.data.compById = function (id) { return all[id] || null; };

  FKC.data.compName = function (id) {
    var c = all[id];
    if (!c) return id;
    if (c.type === 'national' && FKC.i18n.lang === 'en' && c.nameEn) return c.nameEn;
    return c.name;
  };

  /** Kontinentaler Wettbewerb einer Liga, tier 1 oder 2 */
  FKC.data.contFor = function (conf, tier) {
    for (var i = 0; i < continental.length; i++) {
      if (continental[i].conf === conf && continental[i].tier === tier) return continental[i];
    }
    return null;
  };

  /** Findet das Turnier, das in diesem Jahr für diese Nation stattfindet */
  FKC.data.tournamentIn = function (year, conf) {
    var out = [];
    national.forEach(function (t) {
      if (t.conf !== '*' && t.conf !== conf) return;
      if ((year - t.offset) % t.cycle === 0) out.push(t);
    });
    return out;
  };

})(window.FKC);
