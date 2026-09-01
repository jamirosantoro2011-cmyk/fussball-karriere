/* ── Ereignisse nach Startpunkt ────────────────────────────────────────
   Drei Startwege, drei sehr verschiedene Kindheiten. Statt überall
   dieselben Szenen zu zeigen, bekommt jeder Weg eigene:

     village  Dorf- oder Amateurverein — knappe Mittel, weite Wege,
              kaum Beobachtung; die Chance kommt zufällig vorbei
     nlz      Nachwuchsleistungszentrum eines Profivereins — Struktur,
              Plan, Sichtungen, Konkurrenz auf normalem Niveau
     academy  Akademie eines Topvereins — beste Ausbildung, aber
              dreissig gleich gute Talente und ein Name, der drückt

   Das Feld `starts` steuert die Zuordnung; gefiltert wird zentral in
   js/engine/events.js, für den Ereignispool und die festen Stationen
   gleichermassen.                                                    */

window.FKC = window.FKC || {};
FKC.data = FKC.data || {};

(function (FKC) {
  'use strict';

  var K = function (id, part) { return 'ev.' + id + '.' + part; };

  /* ══ Feste Stationen: Gegenstücke zum Dorfweg ══════════════════════
     Alter 6, 9 und 11 haben im Dorfweg feste Szenen. Ohne Entsprechung
     hätten NLZ- und Akademiekarrieren dort schlicht Lücken.        */

  var spine = [

    /* ── Alter 6 ─────────────────────────────────────────────────── */
    {
      id: 'first_ball_nlz', spine: true, phase: 'childhood', age: 6, category: 'youth',
      starts: ['nlz'],
      title: K('first_ball_nlz', 'title'), text: K('first_ball_nlz', 'text'),
      textParams: function (g) { return { club: clubName(g), town: g.origin.town }; },
      choices: [
        { id: 'system', label: K('first_ball_nlz', 'system'), desc: K('first_ball_nlz', 'system_d'),
          risk: 'low', result: K('first_ball_nlz', 'system_r'),
          effects: function (g) {
            return [
              { type: 'flag', key: 'upbringing', value: 'club' },
              { type: 'attr', key: g.identity.isGK ? 'positioning' : 'passing', delta: 4 },
              { type: 'hidden', key: 'discipline', delta: 6 },
              { type: 'morale', delta: 4 }
            ];
          } },
        { id: 'street', label: K('first_ball_nlz', 'street'), desc: K('first_ball_nlz', 'street_d'),
          risk: 'medium', result: K('first_ball_nlz', 'street_r'),
          effects: function (g) {
            return [
              { type: 'flag', key: 'upbringing', value: 'street' },
              { type: 'attr', key: g.identity.isGK ? 'reflexes' : 'dribbling', delta: 5 },
              { type: 'hidden', key: 'flair', delta: 7 },
              { type: 'hidden', key: 'discipline', delta: -5 }
            ];
          } },
        { id: 'easy', label: K('first_ball_nlz', 'easy'), desc: K('first_ball_nlz', 'easy_d'),
          risk: 'medium', result: K('first_ball_nlz', 'easy_r'),
          effects: [
            { type: 'flag', key: 'upbringing', value: 'late' },
            { type: 'education', delta: 10 },
            { type: 'morale', delta: 8 },
            { type: 'growthBonus', points: -3 }
          ] }
      ]
    },

    {
      id: 'first_ball_aca', spine: true, phase: 'childhood', age: 6, category: 'youth',
      starts: ['academy'],
      title: K('first_ball_aca', 'title'), text: K('first_ball_aca', 'text'),
      textParams: function (g) { return { club: clubName(g), town: g.origin.town }; },
      choices: [
        { id: 'belong', label: K('first_ball_aca', 'belong'), desc: K('first_ball_aca', 'belong_d'),
          risk: 'low', result: K('first_ball_aca', 'belong_r'),
          effects: function (g) {
            return [
              { type: 'flag', key: 'upbringing', value: 'club' },
              { type: 'attr', key: g.identity.isGK ? 'handling' : 'dribbling', delta: 4 },
              { type: 'hidden', key: 'workRate', delta: 6 },
              { type: 'reputation', delta: 3 }
            ];
          } },
        { id: 'quiet', label: K('first_ball_aca', 'quiet'), desc: K('first_ball_aca', 'quiet_d'),
          risk: 'medium', result: K('first_ball_aca', 'quiet_r'),
          effects: [
            { type: 'flag', key: 'upbringing', value: 'club' },
            { type: 'hidden', key: 'mentality', delta: 8 },
            { type: 'morale', delta: -4 },
            { type: 'attrAll', delta: 1 }
          ] },
        { id: 'homefirst', label: K('first_ball_aca', 'homefirst'), desc: K('first_ball_aca', 'homefirst_d'),
          risk: 'medium', result: K('first_ball_aca', 'homefirst_r'),
          effects: [
            { type: 'flag', key: 'upbringing', value: 'street' },
            { type: 'familySupport', delta: 8 },
            { type: 'homesick', delta: -8 },
            { type: 'growthBonus', points: -2 }
          ] }
      ]
    },

    /* ── Alter 9 ─────────────────────────────────────────────────── */
    {
      id: 'nlz_first_review', spine: true, phase: 'childhood', age: 9, category: 'youth',
      starts: ['nlz'],
      title: K('nlz_first_review', 'title'), text: K('nlz_first_review', 'text'),
      textParams: function (g) { return { club: clubName(g) }; },
      choices: [
        { id: 'target', label: K('nlz_first_review', 'target'), desc: K('nlz_first_review', 'target_d'),
          risk: 'low', result: K('nlz_first_review', 'target_r'),
          effects: function (g) {
            return [
              { type: 'attr', key: weakest(g), delta: 5 },
              { type: 'hidden', key: 'discipline', delta: 6 },
              { type: 'growthBonus', points: 4 }
            ];
          } },
        { id: 'strength', label: K('nlz_first_review', 'strength'), desc: K('nlz_first_review', 'strength_d'),
          risk: 'medium', result: K('nlz_first_review', 'strength_r'),
          effects: function (g) {
            return [
              { type: 'attr', key: g.hidden.playstyle, delta: 6 },
              { type: 'morale', delta: 6 },
              { type: 'growthBonus', points: -2 }
            ];
          } },
        { id: 'ignore', label: K('nlz_first_review', 'ignore'), desc: K('nlz_first_review', 'ignore_d'),
          risk: 'high', result: K('nlz_first_review', 'ignore_r'),
          effects: [
            { type: 'hidden', key: 'flair', delta: 6 },
            { type: 'hidden', key: 'discipline', delta: -8 },
            { type: 'reputation', delta: -3 }
          ] }
      ]
    },

    {
      id: 'aca_first_cut', spine: true, phase: 'childhood', age: 9, category: 'youth',
      starts: ['academy'],
      title: K('aca_first_cut', 'title'), text: K('aca_first_cut', 'text'),
      textParams: function (g) { return { club: clubName(g) }; },
      choices: [
        { id: 'work', label: K('aca_first_cut', 'work'), desc: K('aca_first_cut', 'work_d'),
          risk: 'low', result: K('aca_first_cut', 'work_r'),
          effects: [
            { type: 'hidden', key: 'workRate', delta: 9 },
            { type: 'growthBonus', points: 5 },
            { type: 'morale', delta: -4 }
          ] },
        { id: 'friend', label: K('aca_first_cut', 'friend'), desc: K('aca_first_cut', 'friend_d'),
          risk: 'low', result: K('aca_first_cut', 'friend_r'),
          effects: [
            { type: 'hidden', key: 'mentality', delta: 8 },
            { type: 'morale', delta: 6 },
            { type: 'attrAll', delta: 1 }
          ] },
        { id: 'fear', label: K('aca_first_cut', 'fear'), desc: K('aca_first_cut', 'fear_d'),
          risk: 'high', result: K('aca_first_cut', 'fear_r'),
          effects: [
            { type: 'morale', delta: -12 },
            { type: 'hidden', key: 'consistency', delta: -5 },
            { type: 'hidden', key: 'mentality', delta: 6 }
          ] }
      ]
    },

    /* ── Alter 11 ────────────────────────────────────────────────────
       Setzt wie academy_trial die Note `trialGrade`, weil davon die
       Vereinsangebote mit zwölf abhängen.                          */
    {
      id: 'nlz_step_up', spine: true, phase: 'childhood', age: 11, category: 'youth',
      starts: ['nlz'],
      title: K('nlz_step_up', 'title'), text: K('nlz_step_up', 'text'),
      textParams: function (g) { return { club: clubName(g) }; },
      choices: [
        { id: 'accept', label: K('nlz_step_up', 'accept'), desc: K('nlz_step_up', 'accept_d'), risk: 'medium',
          outcomes: [
            { p: 0.58, text: K('nlz_step_up', 'accept_ok'),
              pMod: function (g) { return 0.6 + g.hidden.bigGame / 130; },
              effects: [
                { type: 'flag', key: 'trialGrade', value: 'strong' },
                { type: 'reputation', delta: 6 }, { type: 'morale', delta: 8 },
                { type: 'growthBonus', points: 5 }
              ] },
            { p: 0.42, text: K('nlz_step_up', 'accept_bad'),
              effects: [
                { type: 'flag', key: 'trialGrade', value: 'solid' },
                { type: 'morale', delta: -8 }, { type: 'hidden', key: 'mentality', delta: 6 },
                { type: 'attr', key: 'physical', delta: 2 }
              ] }
          ] },
        { id: 'stay', label: K('nlz_step_up', 'stay'), desc: K('nlz_step_up', 'stay_d'),
          risk: 'low', result: K('nlz_step_up', 'stay_r'),
          effects: [
            { type: 'flag', key: 'trialGrade', value: 'solid' },
            { type: 'growthBonus', points: 3 }, { type: 'morale', delta: 5 },
            { type: 'hidden', key: 'consistency', delta: 5 }
          ] }
      ]
    },

    {
      id: 'aca_internal_ranking', spine: true, phase: 'childhood', age: 11, category: 'youth',
      starts: ['academy'],
      title: K('aca_internal_ranking', 'title'), text: K('aca_internal_ranking', 'text'),
      textParams: function (g) { return { club: clubName(g) }; },
      choices: [
        { id: 'push', label: K('aca_internal_ranking', 'push'), desc: K('aca_internal_ranking', 'push_d'), risk: 'high',
          outcomes: [
            { p: 0.5, text: K('aca_internal_ranking', 'push_ok'),
              pMod: function (g) { return 0.55 + g.hidden.workRate / 120; },
              effects: [
                { type: 'flag', key: 'trialGrade', value: 'strong' },
                { type: 'reputation', delta: 8 }, { type: 'growthBonus', points: 6 },
                { type: 'morale', delta: 8 }
              ] },
            { p: 0.5, text: K('aca_internal_ranking', 'push_bad'),
              effects: [
                { type: 'flag', key: 'trialGrade', value: 'weak' },
                { type: 'morale', delta: -14 }, { type: 'fitness', delta: -8 },
                { type: 'hidden', key: 'mentality', delta: 7 }
              ] }
          ] },
        { id: 'steady', label: K('aca_internal_ranking', 'steady'), desc: K('aca_internal_ranking', 'steady_d'),
          risk: 'low', result: K('aca_internal_ranking', 'steady_r'),
          effects: [
            { type: 'flag', key: 'trialGrade', value: 'solid' },
            { type: 'hidden', key: 'consistency', delta: 8 },
            { type: 'growthBonus', points: 3 }
          ] }
      ]
    }
  ];

  /* ══ Ereignispool ══════════════════════════════════════════════════ */

  var pool = [

    /* ── Dorf- und Amateurverein ─────────────────────────────────── */

    {
      id: 'vil_scout_visit', category: 'club', phases: ['childhood', 'youth'],
      starts: ['village'], weight: 9, once: true, minAge: 9, maxAge: 15,
      weightMod: function (g) { return 0.5 + g.hidden.potential / 90; },
      title: K('vil_scout_visit', 'title'), text: K('vil_scout_visit', 'text'),
      choices: [
        { id: 'showoff', label: K('vil_scout_visit', 'showoff'), desc: K('vil_scout_visit', 'showoff_d'), risk: 'high',
          outcomes: [
            { p: 0.45, text: K('vil_scout_visit', 'showoff_ok'),
              pMod: function (g) { return 0.5 + g.hidden.bigGame / 110; },
              effects: [{ type: 'reputation', delta: 12 }, { type: 'morale', delta: 12 },
                        { type: 'growthBonus', points: 5 },
                        { type: 'timeline', key: 'tl.scouted', mark: 'good' }] },
            { p: 0.55, text: K('vil_scout_visit', 'showoff_bad'),
              effects: [{ type: 'morale', delta: -10 }, { type: 'hidden', key: 'bigGame', delta: 6 },
                        { type: 'reputation', delta: -2 }] }
          ] },
        { id: 'normal', label: K('vil_scout_visit', 'normal'), desc: K('vil_scout_visit', 'normal_d'), risk: 'medium',
          outcomes: [
            { p: 0.6, text: K('vil_scout_visit', 'normal_ok'),
              effects: [{ type: 'reputation', delta: 7 }, { type: 'hidden', key: 'consistency', delta: 5 },
                        { type: 'morale', delta: 5 }] },
            { p: 0.4, text: K('vil_scout_visit', 'normal_bad'),
              effects: [{ type: 'reputation', delta: 1 }, { type: 'hidden', key: 'mentality', delta: 4 }] }
          ] },
        { id: 'nervous', label: K('vil_scout_visit', 'nervous'), desc: K('vil_scout_visit', 'nervous_d'), risk: 'medium',
          result: K('vil_scout_visit', 'nervous_r'),
          effects: [{ type: 'morale', delta: -8 }, { type: 'hidden', key: 'bigGame', delta: 9 }] }
      ]
    },

    {
      id: 'vil_travel', category: 'private', phases: ['childhood', 'youth'],
      starts: ['village'], weight: 7, cooldown: 4, minAge: 8, maxAge: 16,
      title: K('vil_travel', 'title'), text: K('vil_travel', 'text'),
      choices: [
        { id: 'always', label: K('vil_travel', 'always'), desc: K('vil_travel', 'always_d'), risk: 'medium',
          result: K('vil_travel', 'always_r'),
          effects: [{ type: 'hidden', key: 'workRate', delta: 7 }, { type: 'familySupport', delta: -5 },
                    { type: 'money', delta: -600 }, { type: 'growthBonus', points: 4 }] },
        { id: 'carpool', label: K('vil_travel', 'carpool'), desc: K('vil_travel', 'carpool_d'), risk: 'low',
          result: K('vil_travel', 'carpool_r'),
          effects: [{ type: 'morale', delta: 7 }, { type: 'loyalty', delta: 8 },
                    { type: 'hidden', key: 'mentality', delta: 4 }] },
        { id: 'skip', label: K('vil_travel', 'skip'), desc: K('vil_travel', 'skip_d'), risk: 'medium',
          result: K('vil_travel', 'skip_r'),
          effects: [{ type: 'growthBonus', points: -5 }, { type: 'education', delta: 6 },
                    { type: 'fitness', delta: 4 }] }
      ]
    },

    {
      id: 'vil_pitch_state', category: 'sport', phases: ['childhood', 'youth'],
      starts: ['village'], weight: 7, cooldown: 4, minAge: 7, maxAge: 16,
      title: K('vil_pitch_state', 'title'), text: K('vil_pitch_state', 'text'),
      choices: [
        { id: 'help', label: K('vil_pitch_state', 'help'), desc: K('vil_pitch_state', 'help_d'), risk: 'low',
          result: K('vil_pitch_state', 'help_r'),
          effects: [{ type: 'loyalty', delta: 14 }, { type: 'attr', key: 'physical', delta: 3 },
                    { type: 'growthBonus', points: -2 }] },
        { id: 'improvise', label: K('vil_pitch_state', 'improvise'), desc: K('vil_pitch_state', 'improvise_d'), risk: 'medium',
          result: K('vil_pitch_state', 'improvise_r'),
          effects: function (g) {
            return [{ type: 'attr', key: g.identity.isGK ? 'reflexes' : 'dribbling', delta: 4 },
                    { type: 'hidden', key: 'flair', delta: 6 },
                    { type: 'hidden', key: 'injuryProneness', delta: 4 }];
          } },
        { id: 'complain', label: K('vil_pitch_state', 'complain'), desc: K('vil_pitch_state', 'complain_d'), risk: 'medium',
          result: K('vil_pitch_state', 'complain_r'),
          effects: [{ type: 'morale', delta: -6 }, { type: 'loyalty', delta: -8 },
                    { type: 'hidden', key: 'mentality', delta: 5 }] }
      ]
    },

    {
      id: 'vil_coach_limits', category: 'youth', phases: ['childhood', 'youth'],
      starts: ['village'], weight: 6, once: true, minAge: 10, maxAge: 16,
      title: K('vil_coach_limits', 'title'), text: K('vil_coach_limits', 'text'),
      choices: [
        { id: 'selftrain', label: K('vil_coach_limits', 'selftrain'), desc: K('vil_coach_limits', 'selftrain_d'), risk: 'medium',
          result: K('vil_coach_limits', 'selftrain_r'),
          effects: function (g) {
            return [{ type: 'attr', key: g.hidden.playstyle, delta: 5 },
                    { type: 'hidden', key: 'workRate', delta: 8 },
                    { type: 'hidden', key: 'discipline', delta: -3 }];
          } },
        { id: 'respect', label: K('vil_coach_limits', 'respect'), desc: K('vil_coach_limits', 'respect_d'), risk: 'low',
          result: K('vil_coach_limits', 'respect_r'),
          effects: [{ type: 'loyalty', delta: 12 }, { type: 'hidden', key: 'mentality', delta: 6 },
                    { type: 'morale', delta: 5 }] },
        { id: 'leave', label: K('vil_coach_limits', 'leave'), desc: K('vil_coach_limits', 'leave_d'), risk: 'high',
          outcomes: [
            { p: 0.55, text: K('vil_coach_limits', 'leave_ok'),
              effects: [{ type: 'growthBonus', points: 7 }, { type: 'reputation', delta: 4 },
                        { type: 'loyalty', delta: -15 }] },
            { p: 0.45, text: K('vil_coach_limits', 'leave_bad'),
              effects: [{ type: 'morale', delta: -12 }, { type: 'loyalty', delta: -10 },
                        { type: 'growthBonus', points: -3 }] }
          ] }
      ]
    },

    {
      id: 'vil_team_folds', category: 'club', phases: ['childhood', 'youth'],
      starts: ['village'], weight: 5, once: true, minAge: 11, maxAge: 16,
      title: K('vil_team_folds', 'title'), text: K('vil_team_folds', 'text'),
      choices: [
        { id: 'older', label: K('vil_team_folds', 'older'), desc: K('vil_team_folds', 'older_d'), risk: 'high',
          outcomes: [
            { p: 0.55, text: K('vil_team_folds', 'older_ok'),
              pMod: function (g) { return 0.5 + g.attributes.physical / 100; },
              effects: [{ type: 'attr', key: 'physical', delta: 5 },
                        { type: 'hidden', key: 'mentality', delta: 8 },
                        { type: 'growthBonus', points: 6 }] },
            { p: 0.45, text: K('vil_team_folds', 'older_bad'),
              effects: [{ type: 'injury', weeks: 7 }, { type: 'morale', delta: -8 },
                        { type: 'hidden', key: 'mentality', delta: 5 }] }
          ] },
        { id: 'neighbour', label: K('vil_team_folds', 'neighbour'), desc: K('vil_team_folds', 'neighbour_d'), risk: 'medium',
          result: K('vil_team_folds', 'neighbour_r'),
          effects: [{ type: 'growthBonus', points: 4 }, { type: 'loyalty', delta: -10 },
                    { type: 'money', delta: -400 }] },
        { id: 'pause', label: K('vil_team_folds', 'pause'), desc: K('vil_team_folds', 'pause_d'), risk: 'high',
          result: K('vil_team_folds', 'pause_r'),
          effects: [{ type: 'growthBonus', points: -8 }, { type: 'education', delta: 10 },
                    { type: 'morale', delta: -6 }] }
      ]
    },

    /* ── Akademie eines Topvereins ───────────────────────────────── */

    {
      id: 'aca_competition', category: 'sport', phases: ['childhood', 'youth'],
      starts: ['academy'], weight: 9, cooldown: 3, minAge: 8, maxAge: 18,
      title: K('aca_competition', 'title'), text: K('aca_competition', 'text'),
      choices: [
        { id: 'outwork', label: K('aca_competition', 'outwork'), desc: K('aca_competition', 'outwork_d'), risk: 'medium',
          outcomes: [
            { p: 0.6, text: K('aca_competition', 'outwork_ok'),
              pMod: function (g) { return 0.5 + g.hidden.workRate / 110; },
              effects: [{ type: 'growthBonus', points: 7 }, { type: 'reputation', delta: 5 },
                        { type: 'fitness', delta: -6 }] },
            { p: 0.4, text: K('aca_competition', 'outwork_bad'),
              effects: [{ type: 'fitness', delta: -12 }, { type: 'morale', delta: -8 },
                        { type: 'hidden', key: 'injuryProneness', delta: 5 }] }
          ] },
        { id: 'learn', label: K('aca_competition', 'learn'), desc: K('aca_competition', 'learn_d'), risk: 'low',
          result: K('aca_competition', 'learn_r'),
          effects: function (g) {
            return [{ type: 'attr', key: weakest(g), delta: 4 },
                    { type: 'hidden', key: 'mentality', delta: 6 },
                    { type: 'morale', delta: 4 }];
          } },
        { id: 'elbows', label: K('aca_competition', 'elbows'), desc: K('aca_competition', 'elbows_d'), risk: 'high',
          result: K('aca_competition', 'elbows_r'),
          effects: [{ type: 'reputation', delta: 4 }, { type: 'hidden', key: 'mentality', delta: 7 },
                    { type: 'morale', delta: -6 }, { type: 'loyalty', delta: -6 }] }
      ]
    },

    {
      id: 'aca_big_name', category: 'media', phases: ['youth'],
      starts: ['academy'], weight: 8, cooldown: 4, minAge: 13, maxAge: 19,
      title: K('aca_big_name', 'title'), text: K('aca_big_name', 'text'),
      textParams: function (g) { return { club: clubName(g) }; },
      choices: [
        { id: 'embrace', label: K('aca_big_name', 'embrace'), desc: K('aca_big_name', 'embrace_d'), risk: 'medium',
          outcomes: [
            { p: 0.55, text: K('aca_big_name', 'embrace_ok'),
              pMod: function (g) { return 0.5 + g.hidden.bigGame / 110; },
              effects: [{ type: 'reputation', delta: 10 }, { type: 'morale', delta: 8 },
                        { type: 'hidden', key: 'bigGame', delta: 7 }] },
            { p: 0.45, text: K('aca_big_name', 'embrace_bad'),
              effects: [{ type: 'reputation', delta: -4 }, { type: 'morale', delta: -10 },
                        { type: 'hidden', key: 'consistency', delta: -4 }] }
          ] },
        { id: 'shield', label: K('aca_big_name', 'shield'), desc: K('aca_big_name', 'shield_d'), risk: 'low',
          result: K('aca_big_name', 'shield_r'),
          effects: [{ type: 'hidden', key: 'consistency', delta: 7 }, { type: 'morale', delta: 5 },
                    { type: 'reputation', delta: -2 }] },
        { id: 'burden', label: K('aca_big_name', 'burden'), desc: K('aca_big_name', 'burden_d'), risk: 'high',
          result: K('aca_big_name', 'burden_r'),
          effects: [{ type: 'morale', delta: -12 }, { type: 'hidden', key: 'bigGame', delta: -5 },
                    { type: 'hidden', key: 'mentality', delta: 8 }] }
      ]
    },

    {
      id: 'aca_homesick_abroad', category: 'private', phases: ['childhood', 'youth'],
      starts: ['academy'], weight: 8, once: true, minAge: 10, maxAge: 18,
      when: function (g) { return g.flags.movedAway || g.career.life.homesick >= 8; },
      title: K('aca_homesick_abroad', 'title'), text: K('aca_homesick_abroad', 'text'),
      choices: [
        { id: 'language', label: K('aca_homesick_abroad', 'language'), desc: K('aca_homesick_abroad', 'language_d'), risk: 'low',
          result: K('aca_homesick_abroad', 'language_r'),
          effects: [{ type: 'hidden', key: 'adaptability', delta: 12 }, { type: 'homesick', delta: -14 },
                    { type: 'education', delta: 8 }] },
        { id: 'clique', label: K('aca_homesick_abroad', 'clique'), desc: K('aca_homesick_abroad', 'clique_d'), risk: 'medium',
          result: K('aca_homesick_abroad', 'clique_r'),
          effects: [{ type: 'morale', delta: 9 }, { type: 'homesick', delta: -6 },
                    { type: 'hidden', key: 'adaptability', delta: -4 }] },
        { id: 'gohome', label: K('aca_homesick_abroad', 'gohome'), desc: K('aca_homesick_abroad', 'gohome_d'), risk: 'high',
          result: K('aca_homesick_abroad', 'gohome_r'),
          effects: [{ type: 'homesick', delta: -22 }, { type: 'morale', delta: 10 },
                    { type: 'growthBonus', points: -7 }, { type: 'reputation', delta: -4 }] }
      ]
    },

    {
      id: 'aca_cut_day', category: 'club', phases: ['youth'],
      starts: ['academy'], weight: 8, cooldown: 4, minAge: 12, maxAge: 18,
      title: K('aca_cut_day', 'title'), text: K('aca_cut_day', 'text'),
      choices: [
        { id: 'support', label: K('aca_cut_day', 'support'), desc: K('aca_cut_day', 'support_d'), risk: 'low',
          result: K('aca_cut_day', 'support_r'),
          effects: [{ type: 'hidden', key: 'mentality', delta: 9 }, { type: 'morale', delta: -5 },
                    { type: 'loyalty', delta: 6 }] },
        { id: 'harden', label: K('aca_cut_day', 'harden'), desc: K('aca_cut_day', 'harden_d'), risk: 'medium',
          result: K('aca_cut_day', 'harden_r'),
          effects: [{ type: 'hidden', key: 'workRate', delta: 8 }, { type: 'growthBonus', points: 5 },
                    { type: 'hidden', key: 'mentality', delta: -3 }] },
        { id: 'shaken', label: K('aca_cut_day', 'shaken'), desc: K('aca_cut_day', 'shaken_d'), risk: 'high',
          result: K('aca_cut_day', 'shaken_r'),
          effects: [{ type: 'morale', delta: -14 }, { type: 'hidden', key: 'consistency', delta: -6 },
                    { type: 'education', delta: 8 }] }
      ]
    },

    {
      id: 'aca_first_team_day', category: 'club', phases: ['youth'],
      starts: ['academy'], weight: 6, once: true, minAge: 15, maxAge: 19,
      weightMod: function (g) { return 0.4 + g.ovr / 80; },
      title: K('aca_first_team_day', 'title'), text: K('aca_first_team_day', 'text'),
      textParams: function (g) { return { club: clubName(g) }; },
      choices: [
        { id: 'bold', label: K('aca_first_team_day', 'bold'), desc: K('aca_first_team_day', 'bold_d'), risk: 'high',
          outcomes: [
            { p: 0.45, text: K('aca_first_team_day', 'bold_ok'),
              pMod: function (g) { return 0.4 + g.hidden.bigGame / 100; },
              effects: [{ type: 'reputation', delta: 14 }, { type: 'growthBonus', points: 8 },
                        { type: 'morale', delta: 12 },
                        { type: 'timeline', key: 'tl.firstTeamDay', mark: 'good' }] },
            { p: 0.55, text: K('aca_first_team_day', 'bold_bad'),
              effects: [{ type: 'morale', delta: -10 }, { type: 'hidden', key: 'bigGame', delta: 8 }] }
          ] },
        { id: 'watch', label: K('aca_first_team_day', 'watch'), desc: K('aca_first_team_day', 'watch_d'), risk: 'low',
          result: K('aca_first_team_day', 'watch_r'),
          effects: function (g) {
            return [{ type: 'attr', key: g.identity.isGK ? 'positioning' : 'passing', delta: 4 },
                    { type: 'hidden', key: 'mentality', delta: 6 },
                    { type: 'growthBonus', points: 4 }];
          } }
      ]
    },

    /* ── NLZ eines Profivereins ──────────────────────────────────── */

    {
      id: 'nlz_dev_plan', category: 'club', phases: ['youth'],
      starts: ['nlz'], weight: 8, cooldown: 4, minAge: 12, maxAge: 18,
      title: K('nlz_dev_plan', 'title'), text: K('nlz_dev_plan', 'text'),
      choices: [
        { id: 'follow', label: K('nlz_dev_plan', 'follow'), desc: K('nlz_dev_plan', 'follow_d'), risk: 'low',
          result: K('nlz_dev_plan', 'follow_r'),
          effects: function (g) {
            return [{ type: 'attr', key: weakest(g), delta: 6 },
                    { type: 'hidden', key: 'discipline', delta: 6 },
                    { type: 'growthBonus', points: 5 }];
          } },
        { id: 'negotiate', label: K('nlz_dev_plan', 'negotiate'), desc: K('nlz_dev_plan', 'negotiate_d'), risk: 'medium',
          outcomes: [
            { p: 0.55, text: K('nlz_dev_plan', 'negotiate_ok'),
              pMod: function (g) { return 0.5 + g.hidden.mentality / 110; },
              effects: function (g) {
                return [{ type: 'attr', key: g.hidden.playstyle, delta: 6 },
                        { type: 'reputation', delta: 4 }, { type: 'morale', delta: 7 }];
              } },
            { p: 0.45, text: K('nlz_dev_plan', 'negotiate_bad'),
              effects: [{ type: 'morale', delta: -7 }, { type: 'reputation', delta: -3 },
                        { type: 'hidden', key: 'mentality', delta: 5 }] }
          ] },
        { id: 'ignore', label: K('nlz_dev_plan', 'ignore'), desc: K('nlz_dev_plan', 'ignore_d'), risk: 'high',
          result: K('nlz_dev_plan', 'ignore_r'),
          effects: [{ type: 'hidden', key: 'flair', delta: 7 }, { type: 'growthBonus', points: -5 },
                    { type: 'hidden', key: 'discipline', delta: -8 }] }
      ]
    },

    {
      id: 'nlz_poach', category: 'club', phases: ['youth'],
      starts: ['nlz'], weight: 8, cooldown: 4, minAge: 13, maxAge: 18,
      weightMod: function (g) { return 0.4 + g.ovr / 75; },
      title: K('nlz_poach', 'title'), text: K('nlz_poach', 'text'),
      choices: [
        { id: 'move', label: K('nlz_poach', 'move'), desc: K('nlz_poach', 'move_d'), risk: 'high',
          outcomes: [
            { p: 0.5, text: K('nlz_poach', 'move_ok'),
              pMod: function (g) { return 0.45 + g.hidden.adaptability / 110; },
              effects: [{ type: 'growthBonus', points: 9 }, { type: 'reputation', delta: 7 },
                        { type: 'loyalty', delta: -18 }, { type: 'homesick', delta: 8 }] },
            { p: 0.5, text: K('nlz_poach', 'move_bad'),
              effects: [{ type: 'growthBonus', points: -6 }, { type: 'morale', delta: -12 },
                        { type: 'homesick', delta: 14 }, { type: 'loyalty', delta: -12 }] }
          ] },
        { id: 'leverage', label: K('nlz_poach', 'leverage'), desc: K('nlz_poach', 'leverage_d'), risk: 'medium',
          outcomes: [
            { p: 0.6, text: K('nlz_poach', 'leverage_ok'),
              effects: [{ type: 'growthBonus', points: 5 }, { type: 'reputation', delta: 5 },
                        { type: 'morale', delta: 6 }] },
            { p: 0.4, text: K('nlz_poach', 'leverage_bad'),
              effects: [{ type: 'loyalty', delta: -10 }, { type: 'morale', delta: -8 }] }
          ] },
        { id: 'stay', label: K('nlz_poach', 'stay'), desc: K('nlz_poach', 'stay_d'), risk: 'low',
          result: K('nlz_poach', 'stay_r'),
          effects: [{ type: 'loyalty', delta: 16 }, { type: 'morale', delta: 6 },
                    { type: 'hidden', key: 'consistency', delta: 5 }] }
      ]
    },

    {
      id: 'nlz_youth_scouting', category: 'sport', phases: ['youth'],
      starts: ['nlz'], weight: 8, once: true, minAge: 14, maxAge: 18,
      weightMod: function (g) { return 0.4 + g.ovr / 80; },
      title: K('nlz_youth_scouting', 'title'), text: K('nlz_youth_scouting', 'text'),
      textParams: function (g) { return { nation: FKC.data.nationName(g.identity.nationality) }; },
      choices: [
        { id: 'go', label: K('nlz_youth_scouting', 'go'), desc: K('nlz_youth_scouting', 'go_d'), risk: 'medium',
          outcomes: [
            { p: 0.55, text: K('nlz_youth_scouting', 'go_ok'),
              pMod: function (g) { return 0.45 + g.ovr / 90; },
              effects: [{ type: 'reputation', delta: 12 }, { type: 'morale', delta: 10 },
                        { type: 'growthBonus', points: 5 },
                        { type: 'timeline', key: 'tl.youthNational', mark: 'good' }] },
            { p: 0.45, text: K('nlz_youth_scouting', 'go_bad'),
              effects: [{ type: 'morale', delta: -9 }, { type: 'hidden', key: 'mentality', delta: 7 },
                        { type: 'reputation', delta: 2 }] }
          ] },
        { id: 'club_first', label: K('nlz_youth_scouting', 'club_first'), desc: K('nlz_youth_scouting', 'club_first_d'), risk: 'low',
          result: K('nlz_youth_scouting', 'club_first_r'),
          effects: [{ type: 'loyalty', delta: 10 }, { type: 'growthBonus', points: 4 },
                    { type: 'fitness', delta: 6 }] }
      ]
    },

    {
      id: 'nlz_school_deal', category: 'private', phases: ['youth'],
      starts: ['nlz'], weight: 7, once: true, minAge: 13, maxAge: 17,
      title: K('nlz_school_deal', 'title'), text: K('nlz_school_deal', 'text'),
      choices: [
        { id: 'sportschool', label: K('nlz_school_deal', 'sportschool'), desc: K('nlz_school_deal', 'sportschool_d'), risk: 'low',
          result: K('nlz_school_deal', 'sportschool_r'),
          effects: [{ type: 'flag', key: 'sportSchool', value: true },
                    { type: 'growthBonus', points: 7 }, { type: 'education', delta: -5 }] },
        { id: 'balance', label: K('nlz_school_deal', 'balance'), desc: K('nlz_school_deal', 'balance_d'), risk: 'medium',
          result: K('nlz_school_deal', 'balance_r'),
          effects: [{ type: 'education', delta: 12 }, { type: 'growthBonus', points: 2 },
                    { type: 'hidden', key: 'discipline', delta: 6 }] },
        { id: 'football_only', label: K('nlz_school_deal', 'football_only'), desc: K('nlz_school_deal', 'football_only_d'), risk: 'high',
          result: K('nlz_school_deal', 'football_only_r'),
          effects: [{ type: 'growthBonus', points: 9 }, { type: 'education', delta: -18 },
                    { type: 'familySupport', delta: -8 }] }
      ]
    },

    {
      id: 'nlz_reserves', category: 'club', phases: ['youth'],
      starts: ['nlz'], weight: 7, once: true, minAge: 16, maxAge: 19,
      weightMod: function (g) { return 0.4 + g.ovr / 80; },
      title: K('nlz_reserves', 'title'), text: K('nlz_reserves', 'text'),
      choices: [
        { id: 'accept', label: K('nlz_reserves', 'accept'), desc: K('nlz_reserves', 'accept_d'), risk: 'medium',
          outcomes: [
            { p: 0.6, text: K('nlz_reserves', 'accept_ok'),
              pMod: function (g) { return 0.5 + g.attributes.physical / 120; },
              effects: [{ type: 'attr', key: 'physical', delta: 5 },
                        { type: 'growthBonus', points: 7 }, { type: 'reputation', delta: 6 }] },
            { p: 0.4, text: K('nlz_reserves', 'accept_bad'),
              effects: [{ type: 'injury', weeks: 6 }, { type: 'morale', delta: -8 },
                        { type: 'attr', key: 'physical', delta: 2 }] }
          ] },
        { id: 'stay', label: K('nlz_reserves', 'stay'), desc: K('nlz_reserves', 'stay_d'), risk: 'low',
          result: K('nlz_reserves', 'stay_r'),
          effects: [{ type: 'morale', delta: 7 }, { type: 'hidden', key: 'consistency', delta: 6 },
                    { type: 'growthBonus', points: 2 }] }
      ]
    }
  ];

  /* ── Hilfen ──────────────────────────────────────────────────────── */

  function clubName(g) {
    var c = FKC.state.club();
    return c ? c.name : g.origin.villageClubName;
  }

  /** Schwächstes Attribut — für „an den Defiziten arbeiten" */
  function weakest(g) {
    var keys = FKC.data.keysFor(g.identity.isGK);
    var lo = keys[0];
    keys.forEach(function (k) { if (g.attributes[k] < g.attributes[lo]) lo = k; });
    return lo;
  }

  FKC.data.spine = (FKC.data.spine || []).concat(spine);
  FKC.data.eventsStart = pool;
  /* Registrierung passiert gebündelt in js/main.js — die Engine ist beim
     Laden der Datendateien noch gar nicht da. */

})(window.FKC);
