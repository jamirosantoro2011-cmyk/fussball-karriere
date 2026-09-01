/* ── Effekt-Engine ─────────────────────────────────────────────────────
   Ereignisse und Entscheidungen liefern deklarative Effektlisten.
   Dadurch lassen sie sich anwenden UND automatisch anzeigen
   ("+2 Abschluss, −12 Form, 8 Wochen verletzt").                     */

window.FKC = window.FKC || {};

(function (FKC) {
  'use strict';

  var E = {};
  var clamp = function (v, a, b) { return FKC.util.clamp(v, a, b); };

  /* ── Anwenden ───────────────────────────────────────────────────── */

  E.apply = function (game, effects) {
    var applied = [];
    (effects || []).forEach(function (fx) {
      if (!fx) return;
      var res = handle(game, fx);
      if (res !== false) applied.push(fx);
    });
    FKC.attributes.recalc(game);
    return applied;
  };

  function handle(game, fx) {
    var s = game.status, c = game.condition, h = game.hidden, life = game.career.life;

    switch (fx.type) {

      case 'attr':
        if (game.attributes[fx.key] == null) return false;
        game.attributes[fx.key] = clamp(game.attributes[fx.key] + fx.delta, 5, 99);
        return true;

      case 'attrRandom': {
        var keys = fx.keys || FKC.data.keysFor(game.identity.isGK);
        var k = FKC.rng.pick(keys);
        fx.resolvedKey = k;
        if (game.attributes[k] == null) return false;
        game.attributes[k] = clamp(game.attributes[k] + fx.delta, 5, 99);
        return true;
      }

      case 'attrAll':
        FKC.data.keysFor(game.identity.isGK).forEach(function (key) {
          game.attributes[key] = clamp(game.attributes[key] + fx.delta, 5, 99);
        });
        return true;

      case 'potential':
        h.potential = clamp(h.potential + fx.delta, 30, 99);
        return true;

      case 'form':    c.form = clamp(c.form + fx.delta, 0, 100); return true;
      case 'morale':  c.morale = clamp(c.morale + fx.delta, 0, 100); return true;
      case 'fitness': c.fitness = clamp(c.fitness + fx.delta, 0, 100); return true;

      case 'injury':
        c.injury = {
          key: fx.key || 'generic',
          weeks: fx.weeks,
          severity: fx.severity || (fx.weeks >= 24 ? 'major' : (fx.weeks >= 8 ? 'medium' : 'minor'))
        };
        c.fitness = clamp(c.fitness - Math.min(45, fx.weeks * 2), 20, 100);
        if (fx.weeks >= 20) h.injuryProneness = clamp(h.injuryProneness + 8, 5, 99);
        return true;

      case 'heal': c.injury = null; c.fitness = clamp(c.fitness + 20, 0, 100); return true;

      case 'reputation':  s.reputation = clamp(s.reputation + fx.delta, 0, 100); return true;
      case 'fanRelation': s.fanRelation = clamp(s.fanRelation + fx.delta, 0, 100); return true;
      case 'loyalty':     s.loyalty = clamp(s.loyalty + fx.delta, 0, 100); return true;

      case 'money':
        game.career.finances.balance = Math.max(-5e6, game.career.finances.balance + fx.delta);
        return true;

      case 'lifestyle':
        game.career.finances.lifestyle = clamp(game.career.finances.lifestyle + fx.delta, 0, 100);
        return true;

      case 'education': life.education = clamp(life.education + fx.delta, 0, 100); return true;
      case 'homesick':  life.homesick = clamp(life.homesick + fx.delta, 0, 100); return true;

      case 'familySupport':
        game.origin.familySupport = clamp(game.origin.familySupport + fx.delta, 0, 100);
        return true;

      case 'hidden':
        if (h[fx.key] == null) return false;
        h[fx.key] = clamp(h[fx.key] + fx.delta, 1, 99);
        return true;

      case 'trait':
        h.traits = h.traits || [];
        if (h.traits.indexOf(fx.id) < 0) h.traits.push(fx.id);
        return true;

      case 'flag':
        game.flags[fx.key] = fx.value === undefined ? true : fx.value;
        return true;

      case 'growthBonus':
        game.flags.growthBonus = (game.flags.growthBonus || 0) + fx.points;
        return true;

      case 'club':
        E.moveToClub(game, fx.club || FKC.data.clubById(fx.clubId), fx.clubType);
        return true;

      case 'position':
        game.identity.position = fx.position;
        return true;

      case 'nationalCall':
        game.national.status = fx.status;
        return true;

      case 'timeline':
        FKC.state.logTimeline({ text: { key: fx.key, params: fx.params }, mark: fx.mark });
        return true;

      case 'none':
        return true;

      default:
        console.warn('[effects] unbekannter Typ:', fx.type);
        return false;
    }
  }

  /* ── Vereinswechsel (auch Jugend) ───────────────────────────────── */
  E.moveToClub = function (game, club, clubType) {
    if (!club) return;
    var prev = game.status.clubId;
    game.status.clubId = club.id;
    game.status.clubType = clubType || (club.synthetic ? club.type : 'pro');
    game.status.seasonsAtClub = 0;
    game.status.loyalty = 0;
    game.status.fanRelation = 50;
    game.status.isCaptain = false;

    // Synthetische Vereine (Dorfverein, Stützpunkt) im Save mitführen
    if (club.synthetic) {
      game.flags.syntheticClubs = game.flags.syntheticClubs || {};
      game.flags.syntheticClubs[club.id] = club;
    }

    if (prev !== club.id) {
      game.career.clubsPlayed.push({
        clubId: club.id, from: game.identity.year, to: null,
        apps: 0, goals: 0, assists: 0, phase: game.career.phase
      });
      var last = null;
      for (var i = game.career.clubsPlayed.length - 2; i >= 0; i--) {
        if (game.career.clubsPlayed[i].clubId === prev) { last = game.career.clubsPlayed[i]; break; }
      }
      if (last && last.to == null) last.to = game.identity.year;
    }
  };

  /* ── Beschreiben (für die Oberfläche) ───────────────────────────── */

  /**
   * Jeder Effekt wird als Chip beschrieben — und zwar IMMER mit dem
   * aktuellen Stand nach der Änderung, nicht nur mit dem Delta:
   * "Abschluss 54 (+2)" statt nur "+2 Abschluss".
   */
  E.describe = function (game, fx) {
    var t = FKC.t;
    var n = function (v) { return (v > 0 ? '+' : '') + v; };
    /* Label mit aktuellem Wert: "Form 62 (−8)" */
    var now = function (label, value, delta) {
      return label + ' ' + Math.round(value) + ' (' + n(delta) + ')';
    };

    switch (fx.type) {
      case 'attr':
        return chip(now(t('attr.' + fx.key), game.attributes[fx.key], fx.delta), fx.delta);
      case 'attrRandom': {
        var rk = fx.resolvedKey || fx.keys[0];
        return chip(now(t('attr.' + rk), game.attributes[rk], fx.delta), fx.delta);
      }
      case 'attrAll':
        return chip(n(fx.delta) + ' ' + t('effect.allAttrs') + ' · ' +
                    t('card.ovr') + ' ' + game.ovr, fx.delta);
      case 'potential':
        return chip(t('effect.potential', { v: n(fx.delta) }), fx.delta);
      case 'form':
        return chip(now(t('effect.form'), game.condition.form, fx.delta), fx.delta);
      case 'morale':
        return chip(now(t('effect.morale'), game.condition.morale, fx.delta), fx.delta);
      case 'fitness':
        return chip(now(t('effect.fitness'), game.condition.fitness, fx.delta), fx.delta);
      case 'injury':
        return chip(t('effect.injuryWeeks', { n: fx.weeks }), -1);
      case 'heal':
        return chip(t('effect.healed'), 1);
      case 'reputation':
        return chip(now(t('effect.reputation'), game.status.reputation, fx.delta), fx.delta);
      case 'fanRelation':
        return chip(now(t('effect.fans'), game.status.fanRelation, fx.delta), fx.delta);
      case 'loyalty':
        return chip(now(t('effect.loyalty'), game.status.loyalty, fx.delta), fx.delta);
      case 'money':
        return chip((fx.delta > 0 ? '+' : '−') + FKC.i18n.money(Math.abs(fx.delta)) +
                    ' · ' + FKC.i18n.money(game.career.finances.balance), fx.delta);
      case 'lifestyle':
        return chip(now(t('effect.lifestyle'), game.career.finances.lifestyle, fx.delta), -fx.delta);
      case 'education':
        return chip(now(t('effect.education'), game.career.life.education, fx.delta), fx.delta);
      case 'homesick':
        return chip(now(t('effect.homesick'), game.career.life.homesick, fx.delta), -fx.delta);
      case 'familySupport':
        return chip(now(t('effect.familySupport'), game.origin.familySupport, fx.delta), fx.delta);
      case 'hidden':
        return chip(n(fx.delta) + ' ' + t('hidden.' + fx.key), fx.delta);
      case 'trait':
        return chip(t('effect.trait', { name: t('trait.' + fx.id) }), 1);
      case 'growthBonus':
        return chip(t('effect.growthBonus'), 1);
      case 'club':
        return chip(t('effect.newClub', { club: (fx.club && fx.club.name) || '' }), 1);
      case 'position':
        return chip(t('effect.position', { pos: t('pos.' + fx.position) }), 0);
      default:
        return null;
    }

    function chip(label, tone) {
      return { label: label, tone: tone > 0 ? 'good' : (tone < 0 ? 'bad' : 'neutral') };
    }
  };

  E.describeAll = function (game, effects) {
    return (effects || []).map(function (fx) { return E.describe(game, fx); })
                          .filter(Boolean);
  };

  FKC.effects = E;

})(window.FKC);
