/* ── Übersicht / Profi-Hub ─────────────────────────────────────────────
   Zentrale Karteikarte des Spielers: Werte, Umfeld, Verlauf.
   Ab Schritt 4 wird hier zusätzlich die Saison gestartet.            */

(function (FKC) {
  'use strict';
  var c = FKC.ui.c, t = FKC.t;

  FKC.ui.router.register('hub', {

    render: function () {
      var game = FKC.state.game;
      if (!game) { setTimeout(function () { FKC.ui.router.go('menu'); }, 0); return ''; }

      var club = FKC.state.club();
      var html = '';

      /* Spielerkarte */
      html += c.playerCard(game);

      /* Zustand */
      html += c.sectionTitle(t('hub.condition'));
      html += '<div class="card"><div class="stack-sm">' +
        c.meter(t('meter.form'), game.condition.form, 'grass') +
        c.meter(t('meter.morale'), game.condition.morale, 'warm') +
        c.meter(t('meter.fitness'), game.condition.fitness, 'cool') +
        c.meter(t('meter.reputation'), game.status.reputation, 'grass') +
        '</div>';
      if (game.condition.injury) {
        html += '<p style="margin-top:12px" class="u-bad">' +
          t('hub.injured', { n: Math.max(1, game.condition.injury.weeks) }) + '</p>';
      }
      html += '</div>';

      /* Verein & Umfeld */
      html += c.sectionTitle(t('hub.club'));
      html += '<div class="card">';
      if (club) {
        var lg = FKC.data.leagueOf(club);
        html += '<div style="margin-bottom:12px">' + c.clubLine(club,
          club.synthetic ? t('club.type.' + (club.type || 'village')) : (lg ? lg.name : '')) + '</div>';
        var rows = [];
        rows.push([t('hub.since'), t('hub.seasons', { n: game.status.seasonsAtClub })]);
        if (game.status.contract) {
          rows.push([t('hub.salary'), FKC.i18n.money(game.status.contract.salary) + t('unit.perYear')]);
          rows.push([t('hub.contract'), t('hub.yearsLeft', { n: game.status.contract.yearsLeft })]);
          rows.push([t('hub.role'), t('role.' + game.status.contract.squadRole)]);
        }
        rows.push([t('hub.marketValue'), FKC.i18n.money(game.status.marketValue)]);
        rows.push([t('meter.loyalty'), Math.round(game.status.loyalty) + '%']);
        if (game.identity.shirtNo) rows.push([t('hub.shirtNo'), '#' + game.identity.shirtNo]);
        html += c.kv(rows);

        /* Das aktuelle Trikot bleibt sichtbar, nicht nur im Moment der
           Unterschrift — es ist der Verein, den man gerade trägt. */
        html += '<div class="shirt-stage shirt-stage-sm">' +
          FKC.ui.art.shirtBack({
            design: FKC.kit.design(club),
            number: game.identity.shirtNo, name: game.identity.lastName, size: 150
          }) + '</div>';
      } else {
        html += '<p class="u-muted">' + t('hub.noClub') + '</p>';
      }
      html += '</div>';

      /* Leben */
      html += c.sectionTitle(t('hub.life'));
      html += '<div class="card">' + c.kv([
        [t('hub.origin'), c.esc(game.origin.town) + ' · ' + c.esc(FKC.data.nationName(game.identity.nationality))],
        [t('meter.support'), Math.round(game.origin.familySupport) + '%'],
        [t('hub.education'), Math.round(game.career.life.education) + '%'],
        [t('hub.homesick'), Math.round(game.career.life.homesick) + '%'],
        [t('hub.balance'), FKC.i18n.money(game.career.finances.balance)]
      ]) + '</div>';

      /* Spielertyp */
      var traits = (game.hidden.traits || []);
      var arche = game.hidden.archetype || 'standard';
      var showArche = FKC.state.age() >= 14;
      if ((traits.length || showArche) && game.identity.age >= 10) {
        html += c.sectionTitle(t('hub.traits'));
        html += '<div class="card"><div class="pill-group">' +
          (showArche ? c.chip((arche === 'prodigy' ? '★ ' : '') + t('archetype.' + arche),
                              arche === 'prodigy' ? 'gold' : 'info') : '') +
          traits.map(function (id) {
            return c.chip(t('trait.' + id), 'accent');
          }).join('') + '</div>' +
          '<p class="u-muted" style="font-size:.8rem;margin-top:10px">' +
          (showArche ? t('archetype.desc.' + arche) + ' ' : '') +
          traits.map(function (id) { return t('trait.desc.' + id); }).join(' ') + '</p></div>';
      }

      /* Mentor */
      var mentor = game.career.mentor;
      if (mentor) {
        var mdef = FKC.data.mentorById(mentor.id) || {};
        html += c.sectionTitle(t('hub.mentor'));
        html += '<div class="card"><div class="mentor-line">' +
          '<span class="mentor-mark" style="background:' + c.esc(mdef.accent || '#9ef25b') + '">' +
          c.esc(FKC.util.initials(mentor.name)) + '</span>' +
          '<div><div style="font-weight:700">' + c.esc(mentor.name) + '</div>' +
          '<div class="club-meta">' + t(mentor.role) + ' · ' + t('mentor.type.' + mentor.id) +
          ' · ' + t('mentor.since', { year: mentor.since }) + '</div></div></div>' +
          '<div style="margin-top:12px">' +
          c.meter(t('mentor.bond'), mentor.bond, 'grass') + '</div>' +
          '<div class="pill-group" style="margin-top:10px">' +
          FKC.data.mentorAttrs(game).map(function (a) {
            return c.chip('↑ ' + t('attr.' + a), 'accent');
          }).join('') + '</div></div>';
      }

      /* Trophäenschrank */
      var titles = game.career.trophies.length + game.career.awards.length;
      html += c.sectionTitle(t('hub.trophies'));
      html += '<div class="card">' +
        '<div class="row-between">' +
        '<span class="u-dim" style="font-size:.88rem">' +
        (titles ? t('cabinet.sub', { n: titles }) : t('cabinet.empty')) + '</span>' +
        '<span class="row" style="gap:8px">' +
        '<button class="btn btn-sm" data-act="tables">' + t('hub.openTables') + '</button>' +
        '<button class="btn btn-sm" data-act="cabinet">' + t('hub.openCabinet') + '</button>' +
        '</span></div>';
      if (titles) {
        /* Der Schrank zeigte früher nur die letzten drei Titel und zwei
           Auszeichnungen — bei einer erfolgreichen Karriere fiel damit
           das meiste unter den Tisch. Jetzt stehen alle da, gruppiert
           nach Wettbewerb, mit der Anzahl als Marke am Pokal. */
        var gruppen = [], index = {};
        function sammeln(id, name, national) {
          var k = id + '|' + name;
          if (!index[k]) { index[k] = { compId: id, name: name, n: 0, national: national };
                           gruppen.push(index[k]); }
          index[k].n++;
        }
        game.career.trophies.forEach(function (tr) {
          sammeln(tr.compId, tr.name || FKC.data.compName(tr.compId), tr.national);
        });
        game.career.awards.forEach(function (a) {
          sammeln(a.id, t('award.' + a.id), false);
        });
        html += '<div class="trophy-row" style="margin-top:14px">' +
          gruppen.map(function (tr) {
            return '<div class="trophy-mini">' +
              FKC.ui.trophy(tr.compId, 48, tr.national) +
              (tr.n > 1 ? '<span class="trophy-count">' + tr.n + '×</span>' : '') +
              '<div class="trophy-name">' + c.esc(tr.name) + '</div>' +
              '</div>';
          }).join('') + '</div>';
      }
      html += '</div>';

      /* Stationen als Wappen-Zeitstrahl */
      var ctl = FKC.ui.art.clubTimeline(game);
      if (ctl) {
        html += c.sectionTitle(t('hub.stations'));
        html += '<div class="card">' + ctl + '</div>';
      }

      /* Verlauf von Rating, Form und Marktwert */
      if (game.ovrHistory.length > 2) {
        html += c.sectionTitle(t('hub.progress'));
        html += '<div class="card">' + FKC.ui.art.historyChart([
          { values: game.ovrHistory.map(function (p) { return { x: p.age, y: p.ovr }; }),
            color: 'var(--accent)', label: t('card.ovr') },
          { values: game.ovrHistory.filter(function (p) { return p.form != null; })
              .map(function (p) { return { x: p.age, y: p.form }; }),
            color: 'var(--warn)', label: t('meter.form'), dashed: true }
        ], { h: 92 }) +
          '<div class="row-between u-muted" style="margin-top:4px;font-size:.72rem">' +
          '<span>' + t('story.age', { n: game.ovrHistory[0].age }) + '</span>' +
          '<span>' + t('story.age', { n: FKC.state.age() }) + '</span></div>';

        var mv = game.ovrHistory.filter(function (p) { return p.mv > 0; });
        if (mv.length > 2) {
          html += '<div style="margin-top:16px">' + FKC.ui.art.historyChart([
            { values: mv.map(function (p) { return { x: p.age, y: p.mv }; }),
              color: 'var(--accent-2)', label: t('hub.marketValue'), min: 0 }
          ], { h: 76 }) + '</div>';
        }
        html += '</div>';
      }

      /* Zeitstrahl */
      html += c.sectionTitle(t('hub.timeline'));
      html += '<div class="card">' + c.timeline(game.career.timeline.slice().reverse()) + '</div>';

      /* Karriere freiwillig beenden */
      if (game.career.phase === 'pro' && FKC.state.age() >= 30) {
        html += '<div style="margin-top:20px" class="u-center">' +
          '<button class="btn btn-danger btn-sm" data-act="retire">' +
          t('hub.retireNow') + '</button></div>';
      }

      /* Aktionen */
      html += '<div class="actionbar">';
      if (game.career.phase === 'retired') {
        html += '<button class="btn btn-primary btn-block" data-act="retro">' +
          t('hub.showRetro') + '</button>';
      } else {
        html += '<button class="btn btn-primary btn-block" data-act="continue">' +
          t(game.career.phase === 'pro' ? 'hub.startSeason' : 'hub.continue') + '</button>';
      }
      html += '</div>';

      return html;
    },

    bind: function (root) {
      root.addEventListener('click', function (e) {
        var b = e.target.closest('[data-act]');
        if (!b) return;
        var act = b.getAttribute('data-act');

        if (act === 'continue') {
          FKC.ui.router.go('story');
        } else if (act === 'cabinet') {
          FKC.ui.router.go('trophies');
        } else if (act === 'tables') {
          FKC.ui.router.go('tables');
        } else if (act === 'retro') {
          FKC.ui.router.go('retire');
        } else if (act === 'retire') {
          FKC.ui.router.confirm(t('hub.retireTitle'), t('hub.retireText'), function () {
            FKC.career.retire(FKC.state.game, 'choice');
            FKC.ui.router.go('retire');
          }, true);
        }
      });
    }
  });

})(window.FKC);
