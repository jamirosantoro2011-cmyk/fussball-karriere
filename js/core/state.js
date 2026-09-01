/* ── Zentraler Spielzustand ────────────────────────────────────────────
   Ein einziges serialisierbares Objekt (= der Spielstand). Alles, was
   die Karriere ausmacht, hängt hier drin. Zugriff nur über FKC.state. */

window.FKC = window.FKC || {};

(function (FKC) {
  'use strict';

  var SAVE_VERSION = 1;
  var START_AGE = 6;

  var state = {
    game: null,
    listeners: [],

    /* ── Neue Karriere anlegen ────────────────────────────────────── */
    create: function (opts) {
      var rng = FKC.rng;
      var seed = opts.seed || rng.newSeed();
      rng.seed(seed);

      var startYear = new Date().getFullYear();
      var isGK = opts.position === 'GK';

      var g = {
        meta: {
          saveVersion: SAVE_VERSION,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          lang: FKC.i18n.lang,
          playerName: opts.firstName + ' ' + opts.lastName
        },

        rng: { seed: seed },

        identity: {
          firstName: opts.firstName,
          lastName: opts.lastName,
          nationality: opts.nationality,
          birthYear: startYear - START_AGE,
          age: START_AGE,
          year: startYear,
          foot: opts.foot || 'right',
          position: opts.position,
          altPositions: [],
          isGK: isGK,
          shirtNo: opts.shirtNo || 0,
          height: 0,          // wächst in der Jugend mit
          heightAdult: 0      // versteckte Endgrösse, in create() gewürfelt
        },

        origin: null,          // wird von FKC.career.rollOrigin() gefüllt
        attributes: null,      // von FKC.attributes.startingSet()
        hidden: null,          // Potenzial & Charakterwerte

        ovr: 0,
        peakOvr: 0,
        ovrHistory: [],        // [{age, ovr}] für die Rückblick-Kurve

        condition: {
          form: 60,
          morale: 65,
          fitness: 100,
          injury: null
        },

        status: {
          clubId: null,        // aktueller Verein (Jugend oder Profi)
          clubType: 'none',    // none | village | support | academy | pro
          contract: null,
          marketValue: 0,
          reputation: 1,       // 0-100, Bekanntheitsgrad
          fanRelation: 50,
          isCaptain: false,
          seasonsAtClub: 0,
          loyalty: 0
        },

        national: {
          teamId: opts.nationality,
          status: 'none',      // none | u17 | u19 | u21 | squad | starter | captain
          caps: 0, goals: 0,
          debutYear: 0,        // Jahr der ersten A-Nominierung, 0 = noch nie
          tournaments: []
        },

        career: {
          phase: 'childhood',  // childhood | youth | pro | retired
          chapter: 0,          // Fortschritt innerhalb der Phase
          seasons: [],
          totals: { apps: 0, goals: 0, assists: 0, yellows: 0, reds: 0, motm: 0, minutes: 0 },
          trophies: [],
          awards: [],
          clubsPlayed: [],
          timeline: [],        // Erzählerische Meilensteine für den Rückblick
          life: {
            partner: null, children: 0,
            parentsTogether: true, parentsAlive: 2,
            homesick: 0, education: 50
          },
          finances: { balance: 0, lifestyle: 30, investments: [] }
        },

        training: { focus: null, secondary: null, intensity: 'balanced' },

        flags: {},             // seenEvents, Storyline-Zustände, Einmal-Schalter
        pending: null          // aktuell offenes Ereignis / offene Entscheidung
      };

      this.syncAge(g);

      /* Endgrösse: Landesdurchschnitt plus positionstypische Abweichung,
         mit realistischer Streuung. Die aktuelle Grösse ergibt sich
         daraus über die Wachstumskurve in engine/growth.js.        */
      var avg = FKC.data.nationHeight(opts.nationality);
      var bias = FKC.data.heightBias[opts.position] || 0;
      /* Profis sind im Schnitt etwas grösser als die Gesamtbevölkerung
         und streuen weniger — sonst kommen 1.66-m-Innenverteidiger raus. */
      var target = avg + bias + 3;
      g.identity.heightAdult = rng.gaussInt(target, 5.5, target - 10, target + 12);
      g.identity.height = FKC.growth.heightAt(g.identity.heightAdult, START_AGE);

      this.game = g;
      return g;
    },

    /* ── Zugriffshilfen ───────────────────────────────────────────── */

    get: function () { return this.game; },
    exists: function () { return !!this.game; },

    club: function () {
      var g = this.game;
      if (!g || !g.status.clubId) return null;
      return this.clubById(g.status.clubId);
    },

    /**
     * Verein zu einer ID — auch wenn es ein Dorf- oder Amateurverein
     * ist, den es nur in diesem Spielstand gibt. `FKC.data.clubById`
     * kennt die nicht, und ein Wechsel dorthin (Karriereausklang,
     * Rückkehr zum ersten Verein) lief deshalb ins Leere.
     */
    clubById: function (id) {
      var g = this.game;
      if (!id) return null;
      var c = FKC.data.clubById(id);
      if (c) return c;
      if (!g) return null;
      var syn = g.flags && g.flags.syntheticClubs;
      if (syn && syn[id]) return syn[id];
      var o = g.origin;
      if (o && o.villageClub && o.villageClub.id === id) return o.villageClub;
      return null;
    },

    league: function () {
      var c = this.club();
      return c ? FKC.data.leagueOf(c) : null;
    },

    fullName: function () {
      var id = this.game.identity;
      return id.firstName + ' ' + id.lastName;
    },

    /* ── Alter ────────────────────────────────────────────────────────
       Einzige Quelle der Wahrheit ist identity.year. Das Alter wird
       daraus abgeleitet und NIRGENDS sonst separat hochgezählt.     */
    syncAge: function (game) {
      var g = game || this.game;
      g.identity.age = g.identity.year - g.identity.birthYear;
      /* Die Körpergrösse hängt am Alter — nie getrennt fortschreiben */
      if (g.identity.heightAdult) {
        g.identity.height = FKC.growth.heightAt(g.identity.heightAdult, g.identity.age);
      }
      return g.identity.age;
    },

    age: function () {
      var id = this.game.identity;
      return id.year - id.birthYear;
    },

    /** Jahr weiterstellen — der einzige erlaubte Weg, älter zu werden */
    advanceCalendar: function (game, years) {
      var g = game || this.game;
      g.identity.year += (years == null ? 1 : years);
      return this.syncAge(g);
    },

    seasonLabel: function () {
      return FKC.i18n.season(this.game.identity.year);
    },

    /** Meilenstein für den späteren Rückblick festhalten */
    logTimeline: function (entry) {
      var g = this.game;
      g.career.timeline.push({
        year: g.identity.year,
        age: g.identity.age,
        text: entry.text,          // bereits übersetzter Text ODER {key, params}
        mark: entry.mark || 'plain'
      });
    },

    /** Wurde ein Ereignis schon gesehen? */
    seen: function (id) {
      return this.game.flags['ev.' + id] != null;
    },
    markSeen: function (id) {
      this.game.flags['ev.' + id] = this.game.identity.age;
    },

    flag: function (key, value) {
      if (value === undefined) return this.game.flags[key];
      this.game.flags[key] = value;
      return value;
    },

    /** Nach jeder Zustandsänderung: UI benachrichtigen */
    touch: function () {
      if (this.game) this.game.meta.updatedAt = Date.now();
      this.listeners.forEach(function (fn) { fn(); });
    },

    onChange: function (fn) { this.listeners.push(fn); },

    SAVE_VERSION: SAVE_VERSION,
    START_AGE: START_AGE
  };

  FKC.state = state;

})(window.FKC);
