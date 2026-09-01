/* ── Folgeereignisse ───────────────────────────────────────────────────
   Ereignisse, die nur auftreten, weil vorher etwas Bestimmtes passiert
   ist. Über `follows` (siehe js/engine/events.js) hängen sie an einem
   früheren Ereignis und oft auch an der damals getroffenen Wahl.

   Damit stehen Szenen nicht mehr isoliert nebeneinander: Was man mit
   siebzehn entschieden hat, holt einen mit zweiundzwanzig ein — der
   Berater, dem man vertraut hat, der Post, den man abgesetzt hat, der
   Konkurrent aus der Jugend, die Verletzung, die nie ganz weg war.

   Aufbau einer Kette:
     Auslöser (bestehendes Ereignis)  →  Folge (hier)  →  ggf. Abschluss

   `maxGap` hält die Kette beisammen — eine Konsequenz nach fünfzehn
   Jahren liest sich nicht mehr als Konsequenz.                      */

window.FKC = window.FKC || {};
FKC.data = FKC.data || {};

(function (FKC) {
  'use strict';

  var K = function (id, part) { return 'ev.' + id + '.' + part; };

  var pool = [

    /* ══ Kette: der erste Berater ═══════════════════════════════════
       first_agent → agent_promise (unterschrieben) bzw. agent_late   */

    {
      id: 'ch_agent_promise', category: 'club', phases: ['youth', 'pro'],
      weight: 9, once: true, minAge: 18, maxAge: 26,
      follows: { ev: 'first_agent', choice: 'sign', minGap: 1, maxGap: 8 },
      title: K('ch_agent_promise', 'title'), text: K('ch_agent_promise', 'text'),
      textParams: function (g) { return { club: clubName(g) }; },
      choices: [
        { id: 'trust', label: K('ch_agent_promise', 'trust'),
          desc: K('ch_agent_promise', 'trust_d'), risk: 'medium',
          outcomes: [
            { p: 0.5, text: K('ch_agent_promise', 'trust_ok'),
              pMod: function (g) { return g.flags.agent === 'shark' ? 0.4 : 1.5; },
              effects: [{ type: 'reputation', delta: 9 }, { type: 'money', delta: 40000 },
                        { type: 'morale', delta: 8 }] },
            { p: 0.5, text: K('ch_agent_promise', 'trust_bad'),
              effects: [{ type: 'money', delta: -60000 }, { type: 'morale', delta: -10 },
                        { type: 'hidden', key: 'mentality', delta: 7 }] }
          ] },
        { id: 'check', label: K('ch_agent_promise', 'check'),
          desc: K('ch_agent_promise', 'check_d'), risk: 'low',
          result: K('ch_agent_promise', 'check_r'),
          effects: [{ type: 'education', delta: 6 }, { type: 'hidden', key: 'mentality', delta: 5 },
                    { type: 'flag', key: 'agent', value: 'careful' }] },
        { id: 'drop', label: K('ch_agent_promise', 'drop'),
          desc: K('ch_agent_promise', 'drop_d'), risk: 'high',
          result: K('ch_agent_promise', 'drop_r'),
          effects: [{ type: 'money', delta: -25000 }, { type: 'reputation', delta: -4 },
                    { type: 'flag', key: 'agent', value: 'none' }] }
      ]
    },

    {
      id: 'ch_agent_late', category: 'club', phases: ['pro'],
      weight: 8, once: true, minAge: 19, maxAge: 27,
      follows: { ev: 'first_agent', choice: ['family', 'wait'], minGap: 2, maxGap: 10 },
      title: K('ch_agent_late', 'title'), text: K('ch_agent_late', 'text'),
      choices: [
        { id: 'sign', label: K('ch_agent_late', 'sign'), desc: K('ch_agent_late', 'sign_d'),
          risk: 'medium', result: K('ch_agent_late', 'sign_r'),
          effects: [{ type: 'flag', key: 'agent', value: 'good' },
                    { type: 'reputation', delta: 7 }, { type: 'money', delta: -15000 }] },
        { id: 'family', label: K('ch_agent_late', 'family'), desc: K('ch_agent_late', 'family_d'),
          risk: 'medium', result: K('ch_agent_late', 'family_r'),
          effects: [{ type: 'familySupport', delta: 10 }, { type: 'loyalty', delta: 8 },
                    { type: 'reputation', delta: -3 }] }
      ]
    },

    /* ══ Kette: was im Netz stehen bleibt ═══════════════════════════
       social_media (aufgebaut) → ch_media_past                       */

    {
      id: 'ch_media_past', category: 'media', phases: ['pro'],
      weight: 9, once: true, minAge: 20, maxAge: 30,
      follows: { ev: 'social_media', choice: 'build', minGap: 2, maxGap: 12 },
      title: K('ch_media_past', 'title'), text: K('ch_media_past', 'text'),
      choices: [
        { id: 'own', label: K('ch_media_past', 'own'), desc: K('ch_media_past', 'own_d'),
          risk: 'low', result: K('ch_media_past', 'own_r'),
          effects: [{ type: 'reputation', delta: 5 }, { type: 'fanRelation', delta: 8 },
                    { type: 'hidden', key: 'mentality', delta: 6 }] },
        { id: 'lawyer', label: K('ch_media_past', 'lawyer'), desc: K('ch_media_past', 'lawyer_d'),
          risk: 'high',
          outcomes: [
            { p: 0.45, text: K('ch_media_past', 'lawyer_ok'),
              effects: [{ type: 'reputation', delta: 3 }, { type: 'money', delta: -30000 }] },
            { p: 0.55, text: K('ch_media_past', 'lawyer_bad'),
              effects: [{ type: 'reputation', delta: -10 }, { type: 'fanRelation', delta: -12 },
                        { type: 'money', delta: -50000 }, { type: 'form', delta: -6 }] }
          ] },
        { id: 'silence', label: K('ch_media_past', 'silence'), desc: K('ch_media_past', 'silence_d'),
          risk: 'medium', result: K('ch_media_past', 'silence_r'),
          effects: [{ type: 'reputation', delta: -3 }, { type: 'hidden', key: 'consistency', delta: 4 }] }
      ]
    },

    /* ══ Kette: der Konkurrent aus der Jugend ═══════════════════════ */

    {
      id: 'ch_rival_again', category: 'sport', phases: ['pro'],
      weight: 9, once: true, minAge: 20, maxAge: 31,
      follows: { ev: 'youth_rival', minGap: 2, maxGap: 14 },
      title: K('ch_rival_again', 'title'), text: K('ch_rival_again', 'text'),
      /* Der Ton hängt daran, wer weiter gekommen ist */
      textParams: function (g) { return { club: clubName(g) }; },
      choices: [
        { id: 'measure', label: K('ch_rival_again', 'measure'),
          desc: K('ch_rival_again', 'measure_d'), risk: 'medium',
          outcomes: [
            { p: 0.55, text: K('ch_rival_again', 'measure_ok'),
              pMod: function (g) { return 0.5 + g.hidden.bigGame / 110; },
              effects: [{ type: 'form', delta: 8 }, { type: 'reputation', delta: 6 },
                        { type: 'growthBonus', points: 4 }] },
            { p: 0.45, text: K('ch_rival_again', 'measure_bad'),
              effects: [{ type: 'form', delta: -8 }, { type: 'morale', delta: -8 },
                        { type: 'hidden', key: 'mentality', delta: 6 }] }
          ] },
        { id: 'respect', label: K('ch_rival_again', 'respect'),
          desc: K('ch_rival_again', 'respect_d'), risk: 'low',
          result: K('ch_rival_again', 'respect_r'),
          effects: [{ type: 'morale', delta: 8 }, { type: 'hidden', key: 'mentality', delta: 8 },
                    { type: 'hidden', key: 'consistency', delta: 4 }] }
      ]
    },

    /* ══ Kette: die Verletzung, die bleibt ══════════════════════════
       youth_serious_injury → ch_old_injury → ch_injury_verdict       */

    {
      id: 'ch_old_injury', category: 'sport', phases: ['pro'],
      weight: 10, once: true, minAge: 21, maxAge: 30,
      follows: { ev: 'youth_serious_injury', minGap: 2, maxGap: 12 },
      weightMod: function (g) { return 0.6 + g.hidden.injuryProneness / 90; },
      title: K('ch_old_injury', 'title'), text: K('ch_old_injury', 'text'),
      choices: [
        { id: 'manage', label: K('ch_old_injury', 'manage'), desc: K('ch_old_injury', 'manage_d'),
          risk: 'low', result: K('ch_old_injury', 'manage_r'),
          effects: [{ type: 'hidden', key: 'injuryProneness', delta: -10 },
                    { type: 'fitness', delta: 8 }, { type: 'growthBonus', points: -3 }] },
        { id: 'ignore', label: K('ch_old_injury', 'ignore'), desc: K('ch_old_injury', 'ignore_d'),
          risk: 'high',
          outcomes: [
            { p: 0.45, text: K('ch_old_injury', 'ignore_ok'),
              effects: [{ type: 'form', delta: 7 }, { type: 'hidden', key: 'workRate', delta: 6 }] },
            { p: 0.55, text: K('ch_old_injury', 'ignore_bad'),
              effects: [{ type: 'injury', weeks: 14 }, { type: 'potential', delta: -3 },
                        { type: 'hidden', key: 'injuryProneness', delta: 10 },
                        { type: 'flag', key: 'chronicKnee', value: true }] }
          ] },
        { id: 'surgery', label: K('ch_old_injury', 'surgery'), desc: K('ch_old_injury', 'surgery_d'),
          risk: 'medium',
          outcomes: [
            { p: 0.7, text: K('ch_old_injury', 'surgery_ok'),
              effects: [{ type: 'injury', weeks: 10 },
                        { type: 'hidden', key: 'injuryProneness', delta: -18 },
                        { type: 'fitness', delta: 10 }] },
            { p: 0.3, text: K('ch_old_injury', 'surgery_bad'),
              effects: [{ type: 'injury', weeks: 20 }, { type: 'potential', delta: -4 },
                        { type: 'morale', delta: -12 },
                        { type: 'flag', key: 'chronicKnee', value: true }] }
          ] }
      ]
    },

    {
      id: 'ch_injury_verdict', category: 'sport', phases: ['pro'],
      weight: 10, once: true, minAge: 24, maxAge: 34,
      follows: { ev: 'ch_old_injury', minGap: 2, maxGap: 10 },
      when: function (g) { return !!g.flags.chronicKnee; },
      title: K('ch_injury_verdict', 'title'), text: K('ch_injury_verdict', 'text'),
      choices: [
        { id: 'adapt', label: K('ch_injury_verdict', 'adapt'), desc: K('ch_injury_verdict', 'adapt_d'),
          risk: 'low', result: K('ch_injury_verdict', 'adapt_r'),
          effects: function (g) {
            return [{ type: 'attr', key: g.identity.isGK ? 'positioning' : 'passing', delta: 5 },
                    { type: 'attr', key: g.identity.isGK ? 'physical' : 'pace', delta: -4 },
                    { type: 'hidden', key: 'mentality', delta: 8 }];
          } },
        { id: 'fight', label: K('ch_injury_verdict', 'fight'), desc: K('ch_injury_verdict', 'fight_d'),
          risk: 'high',
          outcomes: [
            { p: 0.4, text: K('ch_injury_verdict', 'fight_ok'),
              effects: [{ type: 'fitness', delta: 12 }, { type: 'form', delta: 8 },
                        { type: 'hidden', key: 'injuryProneness', delta: -8 }] },
            { p: 0.6, text: K('ch_injury_verdict', 'fight_bad'),
              effects: [{ type: 'injury', weeks: 16 }, { type: 'potential', delta: -5 },
                        { type: 'morale', delta: -12 }] }
          ] }
      ]
    },

    /* ══ Kette: der Mentor meldet sich ══════════════════════════════ */

    {
      id: 'ch_mentor_call', category: 'youth', phases: ['pro'],
      weight: 9, once: true, minAge: 20, maxAge: 32,
      follows: { any: [{ ev: 'mentor_farewell', minGap: 1, maxGap: 14 },
                       { ev: 'mentor_bigmatch', minGap: 3, maxGap: 14 }] },
      when: function (g) { return !!g.career.mentor; },
      /* Er ruft an, wenn es gerade nicht läuft — sonst wäre es Small Talk */
      weightMod: function (g) { return g.condition.morale < 50 ? 2.2 : 0.6; },
      title: K('ch_mentor_call', 'title'), text: K('ch_mentor_call', 'text'),
      textParams: function (g) {
        return { mentor: (g.career.mentor && g.career.mentor.name) || '' };
      },
      choices: [
        { id: 'listen', label: K('ch_mentor_call', 'listen'), desc: K('ch_mentor_call', 'listen_d'),
          risk: 'low', result: K('ch_mentor_call', 'listen_r'),
          effects: [{ type: 'morale', delta: 14 }, { type: 'form', delta: 6 },
                    { type: 'hidden', key: 'mentality', delta: 8 }],
          after: function (g) { FKC.career.mentorBond(g, 8); } },
        { id: 'brush', label: K('ch_mentor_call', 'brush'), desc: K('ch_mentor_call', 'brush_d'),
          risk: 'medium', result: K('ch_mentor_call', 'brush_r'),
          effects: [{ type: 'morale', delta: -6 }, { type: 'hidden', key: 'mentality', delta: -4 }],
          after: function (g) { FKC.career.mentorBond(g, -12); } }
      ]
    },

    /* ══ Kette: die Sportschule zahlt sich aus (oder nicht) ═════════ */

    {
      id: 'ch_school_payoff', category: 'private', phases: ['pro'],
      weight: 7, once: true, minAge: 22, maxAge: 33,
      follows: { any: [{ ev: 'nlz_school_deal', choice: 'football_only', minGap: 4, maxGap: 16 },
                       { ev: 'school_vs_football', minGap: 5, maxGap: 18 }] },
      title: K('ch_school_payoff', 'title'), text: K('ch_school_payoff', 'text'),
      choices: [
        { id: 'catchup', label: K('ch_school_payoff', 'catchup'),
          desc: K('ch_school_payoff', 'catchup_d'), risk: 'low',
          result: K('ch_school_payoff', 'catchup_r'),
          effects: [{ type: 'education', delta: 20 }, { type: 'growthBonus', points: -4 },
                    { type: 'hidden', key: 'mentality', delta: 6 }] },
        { id: 'focus', label: K('ch_school_payoff', 'focus'),
          desc: K('ch_school_payoff', 'focus_d'), risk: 'medium',
          result: K('ch_school_payoff', 'focus_r'),
          effects: [{ type: 'growthBonus', points: 6 }, { type: 'education', delta: -6 },
                    { type: 'hidden', key: 'workRate', delta: 5 }] }
      ]
    },

    /* ══ Kette: der Wechselwunsch von damals ════════════════════════ */

    {
      id: 'ch_fans_remember', category: 'media', phases: ['pro'],
      weight: 8, once: true, minAge: 22, maxAge: 34,
      when: function (g) {
        /* Nur wenn tatsächlich einmal ein Wechsel erzwungen wurde und
           die Fans es noch spüren. */
        return g.status.loyalty < 45 && g.status.fanRelation < 55 &&
               g.career.clubsPlayed && g.career.clubsPlayed.length >= 3;
      },
      title: K('ch_fans_remember', 'title'), text: K('ch_fans_remember', 'text'),
      textParams: function (g) { return { club: clubName(g) }; },
      choices: [
        { id: 'explain', label: K('ch_fans_remember', 'explain'),
          desc: K('ch_fans_remember', 'explain_d'), risk: 'medium',
          outcomes: [
            { p: 0.55, text: K('ch_fans_remember', 'explain_ok'),
              effects: [{ type: 'fanRelation', delta: 16 }, { type: 'reputation', delta: 4 }] },
            { p: 0.45, text: K('ch_fans_remember', 'explain_bad'),
              effects: [{ type: 'fanRelation', delta: -8 }, { type: 'morale', delta: -8 }] }
          ] },
        { id: 'pitch', label: K('ch_fans_remember', 'pitch'),
          desc: K('ch_fans_remember', 'pitch_d'), risk: 'low',
          result: K('ch_fans_remember', 'pitch_r'),
          effects: [{ type: 'hidden', key: 'mentality', delta: 7 },
                    { type: 'form', delta: 5 }, { type: 'fanRelation', delta: 6 }] }
      ]
    }
  ];

  function clubName(g) {
    var c = FKC.state.club();
    return c ? c.name : (g.origin && g.origin.villageClubName) || '';
  }

  FKC.data.eventsChains = pool;
  /* Registrierung gebündelt in js/main.js */

})(window.FKC);
