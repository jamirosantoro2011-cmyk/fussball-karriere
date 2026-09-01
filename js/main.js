/* ── Start ─────────────────────────────────────────────────────────────
   Bindet die Teile zusammen: Sprache setzen, Ereignisse registrieren,
   Spielstand prüfen, ersten Screen zeigen.

   Jeder Schritt läuft in FKC.guard(). Ein Fehler beim Start darf nicht
   dazu führen, dass gar nichts mehr passiert — er wird angezeigt, und
   der Rest läuft weiter.                                             */

(function (FKC) {
  'use strict';

  /* Fehlt ein Baustein, hat ein Skript nicht geladen. Das sofort sagen. */
  var required = ['rng', 'i18n', 'state', 'save', 'data', 'attributes', 'growth',
                  'effects', 'events', 'season', 'world', 'national', 'transfer',
                  'career', 'ui'];
  var missing = required.filter(function (k) { return !FKC[k]; });
  if (missing.length) {
    FKC.showError({ where: 'Start',
      message: 'Diese Programmteile fehlen: ' + missing.join(', ') +
               '. Vermutlich konnte eine Skriptdatei nicht geladen werden.' });
    return;
  }

  /* Ereignispools anmelden (Reihenfolge der Datendateien egal) */
  FKC.guard('Ereignisse laden', function () {
    [FKC.data.eventsYouth, FKC.data.eventsPro, FKC.data.eventsStart,
     FKC.data.eventsPotential, FKC.data.eventsChains].forEach(function (pool) {
      if (pool && pool.length) FKC.events.register(pool);
    });
  });

  FKC.guard('Sprache', function () { FKC.i18n.initLang(); });

  /* Diagnose zuerst, damit sie auch bei einem Startfehler in der
     Konsole steht. */
  console.log('%cFussball-Karriere', 'color:#9ef25b;font-weight:bold',
    '· ' + FKC.data.leagues.length + ' Ligen · ' + FKC.data.clubs.length + ' Vereine · ' +
    FKC.events.pool.length + ' Ereignisse · ' + FKC.data.spine.length + ' feste Stationen');

  /* Sprachwechsel: aktuellen Screen neu zeichnen */
  FKC.i18n.onChange.push(function () {
    FKC.guard('Sprachwechsel', function () {
      FKC.ui.router.reload();
      if (FKC.state.exists()) FKC.save.write();
    });
  });

  /* Vor dem Schliessen sichern */
  window.addEventListener('beforeunload', function () {
    try { if (FKC.state.exists()) FKC.save.write(); } catch (e) {}
  });

  /* Manche Browser sperren localStorage bei geöffneter Datei (file://).
     Dann läuft das Spiel, speichert aber nicht — das soll man wissen. */
  var storageOk = true;
  try {
    localStorage.setItem('fkc.probe', '1');
    localStorage.removeItem('fkc.probe');
  } catch (e) {
    storageOk = false;
  }

  FKC.guard('Startbildschirm', function () { FKC.ui.router.go('menu'); });

  if (!storageOk) {
    setTimeout(function () {
      FKC.guard('Speicherhinweis', function () {
        FKC.ui.router.toast(FKC.t('warn.noStorage'), 'bad');
      });
    }, 900);
  }

})(window.FKC);
