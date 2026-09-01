/* ── Nachwuchsweg ──────────────────────────────────────────────────────
   Der echte Weg nach oben: Dorfverein → Stützpunkt/Talentschule →
   NLZ bzw. Akademie eines Profivereins → U-Teams → Profikader.
   Jedes Land hat eigene Begriffe (NLZ, Academy, Cantera, Base ...).  */

window.FKC = window.FKC || {};
FKC.data = FKC.data || {};

(function (FKC) {
  'use strict';

  var youth = {};

  /* ── Begriffe pro Land (Schlüssel ins Sprachobjekt) ─────────────── */
  var terms = {
    GER: 'nlz', SUI: 'nlz', AUT: 'nlz',
    ENG: 'academy', SCO: 'academy', USA: 'academy',
    ESP: 'cantera', MEX: 'cantera', ARG: 'inferiores',
    FRA: 'centre', BEL: 'jeugd', NED: 'jeugd',
    POR: 'formacao', BRA: 'base', ITA: 'settore',
    TUR: 'altyapi', KSA: 'academy'
  };
  youth.termFor = function (country) { return terms[country] || 'academy'; };

  /* ── Ortsnamen für den Heimatverein ─────────────────────────────── */
  function T(s) { return s.split(','); }
  var towns = {
    GER: T('Bergheim,Altdorf,Lindenau,Rothenbach,Kirchdorf,Neustadt,Waldbach,Hochfeld,Sonnenberg,Eichwalde,Grünbach,Steinfurt,Moosbach,Talheim'),
    SUI: T('Wängi,Oberdorf,Sempach,Bütschwil,Steinegg,Rüti,Ebnat,Aegerten,Wolhusen,Zäziwil,Erlenbach,Hinwil,Grabs,Muri'),
    ENG: T('Ashford,Barnwell,Redhill,Thornbury,Whitfield,Eastvale,Marsden,Oakley,Hartwell,Kingsbrook,Stanmore,Elmwood,Northgate,Wexley'),
    SCO: T('Craigmill,Bannock,Inverleith,Kinross,Glenmore,Fairlie,Balloch,Dunmore,Carnie,Linwood'),
    ESP: T('Villanueva,Montijo,Alcorán,Ribera,Sanlúcar,Peñalba,Castellar,Torrejón,Miralles,Valdealba,Olivares,Fuentes'),
    ITA: T('Montesano,Rocca,Valdarno,Casalino,Poggio,Sanremo,Villafranca,Cerreto,Pontevico,Borgone,Fiumara,Salveri'),
    FRA: T('Beaulieu,Villeneuve,Saint-Amand,Rochefort,Montbrun,Aubigny,Chatelard,Vertou,Marnay,Lestrange,Trévoux,Grandval'),
    POR: T('Vilar,Ribeirinho,Santarém,Casalinho,Fonte Nova,Estreito,Pinheiral,Marinha,Alvorada,Cabeceiras'),
    NED: T('Wildervank,Sluisdorp,Oostwoud,Berkelheim,Nieuwveen,Kortenhoef,Bergerdam,Veldhorst,Zandvliet,Maarsen'),
    TUR: T('Yenidere,Karaköy,Akbulut,Söğütlü,Beydere,Çamlıca,Gökçeler,Doğanpınar,Yeşilova,Taşköprü'),
    BEL: T('Kortenberg,Loenhout,Villers,Hamme,Zoerle,Rixensart,Beveren-Dorp,Aalbeke,Mortsel,Wichelen'),
    BRA: T('Vila Nova,Riacho Fundo,Bairro Alto,Boa Vista,Serra Verde,Ipiranga,Jardim Sul,Novo Horizonte,Pontal,Cachoeira'),
    ARG: T('Villa Elisa,Barrio Norte,El Talar,Los Pinos,San Vicente,Colonia Sur,Puerto Chico,Las Flores,Monte Grande,Rincón'),
    MEX: T('San Isidro,La Loma,Tepalcates,Rincón Verde,Barrio Nuevo,Santa Cruz,Colinas,Ojo de Agua,Palma Sola,Cerro Azul'),
    USA: T('Fairview,Riverton,Oakridge,Brookside,Millvale,Cedar Park,Lakewood,Northfield,Stonegate,Elmhurst'),
    KSA: T('Al-Wadi,Al-Bustan,Al-Rabwa,Al-Nakheel,Al-Salam,Al-Faisaliah,Al-Yasmin,Al-Aziziyah,Al-Manar,Al-Rayyan')
  };

  /* ── Namensmuster für Amateur-/Dorfvereine ──────────────────────── */
  var patterns = {
    GER: ['FC {t}', 'SV {t}', 'TSV {t}', 'SpVgg {t}', 'VfL {t}', 'FC {t} 08'],
    SUI: ['FC {t}', 'SC {t}', 'FC {t} 04', 'FC Union {t}'],
    ENG: ['{t} Juniors FC', '{t} Rovers', '{t} Town Youth', '{t} Athletic'],
    SCO: ['{t} Boys Club', '{t} Thistle', '{t} United Youth'],
    ESP: ['CD {t}', 'CF {t}', 'UD {t}', 'Atlético {t}'],
    ITA: ['AC {t}', 'US {t}', 'Polisportiva {t}', 'ASD {t}'],
    FRA: ['AS {t}', 'US {t}', 'FC {t}', 'ES {t}'],
    POR: ['CD {t}', 'GD {t}', 'AD {t}', 'FC {t}'],
    NED: ['VV {t}', 'SV {t}', 'RKVV {t}', '{t} Boys'],
    TUR: ['{t}spor', '{t} Gençlik', '{t} Belediyespor'],
    BEL: ['KFC {t}', 'VV {t}', 'RC {t}'],
    BRA: ['{t} FC', 'AA {t}', 'EC {t}', 'Grêmio {t}'],
    ARG: ['Club Atlético {t}', 'Deportivo {t}', 'CS {t}'],
    MEX: ['Deportivo {t}', 'Club {t}', 'Atlético {t}'],
    USA: ['{t} SC', '{t} United Youth', '{t} Rangers SC'],
    KSA: ['{t} Club', 'Shabab {t}', '{t} SC']
  };

  /** Erzeugt den Heimat-/Dorfverein des Spielers */
  youth.villageClub = function (country, rng) {
    rng = rng || FKC.rng;
    /* Nationen ohne eigene Ortsliste erben die des Nachbarlandes */
    var fallback = FKC.data.youthCountry(country);
    var t = towns[country] || towns[fallback] || towns.ENG;
    var p = patterns[country] || patterns[fallback] || patterns.ENG;
    var town = rng.pick(t);
    var name = rng.pick(p).replace('{t}', town);
    return {
      id: 'village.' + town.toLowerCase().replace(/[^a-z0-9]/g, ''),
      name: name, short: FKC.util.initials(name),
      town: town,
      leagueId: null, synthetic: true, type: 'village',
      strength: rng.int(38, 46),
      prestige: 30, finances: 30,
      facilities: rng.int(30, 44),
      youthTrust: 95,
      color: FKC.util.hashColor(name)
    };
  };

  /** Regionaler Stützpunkt / Talentschule — Zwischenstufe vor dem NLZ */
  youth.supportCentre = function (country, town) {
    return {
      id: 'support.' + (town || country).toLowerCase().replace(/[^a-z0-9]/g, ''),
      name: null,               // Anzeige über i18n: youth.support.name
      townName: town || '',
      leagueId: null, synthetic: true, type: 'support',
      strength: 50, prestige: 40, finances: 40,
      facilities: FKC.rng.int(58, 70),
      youthTrust: 90,
      color: '#3f6f5a'
    };
  };

  /* ── Startpunkt der Karriere ────────────────────────────────────────
     Wo ein Kind anfängt, entscheidet über Ausbildung und Konkurrenz.
     Immer im Herkunftsland (bzw. dem zugeordneten Nachbarland).    */

  youth.START_KINDS = ['village', 'nlz', 'academy'];

  /**
   * Realer Startverein für nlz / academy. Gibt null zurück, wenn das
   * Land nichts Passendes hergibt — dann bleibt es beim Dorfverein.
   */
  youth.startClub = function (country, kind) {
    var pool = FKC.data.clubsOfCountry(country);
    if (!pool.length) return null;

    var ranked = pool.slice().sort(function (a, b) {
      return (b.facilities * 2 + b.prestige + b.youthTrust) -
             (a.facilities * 2 + a.prestige + a.youthTrust);
    });

    var top = ranked.slice(0, Math.max(1, Math.min(4, ranked.length)));

    if (kind === 'academy') {
      /* Die Spitze der Nachwuchsarbeit des Landes */
      return FKC.rng.pick(top);
    }

    /* NLZ: solider Profiverein aus dem breiten Mittelfeld. Die vier
       Akademie-Adressen sind hier bewusst ausgeschlossen — sonst landet
       man als „normaler Profiverein" plötzlich bei Flamengo.          */
    var rest = ranked.filter(function (c) { return top.indexOf(c) < 0; });
    if (!rest.length) rest = ranked;

    var mid = rest.filter(function (c) {
      return c.facilities >= 58 && c.facilities < 86;
    });
    if (mid.length < 3) mid = rest.slice(Math.floor(rest.length * 0.15),
                                         Math.floor(rest.length * 0.7) + 1);
    return mid.length ? FKC.rng.pick(mid) : rest[Math.floor(rest.length / 2)];
  };

  /**
   * Drei konkrete Startadressen zur Auswahl — der Spieler entscheidet
   * selbst, statt zugewiesen zu bekommen. Für `village` werden drei
   * verschiedene Dorfvereine erzeugt, für `nlz` und `academy` drei
   * echte Vereine aus dem jeweiligen Band.
   *
   * `rng` ist bewusst ein Parameter: die Charaktererstellung darf den
   * globalen Zufallszustand nicht anfassen, solange nichts angelegt ist.
   */
  youth.startClubOptions = function (country, kind, rng) {
    rng = rng || FKC.rng;
    var out = [], i;

    if (kind === 'village') {
      var gesehen = {};
      for (i = 0; i < 40 && out.length < 3; i++) {
        var v = youth.villageClub(country, rng);
        if (gesehen[v.id]) continue;
        gesehen[v.id] = 1;
        out.push(v);
      }
      return out;
    }

    var pool = FKC.data.clubsOfCountry(FKC.data.youthCountry(country));
    if (!pool.length) return youth.startClubOptions(country, 'village', rng);

    var ranked = pool.slice().sort(function (a, b) {
      return (b.facilities * 2 + b.prestige + b.youthTrust) -
             (a.facilities * 2 + a.prestige + a.youthTrust);
    });
    var top = ranked.slice(0, Math.max(1, Math.min(4, ranked.length)));

    /* Die beiden Bänder dürfen sich nicht berühren: sonst stehen bei
       „NLZ" und bei „Akademie" dieselben Vereine, nur anders gewürfelt,
       und die Wahl des Startpunkts wirkt wirkungslos. Die Akademie zieht
       aus der Spitze, das NLZ ausdrücklich aus dem Rest darunter. */
    var band;
    if (kind === 'academy') {
      band = top;
    } else {
      var rest = ranked.filter(function (c) { return top.indexOf(c) < 0; });
      if (!rest.length) rest = ranked;
      band = rest.filter(function (c) {
        return c.facilities >= 58 && c.facilities < 86;
      });
      if (band.length < 3) band = rest.slice(Math.floor(rest.length * 0.15),
                                             Math.floor(rest.length * 0.7) + 1);
      if (!band.length) band = rest;
    }

    /* Ohne Zurücklegen ziehen, damit nicht zweimal derselbe Verein steht */
    var kopie = band.slice();
    while (out.length < 3 && kopie.length) {
      out.push(kopie.splice(rng.int(0, kopie.length - 1), 1)[0]);
    }

    /* Stärkster zuerst — die Reihenfolge soll die Auswahl erklären,
       nicht verwürfeln. */
    out.sort(function (a, b) {
      return (b.facilities * 2 + b.prestige) - (a.facilities * 2 + a.prestige);
    });
    return out;
  };

  /* ── Altersstufen ───────────────────────────────────────────────── */
  youth.stages = [
    { from: 6,  to: 7,  key: 'bambini' },
    { from: 8,  to: 9,  key: 'f_e' },
    { from: 10, to: 11, key: 'e_d' },
    { from: 12, to: 13, key: 'd_c' },
    { from: 14, to: 15, key: 'c_b' },
    { from: 16, to: 17, key: 'b_a' },
    { from: 18, to: 19, key: 'a_u21' }
  ];

  youth.stageFor = function (age) {
    for (var i = 0; i < youth.stages.length; i++) {
      if (age >= youth.stages[i].from && age <= youth.stages[i].to) return youth.stages[i];
    }
    return youth.stages[youth.stages.length - 1];
  };

  /* ── Akademie-Angebote ──────────────────────────────────────────── */
  /**
   * Drei Nachwuchsabteilungen — immer aus dem Herkunftsland, gestaffelt
   * nach dem Niveau des Kindes: ein Sprung nach oben, ein passender
   * Schritt und ein kleiner Verein in der Nähe.
   */
  youth.academyOffers = function (country, talentLevel) {
    var rng = FKC.rng;
    var pool = FKC.data.clubsOfCountry(country).filter(function (c) {
      return c.facilities >= 45;
    });
    /* Nur falls ein Land wirklich zu wenige Vereine hat */
    if (pool.length < 3) pool = FKC.data.clubsOfCountry(country);
    if (pool.length < 3) return [];

    function pickNear(target, spread, taken) {
      var cand = pool.filter(function (c) {
        if (taken.indexOf(c) >= 0) return false;
        return Math.abs(FKC.data.clubLevel(c) - target) <= spread;
      });
      if (!cand.length) {
        cand = pool.filter(function (c) { return taken.indexOf(c) < 0; })
          .sort(function (a, b) {
            return Math.abs(FKC.data.clubLevel(a) - target) -
                   Math.abs(FKC.data.clubLevel(b) - target);
          }).slice(0, 5);
      }
      return cand.length ? rng.pick(cand) : null;
    }

    var taken = [];
    /* Der grosse Name — nur so weit über dem Kind, wie es Sinn ergibt */
    var reach = talentLevel >= 68 ? rng.int(20, 30) : talentLevel >= 58 ? rng.int(12, 22) : rng.int(6, 14);
    var elite = pickNear(talentLevel + reach, 7, taken);
    if (elite) taken.push(elite);

    var solid = pickNear(talentLevel + rng.int(4, 12), 6, taken);
    if (solid) taken.push(solid);

    var local = pickNear(talentLevel - rng.int(0, 8), 8, taken);
    if (local) taken.push(local);

    return taken.sort(function (a, b) {
      return FKC.data.clubLevel(b) - FKC.data.clubLevel(a);
    });
  };

  FKC.data.youth = youth;
  FKC.data.towns = towns;

})(window.FKC);
