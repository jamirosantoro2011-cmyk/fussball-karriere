/* ── Die eine Frage ────────────────────────────────────────────────────
   Zwischen 16 und 18 kommt einmal jemand vorbei, der nicht die Beine
   prüft, sondern den Kopf. Wer richtig antwortet, macht einen
   Potenzialsprung, wie ihn die normale Entwicklung nie hergibt.

   Ob die Szene überhaupt kommt, entscheidet ein einziger 50-%-Wurf mit
   sechzehn (`flags.potQuiz`, gesetzt in C.beginYear). Danach zieht der
   Pool eine der Fragen — welche, hängt unter anderem an der Position,
   ein Torhüter bekommt seine eigene.

   Alle Fragen laufen über den normalen Ereignismechanismus: eine Szene,
   drei Antworten, eine davon richtig.                              */

window.FKC = window.FKC || {};
FKC.data = FKC.data || {};

(function (FKC) {
  'use strict';

  var K = function (id, part) { return 'ev.' + id + '.' + part; };

  /* Der Sprung. Er orientiert sich am **bereits festgelegten** Potenzial:
     wer mit 17 schon bei 88 steht, hat weniger Luft nach oben als einer
     bei 68, und der Sprung bleibt in der Talentklasse plausibel.

     In rund einem von sieben Fällen fällt er aber deutlich grösser aus,
     als er dürfte — die seltene positive Überraschung. Ohne die wäre
     jedes Upgrade vorhersehbar, mit ihr bleibt ein Rest Hoffnung, dass
     aus einem soliden Talent doch noch etwas Grosses wird.          */
  function leap(g, rng) {
    var p = g.hidden.potential;
    var r = rng || FKC.rng;

    /* Ab 85 Potenzial schöpft der Sprung den Restweg zur Spitze fast aus.
       Vorher lief die Formel rein über den Abstand zu 99 und fiel damit
       ausgerechnet bei den grössten Talenten am kleinsten aus — wer bei
       88 stand, bekam 8 Punkte, wer bei 70 stand, elf. Genau verkehrt
       herum: ein Ausnahmetalent, das mit siebzehn erkannt wird, macht
       den grösseren Sprung, nicht den kleineren. */
    var normal = p >= 85
      ? Math.max(6, Math.min(14, Math.round((99 - p) * 0.62) + r.int(3, 7)))
      : Math.max(4, Math.min(11, Math.round((99 - p) * 0.34) + 4));

    if (r.chance(0.14)) {
      /* Ausreisser: einmalig über das hinaus, was die Klasse hergibt */
      return Math.min(99 - p, normal + r.int(6, 13));
    }
    return Math.min(99 - p, normal);
  }

  /* Richtige Antwort: der Sprung plus das, was so ein Nachmittag mit
     einem Siebzehnjährigen macht. */
  function right(g, rng) {
    var d = leap(g, rng);
    var stark = g.hidden.potential >= 85;
    return [
      { type: 'potential', delta: d },
      /* Ein Teil davon ist sofort spürbar, nicht erst in drei Jahren.
         Bei den grossen Talenten deutlich mehr: sonst verschiebt sich
         nur eine Obergrenze, die man erst mit fünfundzwanzig erreicht,
         und im Moment der Szene passiert gefühlt nichts. */
      { type: 'growthBonus', points: (stark ? 16 : 6) + Math.round(d / 3) },
      { type: 'hidden', key: 'mentality', delta: 8 },
      { type: 'morale', delta: 12 },
      { type: 'reputation', delta: 5 },
      { type: 'timeline', key: 'tl.potQuiz', mark: 'good' }
    ];
  }

  /* Falsche Antwort: kein Sprung, aber auch keine Strafe — gelernt hat
     man trotzdem etwas. */
  var wrong = [
    { type: 'hidden', key: 'mentality', delta: 5 },
    { type: 'education', delta: 4 },
    { type: 'morale', delta: -4 }
  ];

  /* Halb richtig: die Richtung stimmt, die Begründung nicht. */
  var half = [
    { type: 'hidden', key: 'mentality', delta: 6 },
    { type: 'growthBonus', points: 3 },
    { type: 'morale', delta: 2 }
  ];

  function base(id, extraWhen) {
    return {
      /* Auch `pro` erlaubt: mit achtzehn ist die Jugendphase vorbei, die
         Frage soll aber laut Vorgabe bis achtzehn kommen können. Gezogen
         wird sie ohnehin nur über ihren eigenen Slot in C.nextScene. */
      id: id, category: 'youth', phases: ['youth', 'pro'],
      weight: 10, once: true, minAge: 16, maxAge: 18,
      when: function (g) {
        if (g.flags.potQuiz !== true || g.flags.potQuizDone) return false;
        return extraWhen ? extraWhen(g) : true;
      },
      title: K(id, 'title'), text: K(id, 'text'),
      /* `weak` steht als Platzhalter in einer der Antworten — die ehrliche
         Selbsteinschätzung nennt damit die tatsächlich schwächste Anlage
         des Spielers und nicht irgendeine erfundene. */
      textParams: function (g) {
        return { club: clubName(g), weak: FKC.t('attr.' + weakest(g)).toLowerCase() };
      }
    };
  }

  /* Nach jeder Antwort ist die Frage für diese Karriere durch — auch
     nach einer falschen. Es gibt nur den einen Nachmittag. */
  function done(g) { g.flags.potQuizDone = true; }

  var pool = [];

  /* ── Abseits: die Regel, die jeder zu kennen glaubt ─────────────── */
  pool.push(Object.assign(base('pq_offside'), {
    choices: [
      { id: 'a', label: K('pq_offside', 'a'), desc: K('pq_offside', 'a_d'), risk: 'low',
        result: K('pq_offside', 'a_r'), effects: wrong, tone: 'mixed', after: done },
      { id: 'b', label: K('pq_offside', 'b'), desc: K('pq_offside', 'b_d'), risk: 'low',
        result: K('pq_offside', 'b_r'), effects: right, tone: 'good', after: done },
      { id: 'c', label: K('pq_offside', 'c'), desc: K('pq_offside', 'c_d'), risk: 'low',
        result: K('pq_offside', 'c_r'), effects: wrong, tone: 'mixed', after: done }
    ]
  }));

  /* ── Unter Druck: erster Kontakt ────────────────────────────────── */
  pool.push(Object.assign(base('pq_pressing', function (g) { return !g.identity.isGK; }), {
    choices: [
      { id: 'a', label: K('pq_pressing', 'a'), desc: K('pq_pressing', 'a_d'), risk: 'low',
        result: K('pq_pressing', 'a_r'), effects: wrong, tone: 'mixed', after: done },
      { id: 'b', label: K('pq_pressing', 'b'), desc: K('pq_pressing', 'b_d'), risk: 'low',
        result: K('pq_pressing', 'b_r'), effects: half, tone: 'mixed', after: done },
      { id: 'c', label: K('pq_pressing', 'c'), desc: K('pq_pressing', 'c_d'), risk: 'low',
        result: K('pq_pressing', 'c_r'), effects: right, tone: 'good', after: done }
    ]
  }));

  /* ── 88. Minute, 1:0, Ball in der Ecke ──────────────────────────── */
  pool.push(Object.assign(base('pq_gamestate'), {
    choices: [
      { id: 'a', label: K('pq_gamestate', 'a'), desc: K('pq_gamestate', 'a_d'), risk: 'low',
        result: K('pq_gamestate', 'a_r'), effects: right, tone: 'good', after: done },
      { id: 'b', label: K('pq_gamestate', 'b'), desc: K('pq_gamestate', 'b_d'), risk: 'low',
        result: K('pq_gamestate', 'b_r'), effects: wrong, tone: 'mixed', after: done },
      { id: 'c', label: K('pq_gamestate', 'c'), desc: K('pq_gamestate', 'c_d'), risk: 'low',
        result: K('pq_gamestate', 'c_r'), effects: half, tone: 'mixed', after: done }
    ]
  }));

  /* ── Torhüter: Flanke in den Fünfer ─────────────────────────────── */
  pool.push(Object.assign(base('pq_keeper', function (g) { return g.identity.isGK; }), {
    weight: 24,                       // sonst zieht der Pool selten die GK-Frage
    choices: [
      { id: 'a', label: K('pq_keeper', 'a'), desc: K('pq_keeper', 'a_d'), risk: 'low',
        result: K('pq_keeper', 'a_r'), effects: half, tone: 'mixed', after: done },
      { id: 'b', label: K('pq_keeper', 'b'), desc: K('pq_keeper', 'b_d'), risk: 'low',
        result: K('pq_keeper', 'b_r'), effects: right, tone: 'good', after: done },
      { id: 'c', label: K('pq_keeper', 'c'), desc: K('pq_keeper', 'c_d'), risk: 'low',
        result: K('pq_keeper', 'c_r'), effects: wrong, tone: 'mixed', after: done }
    ]
  }));

  /* ── Der Abend vor dem Spiel ────────────────────────────────────── */
  pool.push(Object.assign(base('pq_recovery'), {
    choices: [
      { id: 'a', label: K('pq_recovery', 'a'), desc: K('pq_recovery', 'a_d'), risk: 'low',
        result: K('pq_recovery', 'a_r'), effects: wrong, tone: 'mixed', after: done },
      { id: 'b', label: K('pq_recovery', 'b'), desc: K('pq_recovery', 'b_d'), risk: 'low',
        result: K('pq_recovery', 'b_r'), effects: half, tone: 'mixed', after: done },
      { id: 'c', label: K('pq_recovery', 'c'), desc: K('pq_recovery', 'c_d'), risk: 'low',
        result: K('pq_recovery', 'c_r'), effects: right, tone: 'good', after: done }
    ]
  }));

  /* ── Der eigene Wert ────────────────────────────────────────────── */
  pool.push(Object.assign(base('pq_selfview'), {
    choices: [
      { id: 'a', label: K('pq_selfview', 'a'), desc: K('pq_selfview', 'a_d'), risk: 'low',
        result: K('pq_selfview', 'a_r'), effects: half, tone: 'mixed', after: done },
      { id: 'b', label: K('pq_selfview', 'b'), desc: K('pq_selfview', 'b_d'), risk: 'low',
        result: K('pq_selfview', 'b_r'), effects: wrong, tone: 'mixed', after: done },
      { id: 'c', label: K('pq_selfview', 'c'), desc: K('pq_selfview', 'c_d'), risk: 'low',
        result: K('pq_selfview', 'c_r'), effects: right, tone: 'good', after: done }
    ]
  }));

  function clubName(g) {
    var c = FKC.state.club();
    return c ? c.name : g.origin.villageClubName;
  }

  function weakest(g) {
    var keys = FKC.data.keysFor(g.identity.isGK);
    var lo = keys[0];
    keys.forEach(function (k) { if (g.attributes[k] < g.attributes[lo]) lo = k; });
    return lo;
  }

  FKC.data.eventsPotential = pool;
  /* Registrierung gebündelt in js/main.js */

})(window.FKC);
