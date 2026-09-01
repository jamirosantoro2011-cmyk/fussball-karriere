/* ── Trophäenschrank ───────────────────────────────────────────────────
   Alles Gewonnene auf einen Blick: Vereinstitel, Länderturniere und
   individuelle Auszeichnungen, jeweils mit Jahr und Anzahl.        */

(function (FKC) {
  'use strict';
  var c = FKC.ui.c, t = FKC.t;

  FKC.ui.router.register('trophies', {

    render: function () {
      var game = FKC.state.game;
      if (!game) { setTimeout(function () { FKC.ui.router.go('menu'); }, 0); return ''; }

      var club = [], nation = [], personal = [];
      group(game.career.trophies,
            function (tr) { return tr.compId; },
            function (tr) { return tr.name || FKC.data.compName(tr.compId); },
            function (tr) { return tr.compId; })
        .forEach(function (g) { (g.national ? nation : club).push(g); });

      /* Turnier-Auszeichnungen zählen je Turnier eigenständig —
         der Goldene Schuh der WM ist nicht der der EM.          */
      group(game.career.awards,
            function (a) { return a.id + '|' + (a.compId || ''); },
            function (a) {
              return t('award.' + a.id) +
                (a.compId ? ' · ' + FKC.data.compName(a.compId) : '');
            },
            function (a) { return a.id; })
        .forEach(function (g) { personal.push(g); });

      var total = game.career.trophies.length + game.career.awards.length;

      var html = '<h1>' + t('cabinet.title') + '</h1>';
      html += '<p class="u-dim" style="margin-top:6px">' +
        (total ? t('cabinet.sub', { n: total }) : t('cabinet.empty')) + '</p>';

      html += section('cabinet.club', club);
      html += section('cabinet.nation', nation);
      html += section('cabinet.personal', personal);

      html += '<div class="actionbar">' +
        '<button class="btn btn-primary btn-block" data-act="back">' + t('ui.back') + '</button></div>';
      return html;
    },

    bind: function (root) {
      root.addEventListener('click', function (e) {
        if (e.target.closest('[data-act="back"]')) {
          var ph = FKC.state.game.career.phase;
          FKC.ui.router.go(ph === 'retired' ? 'retire' : 'hub');
        }
      });
    }
  });

  /* ── Gruppieren nach Wettbewerb / Auszeichnung ──────────────────── */
  function group(list, keyFn, nameFn, artFn) {
    var map = {}, order = [];
    (list || []).forEach(function (item) {
      var k = keyFn(item);
      if (!map[k]) {
        map[k] = { id: k, artId: artFn ? artFn(item) : k, name: nameFn(item),
                   count: 0, seasons: [], national: !!item.national };
        order.push(k);
      }
      map[k].count++;
      if (item.season) map[k].seasons.push(item.season);
    });
    return order.map(function (k) { return map[k]; })
      .sort(function (a, b) { return b.count - a.count; });
  }

  function section(titleKey, items) {
    if (!items.length) return '';
    var html = c.sectionTitle(t(titleKey));
    html += '<div class="cabinet">';
    items.forEach(function (g) {
      html += '<div class="trophy-card">' +
        (g.count > 1 ? '<span class="trophy-count">×' + g.count + '</span>' : '') +
        '<div class="trophy-art">' + FKC.ui.trophy(g.artId || g.id, 62, g.national) + '</div>' +
        '<div class="trophy-name">' + c.esc(g.name) + '</div>' +
        '<div class="trophy-years">' + c.esc(years(g.seasons)) + '</div>' +
        '</div>';
    });
    return html + '</div>';
  }

  /** Jahre kompakt: "2041/42, 2044/45 …" — bei vielen nur die letzten */
  function years(list) {
    if (!list.length) return '';
    var shown = list.slice(-4);
    var txt = shown.join(', ');
    return list.length > shown.length ? '… ' + txt : txt;
  }

})(window.FKC);
