/* ── Ereignissystem ────────────────────────────────────────────────────
   Ereignisse liegen als Daten in data/events/*.js und melden sich hier
   an. Gezogen wird gewichtet aus allen, deren Bedingungen passen.    */

window.FKC = window.FKC || {};

(function (FKC) {
  'use strict';

  /**
   * Passt ein Ereignis zum gewählten Startpunkt?
   * `starts: ['village']` beschränkt ein Ereignis auf den Dorfverein,
   * fehlt das Feld, passt es überall. Zentral hier, damit dieselbe Regel
   * für den Ereignispool **und** die festen Stationen gilt — sonst
   * erzählt einem der Spielstand mit sechs Jahren vom Dorfverein,
   * obwohl man im NLZ angefangen hat.
   */
  function startsMatch(e, game) {
    if (!e.starts) return true;
    var kind = (game.origin && game.origin.startKind) || 'village';
    return e.starts.indexOf(kind) >= 0;
  }

  /**
   * Folgeereignisse. `follows` verlangt, dass ein früheres Ereignis
   * bereits aufgelöst wurde — wahlweise mit einer bestimmten Antwort
   * und innerhalb eines Altersfensters:
   *
   *   follows: { ev: 'social_media', choice: 'post', minGap: 2, maxGap: 8 }
   *
   * Damit hängen Ereignisse zusammen, statt nur nebeneinander zu
   * würfeln: Was man mit siebzehn entschieden hat, holt einen mit
   * zweiundzwanzig ein.
   */
  function followsMatch(e, game) {
    var f = e.follows;
    if (!f) return true;
    var list = f.ev ? [f] : (f.any || []);
    for (var i = 0; i < list.length; i++) {
      if (oneFollows(list[i], game)) return true;
    }
    return false;
  }

  function oneFollows(f, game) {
    var seenAt = game.flags['ev.' + f.ev];
    if (seenAt == null) return false;
    if (f.choice) {
      var taken = game.flags['evc.' + f.ev];
      var wanted = Array.isArray(f.choice) ? f.choice : [f.choice];
      if (wanted.indexOf(taken) < 0) return false;
    }
    var gap = game.identity.age - seenAt;
    if (f.minGap != null && gap < f.minGap) return false;
    if (f.maxGap != null && gap > f.maxGap) return false;
    return true;
  }

  var Ev = {
    pool: [],
    index: {},
    startsMatch: startsMatch,
    followsMatch: followsMatch,

    register: function (list) {
      var self = this;
      list.forEach(function (e) {
        if (self.index[e.id]) { console.warn('[events] doppelte ID:', e.id); return; }
        self.index[e.id] = e;
        self.pool.push(e);
      });
    },

    byId: function (id) { return this.index[id] || null; },

    /** Alle Ereignisse, die gerade auftreten dürfen */
    eligible: function (game, opts) {
      opts = opts || {};
      var age = game.identity.age;
      var phase = game.career.phase;

      return this.pool.filter(function (e) {
        if (opts.category && e.category !== opts.category) return false;
        if (opts.idPrefix && e.id.indexOf(opts.idPrefix) !== 0) return false;
        if (opts.notPrefix && e.id.indexOf(opts.notPrefix) === 0) return false;
        if (opts.exclude && opts.exclude.indexOf(e.id) >= 0) return false;
        if (e.phases && e.phases.indexOf(phase) < 0) return false;
        if (e.minAge != null && age < e.minAge) return false;
        if (e.maxAge != null && age > e.maxAge) return false;
        if (!startsMatch(e, game)) return false;
        if (!followsMatch(e, game)) return false;

        var lastSeen = game.flags['ev.' + e.id];
        if (lastSeen != null) {
          if (e.once) return false;
          if (e.cooldown && age - lastSeen < e.cooldown) return false;
        }
        if (e.when) {
          try { if (!e.when(game)) return false; }
          catch (err) { console.warn('[events] when() fehlgeschlagen bei', e.id, err); return false; }
        }
        return true;
      });
    },

    /** Ein Ereignis ziehen (gewichtet). Gibt null zurück, wenn keins passt. */
    draw: function (game, opts) {
      var list = this.eligible(game, opts);
      if (!list.length) return null;
      var e = FKC.rng.weighted(list, function (ev) {
        var w = ev.weight || 5;
        if (ev.weightMod) {
          try { w *= ev.weightMod(game); } catch (err) {}
        }
        return Math.max(0, w);
      });
      return e || null;
    },

    /** Mehrere verschiedene Ereignisse für eine Saison/ein Jahr */
    drawMany: function (game, count, opts) {
      var out = [], exclude = (opts && opts.exclude ? opts.exclude.slice() : []);
      for (var i = 0; i < count; i++) {
        var e = this.draw(game, Object.assign({}, opts || {}, { exclude: exclude }));
        if (!e) break;
        out.push(e);
        exclude.push(e.id);
      }
      return out;
    },

    /* ── Auflösen ─────────────────────────────────────────────────── */

    /** Text und Parameter eines Ereignisses für die Anzeige aufbereiten */
    present: function (game, ev) {
      var params = ev.textParams ? ev.textParams(game) : {};
      var choices = (ev.choices || []).filter(function (c) {
        return !c.when || c.when(game);
      }).map(function (c) {
        return {
          id: c.id,
          label: FKC.t(c.label, params),
          desc: c.desc ? FKC.t(c.desc, params) : null,
          risk: c.risk || null
        };
      });
      return {
        id: ev.id,
        category: ev.category,
        title: FKC.t(ev.title, params),
        text: FKC.t(ev.text, params),
        choices: choices,
        params: params
      };
    },

    /**
     * Eine Wahl auflösen.
     * Liefert { text, effects, chips, tone }.
     */
    resolve: function (game, ev, choiceId) {
      var choice = null;
      (ev.choices || []).forEach(function (c) { if (c.id === choiceId) choice = c; });
      if (!choice) return null;

      var params = ev.textParams ? ev.textParams(game) : {};
      var outcome;

      if (choice.outcomes && choice.outcomes.length) {
        outcome = FKC.rng.weighted(choice.outcomes, function (o) {
          var p = o.p != null ? o.p : 1;
          if (o.pMod) { try { p *= o.pMod(game); } catch (e) {} }
          return Math.max(0, p);
        });
      } else {
        outcome = {
          text: choice.result || null, effects: choice.effects,
          tone: choice.tone, after: choice.after
        };
      }
      if (outcome && !outcome.after && choice.after) outcome.after = choice.after;
      if (!outcome) return null;

      var effects = typeof outcome.effects === 'function'
        ? outcome.effects(game, FKC.rng) || []
        : (outcome.effects || []);

      FKC.effects.apply(game, effects);
      game.flags['ev.' + ev.id] = game.identity.age;
      /* Auch die getroffene Wahl merken — ohne sie könnten Folge-
         ereignisse nur wissen *dass* etwas war, nicht *wie* es ausging. */
      game.flags['evc.' + ev.id] = choiceId;

      if (outcome.after) { try { outcome.after(game); } catch (e) { console.warn(e); } }

      var chips = FKC.effects.describeAll(game, effects);
      var tone = outcome.tone || guessTone(chips);

      var allParams = Object.assign({}, params, outcome.params || {});
      return {
        textKey: outcome.text || null,
        params: allParams,
        text: outcome.text ? FKC.t(outcome.text, allParams) : '',
        effects: effects,
        chips: chips,
        tone: tone
      };
    }
  };

  function guessTone(chips) {
    var good = 0, bad = 0;
    chips.forEach(function (c) { if (c.tone === 'good') good++; if (c.tone === 'bad') bad++; });
    if (good && bad) return 'mixed';
    if (bad) return 'bad';
    return 'good';
  }

  FKC.events = Ev;

})(window.FKC);
