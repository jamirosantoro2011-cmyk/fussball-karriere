/* ── Nationen ──────────────────────────────────────────────────────────
   strength   : Stärke der A-Nationalmannschaft (40-99)
   depth      : Konkurrenzdichte — wie schwer ein Stammplatz ist
   nameRegion : Schlüssel für den Namensgenerator
   league     : Land hat eine spielbare Liga (Jugendweg startet dort)
   conf       : Konföderation (Quali-Struktur für WM/EM)               */

window.FKC = window.FKC || {};
FKC.data = FKC.data || {};

/* Historische Qualifikationshäufigkeit für Endrunden, getrennt nach
   Weltmeisterschaft und Kontinentalturnier. Werte sind der Anteil der
   letzten Turniere, für die sich das Land tatsächlich qualifiziert hat.

   Brasilien war bei jeder WM dabei, Norwegen seit 1998 bei keiner mehr —
   das lässt sich nicht aus der Mannschaftsstärke allein ableiten. Ein
   Kontinentalturnier ist ausserdem fast überall leichter zu erreichen
   als eine WM: die EM hat 24 Plätze für 55 Verbände, die WM 13 für
   dieselben. Fehlt ein Eintrag, wird aus der Stärke geschätzt.      */
FKC.data.qualRate = {
  /* Europa */
  ENG: [0.92, 0.92], ESP: [0.92, 1.00], GER: [1.00, 1.00], ITA: [0.77, 0.92],
  FRA: [0.92, 1.00], POR: [0.77, 0.92], NED: [0.69, 0.85], BEL: [0.69, 0.85],
  CRO: [0.85, 0.77], SUI: [0.77, 0.77], DEN: [0.62, 0.85], POL: [0.69, 0.77],
  AUT: [0.31, 0.62], SRB: [0.62, 0.46], UKR: [0.38, 0.77], TUR: [0.23, 0.69],
  CZE: [0.38, 0.92], SWE: [0.54, 0.69], SCO: [0.15, 0.31], NOR: [0.15, 0.23],
  IRL: [0.23, 0.38], WAL: [0.15, 0.23], GRE: [0.31, 0.46], ROU: [0.38, 0.62],
  HUN: [0.15, 0.46], RUS: [0.46, 0.62],
  /* Südamerika — nur zehn Verbände, das Kontinentalturnier nimmt alle */
  BRA: [1.00, 1.00], ARG: [0.92, 1.00], URU: [0.77, 1.00], COL: [0.62, 1.00],
  CHI: [0.46, 1.00], PER: [0.38, 1.00], ECU: [0.46, 1.00], PAR: [0.54, 1.00],
  /* Afrika, Asien, Nordamerika */
  MAR: [0.62, 0.92], SEN: [0.54, 0.85], NGA: [0.54, 0.85], CIV: [0.31, 0.92],
  GHA: [0.62, 0.85], ALG: [0.38, 0.92], CMR: [0.69, 0.92], EGY: [0.23, 0.92],
  JPN: [0.85, 0.92], KOR: [0.92, 0.92], IRN: [0.62, 0.92], KSA: [0.54, 0.85],
  QAT: [0.15, 0.85], AUS: [0.77, 0.85],
  USA: [0.77, 0.92], MEX: [0.92, 1.00], CAN: [0.23, 0.85]
};

(function (FKC) {
  'use strict';

  /* [code, de, en, strength, depth, nameRegion, conf, hasLeague, home, height]
     home   : Land, in dem der Nachwuchsweg realistisch beginnt. Nationen
              ohne eigenes Ligensystem docken an ein benachbartes an.
     height : durchschnittliche Körpergrösse erwachsener Männer in cm  */
  var rows = [
    ['ENG', 'England', 'England', 88, 92, 'en', 'UEFA', 1, 'ENG', 178],
    ['ESP', 'Spanien', 'Spain', 90, 92, 'es', 'UEFA', 1, 'ESP', 176],
    ['GER', 'Deutschland', 'Germany', 87, 88, 'de', 'UEFA', 1, 'GER', 180],
    ['ITA', 'Italien', 'Italy', 85, 86, 'it', 'UEFA', 1, 'ITA', 177],
    ['FRA', 'Frankreich', 'France', 91, 94, 'fr', 'UEFA', 1, 'FRA', 179],
    ['POR', 'Portugal', 'Portugal', 87, 86, 'pt', 'UEFA', 1, 'POR', 173],
    ['NED', 'Niederlande', 'Netherlands', 84, 82, 'nl', 'UEFA', 1, 'NED', 184],
    ['TUR', 'Türkei', 'Türkiye', 78, 74, 'tr', 'UEFA', 1, 'TUR', 174],
    ['BRA', 'Brasilien', 'Brazil', 90, 95, 'br', 'CONMEBOL', 1, 'BRA', 176],
    ['BEL', 'Belgien', 'Belgium', 82, 78, 'nl', 'UEFA', 1, 'BEL', 181],
    ['SUI', 'Schweiz', 'Switzerland', 78, 70, 'ch', 'UEFA', 1, 'SUI', 178],
    ['USA', 'USA', 'USA', 74, 70, 'en', 'CONCACAF', 1, 'USA', 177],
    ['ARG', 'Argentinien', 'Argentina', 92, 90, 'ar', 'CONMEBOL', 1, 'ARG', 175],
    ['KSA', 'Saudi-Arabien', 'Saudi Arabia', 66, 58, 'ar-sa', 'AFC', 1, 'KSA', 168],
    ['SCO', 'Schottland', 'Scotland', 72, 64, 'en', 'UEFA', 1, 'SCO', 177],
    ['MEX', 'Mexiko', 'Mexico', 76, 74, 'es', 'CONCACAF', 1, 'MEX', 170],

    ['AUT', 'Österreich', 'Austria', 77, 70, 'de', 'UEFA', 0, 'GER', 179],
    ['CRO', 'Kroatien', 'Croatia', 82, 76, 'balkan', 'UEFA', 0, 'ITA', 181],
    ['SRB', 'Serbien', 'Serbia', 76, 72, 'balkan', 'UEFA', 0, 'GER', 182],
    ['POL', 'Polen', 'Poland', 74, 70, 'pl', 'UEFA', 0, 'GER', 179],
    ['DEN', 'Dänemark', 'Denmark', 80, 74, 'scand', 'UEFA', 0, 'NED', 181],
    ['SWE', 'Schweden', 'Sweden', 74, 70, 'scand', 'UEFA', 0, 'NED', 181],
    ['NOR', 'Norwegen', 'Norway', 75, 66, 'scand', 'UEFA', 0, 'NED', 180],
    ['CZE', 'Tschechien', 'Czechia', 72, 68, 'cz', 'UEFA', 0, 'GER', 180],
    ['UKR', 'Ukraine', 'Ukraine', 74, 70, 'ua', 'UEFA', 0, 'TUR', 178],
    ['GRE', 'Griechenland', 'Greece', 71, 66, 'gr', 'UEFA', 0, 'ITA', 177],
    ['IRL', 'Irland', 'Ireland', 68, 62, 'en', 'UEFA', 0, 'ENG', 178],
    ['WAL', 'Wales', 'Wales', 70, 60, 'en', 'UEFA', 0, 'ENG', 177],
    ['ROU', 'Rumänien', 'Romania', 68, 64, 'ro', 'UEFA', 0, 'ITA', 175],
    ['HUN', 'Ungarn', 'Hungary', 70, 62, 'hu', 'UEFA', 0, 'GER', 177],
    ['RUS', 'Russland', 'Russia', 70, 72, 'ru', 'UEFA', 0, 'TUR', 176],

    ['MAR', 'Marokko', 'Morocco', 82, 76, 'maghreb', 'CAF', 0, 'FRA', 172],
    ['SEN', 'Senegal', 'Senegal', 80, 76, 'wafr', 'CAF', 0, 'FRA', 176],
    ['NGA', 'Nigeria', 'Nigeria', 78, 78, 'wafr', 'CAF', 0, 'BEL', 167],
    ['CIV', 'Elfenbeinküste', 'Ivory Coast', 76, 74, 'wafr', 'CAF', 0, 'FRA', 170],
    ['GHA', 'Ghana', 'Ghana', 74, 72, 'wafr', 'CAF', 0, 'BEL', 170],
    ['ALG', 'Algerien', 'Algeria', 75, 70, 'maghreb', 'CAF', 0, 'FRA', 173],
    ['CMR', 'Kamerun', 'Cameroon', 73, 70, 'wafr', 'CAF', 0, 'FRA', 170],
    ['EGY', 'Ägypten', 'Egypt', 74, 68, 'ar', 'CAF', 0, 'KSA', 172],

    ['URU', 'Uruguay', 'Uruguay', 84, 78, 'ar', 'CONMEBOL', 0, 'ARG', 174],
    ['COL', 'Kolumbien', 'Colombia', 84, 80, 'es', 'CONMEBOL', 0, 'ARG', 172],
    ['CHI', 'Chile', 'Chile', 74, 70, 'es', 'CONMEBOL', 0, 'ARG', 171],
    ['PER', 'Peru', 'Peru', 70, 66, 'es', 'CONMEBOL', 0, 'ARG', 166],
    ['ECU', 'Ecuador', 'Ecuador', 74, 70, 'es', 'CONMEBOL', 0, 'ARG', 167],
    ['PAR', 'Paraguay', 'Paraguay', 70, 64, 'es', 'CONMEBOL', 0, 'ARG', 172],

    ['JPN', 'Japan', 'Japan', 80, 76, 'jp', 'AFC', 0, 'NED', 172],
    ['KOR', 'Südkorea', 'South Korea', 77, 72, 'kr', 'AFC', 0, 'NED', 174],
    ['AUS', 'Australien', 'Australia', 70, 62, 'en', 'AFC', 0, 'ENG', 179],
    ['CAN', 'Kanada', 'Canada', 72, 64, 'en', 'CONCACAF', 0, 'USA', 178],
    ['QAT', 'Katar', 'Qatar', 62, 54, 'ar-sa', 'AFC', 0, 'KSA', 170],
    ['IRN', 'Iran', 'Iran', 70, 62, 'ar', 'AFC', 0, 'KSA', 173]
  ];

  FKC.data.nations = rows.map(function (r) {
    return {
      id: r[0], code: r[0],
      name: { de: r[1], en: r[2] },
      strength: r[3], depth: r[4],
      nameRegion: r[5], conf: r[6],
      hasLeague: !!r[7],
      home: r[8] || r[0],
      height: r[9] || 177
    };
  });

  FKC.data.nationById = function (code) {
    return FKC.util.byId(FKC.data.nations, code);
  };

  FKC.data.nationName = function (code) {
    var n = FKC.data.nationById(code);
    return n ? n.name[FKC.i18n.lang] || n.name.de : code;
  };

  /* Länder mit spielbarem Ligensystem — für die Charaktererstellung zuerst */
  FKC.data.leagueNations = function () {
    return FKC.data.nations.filter(function (n) { return n.hasLeague; });
  };

  /**
   * In welchem Land beginnt der Nachwuchsweg? Für Nationen ohne eigenes
   * Ligensystem das nächstgelegene Land mit Ligen — der erste Verein
   * kommt nie zufällig aus irgendeiner Top-Liga der Welt.
   */
  FKC.data.youthCountry = function (code) {
    var n = FKC.data.nationById(code);
    if (!n) return 'ENG';
    if (n.hasLeague) return n.id;
    var h = FKC.data.nationById(n.home);
    return h && h.hasLeague ? h.id : 'ENG';
  };

  /** Durchschnittliche Körpergrösse des Herkunftslandes */
  FKC.data.nationHeight = function (code) {
    var n = FKC.data.nationById(code);
    return n ? n.height : 177;
  };

})(window.FKC);
