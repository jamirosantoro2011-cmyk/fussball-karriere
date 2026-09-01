/* ── Spielstand ────────────────────────────────────────────────────────
   Ein Slot in localStorage, Autosave nach jedem Phasenwechsel.
   Zusätzlich Export/Import als Textblock (Backup, Gerätewechsel).    */

window.FKC = window.FKC || {};

(function (FKC) {
  'use strict';

  var KEY = 'fkc.save.v1';
  var LAST = 'fkc.lastPlayer';          // Spur des zuletzt gespeicherten Spielers

  var save = {

    write: function () {
      var g = FKC.state.game;
      if (!g) return false;
      g.meta.updatedAt = Date.now();
      g.meta.lang = FKC.i18n.lang;
      /* Der Name wird redundant in meta abgelegt. Sollte identity je
         beschädigt ankommen, lässt er sich daraus wiederherstellen —
         ein Default- oder Zufallsname darf ihn nie überschreiben.  */
      g.meta.playerName = g.identity.firstName + ' ' + g.identity.lastName;
      g.rng.state = FKC.rng.state;          // RNG-Stand mitnehmen
      try {
        localStorage.setItem(KEY, JSON.stringify(g));
        localStorage.setItem(LAST, g.meta.playerName);
        return true;
      } catch (e) {
        console.warn('[save] Schreiben fehlgeschlagen', e);
        return false;
      }
    },

    /** Name des zuletzt gespeicherten Spielers, auch ohne Spielstand */
    lastPlayerName: function () {
      try { return localStorage.getItem(LAST); } catch (e) { return null; }
    },

    /** War der zuletzt gelesene Spielstand unbrauchbar? */
    corrupt: false,

    /**
     * Mindeststruktur eines Spielstands. Fehlt eines dieser Felder,
     * ist der Stand unbrauchbar — dann lieber sauber ablehnen als
     * beim Rendern mit einem TypeError die ganze Seite zu killen.
     */
    isUsable: function (g) {
      return !!(g && g.meta && g.identity && g.identity.firstName &&
                g.career && g.career.phase && g.status && g.attributes && g.hidden);
    },

    read: function () {
      this.corrupt = false;
      var raw;
      try { raw = localStorage.getItem(KEY); }
      catch (e) { console.warn('[save] Speicher nicht lesbar', e); return null; }
      if (!raw) return null;

      var g;
      try { g = JSON.parse(raw); }
      catch (e) {
        console.warn('[save] Spielstand ist kein gültiges JSON', e);
        this.corrupt = true;
        return null;
      }

      try { g = this.migrate(g); }
      catch (e) {
        console.warn('[save] Migration fehlgeschlagen', e);
        this.corrupt = true;
        return null;
      }

      if (!this.isUsable(g)) {
        console.warn('[save] Spielstand unvollständig — wird nicht geladen');
        this.corrupt = true;
        return null;
      }
      return g;
    },

    load: function () {
      var g = this.read();
      if (!g) return null;
      FKC.state.game = g;
      g.rng = g.rng || { seed: FKC.rng.newSeed() };
      FKC.rng.seed(g.rng.seed);
      if (g.rng.state) FKC.rng.state = g.rng.state;
      return g;
    },

    exists: function () {
      try { return !!localStorage.getItem(KEY); } catch (e) { return false; }
    },

    /** Kurzinfo für den Startbildschirm, ohne den Save zu laden */
    peek: function () {
      var g = this.read();
      if (!g) return null;
      /* Defensiv: der Startbildschirm darf an keinem fehlenden Feld
         scheitern, sonst bleibt die ganze Seite leer.              */
      var id = g.identity || {}, career = g.career || {}, status = g.status || {};
      return {
        name: ((id.firstName || '?') + ' ' + (id.lastName || '')).trim(),
        age: id.age != null ? id.age : '?',
        phase: career.phase || 'childhood',
        ovr: g.ovr || 0,
        clubId: status.clubId || null,
        year: id.year || 0,
        updatedAt: (g.meta && g.meta.updatedAt) || 0
      };
    },

    clear: function () {
      try { localStorage.removeItem(KEY); } catch (e) {}
      FKC.state.game = null;
    },

    /* ── Versionsmigration ────────────────────────────────────────── */
    migrate: function (g) {
      if (!g.meta) return null;

      /* Identität absichern: ein leerer Name wird aus meta rekonstruiert,
         nie durch einen neuen Zufallsnamen ersetzt. */
      if (g.identity && (!g.identity.firstName || !g.identity.lastName) && g.meta.playerName) {
        var parts = String(g.meta.playerName).split(' ');
        g.identity.firstName = g.identity.firstName || parts.shift();
        g.identity.lastName = g.identity.lastName || parts.join(' ');
        console.warn('[save] Name aus meta wiederhergestellt:', g.meta.playerName);
      }

      /* Auszeichnungen aus älteren Ständen auf die genaueren Namen
         umstellen. „Goldener Ball" ist inzwischen dem besten Spieler
         eines **Turniers** vorbehalten; die alte Saisonauszeichnung
         gleichen Namens wird deshalb zum Fussballer des Jahres. */
      var renamed = { topscorer: 'goldenBoot',
                      playerOfSeason: 'ballon', goldenBall: 'ballon',
                      tournamentTopScorer: 'goldenBootTournament',
                      tournamentBestPlayer: 'goldenBallTournament' };
      if (g.career && g.career.awards) {
        g.career.awards.forEach(function (a) { if (renamed[a.id]) a.id = renamed[a.id]; });
      }

      /* Ältere Stände kennen die Liga-Welt noch nicht */
      if (!g.world) g.world = { clubLeague: {}, moves: [], seasons: 0 };

      g.meta.saveVersion = FKC.state.SAVE_VERSION;
      return g;
    },

    /* ── Export / Import ──────────────────────────────────────────── */

    exportText: function () {
      var g = FKC.state.game;
      if (!g) return '';
      g.rng.state = FKC.rng.state;
      try { return btoa(unescape(encodeURIComponent(JSON.stringify(g)))); }
      catch (e) { return JSON.stringify(g); }
    },

    importText: function (text) {
      var g;
      try {
        var json = text.trim().charAt(0) === '{'
          ? text
          : decodeURIComponent(escape(atob(text.trim())));
        g = JSON.parse(json);
      } catch (e) { return false; }
      if (!g || !g.identity || !g.career) return false;
      g = this.migrate(g);
      FKC.state.game = g;
      FKC.rng.seed(g.rng.seed);
      if (g.rng.state) FKC.rng.state = g.rng.state;
      this.write();
      return true;
    },

    KEY: KEY
  };

  FKC.save = save;

})(window.FKC);
