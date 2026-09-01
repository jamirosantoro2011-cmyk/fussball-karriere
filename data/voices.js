/* ── Stimmen zur Karriere ──────────────────────────────────────────────
   Der Rückblick soll mehr sein als ein Label mit Zahlen darunter.
   Deshalb kommen am Ende drei Perspektiven zusammen: die eigenen Fans,
   Expertenmeinungen und ehemalige Weggefährten.
   Bedingungen greifen auf die Kennzahlen der Karriere zu (siehe
   FKC.career.voiceContext).                                         */

window.FKC = window.FKC || {};
FKC.data = FKC.data || {};

(function (FKC) {
  'use strict';

  /* ── Die eigenen Fans — genau eine Stimme ───────────────────────── */
  var fans = [
    { id: 'fans_idol', weight: 12, tone: 'good',
      when: function (s) { return s.legend && s.fanRelation >= 70; } },
    { id: 'fans_oneClub', weight: 11, tone: 'good',
      when: function (s) { return s.clubs <= 2 && s.apps >= 200; } },
    { id: 'fans_warm', weight: 8, tone: 'good',
      when: function (s) { return s.fanRelation >= 62; } },
    { id: 'fans_trophies', weight: 9, tone: 'good',
      when: function (s) { return s.trophies >= 5 && s.fanRelation >= 50; } },
    { id: 'fans_respect', weight: 7, tone: 'mixed',
      when: function (s) { return s.fanRelation >= 45; } },
    { id: 'fans_distant', weight: 8, tone: 'mixed',
      when: function (s) { return s.clubs >= 7; } },
    { id: 'fans_betrayed', weight: 14, tone: 'bad',
      when: function (s) { return s.chasedMoney; } },
    { id: 'fans_cold', weight: 6, tone: 'bad',
      when: function (s) { return s.fanRelation < 45; } },
    { id: 'fans_neutral', weight: 2, tone: 'mixed',
      when: function () { return true; } }
  ];

  /* ── Experten und Weggefährten — zwei bis drei Stimmen ──────────── */
  var pundits = [
    { id: 'p_ceiling', kind: 'pundit', weight: 12,
      when: function (s) { return s.shortfall >= 12; } },
    { id: 'p_maxed', kind: 'pundit', weight: 11,
      when: function (s) { return s.shortfall <= 2 && s.peakOvr >= 68; } },
    { id: 'p_elite', kind: 'pundit', weight: 12,
      when: function (s) { return s.peakOvr >= 88; } },
    { id: 'p_trophies', kind: 'pundit', weight: 10,
      when: function (s) { return s.trophies >= 6; } },
    { id: 'p_noTrophies', kind: 'pundit', weight: 9,
      when: function (s) { return s.trophies === 0 && s.apps >= 250; } },
    { id: 'p_international', kind: 'pundit', weight: 12,
      when: function (s) { return s.natTitles >= 1; } },
    { id: 'p_noCaps', kind: 'pundit', weight: 9,
      when: function (s) { return s.caps === 0 && s.peakOvr >= 74; } },
    { id: 'p_manyCaps', kind: 'pundit', weight: 8,
      when: function (s) { return s.caps >= 70; } },
    { id: 'p_goals', kind: 'pundit', weight: 10,
      when: function (s) { return s.goals >= 180; } },
    { id: 'p_keeper', kind: 'pundit', weight: 9,
      when: function (s) { return s.isGK && s.apps >= 250; } },
    { id: 'p_defender', kind: 'pundit', weight: 8,
      when: function (s) { return s.group === 'DEF' && s.apps >= 250; } },
    { id: 'p_longevity', kind: 'pundit', weight: 9,
      when: function (s) { return s.retiredAt >= 36; } },
    { id: 'p_early', kind: 'pundit', weight: 10,
      when: function (s) { return s.retiredAt <= 31; } },
    { id: 'p_injuries', kind: 'pundit', weight: 11,
      when: function (s) { return s.injurySeasons >= 4; } },
    { id: 'p_journeyman', kind: 'pundit', weight: 9,
      when: function (s) { return s.clubs >= 7; } },
    { id: 'p_moneyMove', kind: 'pundit', weight: 12,
      when: function (s) { return s.chasedMoney; } },
    { id: 'p_lowerLeagues', kind: 'pundit', weight: 8,
      when: function (s) { return s.peakOvr < 66 && s.apps >= 200; } },
    { id: 'p_solid', kind: 'pundit', weight: 4,
      when: function () { return true; } },

    { id: 't_leader', kind: 'teammate', weight: 12,
      when: function (s) { return s.wasCaptain; } },
    { id: 't_worker', kind: 'teammate', weight: 9,
      when: function (s) { return s.workRate >= 72; } },
    { id: 't_quiet', kind: 'teammate', weight: 8,
      when: function (s) { return s.reputation < 55; } },
    { id: 't_talent', kind: 'teammate', weight: 10,
      when: function (s) { return s.flair >= 72; } },
    { id: 't_bigGame', kind: 'teammate', weight: 10,
      when: function (s) { return s.bigGame >= 72; } },
    { id: 't_hardTimes', kind: 'teammate', weight: 10,
      when: function (s) { return s.injurySeasons >= 3 || s.freeAgentYears >= 1; } },
    { id: 't_abroad', kind: 'teammate', weight: 8,
      when: function (s) { return s.movedAbroad; } },
    { id: 't_normal', kind: 'teammate', weight: 3,
      when: function () { return true; } },

    { id: 'c_coachTough', kind: 'coach', weight: 9,
      when: function (s) { return s.peakOvr >= 72 && s.shortfall <= 5; } },
    { id: 'c_coachRegret', kind: 'coach', weight: 10,
      when: function (s) { return s.shortfall >= 10; } },
    { id: 'c_coachProud', kind: 'coach', weight: 9,
      when: function (s) { return s.trophies >= 3; } },
    { id: 'c_coachHonest', kind: 'coach', weight: 5,
      when: function () { return true; } }
  ];

  FKC.data.voices = { fans: fans, pundits: pundits };

  /** Rollenbezeichnungen für die Sprecher */
  FKC.data.voiceRoles = {
    pundit: ['role.journalist', 'role.tvExpert', 'role.analyst'],
    teammate: ['role.exTeammate', 'role.captainOf', 'role.roommate'],
    coach: ['role.exCoach', 'role.academyHead', 'role.scout']
  };

})(window.FKC);
