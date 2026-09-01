/* ── Liga-Welt ─────────────────────────────────────────────────────────
   Alle 32 Ligen werden jede Saison durchgerechnet, nicht nur die des
   Spielers. Meister der zweiten Liga steigen auf, Tabellenletzte ab —
   auch bei Vereinen, mit denen der Spieler nie zu tun hat.
   Die Zuordnung Verein → Liga lebt im Spielstand, nicht in den Daten. */

window.FKC = window.FKC || {};

(function (FKC) {
  'use strict';

  var W = {};

  /** Wie viele Vereine pro Saison die Liga wechseln */
  W.exchangeCount = function (topLeague, bottomLeague) {
    var n = Math.round(Math.min(topLeague.clubCount, bottomLeague.clubCount) * 0.14);
    return FKC.util.clamp(n, 1, 3);
  };

  W.init = function (game) {
    if (!game.world) game.world = { clubLeague: {}, moves: [], seasons: 0 };
    if (!game.world.clubLeague) game.world.clubLeague = {};
    if (!game.world.moves) game.world.moves = [];
    return game.world;
  };

  /** Paare aus höherer und tieferer Liga eines Landes */
  W.pairs = function () {
    var out = [];
    FKC.data.leagues.forEach(function (lg) {
      if (lg.down) {
        var lower = FKC.data.leagueById(lg.down);
        if (lower) out.push({ top: lg, bottom: lower });
      }
    });
    return out;
  };

  /**
   * Eine Saison für die ganze Fussballwelt.
   * playerClub und boost fliessen nur in die eigene Liga ein.
   * Liefert { tables: {leagueId: rows}, moves: [...] }.
   */
  W.runSeason = function (game, playerClub, boost) {
    W.init(game);
    var tables = {};

    FKC.data.leagues.forEach(function (lg) {
      var isOwn = playerClub && FKC.data.leagueIdOf(playerClub) === lg.id;
      tables[lg.id] = FKC.season.simulateTable(lg, isOwn ? playerClub : null, isOwn ? boost : 0);
    });

    var moves = W.applyPromotions(game, tables);
    game.world.seasons += 1;
    return { tables: tables, moves: moves };
  };

  /** Auf- und Abstieg auf Basis der fertigen Tabellen anwenden */
  W.applyPromotions = function (game, tables) {
    var map = game.world.clubLeague;
    var moves = [];

    W.pairs().forEach(function (pair) {
      var topRows = tables[pair.top.id];
      var bottomRows = tables[pair.bottom.id];
      if (!topRows || !bottomRows || !topRows.length || !bottomRows.length) return;

      var n = W.exchangeCount(pair.top, pair.bottom);
      n = Math.min(n, topRows.length - 1, bottomRows.length - 1);
      if (n < 1) return;

      /* Die letzten n der oberen Liga steigen ab … */
      var relegated = topRows.slice(-n);
      /* … die ersten n der unteren steigen auf */
      var promoted = bottomRows.slice(0, n);

      relegated.forEach(function (r) {
        map[r.club.id] = pair.bottom.id;
        moves.push({ clubId: r.club.id, from: pair.top.id, to: pair.bottom.id,
                     dir: 'down', pos: r.position });
      });
      promoted.forEach(function (r) {
        map[r.club.id] = pair.top.id;
        moves.push({ clubId: r.club.id, from: pair.bottom.id, to: pair.top.id,
                     dir: 'up', pos: r.position });
      });
    });

    /* Nur die jüngsten Bewegungen aufheben — der Spielstand soll klein bleiben */
    game.world.moves = moves;
    return moves;
  };

  /** Betrifft eine der Bewegungen den Verein des Spielers? */
  W.moveFor = function (moves, clubId) {
    for (var i = 0; i < (moves || []).length; i++) {
      if (moves[i].clubId === clubId) return moves[i];
    }
    return null;
  };

  /** Auf-/Abstiege in einem Land, für die Tabellenansicht */
  W.movesInCountry = function (moves, country) {
    return (moves || []).filter(function (m) {
      var lg = FKC.data.leagueById(m.to);
      return lg && lg.country === country;
    });
  };

  FKC.world = W;

})(window.FKC);
