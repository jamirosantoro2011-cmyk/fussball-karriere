/* ── Mentoren ──────────────────────────────────────────────────────────
   Zu Beginn der Jugendzeit nimmt sich jemand des Spielers an. Der Mentor
   prägt die Entwicklung über Jahre und meldet sich immer wieder — er ist
   keine einmalige Auswahl, sondern eine Begleitung.                 */

window.FKC = window.FKC || {};
FKC.data = FKC.data || {};

(function (FKC) {
  'use strict';

  var mentors = [
    {
      id: 'technical',
      /* Auf welche Attribute der Mentor drückt */
      attrs: { field: ['passing', 'dribbling'], gk: ['distribution', 'handling'] },
      boost: 1.75,
      onPick: [{ type: 'hidden', key: 'flair', delta: 6 }],
      accent: '#35e3ac'
    },
    {
      id: 'physical',
      attrs: { field: ['pace', 'physical'], gk: ['reflexes', 'physical'] },
      boost: 1.75,
      onPick: [{ type: 'hidden', key: 'workRate', delta: 8 },
               { type: 'fitness', delta: 6 }],
      accent: '#f5a524'
    },
    {
      id: 'mental',
      attrs: { field: ['shooting', 'defending'], gk: ['positioning', 'aerial'] },
      boost: 1.25,
      /* Der eigentliche Wert liegt in der Stabilität, nicht im Wachstum */
      stability: true,
      onPick: [{ type: 'hidden', key: 'consistency', delta: 10 },
               { type: 'hidden', key: 'mentality', delta: 8 }],
      accent: '#9ef25b'
    }
  ];

  FKC.data.mentors = mentors;
  FKC.data.mentorById = function (id) { return FKC.util.byId(mentors, id); };

  FKC.data.mentorRoles = ['mentorRole.expro', 'mentorRole.coach', 'mentorRole.veteran',
                          'mentorRole.keeper', 'mentorRole.captain'];

  /** Attribute, auf die der Mentor des Spielers hinarbeitet */
  FKC.data.mentorAttrs = function (game) {
    var m = game.career && game.career.mentor;
    if (!m) return [];
    var def = FKC.data.mentorById(m.id);
    if (!def) return [];
    return game.identity.isGK ? def.attrs.gk : def.attrs.field;
  };

  /** Wie stark der Mentor gerade wirkt (0.6 – 1.35, abhängig von der Bindung) */
  FKC.data.mentorStrength = function (game) {
    var m = game.career && game.career.mentor;
    if (!m) return 0;
    return 0.6 + FKC.util.clamp(m.bond, 0, 100) / 133;
  };

  /** Drei Kandidaten mit Namen und Rolle */
  FKC.data.rollMentorOffers = function (game) {
    var rng = FKC.rng;
    var nat = game.identity.nationality;
    var roles = rng.shuffle(FKC.data.mentorRoles);
    return mentors.map(function (m, i) {
      var n = FKC.data.randomName(nat);
      var role = m.id === 'mental' && rng.chance(0.4) ? 'mentorRole.captain' : roles[i % roles.length];
      if (game.identity.isGK && m.id === 'technical') role = 'mentorRole.keeper';
      return {
        id: m.id, name: n.first + ' ' + n.last, role: role,
        accent: m.accent,
        attrs: game.identity.isGK ? m.attrs.gk : m.attrs.field
      };
    });
  };

})(window.FKC);
