/* ── Charaktererstellung ───────────────────────────────────────────── */

(function (FKC) {
  'use strict';
  var c = FKC.ui.c, t = FKC.t;

  var draft = null;

  /* Startbedingungen: Auswahl → Zielwert, um den herum gewürfelt wird */
  var WEALTH = { poor: 24, mid: 52, rich: 82 };
  var SUPPORT = { low: 26, mid: 58, high: 86 };

  /* Beim ersten Trikot ist nichts vergeben — mit sechs sucht man sich
     die Nummer aus. Die Kaderbelegung greift erst beim Profivertrag. */
  var CREATE_NUMBERS = (function () {
    var a = [];
    for (var n = 1; n <= 30; n++) a.push(n);
    return a.concat([33, 37, 44, 45, 50, 70, 77, 99]);
  })();

  function currentStartClub() {
    var o = draft.clubOptions || [];
    return o[draft.clubPick] || o[0] || null;
  }

  function shirtPreview() {
    var club = currentStartClub();
    return '<div class="shirt-stage shirt-stage-sm">' + FKC.ui.art.shirtBack({
      design: FKC.kit.design(club),
      number: draft.shirtNo,
      name: draft.lastName || '—',
      size: 156
    }) + '</div>';
  }

  function clubOptionsHtml() {
    var opts = draft.clubOptions || [];
    if (!opts.length) return '<p class="u-muted">' + t('create.clubNone') + '</p>';

    /* Die Zugehörigkeit zum gewählten Startpunkt muss auf der Karte
       stehen. Ohne sie sehen in kleinen Ländern die NLZ-Auswahl und die
       Akademie-Auswahl gleich aus — beides Vereine derselben Liga — und
       die Auswahl wirkt beliebig, obwohl sie es nicht ist. */
    var kindChip = c.chip(t('create.start.' + draft.start),
      draft.start === 'academy' ? 'accent' : draft.start === 'nlz' ? 'info' : '');

    return opts.map(function (club, i) {
      var lg = club.synthetic ? null : FKC.data.leagueOf(club);
      var tags = [];
      if (club.facilities >= 82) tags.push(['tag.topFacilities', 'accent']);
      if (club.youthTrust >= 82) tags.push(['tag.youthPath', 'good']);
      else if (club.youthTrust <= 60) tags.push(['tag.hardPath', 'warn']);
      if (!club.synthetic && club.prestige >= 80) tags.push(['tag.bigName', 'gold']);

      var lvl = club.synthetic ? club.strength : FKC.data.clubLevel(club);

      return '<button class="choice" data-club="' + i + '" aria-pressed="' +
        (draft.clubPick === i) + '">' +
        '<div class="row" style="gap:12px;align-items:center">' +
        c.crest(club, true) +
        '<div style="min-width:0;flex:1">' +
        '<div class="choice-title">' + c.esc(club.name) + '</div>' +
        '<div class="choice-desc">' +
        (lg ? c.esc(lg.name) : t('create.clubVillage', { town: c.esc(club.town || '') })) +
        '</div></div></div>' +
        '<div style="margin-top:12px" class="stack-sm">' +
        /* Niveau zuerst: daran sieht man den Unterschied zwischen einem
           NLZ und einer Topakademie auf einen Blick. */
        c.meter(t('meter.level'), lvl, 'cool', String(lvl)) +
        c.meter(t('meter.facilities'), club.facilities, 'grass') +
        c.meter(t('meter.youthTrust'), club.youthTrust, 'warm') +
        '</div>' +
        '<div class="choice-foot">' + kindChip +
        tags.map(function (x) { return c.chip(t(x[0]), x[1]); }).join('') + '</div>' +
        '</button>';
    }).join('');
  }

  function nationFlag(id) {
    return FKC.ui.art.flag(id, 42) +
      '<span class="nation-pick-name">' + c.esc(FKC.data.nationName(id)) + '</span>';
  }

  /* Neue Position setzen, ohne den ganzen Screen neu zu zeichnen —
     sonst springt die Seite bei jedem Klick nach oben. */
  function selectPosition(root, id) {
    if (!id || draft.position === id) return;
    draft.position = id;
    root.querySelectorAll('.pitch-spot').forEach(function (g) {
      var on = g.getAttribute('data-pos') === id;
      g.classList.toggle('is-on', on);
      g.setAttribute('aria-pressed', on);
    });
    var out = root.querySelector('#pos-readout');
    if (out) out.outerHTML = positionReadout(id);
  }

  /* Anzeige unter dem Feld: Kürzel, ausgeschriebener Name, Beschreibung */
  function positionReadout(id) {
    return '<div class="pitch-readout" id="pos-readout">' +
      '<div class="pitch-readout-badge">' + t('pos.short.' + id) + '</div>' +
      '<div style="min-width:0">' +
      '<div class="pitch-readout-name">' + t('pos.' + id) + '</div>' +
      '<p class="pitch-readout-desc">' + t('pos.desc.' + id) + '</p>' +
      '</div></div>';
  }

  function initDraft() {
    /* Kein Reseed des globalen RNG beim Rendern — das ist ein Seiteneffekt,
       der einen geladenen Spielstand stören könnte. Gewürfelt wird erst
       beim tatsächlichen Anlegen der Karriere.                        */
    var nation = 'SUI';
    var n = FKC.data.randomName(nation);
    draft = {
      firstName: n.first, lastName: n.last,
      nationality: nation,
      position: 'CM',
      foot: 'right',
      wealth: 'mid',
      support: 'mid',
      start: 'village',
      shirtNo: 10,
      /* Eigener Zufallsstrang für die Vorschau der Startvereine. Der
         globale RNG bleibt unangetastet, solange nichts angelegt ist —
         sonst würfelt allein das Öffnen des Bildschirms eine laufende
         Karriere um.                                                  */
      previewSeed: FKC.rng.newSeed(),
      clubOptions: null,
      clubPick: 0
    };
    refreshClubOptions();
  }

  /* Drei Startadressen zur gewählten Nation und Startart. Wird neu
     gezogen, wenn sich eines von beiden ändert. */
  function refreshClubOptions() {
    var rng = FKC.rng.fork(draft.previewSeed);
    draft.clubOptions = FKC.data.youth.startClubOptions(
      draft.nationality, draft.start, rng);
    draft.clubPick = 0;
  }

  FKC.ui.router.register('create', {
    topbar: false,

    render: function () {
      if (!draft) initDraft();

      var html = '<h1>' + t('create.title') + '</h1>' +
        '<p class="u-dim" style="margin-top:6px">' + t('create.intro') + '</p>';

      /* Name */
      html += c.sectionTitle(t('create.name'));
      html += '<div class="input-row">' +
        '<input class="input" id="f-first" value="' + c.esc(draft.firstName) +
        '" placeholder="' + t('create.firstName') + '" autocomplete="off">' +
        '<input class="input" id="f-last" value="' + c.esc(draft.lastName) +
        '" placeholder="' + t('create.lastName') + '" autocomplete="off">' +
        '<button class="btn btn-sm" data-act="dice" title="' + t('create.dice') + '">🎲</button>' +
        '</div>';

      /* Nation */
      html += c.sectionTitle(t('create.nation'));
      var leagueNations = FKC.data.leagueNations();
      var others = FKC.data.nations.filter(function (x) { return !x.hasLeague; });
      html += '<select class="input" id="f-nation">';
      html += '<optgroup label="' + t('create.nationLeagues') + '">';
      leagueNations.forEach(function (nn) {
        html += '<option value="' + nn.id + '"' + (nn.id === draft.nationality ? ' selected' : '') +
          '>' + c.esc(FKC.data.nationName(nn.id)) + '</option>';
      });
      html += '</optgroup><optgroup label="' + t('create.nationOther') + '">';
      others.sort(function (a, b) {
        return FKC.data.nationName(a.id).localeCompare(FKC.data.nationName(b.id));
      }).forEach(function (nn) {
        html += '<option value="' + nn.id + '"' + (nn.id === draft.nationality ? ' selected' : '') +
          '>' + c.esc(FKC.data.nationName(nn.id)) + '</option>';
      });
      html += '</optgroup></select>';
      /* Flagge zur Auswahl — das Land soll man sehen, nicht nur lesen */
      html += '<div class="nation-pick" id="f-nation-flag">' + nationFlag(draft.nationality) + '</div>';
      html += '<p class="u-muted" style="font-size:.78rem;margin-top:6px">' + t('create.nationHint') + '</p>';

      /* Position — direkt auf dem Spielfeld gewählt */
      html += c.sectionTitle(t('create.position'));
      html += '<p class="u-muted" style="font-size:.78rem;margin:0 0 4px">' +
        t('create.positionHint') + '</p>';
      html += '<div class="pitch-wrap" id="pos-pitch">' +
        FKC.ui.art.pitch(draft.position, {
          label: function (id) { return t('pos.short.' + id); }
        }) + '</div>';
      html += positionReadout(draft.position);

      /* Fuss */
      html += c.sectionTitle(t('create.foot'));
      html += '<div class="pill-group">' +
        ['right', 'left', 'both'].map(function (f) {
          return '<button class="pill" data-foot="' + f + '" aria-pressed="' +
            (draft.foot === f) + '">' + t('foot.' + f) + '</button>';
        }).join('') + '</div>';

      /* Rückennummer — das erste eigene Trikot */
      html += c.sectionTitle(t('create.shirtNo'));
      html += '<p class="u-muted" style="font-size:.78rem;margin:0 0 4px">' +
        t('create.shirtNoHint') + '</p>';
      html += '<div id="create-shirt">' + shirtPreview() + '</div>';
      html += '<div class="numgrid" id="create-numgrid">' +
        CREATE_NUMBERS.map(function (n) {
          return '<button class="numtile' + (draft.shirtNo === n ? ' is-keep' : '') +
            '" data-num="' + n + '">' + n + '</button>';
        }).join('') + '</div>';

      /* Herkunft: Wohlstand und Rückhalt */
      html += c.sectionTitle(t('create.background'));
      html += '<div class="field" style="margin-bottom:14px">' +
        '<label>' + t('meter.wealth') + '</label>' +
        '<div class="pill-group">' +
        ['poor', 'mid', 'rich'].map(function (w) {
          return '<button class="pill" data-wealth="' + w + '" aria-pressed="' +
            (draft.wealth === w) + '">' + t('create.wealth.' + w) + '</button>';
        }).join('') + '</div>' +
        '<p class="u-muted" style="font-size:.76rem;margin:6px 0 0">' +
        t('create.wealthHint') + '</p></div>';

      html += '<div class="field">' +
        '<label>' + t('meter.support') + '</label>' +
        '<div class="pill-group">' +
        ['low', 'mid', 'high'].map(function (s) {
          return '<button class="pill" data-support="' + s + '" aria-pressed="' +
            (draft.support === s) + '">' + t('create.support.' + s) + '</button>';
        }).join('') + '</div>' +
        '<p class="u-muted" style="font-size:.76rem;margin:6px 0 0">' +
        t('create.supportHint') + '</p></div>';

      /* Wo die Karriere beginnt */
      html += c.sectionTitle(t('create.startSection'));
      html += '<div class="stack-sm">';
      ['village', 'nlz', 'academy'].forEach(function (k) {
        html += '<button class="choice" data-start="' + k + '" aria-pressed="' +
          (draft.start === k) + '">' +
          '<div class="choice-title">' + t('create.start.' + k) + '</div>' +
          '<div class="choice-desc">' + t('create.start.' + k + '_d') + '</div>' +
          '<div class="choice-foot">' +
          c.chip(t('create.start.' + k + '.dev'), k === 'academy' ? 'accent'
                 : k === 'nlz' ? 'info' : '') +
          c.chip(t('create.start.' + k + '.comp'), k === 'academy' ? 'warn'
                 : k === 'nlz' ? '' : 'good') +
          '</div></button>';
      });
      html += '</div>';
      html += '<p class="u-muted" style="font-size:.76rem;margin:8px 0 0">' +
        t('create.startHint') + '</p>';

      /* Drei konkrete Adressen zur Auswahl statt einer Zuweisung */
      html += c.sectionTitle(t('create.clubSection'));
      html += '<div class="stack-sm" id="create-clubs">' + clubOptionsHtml() + '</div>';

      html += '<div class="actionbar">' +
        '<button class="btn btn-ghost" data-act="back">' + t('ui.back') + '</button>' +
        '<button class="btn btn-primary" data-act="start">' + t('create.start') + '</button></div>';

      return html;
    },

    bind: function (root) {
      root.addEventListener('input', function (e) {
        if (e.target.id === 'f-first') draft.firstName = e.target.value;
        if (e.target.id === 'f-last') draft.lastName = e.target.value;
      });

      root.addEventListener('change', function (e) {
        if (e.target.id === 'f-nation') {
          draft.nationality = e.target.value;
          var n = FKC.data.randomName(draft.nationality);
          draft.firstName = n.first; draft.lastName = n.last;
          /* Neues Land, neue Vereine zur Auswahl */
          refreshClubOptions();
          FKC.ui.router.reload();
        }
      });

      /* Positionswahl auf dem Feld — auch per Tastatur bedienbar */
      root.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var spot = e.target.closest && e.target.closest('[data-pos]');
        if (!spot) return;
        e.preventDefault();
        selectPosition(root, spot.getAttribute('data-pos'));
      });

      root.addEventListener('click', function (e) {
        /* `closest` fehlt auf SVG-Knoten in älteren Engines — deshalb der
           Aufstieg von Hand, bis die Gruppe mit `data-pos` erreicht ist. */
        var node = e.target, pos = null;
        while (node && node !== root) {
          if (node.getAttribute && node.getAttribute('data-pos')) { pos = node; break; }
          node = node.parentNode;
        }
        if (pos) { selectPosition(root, pos.getAttribute('data-pos')); return; }

        var foot = e.target.closest('[data-foot]');
        if (foot) {
          draft.foot = foot.getAttribute('data-foot');
          root.querySelectorAll('[data-foot]').forEach(function (b) {
            b.setAttribute('aria-pressed', b.getAttribute('data-foot') === draft.foot);
          });
          return;
        }

        var wealth = e.target.closest('[data-wealth]');
        if (wealth) {
          draft.wealth = wealth.getAttribute('data-wealth');
          root.querySelectorAll('[data-wealth]').forEach(function (b) {
            b.setAttribute('aria-pressed', b.getAttribute('data-wealth') === draft.wealth);
          });
          return;
        }

        var start = e.target.closest('[data-start]');
        if (start) {
          draft.start = start.getAttribute('data-start');
          root.querySelectorAll('[data-start]').forEach(function (b) {
            b.setAttribute('aria-pressed', b.getAttribute('data-start') === draft.start);
          });
          /* Andere Startart, andere Adressen — aber nur diesen Block neu
             zeichnen, sonst springt die Seite nach oben. */
          refreshClubOptions();
          root.querySelector('#create-clubs').innerHTML = clubOptionsHtml();
          root.querySelector('#create-shirt').innerHTML = shirtPreview();
          return;
        }

        var club = e.target.closest('[data-club]');
        if (club) {
          draft.clubPick = parseInt(club.getAttribute('data-club'), 10) || 0;
          root.querySelectorAll('[data-club]').forEach(function (b) {
            b.setAttribute('aria-pressed',
              parseInt(b.getAttribute('data-club'), 10) === draft.clubPick);
          });
          root.querySelector('#create-shirt').innerHTML = shirtPreview();
          return;
        }

        var num = e.target.closest('[data-num]');
        if (num) {
          draft.shirtNo = parseInt(num.getAttribute('data-num'), 10);
          root.querySelectorAll('[data-num]').forEach(function (b) {
            b.classList.toggle('is-keep',
              parseInt(b.getAttribute('data-num'), 10) === draft.shirtNo);
          });
          root.querySelector('#create-shirt').innerHTML = shirtPreview();
          return;
        }

        var support = e.target.closest('[data-support]');
        if (support) {
          draft.support = support.getAttribute('data-support');
          root.querySelectorAll('[data-support]').forEach(function (b) {
            b.setAttribute('aria-pressed', b.getAttribute('data-support') === draft.support);
          });
          return;
        }

        var b = e.target.closest('[data-act]');
        if (!b) return;
        var act = b.getAttribute('data-act');

        if (act === 'dice') {
          var n = FKC.data.randomName(draft.nationality);
          draft.firstName = n.first; draft.lastName = n.last;
          root.querySelector('#f-first').value = n.first;
          root.querySelector('#f-last').value = n.last;

        } else if (act === 'back') {
          FKC.ui.router.go('menu');

        } else if (act === 'start') {
          // Doppelklick / Doppel-Auslösung darf den Namen nie neu würfeln
          if (!draft || draft._submitted) return;
          draft.firstName = (root.querySelector('#f-first').value || '').trim();
          draft.lastName = (root.querySelector('#f-last').value || '').trim();
          if (!draft.firstName || !draft.lastName) {
            FKC.ui.router.toast(t('create.needName'), 'bad');
            return;
          }
          draft._submitted = true;
          FKC.rng.seed(FKC.rng.newSeed());
          var game = FKC.state.create({
            firstName: draft.firstName, lastName: draft.lastName,
            nationality: draft.nationality, position: draft.position,
            foot: draft.foot,
            wealth: draft.wealth, support: draft.support
          });
          FKC.career.start(game, {
            wealth: WEALTH[draft.wealth], support: SUPPORT[draft.support],
            start: draft.start,
            club: currentStartClub(),
            shirtNo: draft.shirtNo
          });
          FKC.save.write();
          draft = null;
          FKC.ui.router.go('story');
        }
      });
    }
  });

})(window.FKC);
