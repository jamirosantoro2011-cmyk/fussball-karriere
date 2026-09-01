/* ── Karriereende: Rückblick ───────────────────────────────────────────
   Das Gesamturteil über alles, was passiert ist.                    */

(function (FKC) {
  'use strict';
  var c = FKC.ui.c, t = FKC.t;

  /** Platzhalter für die Zitattexte */
  function voiceParams(game, s) {
    var best = null;
    (s.clubs || []).forEach(function (st) {
      if (!best || st.apps > best.apps) best = st;
    });
    var bestClub = best ? FKC.data.clubById(best.clubId) : null;
    var ctx = (s.voices && s.voices.ctx) || {};
    return {
      name: c.esc(FKC.state.fullName()),
      last: c.esc(game.identity.lastName),
      club: c.esc(bestClub ? bestClub.name : ''),
      nation: c.esc(FKC.data.nationName(game.identity.nationality)),
      peak: s.peakOvr, apps: s.totals.apps, goals: s.totals.goals,
      assists: s.totals.assists, caps: s.national.caps,
      trophies: ctx.trophies || 0, clubs: ctx.clubs || 1,
      age: s.retiredAt, seasons: s.seasons
    };
  }

  function card(id, name, count, national) {
    return '<div class="trophy-card">' +
      (count > 1 ? '<span class="trophy-count">×' + count + '</span>' : '') +
      '<div class="trophy-art">' + FKC.ui.trophy(id, 58, national) + '</div>' +
      '<div class="trophy-name">' + c.esc(name) + '</div></div>';
  }

  FKC.ui.router.register('retire', {

    render: function () {
      var game = FKC.state.game;
      if (!game) { setTimeout(function () { FKC.ui.router.go('menu'); }, 0); return ''; }

      if (!game.pending || game.pending.kind !== 'retire') {
        game.pending = { kind: 'retire' };
      }
      var s = game.pending.summary || (game.pending.summary = FKC.career.buildRetrospective(game));

      var html = '<div class="hero" style="padding-bottom:var(--sp-4)">' +
        '<div style="display:flex;justify-content:center;margin-bottom:14px">' +
        FKC.ui.art.avatar(game, 92) + '</div>' +
        '<div class="hero-kicker">' + t('retire.kicker', { age: s.retiredAt }) + '</div>' +
        '<h1 style="margin-top:14px">' + c.esc(FKC.state.fullName()) + '</h1>' +
        '<p style="margin-top:10px;display:flex;align-items:center;justify-content:center;gap:8px">' +
        FKC.ui.art.flag(game.identity.nationality, 24) +
        t('retire.sub', {
          seasons: s.seasons,
          nation: c.esc(FKC.data.nationName(game.identity.nationality))
        }) + '</p></div>';

      /* Verdikt */
      html += '<div class="playercard" style="text-align:center">' +
        '<div class="hero-kicker" style="letter-spacing:.24em">' + t('retire.verdict') + '</div>' +
        '<h2 style="margin:10px 0 8px;font-size:1.8rem;color:var(--gold)">' +
        t('verdict.' + s.verdictId) + '</h2>' +
        /* Note 0–100: macht das Urteil vergleichbar, statt nur ein
           Etikett zu vergeben. */
        '<div class="career-score"><b>' + (s.rated != null ? s.rated : '—') +
        '</b><span>' + t('retire.ratingOf100') + '</span></div>' +
        '<p class="u-dim" style="font-size:.9rem;margin:0 auto;max-width:38ch">' +
        t('verdict.desc.' + s.verdictId) + '</p></div>';

      /* Woraus sich das Urteil zusammensetzt */
      html += c.sectionTitle(t('retire.breakdown'));
      var parts = s.parts || {};
      var maxPart = Math.max(1, parts.rating || 0, parts.trophies || 0,
                             parts.national || 0, parts.stats || 0, parts.awards || 0);
      html += '<div class="card"><div class="stack-sm">' +
        ['rating', 'trophies', 'national', 'stats', 'awards'].map(function (k) {
          var v = parts[k] || 0;
          return c.meter(t('retire.part.' + k), v / maxPart * 100,
                         k === 'trophies' ? 'warm' : k === 'national' ? 'cool' : 'grass',
                         FKC.i18n.num(v));
        }).join('') + '</div>' +
        '<div class="kv" style="margin-top:12px"><span>' + t('retire.total') +
        '</span><span><b>' + FKC.i18n.num(s.score) + '</b></span></div></div>';

      /* Die Fans */
      var voices = s.voices || {};
      var vp = voiceParams(game, s);
      if (voices.fans) {
        html += c.sectionTitle(t('retire.fans'));
        html += '<div class="outcome" data-tone="' + c.esc(voices.fans.tone) + '">' +
          '<div class="story-text">' + t('voice.' + voices.fans.id, vp) + '</div></div>';
      }

      /* Stimmen von aussen */
      if (voices.quotes && voices.quotes.length) {
        html += c.sectionTitle(t('retire.voices'));
        html += '<div class="stack-sm">' + voices.quotes.map(function (q) {
          return '<blockquote class="quote">' +
            '<p>' + t('voice.' + q.id, vp) + '</p>' +
            '<footer><b>' + c.esc(q.speaker) + '</b> · ' + t(q.role) + '</footer>' +
            '</blockquote>';
        }).join('') + '</div>';
      }

      /* Eckdaten */
      html += c.sectionTitle(t('retire.numbers'));
      html += '<div class="card">' + c.stats([
        { value: s.peakOvr, label: t('retire.peak') },
        { value: s.totals.apps, label: t('stat.apps') },
        { value: game.identity.isGK ? (s.totals.cleanSheets || 0) : s.totals.goals,
          label: game.identity.isGK ? t('stat.cleanSheets') : t('stat.goals') }
      ]) + '<div style="margin-top:12px">' + c.kv([
        [t('stat.assists'), String(s.totals.assists)],
        [t('stat.minutes'), FKC.i18n.num(s.totals.minutes) + '′'],
        [t('stat.motm'), String(s.totals.motm)],
        [t('stat.cards'), s.totals.yellows + ' / ' + s.totals.reds],
        [t('retire.earned'), FKC.i18n.money(s.finances)]
      ]) + '</div></div>';

      /* Stationen als Wappen-Zeitstrahl */
      var ctl = FKC.ui.art.clubTimeline(game);
      if (ctl) {
        html += c.sectionTitle(t('hub.stations'));
        html += '<div class="card">' + ctl + '</div>';
      }

      /* Verlaufskurven */
      if (game.ovrHistory.length > 3) {
        html += c.sectionTitle(t('retire.curve'));
        html += '<div class="card">' + FKC.ui.art.historyChart([
          { values: game.ovrHistory.map(function (p) { return { x: p.age, y: p.ovr }; }),
            color: 'var(--accent)', label: t('card.ovr') },
          { values: game.ovrHistory.filter(function (p) { return p.form != null; })
              .map(function (p) { return { x: p.age, y: p.form }; }),
            color: 'var(--warn)', label: t('meter.form'), dashed: true }
        ], { h: 96 }) +
          '<div class="row-between u-muted" style="margin-top:4px;font-size:.72rem">' +
          '<span>' + t('story.age', { n: game.ovrHistory[0].age }) + '</span>' +
          '<span>' + t('story.age', { n: s.retiredAt }) + '</span></div>';
        var mv = game.ovrHistory.filter(function (p) { return p.mv > 0; });
        if (mv.length > 2) {
          html += '<div style="margin-top:16px">' + FKC.ui.art.historyChart([
            { values: mv.map(function (p) { return { x: p.age, y: p.mv }; }),
              color: 'var(--accent-2)', label: t('hub.marketValue'), min: 0 }
          ], { h: 76 }) + '</div>';
        }
        html += '</div>';
      }

      /* Titel und Auszeichnungen */
      html += c.sectionTitle(t('retire.trophies'));
      if (s.trophies.length || s.awards.length) {
        var byAward = {};
        s.awards.forEach(function (a) {
          var k = a.id + '|' + (a.compId || '');
          if (!byAward[k]) {
            byAward[k] = { id: a.id, count: 0,
              label: t('award.' + a.id) + (a.compId ? ' · ' + FKC.data.compName(a.compId) : '') };
          }
          byAward[k].count++;
        });
        html += '<div class="cabinet">' +
          s.trophies.map(function (tr) {
            return card(tr.compId || tr.id, tr.name, tr.count, tr.national);
          }).join('') +
          Object.keys(byAward).map(function (k) {
            return card(byAward[k].id, byAward[k].label, byAward[k].count, false);
          }).join('') +
          '</div>';
        html += '<button class="btn btn-block btn-sm" style="margin-top:12px" data-act="cabinet">' +
          t('hub.openCabinet') + '</button>';
      } else {
        html += '<div class="card"><p class="u-muted" style="margin:0">' + t('retire.noTrophies') + '</p></div>';
      }

      /* Vereine */
      html += c.sectionTitle(t('retire.clubs'));
      html += '<div class="card">' + s.clubs.filter(function (st) {
        return st.phase === 'pro' || st.apps > 0;
      }).map(function (st) {
        var club = FKC.data.clubById(st.clubId);
        if (!club) return '';
        return '<div class="kv"><span>' + c.crest(club) + ' ' + c.esc(club.name) + '</span>' +
          '<span class="u-mono-num">' + st.from + '–' + (st.to || s.retiredAt + game.identity.birthYear) +
          ' · ' + st.apps + '/' + st.goals + '</span></div>';
      }).join('') + '</div>';

      /* Nationalmannschaft */
      html += c.sectionTitle(t('retire.national'));
      html += '<div class="card">' + c.kv([
        [t('national.total'), t('national.capsGoals', { caps: s.national.caps, goals: s.national.goals })],
        [t('retire.tournaments'), s.national.tournaments.length
          ? s.national.tournaments.filter(function (x) { return x.qualified; }).map(function (x) {
              return FKC.data.compName(x.compId) + ' (' + t('season.stage.' + x.result) + ')';
            }).join(', ') || t('retire.noneNat')
          : t('retire.noneNat')]
      ]) + '</div>';

      html += '<div class="actionbar">' +
        '<button class="btn btn-ghost" data-act="menu">' + t('retire.toMenu') + '</button>' +
        '<button class="btn btn-primary" data-act="new">' + t('retire.newCareer') + '</button></div>';

      return html;
    },

    bind: function (root) {
      root.addEventListener('click', function (e) {
        var b = e.target.closest('[data-act]');
        if (!b) return;
        if (b.getAttribute('data-act') === 'cabinet') {
          FKC.ui.router.go('trophies');
        } else if (b.getAttribute('data-act') === 'new') {
          FKC.ui.router.confirm(t('menu.newWarnTitle'), t('menu.newWarnText'), function () {
            FKC.save.clear();
            FKC.ui.router.go('create');
          }, true);
        } else {
          FKC.ui.router.go('menu');
        }
      });
    }
  });

})(window.FKC);
