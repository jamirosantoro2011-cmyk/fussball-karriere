/* ── Positionen & OVR-Gewichtung ───────────────────────────────────────
   Das Overall-Rating ergibt sich aus den Attributen, positionsabhängig
   gewichtet (Summe der Gewichte = 1). Torhüter haben ein eigenes Set. */

window.FKC = window.FKC || {};
FKC.data = FKC.data || {};

(function (FKC) {
  'use strict';

  /* Feldspieler-Attribute in fester Reihenfolge (UI-Reihenfolge) */
  FKC.data.attrKeys = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'];
  FKC.data.gkAttrKeys = ['reflexes', 'positioning', 'handling', 'distribution', 'aerial', 'physical'];

  FKC.data.positions = [
    { id: 'GK',  group: 'GK',  gk: true,
      w: { reflexes: .27, positioning: .23, handling: .21, aerial: .12, distribution: .10, physical: .07 } },

    { id: 'CB',  group: 'DEF',
      w: { defending: .35, physical: .25, pace: .15, passing: .13, dribbling: .07, shooting: .05 } },
    { id: 'LB',  group: 'DEF',
      w: { defending: .26, pace: .24, passing: .16, dribbling: .14, physical: .14, shooting: .06 } },
    { id: 'RB',  group: 'DEF',
      w: { defending: .26, pace: .24, passing: .16, dribbling: .14, physical: .14, shooting: .06 } },

    { id: 'CDM', group: 'MID',
      w: { defending: .28, passing: .24, physical: .20, dribbling: .12, pace: .09, shooting: .07 } },
    { id: 'CM',  group: 'MID',
      w: { passing: .28, dribbling: .20, physical: .16, defending: .14, shooting: .12, pace: .10 } },
    { id: 'CAM', group: 'MID',
      w: { passing: .26, dribbling: .26, shooting: .20, pace: .14, physical: .08, defending: .06 } },

    { id: 'LW',  group: 'ATT',
      w: { dribbling: .28, pace: .26, shooting: .18, passing: .16, physical: .07, defending: .05 } },
    { id: 'RW',  group: 'ATT',
      w: { dribbling: .28, pace: .26, shooting: .18, passing: .16, physical: .07, defending: .05 } },
    { id: 'ST',  group: 'ATT',
      w: { shooting: .34, pace: .22, dribbling: .18, physical: .16, passing: .07, defending: .03 } }
  ];

  /* ── Playstyles ────────────────────────────────────────────────────
     Jeder Spieler bekommt beim Start eine Signaturstärke, die zu seiner
     Position passt. Sie liegt deutlich über den übrigen Werten und
     entwickelt sich schneller — so spielt sich jede Karriere anders. */
  FKC.data.playstyles = {
    ST:  ['pace', 'shooting', 'dribbling', 'physical'],
    LW:  ['pace', 'dribbling', 'shooting', 'passing'],
    RW:  ['pace', 'dribbling', 'shooting', 'passing'],
    CAM: ['passing', 'dribbling', 'shooting'],
    CM:  ['passing', 'dribbling', 'physical', 'defending'],
    CDM: ['defending', 'physical', 'passing'],
    CB:  ['defending', 'physical', 'pace'],
    LB:  ['pace', 'defending', 'passing', 'dribbling'],
    RB:  ['pace', 'defending', 'passing', 'dribbling'],
    GK:  ['reflexes', 'positioning', 'handling', 'distribution', 'aerial']
  };

  FKC.data.rollPlaystyle = function (positionId) {
    var list = FKC.data.playstyles[positionId] || FKC.data.playstyles.CM;
    return FKC.rng.pick(list);
  };

  /* Verwandte Positionen — für Positionswechsel-Ereignisse und Angebote */
  FKC.data.positionNeighbours = {
    GK: [], CB: ['CDM', 'LB', 'RB'], LB: ['CB', 'LW'], RB: ['CB', 'RW'],
    CDM: ['CM', 'CB'], CM: ['CDM', 'CAM'], CAM: ['CM', 'LW', 'RW', 'ST'],
    LW: ['RW', 'CAM', 'ST', 'LB'], RW: ['LW', 'CAM', 'ST', 'RB'], ST: ['CAM', 'LW', 'RW']
  };

  /* Positionsbedingte Abweichung von der Durchschnittsgrösse (cm) */
  FKC.data.heightBias = {
    GK: 7, CB: 4, ST: 1.5, CDM: 1, CM: -0.5, CAM: -2.5,
    LW: -3, RW: -3, LB: -1.5, RB: -1.5
  };

  FKC.data.positionById = function (id) {
    return FKC.util.byId(FKC.data.positions, id);
  };

  /* Attributschlüssel für einen Spieler */
  FKC.data.keysFor = function (isGK) {
    return isGK ? FKC.data.gkAttrKeys : FKC.data.attrKeys;
  };

})(window.FKC);
