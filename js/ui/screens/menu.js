/* ── Startbildschirm ───────────────────────────────────────────────── */

(function (FKC) {
  'use strict';
  var c = FKC.ui.c, t = FKC.t;

  FKC.ui.router.register('menu', {
    topbar: false,

    render: function () {
      var peek = FKC.save.peek();
      var html = '<div class="hero">' +
        '<div class="hero-ball"></div>' +
        '<div class="hero-kicker">' + t('menu.kicker') + '</div>' +
        '<h1>' + t('menu.title') + ' <em>' + t('menu.titleAccent') + '</em></h1>' +
        '<p>' + t('menu.tagline') + '</p></div>';

      html += '<div class="stack">';

      if (peek) {
        var club = FKC.data.clubById(peek.clubId);
        var syn = !club && peek.clubId;
        html += '<button class="choice" data-act="continue">' +
          '<div class="choice-title">' + t('menu.continue') + '</div>' +
          '<div class="choice-desc">' + c.esc(peek.name) + ' · ' +
          t('menu.continueSub', { age: peek.age, phase: t('phase.' + peek.phase) }) +
          (club ? ' · ' + c.esc(club.name) : (syn ? '' : '')) + '</div>' +
          '<div class="choice-foot">' + c.chip(t('phase.' + peek.phase), 'accent') +
          (peek.phase !== 'childhood' ? c.chip(t('card.ovr') + ' ' + peek.ovr, 'info') : '') +
          '</div></button>';
      }

      /* Spielstand vorhanden, aber unlesbar */
      if (!peek && FKC.save.corrupt) {
        html += '<div class="outcome" data-tone="bad" style="margin-bottom:4px">' +
          '<div class="story-text"><strong>' + t('menu.corruptTitle') + '</strong><br>' +
          t('menu.corruptText') + '</div>' +
          '<button class="btn btn-danger btn-sm btn-block" style="margin-top:12px" ' +
          'data-act="dropCorrupt">' + t('menu.corruptDrop') + '</button></div>';
      }

      /* Es gab schon einmal einen Spielstand, jetzt ist keiner mehr da —
         typisch, wenn der Browser den Speicher bei file:// nicht behält. */
      var lost = !peek && !FKC.save.corrupt && FKC.save.lastPlayerName();
      if (lost) {
        html += '<div class="outcome" data-tone="bad" style="margin-bottom:4px">' +
          '<div class="story-text"><strong>' + t('menu.lostTitle') + '</strong><br>' +
          t('menu.lostText', { name: c.esc(lost) }) + '</div></div>';
      }

      html += '<button class="choice" data-act="new">' +
        '<div class="choice-title">' + t('menu.new') + '</div>' +
        '<div class="choice-desc">' + t('menu.newSub') + '</div></button>';

      html += '<button class="choice" data-act="settings">' +
        '<div class="choice-title">' + t('menu.settings') + '</div>' +
        '<div class="choice-desc">' + t('menu.settingsSub') + '</div></button>';

      html += '</div>';

      html += '<div class="row-between" style="margin-top:28px">' +
        '<span class="u-muted" style="font-size:.78rem">' + t('menu.footer') + '</span>' +
        '<button class="tb-btn" data-act="lang">' + FKC.i18n.lang.toUpperCase() + '</button></div>';

      return html;
    },

    bind: function (root) {
      root.addEventListener('click', function (e) {
        var b = e.target.closest('[data-act]');
        if (!b) return;
        var act = b.getAttribute('data-act');

        if (act === 'dropCorrupt') {
          FKC.save.clear();
          FKC.ui.router.reload();
        } else if (act === 'lang') {
          FKC.i18n.setLang(FKC.i18n.lang === 'de' ? 'en' : 'de');
        } else if (act === 'continue') {
          FKC.save.load();
          var ph = FKC.state.game.career.phase;
          FKC.ui.router.go(ph === 'retired' ? 'retire' : ph === 'pro' ? 'hub' : 'story');
        } else if (act === 'new') {
          if (FKC.save.exists()) {
            FKC.ui.router.confirm(t('menu.newWarnTitle'), t('menu.newWarnText'), function () {
              FKC.ui.router.go('create');
            }, true);
          } else {
            FKC.ui.router.go('create');
          }
        } else if (act === 'settings') {
          FKC.ui.router.go('settings');
        }
      });
    }
  });

})(window.FKC);
