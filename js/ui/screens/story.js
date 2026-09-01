/* ── Erzählbildschirm ──────────────────────────────────────────────────
   Zeigt die jeweils aktuelle Szene: Einstieg, Entscheidung, Ereignis,
   Jahresabschluss, Saisonvorbereitung, Saisonbilanz, Transferfenster. */

(function (FKC) {
  'use strict';
  var c = FKC.ui.c, t = FKC.t;

  /* Was beim nächsten bind() gefeiert wird, und für welche Saison das
     schon passiert ist — sonst spielt die Animation bei jedem
     Neuzeichnen desselben Rückblicks wieder ab. */
  var pendingCelebration = null;
  var celebratedSeason = null;

  FKC.ui.router.register('story', {

    render: function () {
      var game = FKC.state.game;
      if (!game) return '';
      var scene = FKC.career.nextScene();
      if (!scene) return '<p>' + t('story.none') + '</p>';

      if (scene.kind === 'retire') {
        setTimeout(function () { FKC.ui.router.go('retire'); }, 0);
        return '';
      }

      switch (scene.kind) {
        case 'intro':          return renderIntro(game, scene);
        case 'scene':          return renderScene(game, scene);
        case 'summary':        return renderSummary(game, scene);
        case 'clubChoice':     return renderClubChoice(game, scene);
        case 'training':       return renderTraining(game, scene);
        case 'seasonReview':   return renderSeasonReview(game, scene);
        case 'transferChoice': return renderTransfer(game, scene);
        case 'contract':       return renderContract(game, scene);
        case 'shirtNumber':    return renderShirtNumber(game, scene);
        case 'mentorChoice':   return renderMentor(game, scene);
        default:               return '';
      }
    },

    bind: function (root) {
      /* Die Feier wird beim Rendern vorgemerkt und erst hier ausgelöst,
         damit sie über einem fertig gezeichneten Bildschirm liegt. */
      if (pendingCelebration) {
        var feier = pendingCelebration;
        pendingCelebration = null;
        setTimeout(function () { FKC.guard('Titelfeier', function () {
          FKC.ui.celebrate(feier);
        }); }, 60);
      }

      root.addEventListener('click', function (e) {
        /* Saisonplan umschalten, ohne den Bildschirm aufzulösen */
        var plan = e.target.closest('[data-plan]');
        if (plan) {
          var pk = FKC.career.setSeasonPlan(FKC.state.game, plan.getAttribute('data-plan'));
          if (pk) {
            root.querySelectorAll('[data-plan]').forEach(function (b) {
              b.setAttribute('aria-pressed', b.getAttribute('data-plan') === pk);
            });
            var hint = root.querySelector('#plan-hint');
            if (hint) hint.textContent = t('plan.' + pk + '_d');
          }
          return;
        }

        var ch = e.target.closest('[data-choice]');
        if (ch) {
          FKC.career.choose(ch.getAttribute('data-choice'));
          FKC.ui.router.reload();
          return;
        }
        var next = e.target.closest('[data-next]');
        if (next) {
          FKC.career.ack();
          FKC.ui.router.reload();
          return;
        }
        var hub = e.target.closest('[data-hub]');
        if (hub) FKC.ui.router.go('hub');
      });
    }
  });

  /* ── Einstieg: Herkunft ─────────────────────────────────────────── */
  function renderIntro(game, scene) {
    var o = scene.origin;
    var startClub = o.startClubId ? FKC.data.clubById(o.startClubId) : null;
    var kind = o.startKind || 'village';

    var html = head(scene.age, t('intro.kicker'));
    html += '<h1>' + t('intro.title') + '</h1>';
    /* Der Einstiegstext richtet sich nach dem gewählten Startpunkt —
       wer im NLZ anfängt, soll nicht über den Dorfplatz lesen. */
    html += '<div class="story-text" style="margin-top:12px">' +
      t(startClub ? 'intro.text.' + kind : 'intro.text',
        { name: c.esc(FKC.state.fullName()), town: c.esc(o.town),
          club: c.esc(startClub ? startClub.name : o.villageClubName) }) +
      '</div>';

    html += '<div class="card" style="margin-top:20px">' +
      '<div class="card-head"><h3>' + t('intro.family') + '</h3></div>' +
      '<div class="stack-sm">' +
      c.meter(t('meter.wealth'), o.familyWealth, 'warm', tier(o.familyWealth, 'wealth')) +
      c.meter(t('meter.support'), o.familySupport, 'grass', tier(o.familySupport, 'support')) +
      '</div></div>';

    html += '<div class="card" style="margin-top:12px">' +
      '<div class="row-between"><span class="u-up">' + t('intro.firstClub') + '</span>' +
      c.chip(t('create.start.' + kind), kind === 'academy' ? 'accent'
             : kind === 'nlz' ? 'info' : '') + '</div>' +
      '<div style="margin-top:10px">' + (startClub
        ? c.clubLine(startClub, (FKC.data.leagueOf(startClub) || {}).name || '')
        : c.clubLine(
            { name: o.villageClubName, short: FKC.util.initials(o.villageClubName), color: '#3f6f5a' },
            t('intro.firstClubSub', { town: o.town }))) + '</div>' +
      '<p class="u-muted" style="font-size:.8rem;margin:12px 0 0">' +
      t('intro.start.' + kind) + '</p></div>';

    /* Erstes Trikot — im Design des Startvereins */
    var kitClub = startClub ||
      { id: o.villageClubId, name: o.villageClubName, color: '#3f6f5a' };
    html += '<div class="shirt-stage">' +
      FKC.ui.art.shirtBack({
        design: FKC.kit.design(kitClub),
        number: game.identity.shirtNo, name: game.identity.lastName, size: 200
      }) +
      '<div class="shirt-caption"><strong>' + t('shirt.intro.title') + '</strong><br>' +
      t('shirt.intro.text') + '</div></div>';

    html += '<div class="actionbar"><button class="btn btn-primary" data-next>' +
      t('intro.begin') + '</button></div>';
    return html;
  }

  function tier(v, kind) {
    var k = v >= 78 ? 'high' : v >= 52 ? 'mid' : v >= 28 ? 'low' : 'none';
    return t('meter.' + kind + '.' + k);
  }

  /* ── Szene mit Entscheidung ─────────────────────────────────────── */
  function renderScene(game, scene) {
    var html = head(scene.age, t('cat.' + scene.category));
    html += '<h1>' + c.esc(scene.title) + '</h1>';
    html += '<div class="story-text" style="margin-top:12px">' + scene.text + '</div>';

    if (!scene.result) {
      html += '<div class="stack" style="margin-top:22px">' +
        scene.choices.map(c.choice).join('') + '</div>';
    } else {
      html += outcome(scene.result);
      html += '<div class="actionbar"><button class="btn btn-primary" data-next>' +
        t('ui.continue') + '</button></div>';
    }
    return html;
  }

  function outcome(res) {
    return '<div class="outcome" style="margin-top:22px" data-tone="' + res.tone + '">' +
      '<div class="story-text">' + res.text + '</div>' + c.chips(res.chips) + '</div>';
  }

  /* ── Schlagzeile für grosse Momente ─────────────────────────────────
     Titel, Auszeichnungen und Skandale bekommen eine eigene Karte im
     Zeitungslook statt nur einer Textzeile.                        */
  function bigMoment(game, r) {
    var name = FKC.state.fullName();
    var club = FKC.data.clubById(r.clubId);
    var clubName = club ? club.name : '';

    var major = (r.titles || []).filter(function (x) {
      return x.counted && (x.compId.indexOf('cont.') === 0 || x.compId.indexOf('league.') === 0);
    })[0];
    var ballon = (r.awards || []).filter(function (a) { return a.id === 'ballon'; })[0];
    var card = null;

    if (ballon) {
      card = { kind: 'ballon', kicker: t('paper.worldFootball'), tone: 'good',
        title: t('paper.ballon.title', { name: name }),
        sub: t('paper.ballon.sub', { club: clubName, goals: r.goals }),
        badge: FKC.ui.trophy('ballon', 42) };
    } else if (major) {
      var cont = major.compId.indexOf('cont.') === 0;
      card = { kind: cont ? 'cont' : 'champion',
        kicker: cont ? t('paper.europe') : t('paper.league'), tone: 'good',
        title: t(cont ? 'paper.cont.title' : 'paper.champion.title',
                 { club: clubName, comp: major.name }),
        sub: t('paper.champion.sub', { name: name, apps: r.apps, goals: r.goals }),
        badge: FKC.ui.trophy(major.compId, 42) };
    } else if (r.injury && r.injury.key === 'ban') {
      card = { kind: 'ban', kicker: t('paper.scandal'), tone: 'bad',
        title: t('paper.ban.title', { name: name }),
        sub: t('paper.ban.sub', { n: r.injury.weeks }) };
    } else if (r.move) {
      var to = FKC.data.leagueById(r.move.to);
      card = { kind: r.move.dir === 'up' ? 'promoted' : 'relegated',
        kicker: t('paper.league'), tone: r.move.dir === 'up' ? 'good' : 'bad',
        title: t(r.move.dir === 'up' ? 'paper.promoted.title' : 'paper.relegated.title',
                 { club: clubName, league: to ? to.name : '' }),
        sub: t('paper.champion.sub', { name: name, apps: r.apps, goals: r.goals }) };
    }
    if (!card) return null;

    card.date = r.season;
    return withTake(game, card, r.season, { name: name, club: clubName,
      apps: r.apps, goals: r.goals, rating: r.avgRating ? r.avgRating.toFixed(2) : '–' });
  }

  /* ── Meinung des Reporters ──────────────────────────────────────────
     Jede Nachricht bekommt eine wertende Stimme dazu — mal Lob, mal
     Kritik. Die Variante ist aus Art und Saison abgeleitet, damit sie
     beim Neuzeichnen dieselbe bleibt.                              */
  var TAKES = {
    champion: 7, cont: 7, ballon: 6, ban: 5,
    promoted: 5, relegated: 5, signed: 9
  };

  function withTake(game, card, seed, params) {
    var n = TAKES[card.kind] || 0;
    if (!n) return card;
    var pick = FKC.ui.art.pickTake(card.kind, seed, n);
    var key = 'take.' + card.kind + '.' + pick;
    card.comment = t(key, params);
    var tone = t(key + '.tone');
    card.takeTone = (tone === 'good' || tone === 'bad') ? tone : 'neutral';
    card.reporter = FKC.ui.art.reporterFor(card.kind + seed, game.identity.nationality);
    return card;
  }

  /* ── Jahresabschluss (Kindheit/Jugend) ──────────────────────────── */
  function renderSummary(game, scene) {
    var club = FKC.state.club();
    var diff = scene.ovrAfter - scene.ovrBefore;
    var html = head(scene.age, t('summary.kicker', { year: scene.year }));
    html += '<h1>' + t('summary.title') + '</h1>';

    if (scene.note) {
      html += '<div class="story-text" style="margin-top:10px">' + t(scene.note) + '</div>';
    }

    html += '<div class="card" style="margin-top:18px">';
    if (club) html += '<div style="margin-bottom:14px">' + c.clubLine(club, clubSub(game, club)) + '</div>';
    html += c.stats([
      { value: scene.age, label: t('stat.age') },
      { value: scene.ovrAfter, label: t('card.ovr') },
      { value: scene.height + ' cm', label: t('stat.height') }
    ]);
    if (diff !== 0) {
      html += '<p style="margin-top:12px;font-size:.85rem" class="' + (diff > 0 ? 'u-good' : 'u-bad') + '">' +
        t(diff > 0 ? 'summary.ovrUp' : 'summary.ovrDown', { n: Math.abs(diff) }) + '</p>';
    }
    html += '</div>';

    /* Leistung in den Spielen dieses Jahres */
    if (scene.line && scene.line.games) {
      var L = scene.line;
      html += c.sectionTitle(t('summary.onThePitch'));
      html += '<div class="card">' + c.stats([
        { value: L.apps + '/' + L.games, label: t('stat.apps') },
        game.identity.isGK
          ? { value: L.cleanSheets, label: t('stat.cleanSheets') }
          : { value: L.goals, label: t('stat.goals') },
        { value: L.assists, label: t('stat.assists') }
      ]) + '<div style="margin-top:12px">' + c.kv([
        [t('stat.avgRating'), L.avgRating ? L.avgRating.toFixed(2) : '–'],
        [t('summary.teamPos'), t('season.positionValue', { n: L.teamPos }) +
          ' / ' + L.teams],
        [t('summary.standing'), t('summary.standing.' + standingTier(L.standing))]
      ]) + '</div></div>';
    }

    /* Potenzial-Einschätzung */
    var pr = FKC.attributes.potentialRange(game);
    html += c.sectionTitle(t('summary.outlook'));
    html += '<div class="card"><div class="row-between" style="margin-bottom:10px">' +
      '<span class="u-dim">' + t('card.potential') + '</span>' +
      '<span><b style="font-size:1.15rem;color:var(--accent-2)">' + pr.low + '–' + pr.high +
      '</b></span></div>' +
      c.meter(t('summary.progressToPeak'),
        FKC.util.clamp((game.ovr - 50) / Math.max(1, pr.high - 50) * 100, 0, 100),
        'cool', game.ovr + ' / ' + pr.high) +
      (FKC.state.age() >= 14
        ? '<div class="row-between" style="margin-top:12px">' +
          '<span class="u-dim">' + t('summary.curve') + '</span>' +
          c.chip(t('archetype.' + (game.hidden.archetype || 'standard')),
                 game.hidden.archetype === 'prodigy' ? 'gold' : 'info') + '</div>'
        : '') +
      '<p class="u-muted" style="font-size:.78rem;margin:12px 0 0">' +
      t('summary.outlookHint') + '</p></div>';

    html += c.sectionTitle(t('summary.development'));
    html += '<div class="card">' + c.attrGrid(game, scene.deltas) + '</div>';

    html += '<div class="actionbar">' +
      '<button class="btn btn-ghost" data-hub>' + t('ui.overview') + '</button>' +
      '<button class="btn btn-primary" data-next>' + t('summary.nextYear') + '</button></div>';
    return html;
  }

  function standingTier(v) {
    return v >= 13 ? 'star' : v >= 5 ? 'strong' : v >= -6 ? 'solid'
         : v >= -14 ? 'weak' : 'struggling';
  }

  function clubSub(game, club) {
    if (club.synthetic) return t('club.type.' + (club.type || 'village'));
    var lg = FKC.data.leagueOf(club);
    return (lg ? lg.name : '') + (game.career.phase === 'youth' ? ' · ' +
      t('youth.team', { stage: t('youth.stage.' + FKC.data.youth.stageFor(game.identity.age).key) }) : '');
  }

  /* ── Saisonvorbereitung ─────────────────────────────────────────── */
  function renderTraining(game, scene) {
    var html = head(scene.age, t('training.kicker', { season: scene.season }));
    html += '<h1>' + t('training.title') + '</h1>';
    html += '<div class="story-text" style="margin-top:12px">' + t('training.text') + '</div>';

    if (scene.result) {
      html += outcome(scene.result);
      html += '<div class="actionbar"><button class="btn btn-primary" data-next>' +
        t('training.play') + '</button></div>';
      return html;
    }

    /* Saisonplan: steht auf demselben Bildschirm, nicht auf einem
       eigenen. Erst die Grundhaltung, dann der Schwerpunkt — beides
       zusammen ist eine Entscheidung, nicht zwei. */
    html += c.sectionTitle(t('plan.section'));
    html += '<div class="pill-group" id="plan-pills">' +
      ['normal', 'allin'].map(function (k) {
        return '<button class="pill" data-plan="' + k + '" aria-pressed="' +
          (scene.plan === k) + '">' + t('plan.' + k) + '</button>';
      }).join('') + '</div>';
    html += '<p class="u-muted" style="font-size:.78rem;margin:8px 0 0" id="plan-hint">' +
      t('plan.' + (scene.plan || 'normal') + '_d') + '</p>';

    html += c.sectionTitle(t('training.section'));
    html += '<div class="stack" style="margin-top:6px">';
    scene.options.forEach(function (o) {
      var chips = [];
      if (o.focus) chips.push(c.chip(t('attr.' + o.focus), 'accent'));
      if (o.second) chips.push(c.chip(t('attr.' + o.second), 'info'));
      chips.push(c.chip(t('training.intensity.' + o.intensity),
        o.intensity === 'hard' ? 'warn' : o.intensity === 'light' ? 'good' : ''));
      html += '<button class="choice" data-choice="' + o.id + '">' +
        '<div class="choice-title">' + t('training.' + o.id) + '</div>' +
        '<div class="choice-desc">' + t('training.' + o.id + '_d') + '</div>' +
        '<div class="choice-foot">' + chips.join('') + '</div></button>';
    });
    html += '</div>';
    return html;
  }

  /* ── Saisonbilanz ───────────────────────────────────────────────── */
  function renderSeasonReview(game, scene) {
    var r = scene.record;
    var club = FKC.data.clubById(r.clubId);
    var lg = FKC.data.leagueById(r.leagueId);
    var diff = r.ovrEnd - r.ovrStart;

    var html = head(scene.age, t('season.kicker', { season: r.season }));
    html += '<h1>' + t('season.title') + '</h1>';

    /* Schlagzeile, falls die Saison etwas Grosses hergibt */
    var moment = bigMoment(game, r);
    if (moment) html += '<div style="margin-top:16px">' + FKC.ui.art.headline(moment) + '</div>';

    /* Saison auf einen Blick */
    html += '<div style="margin-top:16px">' + FKC.ui.art.seasonPoster(game, r) + '</div>';

    /* Verein und Platzierung */
    html += '<div class="card" style="margin-top:16px">' +
      '<div style="margin-bottom:14px">' + c.clubLine(club, lg ? lg.name : '') + '</div>' +
      c.kv([
        [t('season.position'), t('season.positionValue', { n: r.leaguePos }) +
          ' · ' + t('season.points', { n: r.leaguePoints })],
        [t('season.cup'), t('season.stage.' + r.cup)],
        r.cont ? [FKC.data.compName(r.cont.id), t('season.stage.' + r.cont.result)] : null
      ].filter(Boolean)) + '</div>';

    /* Die Tabelle steht **hier**, direkt unter der eigenen Platzierung.
       Vorher musste man dafür den Rückblick verlassen und den
       Tabellen-Bildschirm öffnen — die Platzierung stand an einem Ort,
       die Tabelle, aus der sie stammt, an einem anderen. */
    var tb = game.tables;
    if (tb && tb.leagueId === r.leagueId && FKC.ui.leagueTable) {
      var reihen = FKC.ui.leagueRows(tb, tb.leagueId);
      if (reihen && reihen.length) {
        html += '<div style="margin-top:12px">' +
          FKC.ui.leagueTable(reihen, lg, tb.clubId) + '</div>';
      }
    }

    /* Auf- oder Abstieg des eigenen Vereins */
    if (r.move) {
      var toLg = FKC.data.leagueById(r.move.to);
      html += '<div class="outcome" data-tone="' + (r.move.dir === 'up' ? 'good' : 'bad') +
        '" style="margin-top:12px"><div class="story-text">' +
        t(r.move.dir === 'up' ? 'season.promoted' : 'season.relegated', {
          club: c.esc(club ? club.name : ''), league: c.esc(toLg ? toLg.name : '')
        }) + '</div></div>';
    }

    /* Persönliche Bilanz */
    html += c.sectionTitle(t('season.personal'));
    html += '<div class="card">' + c.stats([
      { value: r.apps, label: t('stat.apps') },
      game.identity.isGK
        ? { value: r.cleanSheets, label: t('stat.cleanSheets') }
        : { value: r.goals, label: t('stat.goals') },
      { value: r.assists, label: t('stat.assists') }
    ]) + '<div style="margin-top:12px">' + c.kv([
      [t('stat.minutes'), FKC.i18n.num(r.minutes) + '′'],
      [t('stat.avgRating'), r.avgRating ? r.avgRating.toFixed(2) : '–'],
      [t('stat.motm'), String(r.motm)],
      [t('stat.cards'), r.yellows + ' / ' + r.reds]
    ]) + '</div></div>';

    /* Verletzung */
    if (r.injury) {
      html += '<div class="outcome" data-tone="bad" style="margin-top:12px">' +
        '<div class="story-text">' + t('season.injury.' + (r.injury.key === 'ban' ? 'ban' : 'hurt'),
          { n: r.injury.weeks }) + '</div></div>';
    }

    /* Titel und Auszeichnungen — auch die, die ohne eigenen Einsatz
       nicht in den Schrank wandern, damit nichts stillschweigend fehlt. */
    var titles = r.titles || r.trophies.map(function (tr) {
      return { name: tr.name, counted: true };
    });
    /* Gewonnene Titel bekommen eine Inszenierung, keine Textzeile.
       Auszeichnungen ohne Titel ebenso — ein Goldener Schuh ist auch
       ein Moment. */
    var feierbar = titles.filter(function (tr) { return tr.counted; })
      .map(function (tr) {
        return { id: tr.compId, name: tr.name,
                 sub: t('celebrate.sub', { season: r.season,
                                           club: (FKC.data.clubById(r.clubId) || {}).name || '' }) };
      })
      .concat(r.awards.map(function (a) {
        return { id: a.id, name: t('award.' + a.id),
                 sub: t('celebrate.subAward', { season: r.season }) };
      }));

    /* WM- und EM-Titel stehen nicht in `record.titles` — sie werden in
       national.js direkt in den Schrank geschrieben. Ohne diesen Zweig
       liefe ausgerechnet der grösste Titel des Spiels ohne Feier durch. */
    var tour = scene.tournament;
    if (tour && tour.result === 'won') {
      feierbar.unshift({ id: tour.compId, name: FKC.data.compName(tour.compId),
        sub: t('celebrate.subNational', {
          nation: FKC.data.nationName(game.identity.nationality), season: r.season }) });
    }
    if (tour && tour.awards) {
      tour.awards.forEach(function (id) {
        feierbar.push({ id: id, name: t('award.' + id),
          sub: t('celebrate.subAward', { season: r.season }) });
      });
    }
    /* Der Merker enthält die Karriere, nicht nur die Saison: sonst
       verschluckt eine zweite Karriere ihre erste Feier, sobald sie
       dieselbe Saisonbezeichnung erreicht. */
    var feierKey = (game.meta && game.meta.createdAt) + '|' + r.season;
    if (feierbar.length && celebratedSeason !== feierKey) {
      celebratedSeason = feierKey;
      pendingCelebration = feierbar;
    }

    if (titles.length || r.awards.length) {
      html += c.sectionTitle(t('season.honours'));
      /* Titel und Auszeichnungen als Pokale bzw. Medaillen, nicht als Text */
      html += '<div class="card"><div class="trophy-row">' +
        titles.filter(function (tr) { return tr.counted; }).map(function (tr) {
          return '<div class="trophy-mini">' + FKC.ui.trophy(tr.compId, 46) +
            '<div class="trophy-name">' + c.esc(tr.name) + '</div></div>';
        }).join('') +
        r.awards.map(function (a) {
          return '<div class="trophy-mini">' + FKC.ui.trophy(a.id, 46) +
            '<div class="trophy-name">' + c.esc(t('award.' + a.id)) + '</div></div>';
        }).join('') + '</div>';
      var missed = titles.filter(function (tr) { return !tr.counted; });
      if (missed.length) {
        html += '<div class="pill-group" style="margin-top:12px">' +
          missed.map(function (tr) { return c.chip('◻ ' + tr.name, ''); }).join('') + '</div>';
      }
      if (titles.some(function (tr) { return !tr.counted; })) {
        html += '<p class="u-muted" style="font-size:.78rem;margin:12px 0 0">' +
          t('season.notCounted') + '</p>';
      }
      html += '</div>';
    }

    /* Nationalmannschaft */
    if (scene.national && (scene.national.caps > 0 || scene.national.changed) || scene.tournament) {
      html += c.sectionTitle(t('season.national'));
      html += '<div class="card">';
      html += '<div class="row" style="gap:10px;margin-bottom:12px">' +
        FKC.ui.art.flag(game.identity.nationality, 30) +
        '<b>' + c.esc(FKC.data.nationName(game.identity.nationality)) + '</b></div>';

      /* Die erste Berufung bekommt das Nationaltrikot zu sehen */
      if (scene.national && scene.national.debut) {
        html += '<div class="shirt-stage">' +
          FKC.ui.art.shirtBack({
            design: FKC.kit.nationalDesign(game.identity.nationality),
            number: game.identity.shirtNo, name: game.identity.lastName, size: 190
          }) +
          '<div class="shirt-caption"><strong>' + t('shirt.national.title') + '</strong><br>' +
          t('shirt.national.text') + '</div></div>';
      }

      if (scene.national) {
        html += c.kv([
          [t('national.status'), t('national.' + scene.national.status)],
          [t('national.thisYear'), t('national.capsGoals',
            { caps: scene.national.caps, goals: scene.national.goals })],
          [t('national.total'), t('national.capsGoals',
            { caps: game.national.caps, goals: game.national.goals })]
        ]);
      }
      if (scene.tournament) {
        var tour = scene.tournament;
        html += '<div style="margin-top:12px" class="outcome" data-tone="' +
          (tour.result === 'won' ? 'good' : tour.qualified ? 'mixed' : 'bad') + '">' +
          '<div class="story-text">' +
          (tour.qualified
            ? t('national.tournamentResult', {
                name: FKC.data.compName(tour.compId),
                stage: t('season.stage.' + tour.result),
                apps: tour.apps, goals: tour.goals })
            : t('national.noQual', { name: FKC.data.compName(tour.compId) })) +
          '</div></div>';
      }
      html += '</div>';
    }

    /* Entwicklung */
    html += c.sectionTitle(t('summary.development'));
    html += '<div class="card">';
    html += '<div class="row-between" style="margin-bottom:12px">' +
      '<span class="u-dim">' + t('card.ovr') + '</span>' +
      '<span><b style="font-size:1.15rem">' + r.ovrEnd + '</b>' +
      (diff !== 0 ? ' <span class="' + (diff > 0 ? 'u-good' : 'u-bad') + '" style="font-size:.82rem">(' +
        (diff > 0 ? '+' : '') + diff + ')</span>' : '') + '</span></div>';
    html += '<div class="row-between" style="margin-bottom:14px">' +
      '<span class="u-dim">' + t('hub.marketValue') + '</span>' +
      '<span><b>' + FKC.i18n.money(r.marketValue) + '</b></span></div>';
    html += c.attrGrid(game, scene.deltas) + '</div>';

    html += '<div class="actionbar">' +
      '<button class="btn btn-ghost" data-hub>' + t('ui.overview') + '</button>' +
      '<button class="btn btn-primary" data-next>' + t('ui.continue') + '</button></div>';
    return html;
  }

  /* ── Mentorwahl ─────────────────────────────────────────────────── */
  function renderMentor(game, scene) {
    var html = head(scene.age, t('mentor.kicker'));
    html += '<h1>' + t('mentor.title') + '</h1>';
    html += '<div class="story-text" style="margin-top:12px">' + t('mentor.text') + '</div>';

    if (scene.result) {
      html += outcome(scene.result);
      html += '<div class="actionbar"><button class="btn btn-primary" data-next>' +
        t('ui.continue') + '</button></div>';
      return html;
    }

    html += '<div class="stack" style="margin-top:20px">';
    scene.offers.forEach(function (o) {
      html += '<button class="choice" data-choice="' + c.esc(o.id) + '">' +
        '<div class="row" style="gap:12px;align-items:center">' +
        '<span class="mentor-mark" style="background:' + c.esc(o.accent) + '">' +
        c.esc(FKC.util.initials(o.name)) + '</span>' +
        '<div style="min-width:0;flex:1">' +
        '<div class="choice-title">' + c.esc(o.name) + '</div>' +
        '<div class="club-meta">' + t(o.role) + ' · ' + t('mentor.type.' + o.id) + '</div>' +
        '</div></div>' +
        '<div class="choice-desc" style="margin-top:10px">' + t('mentor.desc.' + o.id) + '</div>' +
        '<div class="choice-foot">' +
        o.attrs.map(function (a) { return c.chip('↑ ' + t('attr.' + a), 'accent'); }).join('') +
        (o.id === 'mental' ? c.chip(t('mentor.stability'), 'info') : '') +
        '</div></button>';
    });
    html += '</div>';
    return html;
  }

  /* ── Rückennummer wählen ────────────────────────────────────────────
     Die Nummer steht direkt auf dem Trikot, das daneben mitwächst —
     man sieht also, was man wählt, bevor man wählt.               */
  function renderShirtNumber(game, scene) {
    var clubName = scene.club ? scene.club.name : '';
    var key = scene.first ? 'first' : scene.renew ? 'renew' : 'move';

    var html = head(scene.age, t('shirt.kicker'));
    html += '<h1>' + t('shirt.title') + '</h1>';
    html += '<div class="story-text" style="margin-top:12px">' +
      t('shirt.text.' + key, { club: c.esc(clubName) }) + '</div>';

    var shown = scene.result ? game.identity.shirtNo : (scene.current || null);
    html += '<div class="shirt-stage">' + FKC.ui.art.shirtBack({
      design: FKC.kit.design(scene.club),
      number: shown, name: game.identity.lastName, size: 208
    }) + '</div>';

    if (scene.result) {
      html += outcome(scene.result);
      html += '<div class="actionbar"><button class="btn btn-primary" data-next>' +
        t('ui.continue') + '</button></div>';
      return html;
    }

    /* Legende, damit die Zustände der Kacheln lesbar sind */
    html += '<div class="numgrid-legend">' +
      c.chip(t('shirt.legend.typical'), 'accent') +
      c.chip(t('shirt.legend.taken')) + '</div>';

    html += '<div class="numgrid">';
    scene.options.forEach(function (o) {
      var cls = 'numtile';
      if (o.typical) cls += ' is-typical';
      if (o.keep) cls += ' is-keep';
      if (!o.free) cls += ' is-taken';
      html += '<button class="' + cls + '"' +
        (o.free ? ' data-choice="' + o.n + '"' : ' disabled') +
        ' title="' + c.esc(o.free ? t('shirt.free') : t('shirt.taken.' + (o.why || 'taken'))) + '">' +
        o.n + '</button>';
    });
    html += '</div>';
    return html;
  }

  /* ── Vertragsverhandlung ────────────────────────────────────────── */
  function renderContract(game, scene) {
    var html = head(scene.age, t('contract.kicker'));
    html += '<h1>' + t('contract.title.' + scene.offerKind) + '</h1>';
    html += '<div class="story-text" style="margin-top:12px">' +
      t('contract.text.' + scene.offerKind, {
        club: c.esc(scene.clubName), fee: FKC.i18n.money(scene.fee)
      }) + '</div>';

    /* Das Angebot: genau zwei Werte */
    html += '<div class="card" style="margin-top:18px">' +
      '<div class="row" style="gap:12px;align-items:center;margin-bottom:14px">' +
      c.crest({ name: scene.clubName, short: scene.short, color: scene.color }, true) +
      '<div><div class="pc-name" style="font-size:1.05rem">' + c.esc(scene.clubName) + '</div>' +
      '<div class="club-meta">' + c.esc(scene.leagueName || '') +
      (scene.roleKey ? ' · ' + t(scene.roleKey) : '') + '</div></div></div>';

    html += '<div class="terms">' +
      '<div class="term"><span>' + t('contract.years') + '</span><b>' +
      t('contract.yearsValue', { n: scene.terms.years }) + '</b></div>' +
      '<div class="term"><span>' + t('contract.salary') + '</span><b>' +
      FKC.i18n.money(scene.terms.salary) + '</b></div></div>';

    var rows = [];
    if (scene.current && scene.offerKind === 'renew') {
      rows.push([t('contract.currentSalary'), FKC.i18n.money(scene.current.salary)]);
    }
    if (scene.fee) rows.push([t('contract.fee'), FKC.i18n.money(scene.fee)]);
    if (scene.round) rows.push([t('contract.rounds'), String(scene.round)]);
    if (rows.length) html += '<div style="margin-top:14px">' + c.kv(rows) + '</div>';
    html += '</div>';

    if (scene.result) {
      /* Eine Unterschrift ist eine Schlagzeile wert */
      if (scene.result.tone === 'good' && scene.offerKind !== 'renew') {
        var season = FKC.i18n.season(game.identity.year);
        html += '<div style="margin-top:18px">' + FKC.ui.art.headline(withTake(game, {
          kind: 'signed',
          kicker: t('paper.transfer'), date: season, tone: 'good',
          title: t('paper.signed.title', { name: FKC.state.fullName(), club: scene.clubName }),
          sub: t('paper.signed.sub', { years: scene.terms.years,
                                       salary: FKC.i18n.money(scene.terms.salary) }),
          badge: c.crest({ name: scene.clubName, short: scene.short, color: scene.color }, true)
        }, season + scene.clubId, {
          name: FKC.state.fullName(), club: scene.clubName,
          salary: FKC.i18n.money(scene.terms.salary), years: scene.terms.years
        })) + '</div>';
      }
      html += outcome(scene.result);
      html += '<div class="actionbar"><button class="btn btn-primary" data-next>' +
        t('ui.continue') + '</button></div>';
      return html;
    }

    html += '<div class="stack" style="margin-top:20px">';
    [['accept', 'low'], ['money', 'medium'], ['years', 'medium'], ['decline', 'high']]
      .forEach(function (o) {
        html += c.choice({ id: o[0], label: t('contract.opt.' + o[0]),
                           desc: t('contract.opt.' + o[0] + '_d'), risk: o[1] });
      });
    html += '</div>';
    return html;
  }

  /* ── Transferfenster ────────────────────────────────────────────── */
  function renderTransfer(game, scene) {
    var html = head(scene.age, t('transfer.kicker'));
    html += '<h1>' + t(scene.free ? 'transfer.freeTitle' : 'transfer.title') + '</h1>';
    html += '<div class="story-text" style="margin-top:12px">' +
      t(scene.free ? 'transfer.freeText' : 'transfer.text') + '</div>';

    if (scene.result) {
      html += outcome(scene.result);
      html += '<div class="actionbar"><button class="btn btn-primary" data-next>' +
        t('ui.continue') + '</button></div>';
      return html;
    }

    /* Eigene Vertragslage — sie entscheidet, ob ein Wechsel überhaupt geht */
    if (scene.contract && scene.contract.yearsLeft > 0) {
      var rows = [
        [t('contract.remaining'), t('contract.yearsValue', { n: scene.contract.yearsLeft })],
        [t('contract.salary'), FKC.i18n.money(scene.contract.salary)],
        [t('contract.askingPrice'), FKC.i18n.money(scene.askingPrice)]
      ];
      rows.push([t('contract.clause'), scene.contract.releaseClause
        ? FKC.i18n.money(scene.contract.releaseClause) : t('contract.noClause')]);
      html += '<div class="card card-quiet" style="margin-top:16px">' + c.kv(rows) +
        '<p class="u-muted" style="font-size:.78rem;margin:10px 0 0">' +
        t(scene.wantsOut ? 'contract.requestFiled' : 'contract.underContractHint') + '</p>' +
        (scene.wantsOut ? '<div class="pill-group" style="margin-top:8px">' +
          c.chip(t('transfer.requestActive'), 'warn') + '</div>' : '') +
        '</div>';
    }

    html += '<div class="stack" style="margin-top:20px">';
    scene.offers.forEach(function (o) {
      html += '<button class="choice" data-choice="' + c.esc(o.key) + '">';
      html += '<div class="row" style="gap:12px;align-items:flex-start">' +
        c.crest({ name: o.name, short: o.short, color: o.color }, true) +
        '<div style="min-width:0;flex:1">' +
        '<div class="choice-title">' + c.esc(o.name) +
        (o.stay ? ' <span class="chip chip-accent">' + t('transfer.current') + '</span>' : '') +
        '</div>' +
        '<div class="choice-desc">' +
        (o.country ? FKC.ui.art.flag(o.country, 18) + ' ' : '') +
        c.esc(o.leagueName || '') + ' · ' +
        FKC.i18n.money(o.salary) + t('unit.perYear') + '</div>' +
        '</div></div>';

      html += '<div style="margin-top:12px" class="stack-sm">' +
        c.meter(t('transfer.axis.sport'), o.rating.sport, 'grass') +
        c.meter(t('transfer.axis.money'), o.rating.money, 'warm') +
        c.meter(t('transfer.axis.risk'), o.rating.risk, 'cool') +
        '</div>';

      /* Wie realistisch ist genau dieser Wechsel? Ohne die Zahl muss man
         blind versuchen und weiss erst hinterher, dass die Vereine sich
         nie einig geworden wären. */
      if (!o.stay && o.chance != null) {
        html += '<div class="transfer-chance" data-level="' +
          (o.chance >= 60 ? 'high' : o.chance >= 30 ? 'mid' : 'low') + '">' +
          '<span>' + t('transfer.chance') + '</span><b>' + o.chance + '%</b></div>';
      }

      var tags = [c.chip(t(o.roleKey), 'info')];
      (o.tagKeys || []).forEach(function (k) {
        var tone = k === 'tag.riskyMove' || k === 'tag.badFit' || k === 'tag.benchRisk' ? 'warn'
                 : k === 'tag.money' ? 'gold' : 'accent';
        tags.push(c.chip(t(k), tone));
      });
      if (o.abroad) tags.push(c.chip(t('tag.abroad'), 'warn'));
      if (o.renew) tags.push(c.chip(t('transfer.renew'), 'accent'));
      html += '<div class="choice-foot">' + tags.join('') + '</div>';
      html += '</button>';
    });

    /* Wechsel aktiv fordern — der dritte Hebel neben Klausel und
       auslaufendem Vertrag, mit entsprechendem Preis. */
    if (scene.canDemand) {
      html += c.choice({ id: 'demand', label: t('transfer.demand'),
                         desc: t('transfer.demand_d'), risk: 'high' });
    }

    /* Vertragslos: abwarten statt unterschreiben */
    if (scene.free) {
      html += c.choice({ id: 'wait', label: t('transfer.wait'),
                         desc: t('transfer.wait_d'), risk: 'high' });
    }
    /* Ab 32: die Karriere bewusst herunterfahren statt sie zu beenden */
    if (scene.canWindDown) {
      html += c.choice({ id: 'winddown', label: t('transfer.windDown'),
                         desc: t('transfer.windDown_d'), risk: 'low' });
    }
    /* Ab 35: die Karriere aktiv beenden */
    if (scene.canRetire) {
      html += c.choice({ id: 'retire', label: t('transfer.retire'),
                         desc: t('transfer.retire_d'), risk: 'low' });
    }

    html += '</div>';
    return html;
  }

  /* ── Vereinswahl (Akademie / erster Profivertrag) ───────────────── */
  function renderClubChoice(game, scene) {
    var isPro = scene.topic === 'pro';
    var html = head(scene.age, t(isPro ? 'clubChoice.pro.kicker' : 'clubChoice.academy.kicker'));
    html += '<h1>' + t(isPro ? 'clubChoice.pro.title' : 'clubChoice.academy.title') + '</h1>';
    html += '<div class="story-text" style="margin-top:12px">' +
      t(isPro ? 'clubChoice.pro.text' : 'clubChoice.academy.text', {
        term: t('youth.term.' + FKC.data.youth.termFor(game.identity.nationality))
      }) + '</div>';

    if (scene.result) {
      html += outcome(scene.result);
      html += '<div class="actionbar"><button class="btn btn-primary" data-next>' +
        t('ui.continue') + '</button></div>';
      return html;
    }

    html += '<div class="stack" style="margin-top:20px">';
    scene.offers.forEach(function (o) {
      html += '<button class="choice" data-choice="' + c.esc(o.key) + '">';
      html += '<div class="row" style="gap:12px;align-items:flex-start">' +
        c.crest({ name: o.name, short: o.short, color: o.color }, true) +
        '<div style="min-width:0;flex:1">' +
        '<div class="choice-title">' + c.esc(o.name) + '</div>' +
        '<div class="choice-desc">' +
        (o.country ? FKC.ui.art.flag(o.country, 18) + ' ' : '') +
        (o.leagueName ? c.esc(o.leagueName) : t('club.type.village')) +
        (o.salary ? ' · ' + FKC.i18n.money(o.salary) + t('unit.perYear') : '') + '</div>' +
        '</div></div>';

      html += '<div style="margin-top:12px" class="stack-sm">';
      if (o.rating) {
        html += c.meter(t('transfer.axis.sport'), o.rating.sport, 'grass') +
                c.meter(t('transfer.axis.money'), o.rating.money, 'warm') +
                c.meter(t('transfer.axis.risk'), o.rating.risk, 'cool');
      } else {
        html += c.meter(t('meter.level'), o.level, 'cool', String(o.level)) +
                (o.facilities ? c.meter(t('meter.facilities'), o.facilities, 'grass') : '') +
                (o.youthTrust ? c.meter(t('meter.youthTrust'), o.youthTrust, 'warm') : '');
      }
      html += '</div>';

      var tags = (o.tagKeys || []).map(function (k) {
        var tone = k === 'tag.benchRisk' || k === 'tag.hardPath' || k === 'tag.longShot' ||
                   k === 'tag.riskyMove' || k === 'tag.badFit' ? 'warn'
                 : k === 'tag.money' ? 'gold' : 'accent';
        return c.chip(t(k), tone);
      });
      if (o.roleKey) tags.unshift(c.chip(t(o.roleKey), 'info'));
      if (o.far) tags.push(c.chip(t('tag.faraway'), 'warn'));
      html += '<div class="choice-foot">' + tags.join('') + '</div>';
      html += '</button>';
    });
    html += '</div>';
    return html;
  }

  /* ── Kopf ───────────────────────────────────────────────────────── */
  function head(age, kicker) {
    return '<div class="story-head"><div class="story-age">' +
      t('story.age', { n: age }) + (kicker ? ' · ' + c.esc(kicker) : '') + '</div></div>';
  }

})(window.FKC);
