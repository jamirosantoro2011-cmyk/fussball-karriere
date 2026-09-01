/* ── Kindheit & Jugend: feste Szenen + Ereignispool ────────────────────
   "Spine"-Szenen sind der rote Faden (jedes Jahr eine feste Station).
   Der Ereignispool füllt die Jahre dazwischen mit Zufall.
   Alle Texte liegen als Schlüssel im Sprachobjekt (i18n/*.js).       */

window.FKC = window.FKC || {};
FKC.data = FKC.data || {};

(function (FKC) {
  'use strict';

  var K = function (id, part) { return 'ev.' + id + '.' + part; };

  /* ══ Feste Stationen ═══════════════════════════════════════════════ */

  var spine = [

    /* ── Alter 6: der erste Ball ─────────────────────────────────── */
    {
      id: 'first_ball', spine: true, phase: 'childhood', age: 6, category: 'youth',
      starts: ['village'],
      title: K('first_ball', 'title'), text: K('first_ball', 'text'),
      textParams: function (g) { return { town: g.origin.town, club: g.origin.villageClubName }; },
      choices: [
        { id: 'club', label: K('first_ball', 'club'), desc: K('first_ball', 'club_d'), risk: 'low',
          result: K('first_ball', 'club_r'),
          effects: function (g) {
            return [
              { type: 'flag', key: 'upbringing', value: 'club' },
              { type: 'attr', key: g.identity.isGK ? 'positioning' : 'passing', delta: 3 },
              { type: 'hidden', key: 'workRate', delta: 4 },
              { type: 'morale', delta: 5 }
            ];
          } },
        { id: 'street', label: K('first_ball', 'street'), desc: K('first_ball', 'street_d'), risk: 'medium',
          result: K('first_ball', 'street_r'),
          effects: function (g) {
            return [
              { type: 'flag', key: 'upbringing', value: 'street' },
              { type: 'attr', key: g.identity.isGK ? 'reflexes' : 'dribbling', delta: 5 },
              { type: 'hidden', key: 'flair', delta: 8 },
              { type: 'hidden', key: 'discipline', delta: -6 },
              { type: 'education', delta: -4 }
            ];
          } },
        { id: 'late', label: K('first_ball', 'late'), desc: K('first_ball', 'late_d'), risk: 'high',
          result: K('first_ball', 'late_r'),
          effects: [
            { type: 'flag', key: 'upbringing', value: 'late' },
            { type: 'education', delta: 12 },
            { type: 'hidden', key: 'mentality', delta: 5 },
            { type: 'attrAll', delta: -2 }
          ] }
      ]
    },

    /* ── Alter 8: Nachmittage ────────────────────────────────────── */
    {
      id: 'after_school', spine: true, phase: 'childhood', age: 8, category: 'youth',
      title: K('after_school', 'title'), text: K('after_school', 'text'),
      choices: [
        { id: 'wall', label: K('after_school', 'wall'), desc: K('after_school', 'wall_d'), risk: 'low',
          result: K('after_school', 'wall_r'),
          effects: function (g) {
            return [
              { type: 'attr', key: g.identity.isGK ? 'handling' : 'shooting', delta: 4 },
              { type: 'hidden', key: 'workRate', delta: 6 },
              { type: 'education', delta: -3 }
            ];
          } },
        { id: 'friends', label: K('after_school', 'friends'), desc: K('after_school', 'friends_d'), risk: 'low',
          result: K('after_school', 'friends_r'),
          effects: [
            { type: 'morale', delta: 10 },
            { type: 'hidden', key: 'mentality', delta: 6 },
            { type: 'attrAll', delta: 1 }
          ] },
        { id: 'watch', label: K('after_school', 'watch'), desc: K('after_school', 'watch_d'), risk: 'low',
          result: K('after_school', 'watch_r'),
          effects: function (g) {
            return [
              { type: 'attr', key: g.identity.isGK ? 'positioning' : 'passing', delta: 4 },
              { type: 'hidden', key: 'bigGame', delta: 5 }
            ];
          } }
      ]
    },

    /* ── Alter 9: Sichtung für den Stützpunkt ────────────────────── */
    {
      id: 'support_invite', spine: true, phase: 'childhood', age: 9, category: 'youth',
      starts: ['village'],
      when: function (g) { return g.ovr >= 30 || g.hidden.potential >= 68; },
      title: K('support_invite', 'title'), text: K('support_invite', 'text'),
      textParams: function (g) { return { term: FKC.t('youth.support.' + FKC.data.youth.termFor(g.identity.nationality)) }; },
      choices: [
        { id: 'go', label: K('support_invite', 'go'), desc: K('support_invite', 'go_d'), risk: 'low',
          outcomes: [
            { p: 0.72, text: K('support_invite', 'go_ok'),
              effects: [
                { type: 'flag', key: 'atSupportCentre', value: true },
                { type: 'attrAll', delta: 2 },
                { type: 'growthBonus', points: 6 },
                { type: 'reputation', delta: 4 },
                { type: 'timeline', key: 'tl.support', mark: 'good' }
              ] },
            { p: 0.28, text: K('support_invite', 'go_fail'),
              effects: [
                { type: 'morale', delta: -12 },
                { type: 'hidden', key: 'mentality', delta: 4 },
                { type: 'growthBonus', points: 2 }
              ] }
          ] },
        { id: 'stay', label: K('support_invite', 'stay'), desc: K('support_invite', 'stay_d'), risk: 'medium',
          result: K('support_invite', 'stay_r'),
          effects: [
            { type: 'morale', delta: 6 },
            { type: 'loyalty', delta: 15 },
            { type: 'familySupport', delta: 4 },
            { type: 'growthBonus', points: -3 }
          ] },
        { id: 'both', label: K('support_invite', 'both'), desc: K('support_invite', 'both_d'), risk: 'high',
          outcomes: [
            { p: 0.55, text: K('support_invite', 'both_ok'),
              effects: [
                { type: 'flag', key: 'atSupportCentre', value: true },
                { type: 'attrAll', delta: 2 },
                { type: 'growthBonus', points: 8 },
                { type: 'hidden', key: 'workRate', delta: 6 },
                { type: 'fitness', delta: -8 }
              ] },
            { p: 0.45, text: K('support_invite', 'both_bad'),
              effects: [
                { type: 'fitness', delta: -18 },
                { type: 'morale', delta: -8 },
                { type: 'hidden', key: 'injuryProneness', delta: 6 },
                { type: 'growthBonus', points: 3 }
              ] }
          ] }
      ]
    },

    /* ── Alter 9: nicht gesichtet ────────────────────────────────── */
    {
      id: 'overlooked', spine: true, phase: 'childhood', age: 9, category: 'youth',
      starts: ['village'],
      when: function (g) { return !(g.ovr >= 30 || g.hidden.potential >= 68); },
      title: K('overlooked', 'title'), text: K('overlooked', 'text'),
      choices: [
        { id: 'grind', label: K('overlooked', 'grind'), desc: K('overlooked', 'grind_d'), risk: 'low',
          result: K('overlooked', 'grind_r'),
          effects: [
            { type: 'hidden', key: 'workRate', delta: 10 },
            { type: 'hidden', key: 'mentality', delta: 8 },
            { type: 'growthBonus', points: 5 },
            { type: 'trait', id: 'latebloomer' }
          ] },
        { id: 'sulk', label: K('overlooked', 'sulk'), desc: K('overlooked', 'sulk_d'), risk: 'medium',
          result: K('overlooked', 'sulk_r'),
          effects: [
            { type: 'morale', delta: -14 },
            { type: 'growthBonus', points: -4 },
            { type: 'education', delta: 6 }
          ] },
        { id: 'switch', label: K('overlooked', 'switch'), desc: K('overlooked', 'switch_d'), risk: 'medium',
          outcomes: [
            { p: 0.6, text: K('overlooked', 'switch_ok'),
              effects: [
                { type: 'growthBonus', points: 6 },
                { type: 'morale', delta: 8 },
                { type: 'attrAll', delta: 1 }
              ] },
            { p: 0.4, text: K('overlooked', 'switch_bad'),
              effects: [
                { type: 'morale', delta: -10 },
                { type: 'familySupport', delta: -6 }
              ] }
          ] }
      ]
    },

    /* ── Alter 11: Probetraining beim Leistungszentrum ───────────── */
    {
      id: 'academy_trial', spine: true, phase: 'childhood', age: 11, category: 'youth',
      starts: ['village'],
      title: K('academy_trial', 'title'), text: K('academy_trial', 'text'),
      textParams: function (g) { return { term: FKC.t('youth.term.' + FKC.data.youth.termFor(g.identity.nationality)) }; },
      choices: [
        { id: 'all_in', label: K('academy_trial', 'all_in'), desc: K('academy_trial', 'all_in_d'), risk: 'medium',
          outcomes: [
            { p: 0.6, text: K('academy_trial', 'all_in_ok'),
              pMod: function (g) { return 0.6 + g.hidden.bigGame / 140; },
              effects: [
                { type: 'flag', key: 'trialGrade', value: 'strong' },
                { type: 'reputation', delta: 6 }, { type: 'morale', delta: 10 },
                { type: 'growthBonus', points: 4 }
              ] },
            { p: 0.4, text: K('academy_trial', 'all_in_bad'),
              effects: [
                { type: 'flag', key: 'trialGrade', value: 'weak' },
                { type: 'morale', delta: -10 }, { type: 'hidden', key: 'mentality', delta: 5 }
              ] }
          ] },
        { id: 'team', label: K('academy_trial', 'team'), desc: K('academy_trial', 'team_d'), risk: 'low',
          outcomes: [
            { p: 0.7, text: K('academy_trial', 'team_ok'),
              effects: [
                { type: 'flag', key: 'trialGrade', value: 'solid' },
                { type: 'attr', key: 'passing', delta: 3 },
                { type: 'hidden', key: 'mentality', delta: 6 }, { type: 'reputation', delta: 3 }
              ] },
            { p: 0.3, text: K('academy_trial', 'team_ok2'),
              effects: [
                { type: 'flag', key: 'trialGrade', value: 'solid' },
                { type: 'hidden', key: 'consistency', delta: 5 }
              ] }
          ] },
        { id: 'nerves', label: K('academy_trial', 'nerves'), desc: K('academy_trial', 'nerves_d'), risk: 'high',
          outcomes: [
            { p: 0.35, text: K('academy_trial', 'nerves_ok'),
              pMod: function (g) { return 0.4 + g.hidden.flair / 90; },
              effects: [
                { type: 'flag', key: 'trialGrade', value: 'strong' },
                { type: 'reputation', delta: 9 }, { type: 'hidden', key: 'flair', delta: 6 },
                { type: 'growthBonus', points: 5 }
              ] },
            { p: 0.65, text: K('academy_trial', 'nerves_bad'),
              effects: [
                { type: 'flag', key: 'trialGrade', value: 'weak' },
                { type: 'morale', delta: -12 }, { type: 'reputation', delta: -2 }
              ] }
          ] }
      ]
    },

    /* ── Alter 14: Schule oder Fussball ──────────────────────────── */
    {
      id: 'school_vs_football', spine: true, phase: 'youth', age: 14, category: 'youth',
      title: K('school_vs_football', 'title'), text: K('school_vs_football', 'text'),
      choices: [
        { id: 'sport_school', label: K('school_vs_football', 'sport_school'), desc: K('school_vs_football', 'sport_school_d'), risk: 'low',
          result: K('school_vs_football', 'sport_school_r'),
          effects: [
            { type: 'growthBonus', points: 8 }, { type: 'education', delta: -8 },
            { type: 'flag', key: 'sportSchool', value: true }, { type: 'morale', delta: 5 }
          ] },
        { id: 'balance', label: K('school_vs_football', 'balance'), desc: K('school_vs_football', 'balance_d'), risk: 'low',
          result: K('school_vs_football', 'balance_r'),
          effects: [
            { type: 'education', delta: 6 }, { type: 'growthBonus', points: 2 },
            { type: 'hidden', key: 'mentality', delta: 5 }
          ] },
        { id: 'school_first', label: K('school_vs_football', 'school_first'), desc: K('school_vs_football', 'school_first_d'), risk: 'medium',
          result: K('school_vs_football', 'school_first_r'),
          effects: [
            { type: 'education', delta: 18 }, { type: 'growthBonus', points: -6 },
            { type: 'familySupport', delta: 8 }
          ] }
      ]
    },

    /* ── Alter 16: Fördervertrag ─────────────────────────────────── */
    {
      id: 'scholarship', spine: true, phase: 'youth', age: 16, category: 'youth',
      title: K('scholarship', 'title'), text: K('scholarship', 'text'),
      textParams: function (g) {
        var c = FKC.state.club();
        return { club: c ? c.name : '' };
      },
      choices: [
        { id: 'sign', label: K('scholarship', 'sign'), desc: K('scholarship', 'sign_d'), risk: 'low',
          result: K('scholarship', 'sign_r'),
          effects: [
            { type: 'flag', key: 'scholarship', value: true },
            { type: 'loyalty', delta: 12 }, { type: 'morale', delta: 8 },
            { type: 'money', delta: 12000 }
          ] },
        { id: 'wait', label: K('scholarship', 'wait'), desc: K('scholarship', 'wait_d'), risk: 'high',
          outcomes: [
            { p: 0.45, text: K('scholarship', 'wait_ok'),
              pMod: function (g) { return 0.3 + g.ovr / 70; },
              effects: [
                { type: 'flag', key: 'scholarship', value: true },
                { type: 'money', delta: 30000 }, { type: 'reputation', delta: 5 },
                { type: 'fanRelation', delta: -6 }
              ] },
            { p: 0.55, text: K('scholarship', 'wait_bad'),
              effects: [
                { type: 'fanRelation', delta: -12 }, { type: 'morale', delta: -10 },
                { type: 'flag', key: 'scholarship', value: true }, { type: 'money', delta: 8000 }
              ] }
          ] },
        { id: 'listen', label: K('scholarship', 'listen'), desc: K('scholarship', 'listen_d'), risk: 'medium',
          outcomes: [
            { p: 0.5, text: K('scholarship', 'listen_ok'),
              effects: [
                { type: 'flag', key: 'openToMove', value: true },
                { type: 'reputation', delta: 8 }, { type: 'loyalty', delta: -10 }
              ] },
            { p: 0.5, text: K('scholarship', 'listen_bad'),
              effects: [
                { type: 'loyalty', delta: -15 }, { type: 'fanRelation', delta: -10 },
                { type: 'morale', delta: -6 }
              ] }
          ] }
      ]
    }
  ];

  /* ══ Zufallsereignisse: Kindheit ═══════════════════════════════════ */

  var childhood = [
    {
      id: 'parents_divorce', category: 'private', phases: ['childhood', 'youth'],
      weight: 5, once: true, minAge: 7, maxAge: 15,
      when: function (g) { return g.career.life.parentsTogether; },
      title: K('parents_divorce', 'title'), text: K('parents_divorce', 'text'),
      choices: [
        { id: 'football', label: K('parents_divorce', 'football'), risk: 'medium',
          result: K('parents_divorce', 'football_r'),
          effects: [
            { type: 'flag', key: 'parentsTogether', value: false },
            { type: 'growthBonus', points: 6 }, { type: 'morale', delta: -10 },
            { type: 'hidden', key: 'mentality', delta: 8 },
            { type: 'timeline', key: 'tl.divorce', mark: 'bad' }
          ],
          after: function (g) { g.career.life.parentsTogether = false; } },
        { id: 'family', label: K('parents_divorce', 'family'), risk: 'low',
          result: K('parents_divorce', 'family_r'),
          effects: [
            { type: 'growthBonus', points: -5 }, { type: 'familySupport', delta: 10 },
            { type: 'morale', delta: 4 }, { type: 'timeline', key: 'tl.divorce', mark: 'bad' }
          ],
          after: function (g) { g.career.life.parentsTogether = false; } },
        { id: 'withdraw', label: K('parents_divorce', 'withdraw'), risk: 'high',
          result: K('parents_divorce', 'withdraw_r'),
          effects: [
            { type: 'morale', delta: -20 }, { type: 'hidden', key: 'consistency', delta: -8 },
            { type: 'education', delta: -8 }, { type: 'timeline', key: 'tl.divorce', mark: 'bad' }
          ],
          after: function (g) { g.career.life.parentsTogether = false; } }
      ]
    },

    {
      id: 'kit_money', category: 'private', phases: ['childhood'],
      weight: 6, once: true, minAge: 7, maxAge: 11,
      /* Ein Leistungszentrum stellt die Ausrüstung — das ist ein
         Problem des Dorfvereins. */
      starts: ['village'],
      when: function (g) { return g.origin.familyWealth < 55; },
      title: K('kit_money', 'title'), text: K('kit_money', 'text'),
      choices: [
        { id: 'coach', label: K('kit_money', 'coach'), risk: 'low',
          result: K('kit_money', 'coach_r'),
          effects: [{ type: 'loyalty', delta: 12 }, { type: 'morale', delta: 6 }, { type: 'hidden', key: 'mentality', delta: 4 }] },
        { id: 'job', label: K('kit_money', 'job'), risk: 'medium',
          result: K('kit_money', 'job_r'),
          effects: [{ type: 'money', delta: 400 }, { type: 'growthBonus', points: -4 }, { type: 'hidden', key: 'workRate', delta: 8 }] },
        { id: 'quiet', label: K('kit_money', 'quiet'), risk: 'medium',
          result: K('kit_money', 'quiet_r'),
          effects: [{ type: 'morale', delta: -8 }, { type: 'hidden', key: 'mentality', delta: 6 }, { type: 'fitness', delta: -5 }] }
      ]
    },

    {
      id: 'street_tournament', category: 'youth', phases: ['childhood'],
      weight: 8, cooldown: 3, minAge: 7, maxAge: 12,
      title: K('street_tournament', 'title'), text: K('street_tournament', 'text'),
      choices: [
        { id: 'join', label: K('street_tournament', 'join'), risk: 'medium',
          outcomes: [
            { p: 0.6, text: K('street_tournament', 'join_ok'),
              effects: function (g) {
                return [{ type: 'attr', key: g.identity.isGK ? 'reflexes' : 'dribbling', delta: 3 },
                        { type: 'hidden', key: 'flair', delta: 6 }, { type: 'morale', delta: 8 }];
              } },
            { p: 0.4, text: K('street_tournament', 'join_bad'),
              effects: [{ type: 'injury', weeks: 2, severity: 'minor' }, { type: 'morale', delta: -5 }] }
          ] },
        { id: 'skip', label: K('street_tournament', 'skip'), risk: 'low',
          result: K('street_tournament', 'skip_r'),
          effects: [{ type: 'fitness', delta: 6 }, { type: 'hidden', key: 'discipline', delta: 5 }] }
      ]
    },

    {
      id: 'kid_injury', category: 'sport', phases: ['childhood'],
      weight: 10, cooldown: 3, minAge: 7, maxAge: 12,
      weightMod: function (g) { return 0.6 + g.hidden.injuryProneness / 70; },
      title: K('kid_injury', 'title'), text: K('kid_injury', 'text'),
      choices: [
        { id: 'rest', label: K('kid_injury', 'rest'), risk: 'low',
          result: K('kid_injury', 'rest_r'),
          effects: [{ type: 'injury', weeks: 6 }, { type: 'education', delta: 5 }, { type: 'hidden', key: 'injuryProneness', delta: -4 }] },
        { id: 'rush', label: K('kid_injury', 'rush'), risk: 'high',
          outcomes: [
            { p: 0.45, text: K('kid_injury', 'rush_ok'),
              effects: [{ type: 'injury', weeks: 2 }, { type: 'hidden', key: 'workRate', delta: 6 }] },
            { p: 0.55, text: K('kid_injury', 'rush_bad'),
              effects: [{ type: 'injury', weeks: 12 }, { type: 'hidden', key: 'injuryProneness', delta: 10 }, { type: 'morale', delta: -10 }] }
          ] }
      ]
    },

    {
      id: 'winter_pitch', category: 'sport', phases: ['childhood', 'youth'],
      weight: 8, cooldown: 3, minAge: 7, maxAge: 15,
      /* Eine Topakademie hat Rasenheizung und Halle */
      starts: ['village', 'nlz'],
      weightMod: function (g) { return 0.7 + g.hidden.injuryProneness / 90; },
      title: K('winter_pitch', 'title'), text: K('winter_pitch', 'text'),
      choices: [
        { id: 'play', label: K('winter_pitch', 'play'), risk: 'high',
          outcomes: [
            { p: 0.5, text: K('winter_pitch', 'play_ok'),
              effects: [{ type: 'attr', key: 'physical', delta: 2 },
                        { type: 'hidden', key: 'workRate', delta: 5 }] },
            { p: 0.5, text: K('winter_pitch', 'play_bad'),
              effects: [{ type: 'injury', weeks: 8 }, { type: 'morale', delta: -8 },
                        { type: 'hidden', key: 'injuryProneness', delta: 5 }] }
          ] },
        { id: 'hall', label: K('winter_pitch', 'hall'), risk: 'low',
          result: K('winter_pitch', 'hall_r'),
          effects: function (g) {
            return [{ type: 'attr', key: g.identity.isGK ? 'reflexes' : 'dribbling', delta: 3 },
                    { type: 'fitness', delta: 5 }];
          } }
      ]
    },

    {
      id: 'growth_pain', category: 'sport', phases: ['childhood', 'youth'],
      weight: 7, once: true, minAge: 10, maxAge: 14,
      title: K('growth_pain', 'title'), text: K('growth_pain', 'text'),
      choices: [
        { id: 'rest', label: K('growth_pain', 'rest'), risk: 'low',
          result: K('growth_pain', 'rest_r'),
          effects: [{ type: 'injury', weeks: 10 }, { type: 'hidden', key: 'injuryProneness', delta: -7 },
                    { type: 'education', delta: 6 }] },
        { id: 'through', label: K('growth_pain', 'through'), risk: 'high',
          outcomes: [
            { p: 0.4, text: K('growth_pain', 'through_ok'),
              effects: [{ type: 'growthBonus', points: 5 }, { type: 'hidden', key: 'workRate', delta: 8 }] },
            { p: 0.6, text: K('growth_pain', 'through_bad'),
              effects: [{ type: 'injury', weeks: 18 }, { type: 'potential', delta: -4 },
                        { type: 'hidden', key: 'injuryProneness', delta: 12 }] }
          ] }
      ]
    },

    {
      id: 'bullying_kid', category: 'youth', phases: ['childhood', 'youth'],
      weight: 5, once: true, minAge: 9, maxAge: 15,
      title: K('bullying_kid', 'title'), text: K('bullying_kid', 'text'),
      choices: [
        { id: 'coach', label: K('bullying_kid', 'coach'), risk: 'low',
          outcomes: [
            { p: 0.65, text: K('bullying_kid', 'coach_ok'),
              effects: [{ type: 'morale', delta: 10 }, { type: 'hidden', key: 'mentality', delta: 5 }] },
            { p: 0.35, text: K('bullying_kid', 'coach_bad'),
              effects: [{ type: 'morale', delta: -12 }, { type: 'hidden', key: 'mentality', delta: 8 }] }
          ] },
        { id: 'pitch', label: K('bullying_kid', 'pitch'), risk: 'medium',
          outcomes: [
            { p: 0.55, text: K('bullying_kid', 'pitch_ok'),
              effects: [{ type: 'growthBonus', points: 7 }, { type: 'hidden', key: 'mentality', delta: 10 }, { type: 'reputation', delta: 3 }] },
            { p: 0.45, text: K('bullying_kid', 'pitch_bad'),
              effects: [{ type: 'morale', delta: -14 }, { type: 'hidden', key: 'consistency', delta: -6 }] }
          ] },
        { id: 'leave', label: K('bullying_kid', 'leave'), risk: 'high',
          result: K('bullying_kid', 'leave_r'),
          effects: [{ type: 'morale', delta: 6 }, { type: 'growthBonus', points: -5 }, { type: 'loyalty', delta: -20 }] }
      ]
    },

    {
      id: 'first_trophy', category: 'youth', phases: ['childhood'],
      weight: 6, once: true, minAge: 8, maxAge: 12,
      when: function (g) { return g.ovr >= 26; },
      title: K('first_trophy', 'title'), text: K('first_trophy', 'text'),
      choices: [
        { id: 'celebrate', label: K('first_trophy', 'celebrate'), risk: 'low',
          result: K('first_trophy', 'celebrate_r'),
          effects: [
            { type: 'morale', delta: 12 }, { type: 'reputation', delta: 3 },
            { type: 'timeline', key: 'tl.firstTrophy', mark: 'good' }
          ] },
        { id: 'more', label: K('first_trophy', 'more'), risk: 'low',
          result: K('first_trophy', 'more_r'),
          effects: [
            { type: 'hidden', key: 'workRate', delta: 8 }, { type: 'growthBonus', points: 5 },
            { type: 'timeline', key: 'tl.firstTrophy', mark: 'good' }
          ] }
      ]
    },

    {
      id: 'family_move', category: 'private', phases: ['childhood', 'youth'],
      weight: 4, once: true, minAge: 8, maxAge: 14,
      title: K('family_move', 'title'), text: K('family_move', 'text'),
      choices: [
        { id: 'go', label: K('family_move', 'go'), risk: 'medium',
          result: K('family_move', 'go_r'),
          effects: [{ type: 'homesick', delta: 12 }, { type: 'hidden', key: 'adaptability', delta: 10 }, { type: 'morale', delta: -6 }] },
        { id: 'stay', label: K('family_move', 'stay'), risk: 'medium',
          result: K('family_move', 'stay_r'),
          effects: [{ type: 'familySupport', delta: -10 }, { type: 'loyalty', delta: 15 }, { type: 'hidden', key: 'mentality', delta: 8 }] }
      ]
    },

    {
      id: 'idol', category: 'youth', phases: ['childhood'],
      weight: 7, once: true, minAge: 8, maxAge: 12,
      title: K('idol', 'title'), text: K('idol', 'text'),
      choices: [
        { id: 'copy', label: K('idol', 'copy'), risk: 'low',
          result: K('idol', 'copy_r'),
          effects: function (g) {
            var key = FKC.attributes.strongest(g);
            return [{ type: 'attr', key: key, delta: 4 }, { type: 'hidden', key: 'flair', delta: 5 }];
          } },
        { id: 'own', label: K('idol', 'own'), risk: 'low',
          result: K('idol', 'own_r'),
          effects: [{ type: 'attrAll', delta: 1 }, { type: 'hidden', key: 'mentality', delta: 7 }] }
      ]
    }
  ];

  /* ══ Zufallsereignisse: Jugend ═════════════════════════════════════ */

  var youthEvents = [
    {
      id: 'growth_spurt', category: 'sport', phases: ['youth'],
      weight: 9, once: true, minAge: 13, maxAge: 17,
      title: K('growth_spurt', 'title'), text: K('growth_spurt', 'text'),
      choices: [
        { id: 'gym', label: K('growth_spurt', 'gym'), risk: 'medium',
          outcomes: [
            { p: 0.65, text: K('growth_spurt', 'gym_ok'),
              effects: [{ type: 'attr', key: 'physical', delta: 6 }, { type: 'growthBonus', points: 5 }] },
            { p: 0.35, text: K('growth_spurt', 'gym_bad'),
              effects: [{ type: 'injury', weeks: 8 }, { type: 'attr', key: 'physical', delta: 2 }] }
          ] },
        { id: 'careful', label: K('growth_spurt', 'careful'), risk: 'low',
          result: K('growth_spurt', 'careful_r'),
          effects: [
            { type: 'attr', key: 'physical', delta: 3 },
            { type: 'hidden', key: 'injuryProneness', delta: -8 }, { type: 'fitness', delta: 8 }
          ] },
        { id: 'ignore', label: K('growth_spurt', 'ignore'), risk: 'high',
          outcomes: [
            { p: 0.4, text: K('growth_spurt', 'ignore_ok'),
              effects: function (g) { return [{ type: 'attr', key: g.identity.isGK ? 'reflexes' : 'pace', delta: 4 }, { type: 'growthBonus', points: 4 }]; } },
            { p: 0.6, text: K('growth_spurt', 'ignore_bad'),
              effects: function (g) { return [{ type: 'attr', key: g.identity.isGK ? 'reflexes' : 'pace', delta: -4 }, { type: 'hidden', key: 'injuryProneness', delta: 10 }]; } }
          ] }
    ]},

    {
      id: 'parents_push_education', category: 'private', phases: ['youth'],
      weight: 6, once: true, minAge: 15, maxAge: 18,
      when: function (g) { return g.origin.familySupport < 65 || g.career.life.education > 60; },
      title: K('parents_push_education', 'title'), text: K('parents_push_education', 'text'),
      choices: [
        { id: 'obey', label: K('parents_push_education', 'obey'), risk: 'medium',
          result: K('parents_push_education', 'obey_r'),
          effects: [{ type: 'education', delta: 20 }, { type: 'growthBonus', points: -8 }, { type: 'familySupport', delta: 12 }] },
        { id: 'argue', label: K('parents_push_education', 'argue'), risk: 'high',
          outcomes: [
            { p: 0.5, text: K('parents_push_education', 'argue_ok'),
              pMod: function (g) { return 0.4 + g.ovr / 60; },
              effects: [{ type: 'familySupport', delta: 8 }, { type: 'growthBonus', points: 6 }, { type: 'hidden', key: 'mentality', delta: 8 }] },
            { p: 0.5, text: K('parents_push_education', 'argue_bad'),
              effects: [{ type: 'familySupport', delta: -18 }, { type: 'morale', delta: -12 }] }
          ] },
        { id: 'deal', label: K('parents_push_education', 'deal'), risk: 'low',
          result: K('parents_push_education', 'deal_r'),
          effects: [{ type: 'education', delta: 10 }, { type: 'familySupport', delta: 6 }, { type: 'fitness', delta: -6 }] }
      ]
    },

    {
      id: 'first_agent', category: 'club', phases: ['youth'],
      weight: 7, once: true, minAge: 15, maxAge: 18,
      title: K('first_agent', 'title'), text: K('first_agent', 'text'),
      choices: [
        { id: 'sign', label: K('first_agent', 'sign'), risk: 'medium',
          outcomes: [
            { p: 0.55, text: K('first_agent', 'sign_ok'),
              effects: [{ type: 'flag', key: 'agent', value: 'good' }, { type: 'reputation', delta: 8 }, { type: 'money', delta: 5000 }] },
            { p: 0.45, text: K('first_agent', 'sign_bad'),
              effects: [{ type: 'flag', key: 'agent', value: 'shark' }, { type: 'reputation', delta: 4 }, { type: 'money', delta: -3000 }] }
          ] },
        { id: 'family', label: K('first_agent', 'family'), risk: 'low',
          result: K('first_agent', 'family_r'),
          effects: [{ type: 'flag', key: 'agent', value: 'family' }, { type: 'familySupport', delta: 8 }, { type: 'reputation', delta: -2 }] },
        { id: 'wait', label: K('first_agent', 'wait'), risk: 'low',
          result: K('first_agent', 'wait_r'),
          effects: [{ type: 'hidden', key: 'mentality', delta: 6 }] }
      ]
    },

    {
      id: 'scout_watching', category: 'club', phases: ['youth'],
      weight: 8, cooldown: 2, minAge: 14, maxAge: 19,
      when: function (g) { return g.ovr >= 45; },
      title: K('scout_watching', 'title'), text: K('scout_watching', 'text'),
      choices: [
        { id: 'showoff', label: K('scout_watching', 'showoff'), risk: 'high',
          outcomes: [
            { p: 0.4, text: K('scout_watching', 'showoff_ok'),
              pMod: function (g) { return 0.5 + g.hidden.bigGame / 100; },
              effects: [{ type: 'reputation', delta: 12 }, { type: 'morale', delta: 8 }, { type: 'flag', key: 'scouted', value: true }] },
            { p: 0.6, text: K('scout_watching', 'showoff_bad'),
              effects: [{ type: 'reputation', delta: -4 }, { type: 'morale', delta: -8 }] }
          ] },
        { id: 'normal', label: K('scout_watching', 'normal'), risk: 'low',
          outcomes: [
            { p: 0.6, text: K('scout_watching', 'normal_ok'),
              pMod: function (g) { return 0.5 + g.hidden.consistency / 100; },
              effects: [{ type: 'reputation', delta: 6 }, { type: 'flag', key: 'scouted', value: true }] },
            { p: 0.4, text: K('scout_watching', 'normal_mid'),
              effects: [{ type: 'reputation', delta: 2 }] }
          ] }
      ]
    },

    {
      id: 'position_change', category: 'sport', phases: ['youth'],
      weight: 5, once: true, minAge: 13, maxAge: 18,
      when: function (g) { return !g.identity.isGK; },
      title: K('position_change', 'title'), text: K('position_change', 'text'),
      textParams: function (g) {
        var n = FKC.data.positionNeighbours[g.identity.position] || [];
        var target = n.length ? n[0] : g.identity.position;
        g.flags._posOffer = target;
        return { from: FKC.t('pos.' + g.identity.position), to: FKC.t('pos.' + target) };
      },
      choices: [
        { id: 'accept', label: K('position_change', 'accept'), risk: 'medium',
          result: K('position_change', 'accept_r'),
          effects: function (g) {
            return [
              { type: 'position', position: g.flags._posOffer || g.identity.position },
              { type: 'growthBonus', points: 6 }, { type: 'morale', delta: -4 }
            ];
          } },
        { id: 'refuse', label: K('position_change', 'refuse'), risk: 'medium',
          result: K('position_change', 'refuse_r'),
          effects: [{ type: 'morale', delta: 4 }, { type: 'growthBonus', points: -4 }, { type: 'hidden', key: 'mentality', delta: 4 }] }
      ]
    },

    {
      id: 'youth_captain', category: 'club', phases: ['youth'],
      weight: 6, once: true, minAge: 15, maxAge: 19,
      when: function (g) { return g.hidden.mentality >= 55 || g.ovr >= 52; },
      title: K('youth_captain', 'title'), text: K('youth_captain', 'text'),
      choices: [
        { id: 'accept', label: K('youth_captain', 'accept'), risk: 'low',
          result: K('youth_captain', 'accept_r'),
          effects: [
            { type: 'flag', key: 'youthCaptain', value: true },
            { type: 'hidden', key: 'mentality', delta: 10 }, { type: 'reputation', delta: 5 },
            { type: 'timeline', key: 'tl.youthCaptain', mark: 'good' }
          ] },
        { id: 'decline', label: K('youth_captain', 'decline'), risk: 'low',
          result: K('youth_captain', 'decline_r'),
          effects: [{ type: 'growthBonus', points: 4 }, { type: 'hidden', key: 'consistency', delta: 4 }] }
      ]
    },

    {
      id: 'academy_switch', category: 'club', phases: ['youth'],
      weight: 6, cooldown: 3, minAge: 13, maxAge: 18,
      /* Wer schon in der besten Akademie des Landes sitzt, bekommt kein
         Angebot von einer „grösseren" — für den gibt es nlz_poach. */
      starts: ['village', 'nlz'],
      when: function (g) { return g.status.clubType === 'pro' || g.status.clubType === 'academy'; },
      title: K('academy_switch', 'title'), text: K('academy_switch', 'text'),
      choices: [
        { id: 'move', label: K('academy_switch', 'move'), risk: 'high',
          outcomes: [
            { p: 0.5, text: K('academy_switch', 'move_ok'),
              effects: [{ type: 'growthBonus', points: 8 }, { type: 'reputation', delta: 6 }, { type: 'homesick', delta: 8 }, { type: 'loyalty', delta: -20 }] },
            { p: 0.5, text: K('academy_switch', 'move_bad'),
              effects: [{ type: 'growthBonus', points: -6 }, { type: 'morale', delta: -12 }, { type: 'homesick', delta: 14 }] }
          ] },
        { id: 'stay', label: K('academy_switch', 'stay'), risk: 'low',
          result: K('academy_switch', 'stay_r'),
          effects: [{ type: 'loyalty', delta: 15 }, { type: 'morale', delta: 5 }] }
      ]
    },

    {
      id: 'youth_rival', category: 'sport', phases: ['youth'],
      weight: 7, cooldown: 3, minAge: 13, maxAge: 19,
      title: K('youth_rival', 'title'), text: K('youth_rival', 'text'),
      choices: [
        { id: 'outwork', label: K('youth_rival', 'outwork'), risk: 'medium',
          outcomes: [
            { p: 0.6, text: K('youth_rival', 'outwork_ok'),
              pMod: function (g) { return 0.4 + g.hidden.workRate / 90; },
              effects: [{ type: 'growthBonus', points: 8 }, { type: 'hidden', key: 'workRate', delta: 6 }] },
            { p: 0.4, text: K('youth_rival', 'outwork_bad'),
              effects: [{ type: 'fitness', delta: -14 }, { type: 'morale', delta: -8 }] }
          ] },
        { id: 'befriend', label: K('youth_rival', 'befriend'), risk: 'low',
          result: K('youth_rival', 'befriend_r'),
          effects: [{ type: 'morale', delta: 10 }, { type: 'growthBonus', points: 4 }, { type: 'hidden', key: 'mentality', delta: 4 }] },
        { id: 'undermine', label: K('youth_rival', 'undermine'), risk: 'high',
          outcomes: [
            { p: 0.35, text: K('youth_rival', 'undermine_ok'),
              effects: [{ type: 'reputation', delta: 4 }, { type: 'growthBonus', points: 3 }] },
            { p: 0.65, text: K('youth_rival', 'undermine_bad'),
              effects: [{ type: 'morale', delta: -14 }, { type: 'hidden', key: 'discipline', delta: -10 }, { type: 'reputation', delta: -5 }] }
          ] }
      ]
    },

    {
      id: 'homesick_boarding', category: 'private', phases: ['youth'],
      weight: 6, once: true, minAge: 14, maxAge: 18,
      when: function (g) { return g.career.life.homesick >= 10 || g.flags.movedAway; },
      title: K('homesick_boarding', 'title'), text: K('homesick_boarding', 'text'),
      choices: [
        { id: 'endure', label: K('homesick_boarding', 'endure'), risk: 'medium',
          result: K('homesick_boarding', 'endure_r'),
          effects: [{ type: 'hidden', key: 'adaptability', delta: 12 }, { type: 'morale', delta: -8 }, { type: 'homesick', delta: -10 }] },
        { id: 'home', label: K('homesick_boarding', 'home'), risk: 'medium',
          result: K('homesick_boarding', 'home_r'),
          effects: [{ type: 'morale', delta: 12 }, { type: 'homesick', delta: -25 }, { type: 'growthBonus', points: -6 }] },
        { id: 'family_move', label: K('homesick_boarding', 'family_move'), risk: 'low',
          result: K('homesick_boarding', 'family_move_r'),
          effects: [{ type: 'homesick', delta: -20 }, { type: 'familySupport', delta: 10 }, { type: 'money', delta: -4000 }] }
      ]
    },

    {
      id: 'party_temptation', category: 'private', phases: ['youth'],
      weight: 7, cooldown: 3, minAge: 16, maxAge: 19,
      title: K('party_temptation', 'title'), text: K('party_temptation', 'text'),
      choices: [
        { id: 'go', label: K('party_temptation', 'go'), risk: 'high',
          outcomes: [
            { p: 0.5, text: K('party_temptation', 'go_ok'),
              effects: [{ type: 'morale', delta: 10 }, { type: 'lifestyle', delta: 8 }] },
            { p: 0.5, text: K('party_temptation', 'go_bad'),
              effects: [{ type: 'fitness', delta: -12 }, { type: 'lifestyle', delta: 15 }, { type: 'reputation', delta: -4 }, { type: 'growthBonus', points: -5 }] }
          ] },
        { id: 'short', label: K('party_temptation', 'short'), risk: 'medium',
          result: K('party_temptation', 'short_r'),
          effects: [{ type: 'morale', delta: 6 }, { type: 'lifestyle', delta: 3 }] },
        { id: 'stay', label: K('party_temptation', 'stay'), risk: 'low',
          result: K('party_temptation', 'stay_r'),
          effects: [{ type: 'growthBonus', points: 4 }, { type: 'hidden', key: 'discipline', delta: 6 }, { type: 'morale', delta: -4 }] }
      ]
    },

    {
      id: 'youth_national_call', category: 'sport', phases: ['youth'],
      weight: 8, once: true, minAge: 15, maxAge: 19,
      when: function (g) { return g.ovr >= 55 && g.national.status === 'none'; },
      title: K('youth_national_call', 'title'), text: K('youth_national_call', 'text'),
      textParams: function (g) { return { nation: FKC.data.nationName(g.identity.nationality) }; },
      choices: [
        { id: 'accept', label: K('youth_national_call', 'accept'), risk: 'low',
          result: K('youth_national_call', 'accept_r'),
          effects: [
            { type: 'nationalCall', status: 'u19' }, { type: 'reputation', delta: 10 },
            { type: 'morale', delta: 12 }, { type: 'fitness', delta: -6 },
            { type: 'timeline', key: 'tl.youthCall', mark: 'good' }
          ] },
        { id: 'rest', label: K('youth_national_call', 'rest'), risk: 'medium',
          result: K('youth_national_call', 'rest_r'),
          effects: [{ type: 'fitness', delta: 10 }, { type: 'reputation', delta: -6 }, { type: 'growthBonus', points: 4 }] }
      ]
    },

    {
      id: 'released_threat', category: 'club', phases: ['youth'],
      weight: 6, cooldown: 3, minAge: 14, maxAge: 18,
      when: function (g) {
        var c = FKC.state.club();
        return c && !c.synthetic && g.ovr < FKC.data.clubLevel(c) - 22;
      },
      title: K('released_threat', 'title'), text: K('released_threat', 'text'),
      choices: [
        { id: 'fight', label: K('released_threat', 'fight'), risk: 'high',
          outcomes: [
            { p: 0.45, text: K('released_threat', 'fight_ok'),
              pMod: function (g) { return 0.3 + g.hidden.workRate / 80; },
              effects: [{ type: 'growthBonus', points: 10 }, { type: 'morale', delta: 10 }, { type: 'hidden', key: 'mentality', delta: 8 }] },
            { p: 0.55, text: K('released_threat', 'fight_bad'),
              effects: [{ type: 'morale', delta: -15 }, { type: 'flag', key: 'atRisk', value: true }] }
          ] },
        { id: 'loan', label: K('released_threat', 'loan'), risk: 'medium',
          result: K('released_threat', 'loan_r'),
          effects: [{ type: 'growthBonus', points: 7 }, { type: 'reputation', delta: -2 }, { type: 'morale', delta: 4 }] },
        { id: 'accept', label: K('released_threat', 'accept'), risk: 'medium',
          result: K('released_threat', 'accept_r'),
          effects: [{ type: 'flag', key: 'seekingClub', value: true }, { type: 'morale', delta: -10 }, { type: 'loyalty', delta: -10 }] }
      ]
    },

    {
      id: 'youth_serious_injury', category: 'sport', phases: ['youth'],
      weight: 4, cooldown: 5, minAge: 14, maxAge: 19,
      weightMod: function (g) { return 0.5 + g.hidden.injuryProneness / 60; },
      title: K('youth_serious_injury', 'title'), text: K('youth_serious_injury', 'text'),
      choices: [
        { id: 'surgery', label: K('youth_serious_injury', 'surgery'), risk: 'medium',
          outcomes: [
            { p: 0.7, text: K('youth_serious_injury', 'surgery_ok'),
              effects: [{ type: 'injury', weeks: 26 }, { type: 'hidden', key: 'mentality', delta: 10 }, { type: 'growthBonus', points: -8 }] },
            { p: 0.3, text: K('youth_serious_injury', 'surgery_bad'),
              effects: [{ type: 'injury', weeks: 38 }, { type: 'potential', delta: -6 }, { type: 'morale', delta: -18 }] }
          ] },
        { id: 'conservative', label: K('youth_serious_injury', 'conservative'), risk: 'high',
          outcomes: [
            { p: 0.4, text: K('youth_serious_injury', 'conservative_ok'),
              effects: [{ type: 'injury', weeks: 14 }, { type: 'hidden', key: 'injuryProneness', delta: 6 }] },
            { p: 0.6, text: K('youth_serious_injury', 'conservative_bad'),
              effects: [{ type: 'injury', weeks: 30 }, { type: 'potential', delta: -9 }, { type: 'hidden', key: 'injuryProneness', delta: 14 }] }
          ] }
      ]
    },

    {
      id: 'social_media', category: 'media', phases: ['youth'],
      weight: 6, once: true, minAge: 15, maxAge: 19,
      title: K('social_media', 'title'), text: K('social_media', 'text'),
      choices: [
        { id: 'build', label: K('social_media', 'build'), risk: 'medium',
          outcomes: [
            { p: 0.6, text: K('social_media', 'build_ok'),
              effects: [{ type: 'reputation', delta: 10 }, { type: 'money', delta: 6000 }, { type: 'trait', id: 'showman' }] },
            { p: 0.4, text: K('social_media', 'build_bad'),
              effects: [{ type: 'reputation', delta: 4 }, { type: 'growthBonus', points: -5 }, { type: 'lifestyle', delta: 10 }] }
          ] },
        { id: 'quiet', label: K('social_media', 'quiet'), risk: 'low',
          result: K('social_media', 'quiet_r'),
          effects: [{ type: 'hidden', key: 'consistency', delta: 6 }, { type: 'growthBonus', points: 3 }] }
      ]
    },

    {
      id: 'first_love', category: 'private', phases: ['youth'],
      weight: 6, once: true, minAge: 16, maxAge: 19,
      title: K('first_love', 'title'), text: K('first_love', 'text'),
      choices: [
        { id: 'commit', label: K('first_love', 'commit'), risk: 'medium',
          result: K('first_love', 'commit_r'),
          effects: [{ type: 'morale', delta: 14 }, { type: 'growthBonus', points: -3 }, { type: 'flag', key: 'relationship', value: true }] },
        { id: 'slow', label: K('first_love', 'slow'), risk: 'low',
          result: K('first_love', 'slow_r'),
          effects: [{ type: 'morale', delta: 6 }, { type: 'flag', key: 'relationship', value: true }] },
        { id: 'focus', label: K('first_love', 'focus'), risk: 'low',
          result: K('first_love', 'focus_r'),
          effects: [{ type: 'growthBonus', points: 5 }, { type: 'morale', delta: -6 }] }
      ]
    }
  ];

  /* ══ Mentor-Momente ════════════════════════════════════════════════
     Der Mentor bleibt präsent: vor grossen Spielen, nach guten und
     schlechten Phasen, und beim Abschied in den Profibereich.      */

  var hasMentor = function (g) { return !!(g.career && g.career.mentor); };
  var mentorName = function (g) {
    return { name: g.career.mentor ? g.career.mentor.name : '', me: g.identity.lastName };
  };

  var mentorEvents = [
    {
      id: 'mentor_bigmatch', category: 'youth', phases: ['youth'],
      weight: 14, cooldown: 2, minAge: 13, maxAge: 19,
      when: hasMentor, textParams: mentorName,
      title: K('mentor_bigmatch', 'title'), text: K('mentor_bigmatch', 'text'),
      choices: [
        { id: 'listen', label: K('mentor_bigmatch', 'listen'), risk: 'low',
          result: K('mentor_bigmatch', 'listen_r'),
          effects: [{ type: 'form', delta: 12 }, { type: 'hidden', key: 'bigGame', delta: 7 }],
          after: function (g) { FKC.career.mentorBond(g, 8); } },
        { id: 'ownway', label: K('mentor_bigmatch', 'ownway'), risk: 'high',
          outcomes: [
            { p: 0.4, text: K('mentor_bigmatch', 'ownway_ok'),
              pMod: function (g) { return 0.4 + g.hidden.flair / 90; },
              effects: [{ type: 'form', delta: 16 }, { type: 'hidden', key: 'flair', delta: 8 },
                        { type: 'reputation', delta: 5 }],
              after: function (g) { FKC.career.mentorBond(g, -6); } },
            { p: 0.6, text: K('mentor_bigmatch', 'ownway_bad'),
              effects: [{ type: 'form', delta: -12 }, { type: 'morale', delta: -8 }],
              after: function (g) { FKC.career.mentorBond(g, -12); } }
          ] }
      ]
    },

    {
      id: 'mentor_praise', category: 'youth', phases: ['youth'],
      weight: 12, cooldown: 3, minAge: 13, maxAge: 19,
      when: function (g) {
        return hasMentor(g) && g.ovr >= FKC.growth.ceiling(g, g.identity.age) - 1;
      },
      textParams: mentorName,
      title: K('mentor_praise', 'title'), text: K('mentor_praise', 'text'),
      choices: [
        { id: 'humble', label: K('mentor_praise', 'humble'), risk: 'low',
          result: K('mentor_praise', 'humble_r'),
          effects: [{ type: 'growthBonus', points: 7 }, { type: 'hidden', key: 'workRate', delta: 5 }],
          after: function (g) { FKC.career.mentorBond(g, 10); } },
        { id: 'enjoy', label: K('mentor_praise', 'enjoy'), risk: 'medium',
          result: K('mentor_praise', 'enjoy_r'),
          effects: [{ type: 'morale', delta: 14 }, { type: 'reputation', delta: 4 },
                    { type: 'growthBonus', points: -3 }],
          after: function (g) { FKC.career.mentorBond(g, 2); } }
      ]
    },

    {
      id: 'mentor_slump', category: 'youth', phases: ['youth'],
      weight: 14, cooldown: 3, minAge: 13, maxAge: 19,
      when: function (g) { return hasMentor(g) && g.condition.form < 55; },
      textParams: mentorName,
      title: K('mentor_slump', 'title'), text: K('mentor_slump', 'text'),
      choices: [
        { id: 'extra', label: K('mentor_slump', 'extra'), risk: 'medium',
          outcomes: [
            { p: 0.7, text: K('mentor_slump', 'extra_ok'),
              effects: [{ type: 'form', delta: 20 }, { type: 'growthBonus', points: 6 }],
              after: function (g) { FKC.career.mentorBond(g, 10); } },
            { p: 0.3, text: K('mentor_slump', 'extra_bad'),
              effects: [{ type: 'fitness', delta: -12 }, { type: 'form', delta: 6 }],
              after: function (g) { FKC.career.mentorBond(g, 4); } }
          ] },
        { id: 'talk', label: K('mentor_slump', 'talk'), risk: 'low',
          result: K('mentor_slump', 'talk_r'),
          effects: [{ type: 'form', delta: 10 }, { type: 'morale', delta: 12 },
                    { type: 'hidden', key: 'mentality', delta: 6 }],
          after: function (g) { FKC.career.mentorBond(g, 8); } },
        { id: 'alone', label: K('mentor_slump', 'alone'), risk: 'high',
          outcomes: [
            { p: 0.35, text: K('mentor_slump', 'alone_ok'),
              effects: [{ type: 'hidden', key: 'mentality', delta: 12 }, { type: 'form', delta: 14 }],
              after: function (g) { FKC.career.mentorBond(g, -8); } },
            { p: 0.65, text: K('mentor_slump', 'alone_bad'),
              effects: [{ type: 'form', delta: -8 }, { type: 'morale', delta: -12 }],
              after: function (g) { FKC.career.mentorBond(g, -14); } }
          ] }
      ]
    },

    {
      id: 'mentor_clash', category: 'youth', phases: ['youth'],
      weight: 6, once: true, minAge: 15, maxAge: 19,
      when: hasMentor, textParams: mentorName,
      title: K('mentor_clash', 'title'), text: K('mentor_clash', 'text'),
      choices: [
        { id: 'accept', label: K('mentor_clash', 'accept'), risk: 'low',
          result: K('mentor_clash', 'accept_r'),
          effects: [{ type: 'hidden', key: 'discipline', delta: 8 }, { type: 'growthBonus', points: 5 }],
          after: function (g) { FKC.career.mentorBond(g, 12); } },
        { id: 'defend', label: K('mentor_clash', 'defend'), risk: 'medium',
          outcomes: [
            { p: 0.5, text: K('mentor_clash', 'defend_ok'),
              effects: [{ type: 'hidden', key: 'mentality', delta: 10 }, { type: 'morale', delta: 8 }],
              after: function (g) { FKC.career.mentorBond(g, 6); } },
            { p: 0.5, text: K('mentor_clash', 'defend_bad'),
              effects: [{ type: 'morale', delta: -10 }, { type: 'growthBonus', points: -4 }],
              after: function (g) { FKC.career.mentorBond(g, -16); } }
          ] },
        { id: 'break', label: K('mentor_clash', 'break'), risk: 'high',
          result: K('mentor_clash', 'break_r'),
          effects: [{ type: 'morale', delta: -14 }, { type: 'growthBonus', points: -8 }],
          after: function (g) { FKC.career.mentorBond(g, -40); } }
      ]
    },

    {
      id: 'mentor_farewell', category: 'youth', phases: ['youth'],
      weight: 22, once: true, minAge: 17, maxAge: 19,
      when: hasMentor, textParams: mentorName,
      title: K('mentor_farewell', 'title'), text: K('mentor_farewell', 'text'),
      choices: [
        { id: 'thanks', label: K('mentor_farewell', 'thanks'), risk: 'low',
          result: K('mentor_farewell', 'thanks_r'),
          effects: [{ type: 'morale', delta: 12 }, { type: 'hidden', key: 'mentality', delta: 8 },
                    { type: 'timeline', key: 'tl.mentorFarewell', mark: 'good' }],
          after: function (g) { FKC.career.mentorBond(g, 10); } },
        { id: 'promise', label: K('mentor_farewell', 'promise'), risk: 'medium',
          result: K('mentor_farewell', 'promise_r'),
          effects: [{ type: 'growthBonus', points: 9 }, { type: 'hidden', key: 'workRate', delta: 8 },
                    { type: 'timeline', key: 'tl.mentorFarewell', mark: 'good' }],
          after: function (g) { FKC.career.mentorBond(g, 6); } }
      ]
    }
  ];

  FKC.data.spine = spine;
  FKC.data.eventsYouth = childhood.concat(youthEvents).concat(mentorEvents);
  /* Registrierung passiert gebündelt in js/main.js, damit die Engine
     unabhängig von der Ladereihenfolge der Datendateien bleibt. */

})(window.FKC);
