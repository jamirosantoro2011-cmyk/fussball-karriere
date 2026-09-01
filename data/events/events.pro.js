/* ── Profikarriere: Ereignisse ─────────────────────────────────────────
   Bewusst wenige pro Saison, dafür mit spürbaren Folgen. Jede Wahl ist
   eine echte Risiko/Ertrags-Abwägung, kein Klick ohne Konsequenz.   */

window.FKC = window.FKC || {};
FKC.data = FKC.data || {};

(function (FKC) {
  'use strict';

  var K = function (id, part) { return 'ev.' + id + '.' + part; };
  var lastSeason = function (g) {
    return g.career.seasons.length ? g.career.seasons[g.career.seasons.length - 1] : null;
  };

  var pro = [

    /* ── Formkrise ───────────────────────────────────────────────── */
    {
      id: 'form_crisis', category: 'sport', phases: ['pro'],
      weight: 9, cooldown: 3, minAge: 18,
      when: function (g) { return g.condition.form < 52; },
      weightMod: function (g) {
        var w = 1 + (55 - g.condition.form) / 30;
        /* Wer mental geschult wurde, gerät seltener in eine Krise */
        var m = g.career.mentor && FKC.data.mentorById(g.career.mentor.id);
        if (m && m.stability) w *= 0.45;
        return w;
      },
      title: K('form_crisis', 'title'), text: K('form_crisis', 'text'),
      choices: [
        { id: 'extra', label: K('form_crisis', 'extra'), desc: K('form_crisis', 'extra_d'), risk: 'medium',
          outcomes: [
            { p: 0.55, text: K('form_crisis', 'extra_ok'),
              pMod: function (g) { return 0.5 + g.hidden.workRate / 90; },
              effects: [{ type: 'form', delta: 26 }, { type: 'morale', delta: 10 },
                        { type: 'hidden', key: 'consistency', delta: 4 }] },
            { p: 0.45, text: K('form_crisis', 'extra_bad'),
              effects: [{ type: 'fitness', delta: -18 }, { type: 'injury', weeks: 5 },
                        { type: 'form', delta: 6 }] }
          ] },
        { id: 'psych', label: K('form_crisis', 'psych'), desc: K('form_crisis', 'psych_d'), risk: 'low',
          outcomes: [
            { p: 0.7, text: K('form_crisis', 'psych_ok'),
              effects: [{ type: 'form', delta: 16 }, { type: 'hidden', key: 'mentality', delta: 8 },
                        { type: 'hidden', key: 'bigGame', delta: 5 }] },
            { p: 0.3, text: K('form_crisis', 'psych_bad'),
              effects: [{ type: 'form', delta: 4 }, { type: 'money', delta: -25000 }] }
          ] },
        { id: 'force', label: K('form_crisis', 'force'), desc: K('form_crisis', 'force_d'), risk: 'high',
          outcomes: [
            { p: 0.35, text: K('form_crisis', 'force_ok'),
              pMod: function (g) { return 0.4 + g.hidden.bigGame / 80; },
              effects: [{ type: 'form', delta: 34 }, { type: 'reputation', delta: 6 },
                        { type: 'fanRelation', delta: 10 }] },
            { p: 0.65, text: K('form_crisis', 'force_bad'),
              effects: [{ type: 'form', delta: -14 }, { type: 'morale', delta: -14 },
                        { type: 'fanRelation', delta: -12 }] }
          ] }
      ]
    },

    /* ── Trainerwechsel ──────────────────────────────────────────── */
    {
      id: 'new_manager', category: 'club', phases: ['pro'],
      weight: 8, cooldown: 2, minAge: 18,
      title: K('new_manager', 'title'), text: K('new_manager', 'text'),
      choices: [
        { id: 'impress', label: K('new_manager', 'impress'), desc: K('new_manager', 'impress_d'), risk: 'medium',
          outcomes: [
            { p: 0.55, text: K('new_manager', 'impress_ok'),
              pMod: function (g) { return 0.5 + g.hidden.workRate / 100; },
              effects: [{ type: 'form', delta: 10 }, { type: 'flag', key: 'coachTrust', value: 2 },
                        { type: 'growthBonus', points: 5 }] },
            { p: 0.45, text: K('new_manager', 'impress_bad'),
              effects: [{ type: 'fitness', delta: -10 }, { type: 'flag', key: 'coachTrust', value: 0 },
                        { type: 'morale', delta: -6 }] }
          ] },
        { id: 'adapt', label: K('new_manager', 'adapt'), desc: K('new_manager', 'adapt_d'), risk: 'low',
          result: K('new_manager', 'adapt_r'),
          effects: [{ type: 'attrRandom', keys: ['passing', 'defending', 'physical'], delta: 6 },
                    { type: 'growthBonus', points: 6 },
                    { type: 'flag', key: 'coachTrust', value: 1 }, { type: 'morale', delta: 8 }] },
        { id: 'clash', label: K('new_manager', 'clash'), desc: K('new_manager', 'clash_d'), risk: 'high',
          outcomes: [
            { p: 0.3, text: K('new_manager', 'clash_ok'),
              effects: [{ type: 'reputation', delta: 8 }, { type: 'hidden', key: 'mentality', delta: 8 },
                        { type: 'flag', key: 'coachTrust', value: 1 }] },
            { p: 0.7, text: K('new_manager', 'clash_bad'),
              effects: [{ type: 'flag', key: 'coachTrust', value: -2 }, { type: 'morale', delta: -16 },
                        { type: 'form', delta: -12 }] }
          ] }
      ]
    },

    /* ── Kapitänsbinde ───────────────────────────────────────────── */
    {
      id: 'captain_offer', category: 'club', phases: ['pro'],
      weight: 7, once: true, minAge: 24,
      when: function (g) {
        return !g.status.isCaptain && g.status.seasonsAtClub >= 2 &&
               g.hidden.mentality >= 60 && g.ovr >= 68;
      },
      title: K('captain_offer', 'title'), text: K('captain_offer', 'text'),
      textParams: function (g) { var c = FKC.state.club(); return { club: c ? c.name : '' }; },
      choices: [
        { id: 'accept', label: K('captain_offer', 'accept'), desc: K('captain_offer', 'accept_d'), risk: 'medium',
          result: K('captain_offer', 'accept_r'),
          effects: [{ type: 'reputation', delta: 10 }, { type: 'fanRelation', delta: 14 },
                    { type: 'loyalty', delta: 18 }, { type: 'hidden', key: 'mentality', delta: 8 },
                    { type: 'timeline', key: 'tl.captainBadge', mark: 'good' }],
          after: function (g) { g.status.isCaptain = true; } },
        { id: 'decline', label: K('captain_offer', 'decline'), desc: K('captain_offer', 'decline_d'), risk: 'low',
          result: K('captain_offer', 'decline_r'),
          effects: [{ type: 'form', delta: 8 }, { type: 'fanRelation', delta: -6 }] }
      ]
    },

    /* ── Rote Karte ──────────────────────────────────────────────── */
    {
      id: 'red_card', category: 'sport', phases: ['pro'],
      weight: 7, cooldown: 3, minAge: 18,
      weightMod: function (g) { return 0.5 + (100 - g.hidden.discipline) / 45; },
      title: K('red_card', 'title'), text: K('red_card', 'text'),
      choices: [
        { id: 'apologise', label: K('red_card', 'apologise'), desc: K('red_card', 'apologise_d'), risk: 'low',
          result: K('red_card', 'apologise_r'),
          effects: [{ type: 'fanRelation', delta: 5 }, { type: 'hidden', key: 'discipline', delta: 6 },
                    { type: 'form', delta: -6 }] },
        { id: 'defend', label: K('red_card', 'defend'), desc: K('red_card', 'defend_d'), risk: 'medium',
          outcomes: [
            { p: 0.4, text: K('red_card', 'defend_ok'),
              effects: [{ type: 'reputation', delta: 5 }, { type: 'fanRelation', delta: 8 }] },
            { p: 0.6, text: K('red_card', 'defend_bad'),
              effects: [{ type: 'money', delta: -60000 }, { type: 'form', delta: -10 },
                        { type: 'reputation', delta: -4 }] }
          ] },
        { id: 'blast', label: K('red_card', 'blast'), desc: K('red_card', 'blast_d'), risk: 'high',
          outcomes: [
            { p: 0.25, text: K('red_card', 'blast_ok'),
              effects: [{ type: 'fanRelation', delta: 16 }, { type: 'reputation', delta: 9 },
                        { type: 'trait', id: 'hothead' }] },
            { p: 0.75, text: K('red_card', 'blast_bad'),
              effects: [{ type: 'money', delta: -150000 }, { type: 'reputation', delta: -8 },
                        { type: 'hidden', key: 'discipline', delta: -8 }, { type: 'morale', delta: -10 }] }
          ] }
      ]
    },

    /* ── Meilenstein ─────────────────────────────────────────────── */
    {
      id: 'milestone', category: 'sport', phases: ['pro'],
      weight: 6, once: true, minAge: 22,
      when: function (g) { return g.career.totals.apps >= 100; },
      title: K('milestone', 'title'), text: K('milestone', 'text'),
      textParams: function (g) { return { apps: g.career.totals.apps, goals: g.career.totals.goals }; },
      choices: [
        { id: 'club', label: K('milestone', 'club'), desc: K('milestone', 'club_d'), risk: 'low',
          result: K('milestone', 'club_r'),
          effects: [{ type: 'fanRelation', delta: 12 }, { type: 'loyalty', delta: 10 },
                    { type: 'morale', delta: 8 }, { type: 'timeline', key: 'tl.milestone', mark: 'good' }] },
        { id: 'quiet', label: K('milestone', 'quiet'), desc: K('milestone', 'quiet_d'), risk: 'low',
          result: K('milestone', 'quiet_r'),
          effects: [{ type: 'hidden', key: 'consistency', delta: 10 },
                    { type: 'growthBonus', points: 9 }, { type: 'form', delta: 8 },
                    { type: 'timeline', key: 'tl.milestone', mark: 'good' }] }
      ]
    },

    /* ── Berater ─────────────────────────────────────────────────── */
    {
      id: 'agent_deal', category: 'club', phases: ['pro'],
      weight: 6, cooldown: 5, minAge: 19,
      title: K('agent_deal', 'title'), text: K('agent_deal', 'text'),
      choices: [
        { id: 'sign', label: K('agent_deal', 'sign'), desc: K('agent_deal', 'sign_d'), risk: 'medium',
          outcomes: [
            { p: 0.45, text: K('agent_deal', 'sign_ok'),
              effects: [{ type: 'money', delta: 400000 }, { type: 'reputation', delta: 5 }] },
            { p: 0.55, text: K('agent_deal', 'sign_bad'),
              effects: [{ type: 'money', delta: -180000 }, { type: 'morale', delta: -8 },
                        { type: 'flag', key: 'badAgent', value: true }] }
          ] },
        { id: 'lawyer', label: K('agent_deal', 'lawyer'), desc: K('agent_deal', 'lawyer_d'), risk: 'low',
          result: K('agent_deal', 'lawyer_r'),
          effects: [{ type: 'money', delta: -40000 }, { type: 'hidden', key: 'mentality', delta: 5 }] },
        { id: 'fire', label: K('agent_deal', 'fire'), desc: K('agent_deal', 'fire_d'), risk: 'high',
          outcomes: [
            { p: 0.5, text: K('agent_deal', 'fire_ok'),
              effects: [{ type: 'reputation', delta: 6 }, { type: 'hidden', key: 'mentality', delta: 8 }] },
            { p: 0.5, text: K('agent_deal', 'fire_bad'),
              effects: [{ type: 'reputation', delta: -8 }, { type: 'money', delta: -120000 },
                        { type: 'morale', delta: -10 }] }
          ] }
      ]
    },

    /* ── Dopingvorwurf ───────────────────────────────────────────── */
    {
      id: 'doping_claim', category: 'media', phases: ['pro'],
      weight: 4, once: true, minAge: 21,
      when: function (g) { return g.status.reputation >= 45; },
      title: K('doping_claim', 'title'), text: K('doping_claim', 'text'),
      choices: [
        { id: 'bTest', label: K('doping_claim', 'bTest'), desc: K('doping_claim', 'bTest_d'), risk: 'medium',
          outcomes: [
            { p: 0.72, text: K('doping_claim', 'bTest_ok'),
              effects: [{ type: 'reputation', delta: 4 }, { type: 'morale', delta: -6 },
                        { type: 'form', delta: -8 }] },
            { p: 0.28, text: K('doping_claim', 'bTest_bad'),
              effects: [{ type: 'injury', weeks: 40, severity: 'ban' }, { type: 'reputation', delta: -30 },
                        { type: 'fanRelation', delta: -35 }, { type: 'morale', delta: -25 },
                        { type: 'timeline', key: 'tl.dopingBan', mark: 'bad' }] }
          ] },
        { id: 'silence', label: K('doping_claim', 'silence'), desc: K('doping_claim', 'silence_d'), risk: 'high',
          outcomes: [
            { p: 0.5, text: K('doping_claim', 'silence_ok'),
              effects: [{ type: 'reputation', delta: -8 }, { type: 'form', delta: -6 }] },
            { p: 0.5, text: K('doping_claim', 'silence_bad'),
              effects: [{ type: 'reputation', delta: -20 }, { type: 'fanRelation', delta: -22 },
                        { type: 'injury', weeks: 20, severity: 'ban' }] }
          ] },
        { id: 'offensive', label: K('doping_claim', 'offensive'), desc: K('doping_claim', 'offensive_d'), risk: 'medium',
          outcomes: [
            { p: 0.6, text: K('doping_claim', 'offensive_ok'),
              effects: [{ type: 'reputation', delta: 10 }, { type: 'fanRelation', delta: 12 },
                        { type: 'hidden', key: 'mentality', delta: 6 }] },
            { p: 0.4, text: K('doping_claim', 'offensive_bad'),
              effects: [{ type: 'reputation', delta: -14 }, { type: 'morale', delta: -12 }] }
          ] }
      ]
    },

    /* ── Lockangebot mit sehr viel Geld ──────────────────────────── */
    {
      id: 'golden_offer', category: 'club', phases: ['pro'],
      weight: 5, cooldown: 6, minAge: 26,
      when: function (g) { return g.ovr >= 74 && g.status.reputation >= 60; },
      title: K('golden_offer', 'title'), text: K('golden_offer', 'text'),
      textParams: function (g) {
        return { salary: FKC.i18n.money(Math.round((g.status.contract ? g.status.contract.salary : 1e6) * 4)) };
      },
      choices: [
        { id: 'take', label: K('golden_offer', 'take'), desc: K('golden_offer', 'take_d'), risk: 'high',
          result: K('golden_offer', 'take_r'),
          effects: function (g) {
            var sal = (g.status.contract ? g.status.contract.salary : 1000000) * 4;
            return [{ type: 'money', delta: Math.round(sal) },
                    { type: 'reputation', delta: -12 }, { type: 'fanRelation', delta: -20 },
                    { type: 'form', delta: -14 }, { type: 'flag', key: 'chasedMoney', value: true },
                    { type: 'timeline', key: 'tl.goldenMove', mark: 'bad' }];
          },
          after: function (g) {
            var club = FKC.transfer.sampleClubs(FKC.data.clubLevel(FKC.state.club()) - 6, 1,
              { exclude: [g.status.clubId], country: 'KSA' })[0]
              || FKC.transfer.sampleClubs(g.ovr - 4, 1, { exclude: [g.status.clubId] })[0];
            if (club) {
              FKC.effects.moveToClub(g, club, 'pro');
              g.status.contract = {
                salary: Math.round((g.status.contract ? g.status.contract.salary : 1e6) * 4),
                yearsLeft: 3, signedYear: g.identity.year, releaseClause: 0, squadRole: 'star'
              };
            }
          } },
        { id: 'refuse', label: K('golden_offer', 'refuse'), desc: K('golden_offer', 'refuse_d'), risk: 'low',
          result: K('golden_offer', 'refuse_r'),
          effects: [{ type: 'fanRelation', delta: 18 }, { type: 'loyalty', delta: 15 },
                    { type: 'morale', delta: 8 }, { type: 'reputation', delta: 4 }] }
      ]
    },

    /* ── Rivalität ───────────────────────────────────────────────── */
    {
      id: 'pro_rival', category: 'sport', phases: ['pro'],
      weight: 6, cooldown: 4, minAge: 19,
      title: K('pro_rival', 'title'), text: K('pro_rival', 'text'),
      choices: [
        { id: 'compete', label: K('pro_rival', 'compete'), desc: K('pro_rival', 'compete_d'), risk: 'medium',
          outcomes: [
            { p: 0.55, text: K('pro_rival', 'compete_ok'),
              pMod: function (g) { return 0.4 + g.ovr / 90; },
              effects: [{ type: 'growthBonus', points: 14 }, { type: 'form', delta: 16 },
                        { type: 'reputation', delta: 8 },
                        { type: 'hidden', key: 'workRate', delta: 6 }] },
            { p: 0.45, text: K('pro_rival', 'compete_bad'),
              effects: [{ type: 'form', delta: -20 }, { type: 'morale', delta: -18 },
                        { type: 'fitness', delta: -12 }] }
          ] },
        { id: 'mentor', label: K('pro_rival', 'mentor'), desc: K('pro_rival', 'mentor_d'), risk: 'low',
          result: K('pro_rival', 'mentor_r'),
          effects: [{ type: 'morale', delta: 10 }, { type: 'hidden', key: 'mentality', delta: 6 },
                    { type: 'fanRelation', delta: 6 }] },
        { id: 'demand', label: K('pro_rival', 'demand'), desc: K('pro_rival', 'demand_d'), risk: 'high',
          outcomes: [
            { p: 0.35, text: K('pro_rival', 'demand_ok'),
              effects: [{ type: 'flag', key: 'coachTrust', value: 2 }, { type: 'form', delta: 8 }] },
            { p: 0.65, text: K('pro_rival', 'demand_bad'),
              effects: [{ type: 'morale', delta: -14 }, { type: 'fanRelation', delta: -10 },
                        { type: 'flag', key: 'coachTrust', value: -1 }] }
          ] }
      ]
    },

    /* ── Heirat ──────────────────────────────────────────────────── */
    {
      id: 'marriage', category: 'private', phases: ['pro'],
      weight: 6, once: true, minAge: 22,
      when: function (g) { return !g.career.life.partner; },
      title: K('marriage', 'title'), text: K('marriage', 'text'),
      choices: [
        { id: 'wed', label: K('marriage', 'wed'), desc: K('marriage', 'wed_d'), risk: 'low',
          result: K('marriage', 'wed_r'),
          effects: [{ type: 'morale', delta: 18 }, { type: 'homesick', delta: -15 },
                    { type: 'money', delta: -180000 },
                    { type: 'timeline', key: 'tl.married', mark: 'good' }],
          after: function (g) { g.career.life.partner = true; } },
        { id: 'wait', label: K('marriage', 'wait'), desc: K('marriage', 'wait_d'), risk: 'medium',
          outcomes: [
            { p: 0.5, text: K('marriage', 'wait_ok'),
              effects: [{ type: 'growthBonus', points: 5 }, { type: 'morale', delta: 4 }] },
            { p: 0.5, text: K('marriage', 'wait_bad'),
              effects: [{ type: 'morale', delta: -16 }, { type: 'form', delta: -10 }] }
          ] }
      ]
    },

    /* ── Kind ────────────────────────────────────────────────────── */
    {
      id: 'child_born', category: 'private', phases: ['pro'],
      weight: 6, cooldown: 4, minAge: 23,
      when: function (g) { return g.career.life.partner && g.career.life.children < 3; },
      title: K('child_born', 'title'), text: K('child_born', 'text'),
      choices: [
        { id: 'present', label: K('child_born', 'present'), desc: K('child_born', 'present_d'), risk: 'medium',
          result: K('child_born', 'present_r'),
          effects: [{ type: 'morale', delta: 20 }, { type: 'form', delta: -8 },
                    { type: 'growthBonus', points: -4 },
                    { type: 'timeline', key: 'tl.child', mark: 'good' }],
          after: function (g) { g.career.life.children += 1; } },
        { id: 'focus', label: K('child_born', 'focus'), desc: K('child_born', 'focus_d'), risk: 'medium',
          result: K('child_born', 'focus_r'),
          effects: [{ type: 'form', delta: 8 }, { type: 'morale', delta: -10 },
                    { type: 'timeline', key: 'tl.child', mark: 'plain' }],
          after: function (g) { g.career.life.children += 1; } }
      ]
    },

    /* ── Prominente Beziehung ────────────────────────────────────── */
    {
      id: 'celebrity', category: 'media', phases: ['pro'],
      weight: 5, once: true, minAge: 21,
      when: function (g) { return g.status.reputation >= 55 && !g.career.life.partner; },
      title: K('celebrity', 'title'), text: K('celebrity', 'text'),
      choices: [
        { id: 'public', label: K('celebrity', 'public'), desc: K('celebrity', 'public_d'), risk: 'high',
          outcomes: [
            { p: 0.45, text: K('celebrity', 'public_ok'),
              effects: [{ type: 'reputation', delta: 20 }, { type: 'money', delta: 600000 },
                        { type: 'morale', delta: 10 }] },
            { p: 0.55, text: K('celebrity', 'public_bad'),
              effects: [{ type: 'reputation', delta: 12 }, { type: 'form', delta: -16 },
                        { type: 'lifestyle', delta: 18 }, { type: 'fanRelation', delta: -8 }] }
          ],
          after: function (g) { g.career.life.partner = true; } },
        { id: 'private', label: K('celebrity', 'private'), desc: K('celebrity', 'private_d'), risk: 'low',
          result: K('celebrity', 'private_r'),
          effects: [{ type: 'morale', delta: 12 }, { type: 'hidden', key: 'consistency', delta: 4 }],
          after: function (g) { g.career.life.partner = true; } }
      ]
    },

    /* ── Todesfall ───────────────────────────────────────────────── */
    {
      id: 'family_death', category: 'private', phases: ['pro'],
      weight: 4, once: true, minAge: 22,
      title: K('family_death', 'title'), text: K('family_death', 'text'),
      choices: [
        { id: 'play', label: K('family_death', 'play'), desc: K('family_death', 'play_d'), risk: 'high',
          outcomes: [
            { p: 0.45, text: K('family_death', 'play_ok'),
              effects: [{ type: 'form', delta: 18 }, { type: 'fanRelation', delta: 14 },
                        { type: 'hidden', key: 'mentality', delta: 10 },
                        { type: 'timeline', key: 'tl.loss', mark: 'bad' }] },
            { p: 0.55, text: K('family_death', 'play_bad'),
              effects: [{ type: 'form', delta: -20 }, { type: 'morale', delta: -22 },
                        { type: 'timeline', key: 'tl.loss', mark: 'bad' }] }
          ] },
        { id: 'pause', label: K('family_death', 'pause'), desc: K('family_death', 'pause_d'), risk: 'low',
          result: K('family_death', 'pause_r'),
          effects: [{ type: 'morale', delta: -8 }, { type: 'form', delta: -6 },
                    { type: 'hidden', key: 'mentality', delta: 6 },
                    { type: 'timeline', key: 'tl.loss', mark: 'bad' }] }
      ]
    },

    /* ── Fehlinvestition ─────────────────────────────────────────── */
    {
      id: 'bad_investment', category: 'private', phases: ['pro'],
      weight: 6, cooldown: 5, minAge: 23,
      when: function (g) { return g.career.finances.balance > 400000; },
      title: K('bad_investment', 'title'), text: K('bad_investment', 'text'),
      choices: [
        { id: 'all_in', label: K('bad_investment', 'all_in'), desc: K('bad_investment', 'all_in_d'), risk: 'high',
          outcomes: [
            { p: 0.35, text: K('bad_investment', 'all_in_ok'),
              effects: function (g) { return [{ type: 'money', delta: Math.round(g.career.finances.balance * 1.1) }]; } },
            { p: 0.65, text: K('bad_investment', 'all_in_bad'),
              effects: function (g) {
                return [{ type: 'money', delta: -Math.round(g.career.finances.balance * 0.55) },
                        { type: 'morale', delta: -14 }, { type: 'form', delta: -8 }];
              } }
          ] },
        { id: 'small', label: K('bad_investment', 'small'), desc: K('bad_investment', 'small_d'), risk: 'medium',
          outcomes: [
            { p: 0.55, text: K('bad_investment', 'small_ok'),
              effects: function (g) { return [{ type: 'money', delta: Math.round(g.career.finances.balance * 0.18) }]; } },
            { p: 0.45, text: K('bad_investment', 'small_bad'),
              effects: function (g) { return [{ type: 'money', delta: -Math.round(g.career.finances.balance * 0.14) }]; } }
          ] },
        { id: 'none', label: K('bad_investment', 'none'), desc: K('bad_investment', 'none_d'), risk: 'low',
          result: K('bad_investment', 'none_r'),
          effects: [{ type: 'hidden', key: 'mentality', delta: 3 }] }
      ]
    },

    /* ── Gesundheitliche Warnung ─────────────────────────────────── */
    {
      id: 'health_scare', category: 'private', phases: ['pro'],
      weight: 4, once: true, minAge: 26,
      title: K('health_scare', 'title'), text: K('health_scare', 'text'),
      choices: [
        { id: 'checks', label: K('health_scare', 'checks'), desc: K('health_scare', 'checks_d'), risk: 'low',
          outcomes: [
            { p: 0.75, text: K('health_scare', 'checks_ok'),
              effects: [{ type: 'injury', weeks: 6 }, { type: 'morale', delta: -6 },
                        { type: 'hidden', key: 'injuryProneness', delta: -6 }] },
            { p: 0.25, text: K('health_scare', 'checks_bad'),
              effects: [{ type: 'injury', weeks: 24 }, { type: 'potential', delta: -5 },
                        { type: 'morale', delta: -18 }, { type: 'timeline', key: 'tl.health', mark: 'bad' }] }
          ] },
        { id: 'ignore', label: K('health_scare', 'ignore'), desc: K('health_scare', 'ignore_d'), risk: 'high',
          outcomes: [
            { p: 0.45, text: K('health_scare', 'ignore_ok'),
              effects: [{ type: 'form', delta: 6 }] },
            { p: 0.55, text: K('health_scare', 'ignore_bad'),
              effects: [{ type: 'injury', weeks: 34 }, { type: 'potential', delta: -9 },
                        { type: 'attrAll', delta: -2 },
                        { type: 'timeline', key: 'tl.health', mark: 'bad' }] }
          ] }
      ]
    },

    /* ── Reha-Rückschlag ─────────────────────────────────────────── */
    {
      id: 'rehab_setback', category: 'sport', phases: ['pro'],
      weight: 7, cooldown: 3, minAge: 19,
      when: function (g) { return !!g.condition.injury && g.condition.injury.weeks >= 10; },
      title: K('rehab_setback', 'title'), text: K('rehab_setback', 'text'),
      choices: [
        { id: 'patient', label: K('rehab_setback', 'patient'), desc: K('rehab_setback', 'patient_d'), risk: 'low',
          result: K('rehab_setback', 'patient_r'),
          effects: [{ type: 'hidden', key: 'injuryProneness', delta: -8 },
                    { type: 'fitness', delta: 14 }, { type: 'form', delta: -6 }] },
        { id: 'rush', label: K('rehab_setback', 'rush'), desc: K('rehab_setback', 'rush_d'), risk: 'high',
          outcomes: [
            { p: 0.4, text: K('rehab_setback', 'rush_ok'),
              effects: [{ type: 'heal' }, { type: 'form', delta: 10 }, { type: 'fanRelation', delta: 8 }] },
            { p: 0.6, text: K('rehab_setback', 'rush_bad'),
              effects: [{ type: 'injury', weeks: 22 }, { type: 'hidden', key: 'injuryProneness', delta: 14 },
                        { type: 'attr', key: 'pace', delta: -3 }, { type: 'morale', delta: -14 }] }
          ] }
      ]
    },

    /* ── Auszeichnung ────────────────────────────────────────────── */
    {
      id: 'award_night', category: 'media', phases: ['pro'],
      weight: 6, cooldown: 4, minAge: 20,
      when: function (g) {
        var s = lastSeason(g);
        return !!s && (s.awards.length > 0 || s.avgRating >= 7.3);
      },
      title: K('award_night', 'title'), text: K('award_night', 'text'),
      choices: [
        { id: 'humble', label: K('award_night', 'humble'), desc: K('award_night', 'humble_d'), risk: 'low',
          result: K('award_night', 'humble_r'),
          effects: [{ type: 'fanRelation', delta: 10 }, { type: 'morale', delta: 8 },
                    { type: 'hidden', key: 'mentality', delta: 4 }] },
        { id: 'demand', label: K('award_night', 'demand'), desc: K('award_night', 'demand_d'), risk: 'high',
          outcomes: [
            { p: 0.45, text: K('award_night', 'demand_ok'),
              effects: function (g) {
                return [{ type: 'money', delta: Math.round((g.status.contract ? g.status.contract.salary : 5e5) * 0.6) },
                        { type: 'reputation', delta: 6 }];
              },
              after: function (g) {
                if (g.status.contract) g.status.contract.salary = Math.round(g.status.contract.salary * 1.35);
              } },
            { p: 0.55, text: K('award_night', 'demand_bad'),
              effects: [{ type: 'fanRelation', delta: -14 }, { type: 'morale', delta: -8 },
                        { type: 'flag', key: 'coachTrust', value: -1 }] }
          ] },
        { id: 'brand', label: K('award_night', 'brand'), desc: K('award_night', 'brand_d'), risk: 'medium',
          outcomes: [
            { p: 0.6, text: K('award_night', 'brand_ok'),
              effects: [{ type: 'money', delta: 900000 }, { type: 'reputation', delta: 12 }] },
            { p: 0.4, text: K('award_night', 'brand_bad'),
              effects: [{ type: 'money', delta: 400000 }, { type: 'form', delta: -10 },
                        { type: 'lifestyle', delta: 12 }] }
          ] }
      ]
    },

    /* ── Anpassungsprobleme nach einem Wechsel ───────────────────── */
    {
      id: 'settling_trouble', category: 'private', phases: ['pro'],
      weight: 9, cooldown: 2, minAge: 18,
      when: function (g) { return (g.flags.adaptationTrouble || 0) > 0; },
      title: K('settling_trouble', 'title'), text: K('settling_trouble', 'text'),
      choices: [
        { id: 'language', label: K('settling_trouble', 'language'), desc: K('settling_trouble', 'language_d'), risk: 'low',
          result: K('settling_trouble', 'language_r'),
          effects: [{ type: 'hidden', key: 'adaptability', delta: 12 }, { type: 'homesick', delta: -18 },
                    { type: 'form', delta: 8 }],
          after: function (g) { g.flags.adaptationTrouble = 0; } },
        { id: 'bubble', label: K('settling_trouble', 'bubble'), desc: K('settling_trouble', 'bubble_d'), risk: 'medium',
          result: K('settling_trouble', 'bubble_r'),
          effects: [{ type: 'morale', delta: 8 }, { type: 'homesick', delta: -6 },
                    { type: 'fanRelation', delta: -8 }],
          after: function (g) { g.flags.adaptationTrouble = Math.max(0, (g.flags.adaptationTrouble || 1) - 1); } },
        { id: 'demandBack', label: K('settling_trouble', 'demandBack'), desc: K('settling_trouble', 'demandBack_d'), risk: 'high',
          outcomes: [
            { p: 0.4, text: K('settling_trouble', 'demandBack_ok'),
              effects: [{ type: 'morale', delta: 14 }, { type: 'flag', key: 'wantsOut', value: true }] },
            { p: 0.6, text: K('settling_trouble', 'demandBack_bad'),
              effects: [{ type: 'fanRelation', delta: -20 }, { type: 'reputation', delta: -6 },
                        { type: 'form', delta: -12 }] }
          ] }
      ]
    }
  ];

  FKC.data.eventsPro = pro;

})(window.FKC);
