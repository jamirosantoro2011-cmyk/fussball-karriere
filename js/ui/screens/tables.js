/* ── Tabellen ──────────────────────────────────────────────────────────
   Liga-Tabelle der letzten gespielten Saison, dazu der Weg durch den
   internationalen Wettbewerb und — in Turnierjahren — Gruppenphase und
   K.-o.-Runde der Nationalmannschaft.                               */

(function (FKC) {
  'use strict';
  var c = FKC.ui.c, t = FKC.t;

  /* Welche Liga gerade angezeigt wird — überlebt das Neuzeichnen,
     wird aber bei einer neuen Karriere zurückgesetzt. */
  var viewLeague = null;
  var viewCareer = null;

  FKC.ui.router.register('tables', {

    render: function () {
      var game = FKC.state.game;
      if (!game) { setTimeout(function () { FKC.ui.router.go('menu'); }, 0); return ''; }

      var tb = game.tables;
      var html = '<h1>' + t('tables.title') + '</h1>';

      if (!tb || !tb.league) {
        html += '<p class="u-dim" style="margin-top:8px">' + t('tables.none') + '</p>';
        html += backBar();
        return html;
      }

      var careerId = (game.meta && game.meta.createdAt) || 0;
      if (viewCareer !== careerId) { viewCareer = careerId; viewLeague = null; }

      var all = tb.all || {};
      var available = Object.keys(all);
      if (!viewLeague || (available.length && available.indexOf(viewLeague) < 0)) {
        viewLeague = tb.leagueId;
      }
      var own = viewLeague === tb.leagueId;

      html += '<p class="u-dim" style="margin-top:6px">' +
        t('tables.season', { season: tb.season }) + '</p>';

      /* ── Ligaauswahl ──────────────────────────────────────────── */
      if (available.length > 1) {
        html += '<div class="field" style="margin-top:14px">' +
          '<label>' + t('tables.pickLeague') + '</label>' +
          '<select class="input" data-select="viewLeague">' + leagueOptions(available, tb) +
          '</select></div>';
      }

      /* ── Liga ─────────────────────────────────────────────────── */
      var lg = FKC.data.leagueById(viewLeague);
      html += c.sectionTitle(lg ? lg.name : t('tables.league'));
      html += leagueTable(viewRows(tb, viewLeague), lg, tb.clubId);

      /* Nur bei der eigenen Liga folgen Pokal, Europapokal und Turnier */
      if (!own) {
        html += '<div class="actionbar">' +
          '<button class="btn btn-ghost" data-act="ownLeague">' + t('tables.backToOwn') + '</button>' +
          '<button class="btn btn-primary" data-act="back">' + t('ui.back') + '</button></div>';
        return html;
      }

      /* ── Auf- und Abstieg im eigenen Land ─────────────────────── */
      if (tb.moves && tb.moves.length) {
        html += c.sectionTitle(t('tables.moves'));
        html += '<div class="card"><div class="ko-list">' +
          tb.moves.slice().sort(function (a, b) {
            return (a.dir === 'up' ? 0 : 1) - (b.dir === 'up' ? 0 : 1);
          }).map(function (m) {
            var club = FKC.data.clubById(m.clubId);
            var to = FKC.data.leagueById(m.to);
            return '<div class="ko-row" data-won="' + (m.dir === 'up' ? '1' : '0') + '">' +
              '<span class="ko-round">' + t(m.dir === 'up' ? 'tables.up' : 'tables.down') + '</span>' +
              '<span class="ko-opp">' + c.esc(club ? club.name : m.clubId) + '</span>' +
              '<span class="ko-score" style="font-size:.72rem;font-weight:600">' +
              c.esc(to ? to.name : '') + '</span></div>';
          }).join('') + '</div></div>';
      }

      /* ── Internationaler Wettbewerb ───────────────────────────── */
      if (tb.cont) {
        html += c.sectionTitle(FKC.data.compName(tb.cont.compId));
        html += contBlock(tb.cont, tb.clubId);
      }

      /* ── Nationaler Pokal ─────────────────────────────────────── */
      if (tb.cup && tb.cup.rounds && tb.cup.rounds.length) {
        html += c.sectionTitle(FKC.data.compName(tb.cup.compId));
        html += '<div class="card">' + roundList(tb.cup.rounds, clubName) +
          '<div class="kv"><span>' + t('tables.result') + '</span><span>' +
          t('season.stage.' + tb.cup.result) + '</span></div></div>';
      }

      /* ── Turnier der Nationalmannschaft ───────────────────────── */
      if (tb.tournament) {
        html += c.sectionTitle(FKC.data.compName(tb.tournament.compId));
        html += tournamentBlock(tb.tournament);
      }

      html += backBar();
      return html;
    },

    bind: function (root) {
      root.addEventListener('change', function (e) {
        var sel = e.target.closest('[data-select="viewLeague"]');
        if (!sel) return;
        viewLeague = sel.value;
        FKC.ui.router.reload();
      });

      root.addEventListener('click', function (e) {
        if (e.target.closest('[data-act="ownLeague"]')) {
          viewLeague = FKC.state.game.tables.leagueId;
          FKC.ui.router.reload();
          return;
        }
        if (e.target.closest('[data-act="back"]')) {
          var ph = FKC.state.game.career.phase;
          FKC.ui.router.go(ph === 'retired' ? 'retire' : 'hub');
        }
      });
    }
  });

  /* ── Ligaauswahl, nach Ländern gruppiert ────────────────────────── */
  function leagueOptions(available, tb) {
    var byCountry = {}, order = [];
    FKC.data.leagues.forEach(function (l) {
      if (available.indexOf(l.id) < 0) return;
      if (!byCountry[l.country]) { byCountry[l.country] = []; order.push(l.country); }
      byCountry[l.country].push(l);
    });
    /* Das eigene Land zuerst */
    var ownLg = FKC.data.leagueById(tb.leagueId);
    if (ownLg) {
      order.sort(function (a, b) {
        return (a === ownLg.country ? -1 : 0) - (b === ownLg.country ? -1 : 0);
      });
    }
    return order.map(function (co) {
      return '<optgroup label="' + c.esc(FKC.data.nationName(co)) + '">' +
        byCountry[co].map(function (l) {
          return '<option value="' + l.id + '"' + (l.id === viewLeague ? ' selected' : '') + '>' +
            c.esc(l.name) + (l.id === tb.leagueId ? ' ★' : '') + '</option>';
        }).join('') + '</optgroup>';
    }).join('');
  }

  /** Zeilen der gewählten Liga in einheitlicher Form */
  function viewRows(tb, leagueId) {
    if (tb.all && tb.all[leagueId]) {
      return tb.all[leagueId].map(FKC.season.unpackTight);
    }
    return leagueId === tb.leagueId ? (tb.league || []) : [];
  }

  function backBar() {
    return '<div class="actionbar"><button class="btn btn-primary btn-block" data-act="back">' +
      t('ui.back') + '</button></div>';
  }

  function clubName(id) {
    var cl = FKC.data.clubById(id);
    return cl ? cl.name : id;
  }

  /* ── Liga-Tabelle im gewohnten Format ─────────────────────────────
     Platz · Verein · Sp · S · U · N · Tore · Diff · Pkt
     Sortiert nach Punkten, bei Gleichstand nach Tordifferenz.      */
  function leagueTable(rows, lg, ownClubId) {
    if (!rows.length) return '<div class="card"><p class="u-muted" style="margin:0">' +
      t('tables.none') + '</p></div>';

    /* Defensiv nachsortieren — die Reihenfolge ist die halbe Tabelle */
    var sorted = rows.slice().sort(function (a, b) {
      return b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf;
    });
    sorted.forEach(function (r, i) { r.pos = i + 1; });

    var zones = zonesFor(lg, sorted.length);

    var html = '<div class="table-wrap"><table class="ltable ltable-full">' +
      '<thead><tr>' +
      '<th class="ta-pos">' + t('tables.rank') + '</th>' +
      '<th class="ta-team">' + t('tables.club') + '</th>' +
      '<th class="ta-num">' + t('tables.played') + '</th>' +
      '<th class="ta-num">' + t('tables.wins') + '</th>' +
      '<th class="ta-num">' + t('tables.draws') + '</th>' +
      '<th class="ta-num">' + t('tables.losses') + '</th>' +
      '<th class="ta-num ta-goals">' + t('tables.goals') + '</th>' +
      '<th class="ta-num">' + t('tables.diff') + '</th>' +
      '<th class="ta-num ta-pts">' + t('tables.points') + '</th>' +
      '</tr></thead><tbody>';

    sorted.forEach(function (r) {
      var club = FKC.data.clubById(r.c);
      var diff = r.gf - r.ga;
      var zone = zoneOf(r.pos, zones, sorted.length);
      html += '<tr' + (r.c === ownClubId ? ' class="is-own"' : '') +
        (zone ? ' data-zone="' + zone + '"' : '') + '>' +
        '<td class="ta-pos">' + r.pos + '</td>' +
        '<td class="ta-club">' + c.crest(club) +
        '<span>' + c.esc(club ? club.name : r.c) + '</span></td>' +
        '<td class="ta-num">' + r.p + '</td>' +
        '<td class="ta-num">' + r.w + '</td>' +
        '<td class="ta-num">' + r.d + '</td>' +
        '<td class="ta-num">' + r.l + '</td>' +
        '<td class="ta-num ta-goals">' + r.gf + ':' + r.ga + '</td>' +
        '<td class="ta-num">' + (diff > 0 ? '+' : '') + diff + '</td>' +
        '<td class="ta-num ta-pts"><b>' + r.pts + '</b></td></tr>';
    });

    html += '</tbody></table></div>';

    /* Legende — nur die Zonen, die es in dieser Liga wirklich gibt */
    var legend = [];
    if (zones.ucl) legend.push(['ucl', t('tables.zone.ucl'), 'accent']);
    if (zones.uel) legend.push(['uel', t('tables.zone.uel'), 'info']);
    if (zones.uecl) legend.push(['uecl', t('tables.zone.uecl'), 'info']);
    if (zones.up) legend.push(['up', t('tables.zone.up'), 'good']);
    if (zones.rel) legend.push(['rel', t('tables.zone.rel'), 'bad']);
    if (legend.length) {
      html += '<div class="zone-legend">' + legend.map(function (z) {
        return '<span class="zone-key" data-zone="' + z[0] + '">' + c.esc(z[1]) + '</span>';
      }).join('') + '</div>';
    }
    return html;
  }

  /** Wie viele Plätze oben und unten besonders sind */
  function zonesFor(lg, size) {
    var z = { ucl: 0, uel: 0, uecl: 0, up: 0, rel: 0 };
    if (!lg) return z;

    if (lg.tier === 1) {
      var slots = lg.contSlots || { champions: 0, secondary: 0 };
      z.ucl = Math.min(slots.champions || 0, size);
      z.uel = Math.min(slots.secondary || 0, Math.max(0, size - z.ucl));
      /* Conference-League-Platz — nur in Europa besetzt */
      z.uecl = Math.min(slots.third || 0, Math.max(0, size - z.ucl - z.uel));
      if (lg.down) {
        var lower = FKC.data.leagueById(lg.down);
        if (lower) z.rel = FKC.world.exchangeCount(lg, lower);
      }
    } else if (lg.up) {
      var upper = FKC.data.leagueById(lg.up);
      if (upper) z.up = FKC.world.exchangeCount(upper, lg);
    }
    return z;
  }

  function zoneOf(pos, z, size) {
    if (z.ucl && pos <= z.ucl) return 'ucl';
    if (z.uel && pos <= z.ucl + z.uel) return 'uel';
    if (z.uecl && pos <= z.ucl + z.uel + z.uecl) return 'uecl';
    if (z.up && pos <= z.up) return 'up';
    if (z.rel && pos > size - z.rel) return 'rel';
    return null;
  }

  /* Auch der Saisonrückblick zeigt die Tabelle — dort steht die eigene
     Platzierung, und beides gehört zusammen. Deshalb nach aussen
     gereicht statt ein zweites Mal geschrieben. */
  FKC.ui.leagueTable = leagueTable;
  FKC.ui.leagueRows = viewRows;

  /* ── Internationaler Wettbewerb ─────────────────────────────────── */
  function contBlock(cont, ownClubId) {
    var html = '<div class="card">';
    if (cont.leaguePhase) {
      html += c.kv([
        [t('tables.leaguePhase'), t('tables.phasePos', {
          pos: cont.leaguePhase.pos, of: cont.teams })],
        [t('tables.points'), String(cont.leaguePhase.pts) + ' / ' +
          t('tables.fromGames', { n: cont.leaguePhase.played })]
      ]);
    }
    if (cont.rounds && cont.rounds.length) {
      html += '<div style="margin-top:10px">' + roundList(cont.rounds, clubName) + '</div>';
    }
    html += '<div class="kv"><span>' + t('tables.result') + '</span><span><b>' +
      t('season.stage.' + cont.result) + '</b></span></div></div>';
    return html;
  }

  /* ── Turnier ────────────────────────────────────────────────────── */
  function tournamentBlock(tour) {
    var d = tour.detail || {};
    var html = '<div class="card">';

    if (d.group && d.group.length) {
      html += '<div class="u-up" style="margin-bottom:8px">' + t('tables.groupStage') + '</div>';
      html += '<div class="table-wrap"><table class="ltable"><thead><tr>' +
        '<th class="ta-pos">#</th><th>' + t('tables.team') + '</th>' +
        '<th class="ta-num">' + t('tables.record') + '</th>' +
        '<th class="ta-num">' + t('tables.goals') + '</th>' +
        '<th class="ta-num">' + t('tables.points') + '</th></tr></thead><tbody>';
      d.group.forEach(function (r) {
        html += '<tr' + (r.own ? ' class="is-own"' : '') + '>' +
          '<td class="ta-pos">' + r.pos + '</td>' +
          '<td class="ta-club"><span>' + c.esc(FKC.data.nationName(r.n)) + '</span></td>' +
          '<td class="ta-num">' + r.w + '–' + r.d + '–' + r.l + '</td>' +
          '<td class="ta-num">' + r.gf + ':' + r.ga + '</td>' +
          '<td class="ta-num"><b>' + r.pts + '</b></td></tr>';
      });
      html += '</tbody></table></div>';
    }

    if (d.rounds && d.rounds.length) {
      html += '<div class="u-up" style="margin:16px 0 8px">' + t('tables.knockout') + '</div>';
      html += roundList(d.rounds, FKC.data.nationName);
    }

    html += '<div class="kv"><span>' + t('tables.result') + '</span><span><b>' +
      t('season.stage.' + tour.result) + '</b></span></div></div>';
    return html;
  }

  /* ── K.-o.-Runden als Liste ─────────────────────────────────────── */
  function roundList(rounds, nameFn) {
    return '<div class="ko-list">' + rounds.map(function (r) {
      return '<div class="ko-row" data-won="' + (r.won ? '1' : '0') + '">' +
        '<span class="ko-round">' + t('season.stage.' + r.round) + '</span>' +
        '<span class="ko-opp">' + c.esc(nameFn(r.opp)) + '</span>' +
        '<span class="ko-score">' + r.a + ':' + r.b + '</span></div>';
    }).join('') + '</div>';
  }

})(window.FKC);
