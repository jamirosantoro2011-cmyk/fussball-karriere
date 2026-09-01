/* ── Admin- und Cheat-Panel ────────────────────────────────────────────
   Bewusst vom Spielfluss getrennt: erreichbar über den kleinen Punkt
   unten rechts oder mit Umschalt+D. Alles hier greift direkt in den
   Spielstand ein und ist zum Testen gedacht.                        */

(function (FKC) {
  'use strict';
  var c = FKC.ui.c, t = FKC.t;

  function g() { return FKC.state.game; }

  /* Nach jedem Eingriff: neu berechnen, speichern, Rückmeldung geben */
  function apply(label) {
    var game = g();
    FKC.attributes.recalc(game);
    game.status.marketValue = FKC.attributes.marketValue(game);
    FKC.save.write();
    FKC.ui.router.reload();
    FKC.ui.router.toast(label, 'good');
  }

  FKC.ui.router.register('admin', {

    render: function () {
      var game = g();
      if (!game) {
        return '<h1>' + t('admin.title') + '</h1>' +
          '<p class="u-dim" style="margin-top:8px">' + t('admin.noCareer') + '</p>' +
          '<div class="actionbar"><button class="btn btn-primary btn-block" data-act="back">' +
          t('ui.back') + '</button></div>';
      }

      var keys = FKC.data.keysFor(game.identity.isGK);
      var html = '<h1>' + t('admin.title') + '</h1>' +
        '<p class="u-dim" style="margin-top:6px">' + t('admin.intro') + '</p>';

      /* ── Rating & Attribute ─────────────────────────────────────── */
      html += c.sectionTitle(t('admin.ratings'));
      html += '<div class="card">';
      html += row(t('card.ovr'), 'ovr', game.ovr, 1, 99);
      html += row(t('hidden.potential'), 'potential', game.hidden.potential, 1, 99);
      html += '<div class="attrs" style="margin-top:14px">';
      keys.forEach(function (k) {
        html += '<div class="attr"><span class="attr-key">' + t('attr.short.' + k) + '</span>' +
          '<input class="input admin-num" type="number" min="1" max="99" data-attr="' + k +
          '" value="' + game.attributes[k] + '">' +
          '<span></span></div>';
      });
      html += '</div>';
      html += '<div class="row" style="margin-top:12px;gap:8px;flex-wrap:wrap">' +
        btn('admin.maxAll', 'maxAll') + btn('admin.set70', 'set70') +
        btn('admin.matchPotential', 'matchPotential') + '</div>';
      html += '</div>';

      /* ── Person & Zeit ──────────────────────────────────────────── */
      html += c.sectionTitle(t('admin.person'));
      html += '<div class="card">';
      html += row(t('stat.age'), 'age', FKC.state.age(), 6, 45);
      html += row(t('meter.form'), 'form', Math.round(game.condition.form), 0, 100);
      html += row(t('meter.morale'), 'morale', Math.round(game.condition.morale), 0, 100);
      html += row(t('meter.fitness'), 'fitness', Math.round(game.condition.fitness), 0, 100);
      html += row(t('meter.reputation'), 'reputation', Math.round(game.status.reputation), 0, 100);
      html += row(t('effect.fans'), 'fanRelation', Math.round(game.status.fanRelation), 0, 100);
      html += '<div class="field" style="margin-top:12px"><label>' + t('admin.position') + '</label>' +
        '<select class="input" data-set="position">' +
        FKC.data.positions.map(function (p) {
          return '<option value="' + p.id + '"' +
            (p.id === game.identity.position ? ' selected' : '') + '>' +
            t('pos.' + p.id) + '</option>';
        }).join('') + '</select></div>';
      html += '</div>';

      /* ── Geld & Vertrag ─────────────────────────────────────────── */
      html += c.sectionTitle(t('admin.money'));
      html += '<div class="card">';
      html += row(t('hub.balance') + ' (€)', 'balance', Math.round(game.career.finances.balance), 0, 1e9, 100000);
      if (game.status.contract) {
        html += row(t('hub.salary') + ' (€)', 'salary', game.status.contract.salary, 0, 1e8, 100000);
        html += row(t('contract.remaining'), 'yearsLeft', game.status.contract.yearsLeft, 0, 8);
        html += '<div class="field" style="margin-top:12px"><label>' + t('hub.role') + '</label>' +
          '<select class="input" data-set="squadRole">' +
          ['talent', 'rotation', 'starter', 'star'].map(function (r) {
            return '<option value="' + r + '"' +
              (r === game.status.contract.squadRole ? ' selected' : '') + '>' +
              t('role.' + r) + '</option>';
          }).join('') + '</select></div>';
      } else {
        html += '<p class="u-muted" style="margin:0">' + t('admin.noContract') + '</p>';
      }
      html += '<div class="row" style="margin-top:12px;gap:8px;flex-wrap:wrap">' +
        btn('admin.giveMillion', 'giveMillion') + btn('admin.captain', 'toggleCaptain') + '</div>';
      html += '</div>';

      /* ── Verletzung ─────────────────────────────────────────────── */
      html += c.sectionTitle(t('admin.injury'));
      html += '<div class="card">';
      html += '<p class="u-dim" style="font-size:.86rem;margin:0 0 12px">' +
        (game.condition.injury
          ? t('hub.injured', { n: game.condition.injury.weeks })
          : t('admin.healthy')) + '</p>';
      html += '<div class="row" style="gap:8px;flex-wrap:wrap">' +
        btn('admin.injureMinor', 'injureMinor') + btn('admin.injureMajor', 'injureMajor') +
        btn('admin.heal', 'heal') + '</div></div>';

      /* ── Verein ─────────────────────────────────────────────────── */
      html += c.sectionTitle(t('admin.club'));
      html += '<div class="card">';
      html += '<div class="field"><label>' + t('admin.moveTo') + '</label>' +
        '<select class="input" data-select="league">' +
        FKC.data.leagues.map(function (l) {
          return '<option value="' + l.id + '">' + c.esc(l.name) + '</option>';
        }).join('') + '</select></div>';
      html += '<div class="field" style="margin-top:10px">' +
        '<select class="input" data-select="club" id="admin-club"></select></div>';
      html += '<div class="row" style="margin-top:12px;gap:8px;flex-wrap:wrap">' +
        btn('admin.forceMove', 'forceMove') + btn('admin.freeAgent', 'freeAgent') + '</div>';
      html += '</div>';

      /* ── Titel ──────────────────────────────────────────────────── */
      html += c.sectionTitle(t('admin.trophies'));
      html += '<div class="card">';
      html += '<div class="field"><label>' + t('admin.addTrophy') + '</label>' +
        '<select class="input" data-select="comp">' + compOptions() + '</select></div>';
      html += '<div class="field" style="margin-top:10px"><label>' + t('admin.addAward') + '</label>' +
        '<select class="input" data-select="award">' +
        ['ballon', 'goldenBoot', 'goldenBall', 'goldenBootTournament',
         'goldenBallTournament', 'teamOfSeason', 'youngPlayer'].map(function (a) {
          return '<option value="' + a + '">' + t('award.' + a) + '</option>';
        }).join('') + '</select></div>';
      html += '<div class="row" style="margin-top:12px;gap:8px;flex-wrap:wrap">' +
        btn('admin.doAddTrophy', 'addTrophy') + btn('admin.doAddAward', 'addAward') +
        btn('admin.clearTrophies', 'clearTrophies') + '</div>';
      html += '<p class="u-muted" style="font-size:.78rem;margin:12px 0 0">' +
        t('admin.trophyCount', { n: game.career.trophies.length, a: game.career.awards.length }) +
        '</p></div>';

      /* ── Nationalmannschaft ─────────────────────────────────────── */
      html += c.sectionTitle(t('season.national'));
      html += '<div class="card">';
      html += '<div class="field"><label>' + t('national.status') + '</label>' +
        '<select class="input" data-set="natStatus">' +
        ['none', 'u21', 'squad', 'starter', 'captain'].map(function (s) {
          return '<option value="' + s + '"' +
            (s === game.national.status ? ' selected' : '') + '>' + t('national.' + s) + '</option>';
        }).join('') + '</select></div>';
      html += row(t('national.total'), 'caps', game.national.caps, 0, 300);
      html += '</div>';

      /* ── Ablauf ─────────────────────────────────────────────────── */
      html += c.sectionTitle(t('admin.flow'));
      html += '<div class="card"><div class="row" style="gap:8px;flex-wrap:wrap">' +
        btn('admin.skipSeason', 'skipSeason') + btn('admin.skip5', 'skip5') +
        btn('admin.toPro', 'toPro') + btn('admin.retire', 'retireNow') +
        btn('admin.clearEvent', 'clearEvent') + '</div>' +
        '<p class="u-muted" style="font-size:.78rem;margin:12px 0 0">' +
        t('admin.state', { phase: t('phase.' + game.career.phase),
                           pending: (game.pending && game.pending.kind) || '—',
                           season: game.career.seasons.length }) + '</p></div>';

      html += '<div class="actionbar">' +
        '<button class="btn btn-ghost" data-act="back">' + t('ui.back') + '</button>' +
        '<button class="btn btn-primary" data-act="applyAll">' + t('admin.applyAll') + '</button></div>' +
        '<p class="u-muted u-center" style="font-size:.76rem;margin-top:10px">' +
        t('admin.hint') + '</p>';

      return html;
    },

    bind: function (root) {
      var game = g();
      if (game) fillClubs(root);

      root.addEventListener('change', function (e) {
        var sel = e.target.closest('[data-select="league"]');
        if (sel) { fillClubs(root); return; }

        /* Zahlenfelder wirken sofort beim Verlassen des Feldes.
           So liest kein späterer Knopfdruck einen veralteten Stand. */
        if (e.target.closest('[data-num]') || e.target.closest('[data-attr]')) {
          readAll(root);
          apply(t('admin.applied'));
          return;
        }

        var setter = e.target.closest('[data-set]');
        if (!setter) return;
        var what = setter.getAttribute('data-set');
        var val = setter.value;
        if (what === 'position') {
          game.identity.position = val;
          game.identity.isGK = val === 'GK';
          apply(t('admin.done'));
        } else if (what === 'squadRole') {
          game.status.contract.squadRole = val;
          apply(t('admin.done'));
        } else if (what === 'natStatus') {
          game.national.status = val;
          apply(t('admin.done'));
        }
      });

      root.addEventListener('click', function (e) {
        var b = e.target.closest('[data-act]');
        if (!b) return;
        var act = b.getAttribute('data-act');

        if (act === 'back') { FKC.ui.router.go(backTarget()); return; }
        if (!game) return;

        if (act === 'applyAll') { readAll(root); apply(t('admin.applied')); return; }

        /* Aktionsknöpfe lesen die Zahlenfelder bewusst NICHT mit —
           sonst schreibt ein Klick nebenbei veraltete Werte zurück. */
        var fn = actions[act];
        if (fn) fn(game, root);
      });
    }
  });

  /* ── Aktionen ───────────────────────────────────────────────────── */

  var actions = {
    maxAll: function (game) {
      FKC.data.keysFor(game.identity.isGK).forEach(function (k) { game.attributes[k] = 99; });
      game.hidden.potential = 99;
      apply(t('admin.done'));
    },
    set70: function (game) {
      FKC.data.keysFor(game.identity.isGK).forEach(function (k) { game.attributes[k] = 70; });
      apply(t('admin.done'));
    },
    matchPotential: function (game) {
      FKC.attributes.calibrate(game.attributes, game.identity.position,
        game.hidden.potential, FKC.data.keysFor(game.identity.isGK));
      apply(t('admin.done'));
    },
    giveMillion: function (game) {
      game.career.finances.balance += 1000000;
      apply(t('admin.done'));
    },
    toggleCaptain: function (game) {
      game.status.isCaptain = !game.status.isCaptain;
      apply(t('admin.done'));
    },
    injureMinor: function (game) {
      FKC.effects.apply(game, [{ type: 'injury', weeks: 4, severity: 'minor' }]);
      apply(t('admin.done'));
    },
    injureMajor: function (game) {
      FKC.effects.apply(game, [{ type: 'injury', weeks: 30, severity: 'major' }]);
      apply(t('admin.done'));
    },
    heal: function (game) {
      game.condition.injury = null;
      game.condition.fitness = 100;
      apply(t('admin.done'));
    },
    forceMove: function (game, root) {
      var sel = root.querySelector('[data-select="club"]');
      var club = sel && FKC.data.clubById(sel.value);
      if (!club) return;
      FKC.effects.moveToClub(game, club, 'pro');
      game.status.contract = game.status.contract || {};
      game.status.contract.salary = game.status.contract.salary || 500000;
      game.status.contract.yearsLeft = Math.max(1, game.status.contract.yearsLeft || 3);
      game.status.contract.squadRole = game.status.contract.squadRole || 'starter';
      if (game.career.phase !== 'pro') game.career.phase = 'pro';
      apply(t('admin.moved', { club: club.name }));
    },
    freeAgent: function (game) {
      game.status.clubId = null;
      game.status.contract = null;
      game.status.isCaptain = false;
      apply(t('admin.done'));
    },
    addTrophy: function (game, root) {
      var sel = root.querySelector('[data-select="comp"]');
      if (!sel) return;
      var id = sel.value;
      var isNat = id.indexOf('nat.') === 0;
      var name = id.indexOf('league.') === 0
        ? (FKC.data.leagueById(id.slice(7)) || {}).name || id
        : FKC.data.compName(id);
      game.career.trophies.push({
        compId: id, name: name, season: FKC.i18n.season(game.identity.year),
        clubId: isNat ? null : game.status.clubId,
        nationId: isNat ? game.identity.nationality : null,
        national: isNat
      });
      apply(t('admin.trophyAdded', { name: name }));
    },
    addAward: function (game, root) {
      var sel = root.querySelector('[data-select="award"]');
      if (!sel) return;
      game.career.awards.push({
        id: sel.value, season: FKC.i18n.season(game.identity.year),
        compId: sel.value.indexOf('Tournament') > 0 ? 'nat.wc' : null
      });
      apply(t('admin.awardAdded', { name: t('award.' + sel.value) }));
    },
    clearTrophies: function (game) {
      game.career.trophies = [];
      game.career.awards = [];
      apply(t('admin.done'));
    },
    skipSeason: function (game) { skip(game, 1); },
    skip5: function (game) { skip(game, 5); },
    toPro: function (game) {
      if (game.career.phase === 'pro') { FKC.ui.router.toast(t('admin.alreadyPro'), 'bad'); return; }
      game.career.phase = 'youth';
      game.identity.year = game.identity.birthYear + 18;
      FKC.state.syncAge(game);
      game.pending = null;
      game.flags.needAcademyChoice = false;
      game.flags.needProChoice = true;
      FKC.career.beginYear(game);
      apply(t('admin.done'));
    },
    retireNow: function (game) {
      FKC.career.retire(game, 'choice');
      FKC.save.write();
      FKC.ui.router.go('retire');
    },
    clearEvent: function (game) {
      game.pending = null;
      apply(t('admin.done'));
    }
  };

  /** Saisons überspringen, ohne Entscheidungen zu treffen */
  function skip(game, n) {
    for (var i = 0; i < n; i++) {
      if (game.career.phase === 'retired') break;
      var guard = 0;
      var target = game.identity.year + 1;
      while (game.identity.year < target && guard++ < 200) {
        var sc = FKC.career.nextScene();
        if (!sc || sc.kind === 'retire') break;
        if (sc.result) { FKC.career.ack(); continue; }
        if (sc.kind === 'scene') FKC.career.choose(sc.choices[0].id);
        else if (sc.kind === 'clubChoice') FKC.career.choose(sc.offers[0].key);
        else if (sc.kind === 'transferChoice') {
          var stay = null;
          sc.offers.forEach(function (o) { if (o.stay) stay = o; });
          FKC.career.choose(stay ? stay.key : sc.offers[0].key);
        } else if (sc.kind === 'contract') FKC.career.choose('accept');
        else if (sc.kind === 'training') FKC.career.choose(sc.options[0].id);
        else FKC.career.ack();
      }
    }
    apply(t('admin.skipped', { n: n }));
  }

  /* ── Bausteine ──────────────────────────────────────────────────── */

  function row(label, key, value, min, max, step) {
    return '<div class="admin-row"><span>' + c.esc(label) + '</span>' +
      '<input class="input admin-num" type="number" data-num="' + key + '" value="' + value +
      '" min="' + min + '" max="' + max + '" step="' + (step || 1) + '"></div>';
  }

  function btn(key, act) {
    return '<button class="btn btn-sm" data-act="' + act + '">' + t(key) + '</button>';
  }

  function compOptions() {
    var out = '<optgroup label="' + t('cabinet.club') + '">';
    FKC.data.leagues.filter(function (l) { return l.tier === 1; }).forEach(function (l) {
      out += '<option value="league.' + l.id + '">' + c.esc(l.name) + '</option>';
    });
    FKC.data.cups.forEach(function (cp) {
      out += '<option value="' + cp.id + '">' + c.esc(cp.name) + '</option>';
    });
    FKC.data.continental.forEach(function (cp) {
      out += '<option value="' + cp.id + '">' + c.esc(cp.name) + '</option>';
    });
    out += '</optgroup><optgroup label="' + t('cabinet.nation') + '">';
    FKC.data.nationalComps.forEach(function (cp) {
      out += '<option value="' + cp.id + '">' + c.esc(FKC.data.compName(cp.id)) + '</option>';
    });
    return out + '</optgroup>';
  }

  function fillClubs(root) {
    var lgSel = root.querySelector('[data-select="league"]');
    var clubSel = root.querySelector('[data-select="club"]');
    if (!lgSel || !clubSel) return;
    var clubs = FKC.data.clubsOf(lgSel.value);
    clubSel.innerHTML = clubs.map(function (cl) {
      return '<option value="' + cl.id + '">' + c.esc(cl.name) +
        ' (' + FKC.data.clubLevel(cl) + ')</option>';
    }).join('');
  }

  /** Alle Zahlenfelder einlesen */
  function readAll(root) {
    var game = g();
    if (!game) return;

    root.querySelectorAll('[data-attr]').forEach(function (inp) {
      var v = parseInt(inp.value, 10);
      if (!isNaN(v)) game.attributes[inp.getAttribute('data-attr')] = FKC.util.clamp(v, 1, 99);
    });

    root.querySelectorAll('[data-num]').forEach(function (inp) {
      var v = parseFloat(inp.value);
      if (isNaN(v)) return;
      switch (inp.getAttribute('data-num')) {
        case 'ovr':
          FKC.attributes.calibrate(game.attributes, game.identity.position,
            FKC.util.clamp(Math.round(v), 1, 99), FKC.data.keysFor(game.identity.isGK));
          break;
        case 'potential': game.hidden.potential = FKC.util.clamp(Math.round(v), 1, 99); break;
        case 'age':
          game.identity.year = game.identity.birthYear + FKC.util.clamp(Math.round(v), 6, 45);
          FKC.state.syncAge(game);
          break;
        case 'form': game.condition.form = FKC.util.clamp(v, 0, 100); break;
        case 'morale': game.condition.morale = FKC.util.clamp(v, 0, 100); break;
        case 'fitness': game.condition.fitness = FKC.util.clamp(v, 0, 100); break;
        case 'reputation': game.status.reputation = FKC.util.clamp(v, 0, 100); break;
        case 'fanRelation': game.status.fanRelation = FKC.util.clamp(v, 0, 100); break;
        case 'balance': game.career.finances.balance = Math.max(0, v); break;
        case 'salary': if (game.status.contract) game.status.contract.salary = Math.max(0, v); break;
        case 'yearsLeft':
          if (game.status.contract) game.status.contract.yearsLeft = FKC.util.clamp(Math.round(v), 0, 8);
          break;
        case 'caps': game.national.caps = Math.max(0, Math.round(v)); break;
      }
    });
  }

  function backTarget() {
    if (!FKC.state.exists()) return 'menu';
    var phase = FKC.state.game.career.phase;
    return phase === 'retired' ? 'retire' : phase === 'pro' ? 'hub' : 'story';
  }

  /* ── Zugang: unauffälliger Punkt und Umschalt+D ─────────────────── */

  function mountToggle() {
    if (document.getElementById('fkc-admin-dot')) return;
    var dot = document.createElement('button');
    dot.id = 'fkc-admin-dot';
    dot.type = 'button';
    dot.title = 'Admin';
    dot.setAttribute('aria-label', 'Admin');
    document.body.appendChild(dot);
    dot.addEventListener('click', function () {
      FKC.ui.router.go(FKC.ui.router.current() === 'admin' ? backTarget() : 'admin');
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.shiftKey && (e.key === 'D' || e.key === 'd') &&
        !/input|textarea|select/i.test((e.target.tagName || ''))) {
      FKC.ui.router.go(FKC.ui.router.current() === 'admin' ? backTarget() : 'admin');
    }
  });

  if (document.body) mountToggle();
  else document.addEventListener('DOMContentLoaded', mountToggle);

})(window.FKC);
