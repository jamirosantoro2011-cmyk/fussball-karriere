/* ── Vereine ───────────────────────────────────────────────────────────
   Spalten: [key, Name, Kürzel, strength, prestige, finances, facilities,
             youthTrust, farbe?]

   strength   40-99  sportliche Stärke (Tabellensimulation, Stammplatzkampf)
   prestige   32-99  Renommee — Medien, Reputationsgewinn, Fandruck
   finances   32-99  Gehaltsbudget & Ablösekraft
   facilities 40-99  Trainingsbedingungen — Bonus auf Attributentwicklung
   youthTrust 30-99  Vertrauen in junge Spieler — Einsatzchance als Talent
                     (99 nur bei zweiten Mannschaften wie Jong Ajax)

   Vereine ohne Farbangabe bekommen eine deterministische Ersatzfarbe.

   ── Eichung der Stärkewerte ──────────────────────────────────────────
   `strength` bildet die **tatsächliche aktuelle Stärke** ab, nicht den
   historischen Namen. Grundlage sind, in dieser Reihenfolge:

     1. die Abschlusstabelle der letzten vollen Saison
     2. der laufende Formstand und die europäische Beteiligung
     3. Kaderwert und Transferaktivität des letzten Sommers

   Deshalb liegt Manchester United deutlich unter Arsenal, obwohl der
   Name grösser ist — dafür gibt es `prestige`. Die drei Werte sind
   bewusst getrennt:

     strength   was die Mannschaft heute auf dem Platz kann
     prestige   was der Name wiegt (Medien, Fandruck, Reputationsgewinn)
     finances   was der Verein zahlen kann

   Sevilla, Lyon oder Santos zeigen genau diese Schere: grosser Name,
   dünner Kader, enge Kasse.

   Stand der Eichung: Saison 2025/26. Wer später nachjustiert, sollte
   ganze Ligen auf einmal durchgehen — Stärke wirkt relativ innerhalb
   der Liga, ein einzelner geänderter Wert verschiebt die ganze
   Tabellensimulation.                                                */

window.FKC = window.FKC || {};
FKC.data = FKC.data || {};

(function (FKC) {
  'use strict';

  var clubs = [];

  function L(leagueId, rows) {
    rows.forEach(function (r) {
      var id = leagueId + '.' + r[0];
      clubs.push({
        id: id, key: r[0], name: r[1], short: r[2],
        leagueId: leagueId,
        strength: r[3], prestige: r[4], finances: r[5],
        facilities: r[6], youthTrust: r[7],
        color: r[8] || FKC.util.hashColor(id)
      });
    });
  }

  /* ── ENGLAND ─────────────────────────────────────────────────────── */
  L('eng.1', [
    /* Arsenal vor City: seit zwei Spielzeiten die konstanteste Mannschaft,
       City nach Platz 3 in 24/25 nicht mehr die Übermacht von 2023.
       United und Tottenham stehen sportlich weit unter ihrem Namen —
       Platz 15 bzw. 17 in 24/25; das trägt `prestige`, nicht `strength`. */
    ['ars', 'Arsenal', 'ARS', 93, 93, 94, 93, 62, '#EF0107'],
    ['liv', 'Liverpool', 'LIV', 92, 95, 95, 92, 58, '#C8102E'],
    ['mci', 'Manchester City', 'MCI', 91, 94, 98, 95, 50, '#6CABDD'],
    ['che', 'Chelsea', 'CHE', 88, 91, 96, 92, 70, '#034694'],
    ['new', 'Newcastle United', 'NEW', 84, 84, 90, 86, 52, '#241F20'],
    ['avl', 'Aston Villa', 'AVL', 83, 82, 82, 85, 55, '#95BFE5'],
    ['bha', 'Brighton & Hove Albion', 'BHA', 80, 74, 78, 86, 80, '#0057B8'],
    ['mun', 'Manchester United', 'MUN', 79, 96, 95, 91, 62, '#DA291C'],
    ['tot', 'Tottenham Hotspur', 'TOT', 79, 88, 89, 92, 62, '#132257'],
    ['cry', 'Crystal Palace', 'CRY', 79, 74, 74, 76, 68, '#1B458F'],
    ['nfo', 'Nottingham Forest', 'NFO', 78, 74, 78, 74, 54, '#DD0000'],
    ['ful', 'Fulham', 'FUL', 78, 71, 76, 78, 58, '#CC0000'],
    ['bou', 'AFC Bournemouth', 'BOU', 77, 66, 72, 76, 74, '#DA291C'],
    ['bre', 'Brentford', 'BRE', 75, 68, 71, 79, 74, '#E30613'],
    ['eve', 'Everton', 'EVE', 75, 77, 76, 78, 60, '#003399'],
    ['whu', 'West Ham United', 'WHU', 74, 79, 79, 80, 58, '#7A263A'],
    ['sun', 'Sunderland', 'SUN', 74, 70, 74, 74, 76, '#EB172B'],
    ['wol', 'Wolverhampton Wanderers', 'WOL', 71, 71, 71, 77, 64, '#FDB913'],
    ['lee', 'Leeds United', 'LEE', 71, 76, 72, 76, 62, '#FFCD00'],
    ['bur', 'Burnley', 'BUR', 69, 63, 64, 70, 62, '#6C1D45']
  ]);
  L('eng.2', [
    ['lei', 'Leicester City', 'LEI', 72, 76, 74, 82, 58],
    ['sou', 'Southampton', 'SOU', 71, 70, 70, 80, 74],
    ['ips', 'Ipswich Town', 'IPS', 70, 65, 68, 72, 66],
    ['mid', 'Middlesbrough', 'MID', 69, 66, 66, 74, 66],
    ['wba', 'West Bromwich Albion', 'WBA', 68, 66, 64, 72, 68],
    ['cov', 'Coventry City', 'COV', 69, 61, 63, 68, 64],
    ['nor', 'Norwich City', 'NOR', 67, 65, 64, 74, 72],
    ['shu', 'Sheffield United', 'SHU', 68, 66, 64, 68, 60],
    ['wat', 'Watford', 'WAT', 66, 62, 66, 72, 70],
    ['mil', 'Millwall', 'MIL', 65, 56, 56, 62, 60],
    ['sto', 'Stoke City', 'STK', 65, 62, 64, 70, 60],
    ['hul', 'Hull City', 'HUL', 64, 58, 62, 66, 62],
    ['bri', 'Bristol City', 'BRC', 65, 57, 58, 68, 66],
    ['pne', 'Preston North End', 'PNE', 63, 55, 54, 62, 62],
    ['qpr', 'Queens Park Rangers', 'QPR', 63, 60, 56, 64, 68],
    ['swa', 'Swansea City', 'SWA', 64, 61, 58, 70, 72],
    ['bla', 'Blackburn Rovers', 'BLA', 63, 61, 56, 68, 70],
    ['der', 'Derby County', 'DER', 62, 62, 56, 66, 66],
    ['por', 'Portsmouth', 'POR', 62, 58, 54, 62, 60],
    ['car', 'Cardiff City', 'CAR', 61, 58, 56, 64, 62],
    ['bir', 'Birmingham City', 'BIR', 66, 60, 70, 68, 62],
    ['cha', 'Charlton Athletic', 'CHA', 61, 56, 52, 62, 66],
    ['wre', 'Wrexham', 'WRE', 63, 60, 68, 62, 54],
    ['oxf', 'Oxford United', 'OXF', 60, 52, 52, 60, 62]
  ]);

  /* ── SPANIEN ─────────────────────────────────────────────────────── */
  L('esp.1', [
    /* Barcelona knapp vor Real: Meister 24/25 mit dem stärksten Angriff
       der Liga. Sevilla und Valencia sind die deutlichsten Fälle von
       „grosser Name, kleine Mannschaft" — beide im unteren Drittel, bei
       Sevilla dazu eine Gehaltsobergrenze, die kaum Bewegung zulässt.  */
    ['rma', 'Real Madrid', 'RMA', 94, 99, 98, 96, 56, '#FEBE10'],
    ['bar', 'FC Barcelona', 'BAR', 93, 97, 84, 95, 82, '#A50044'],
    ['atm', 'Atlético Madrid', 'ATM', 87, 88, 86, 89, 56, '#CB3524'],
    ['ath', 'Athletic Club', 'ATH', 83, 80, 78, 88, 84, '#EE2523'],
    ['vil', 'Villarreal', 'VIL', 82, 78, 78, 84, 70, '#FFE667'],
    ['bet', 'Real Betis', 'BET', 79, 78, 72, 78, 66, '#00954C'],
    ['rso', 'Real Sociedad', 'RSO', 76, 76, 72, 88, 88, '#0067B1'],
    ['cel', 'Celta Vigo', 'CEL', 75, 68, 64, 76, 76, '#8AC3EE'],
    ['osa', 'CA Osasuna', 'OSA', 72, 66, 60, 74, 78, '#0A346F'],
    ['ray', 'Rayo Vallecano', 'RAY', 72, 64, 58, 68, 70, '#E53027'],
    ['val', 'Valencia', 'VAL', 71, 82, 62, 82, 84, '#F5820D'],
    ['mal', 'RCD Mallorca', 'MAL', 71, 64, 62, 72, 66, '#E20613'],
    ['sev', 'Sevilla', 'SEV', 70, 82, 58, 82, 76, '#D9042B'],
    ['gir', 'Girona', 'GIR', 70, 66, 64, 74, 70, '#CC0000'],
    ['get', 'Getafe', 'GET', 70, 60, 58, 68, 58, '#005999'],
    ['esp', 'RCD Espanyol', 'ESP', 70, 68, 60, 76, 74, '#007FC8'],
    ['ala', 'Deportivo Alavés', 'ALA', 69, 58, 56, 68, 62, '#0761AF'],
    ['lev', 'Levante', 'LEV', 67, 58, 54, 66, 68, '#004C9F'],
    ['elc', 'Elche', 'ELC', 67, 56, 54, 66, 68, '#00913F'],
    ['ovi', 'Real Oviedo', 'OVI', 66, 60, 54, 64, 66, '#0055A5']
  ]);
  L('esp.2', [
    ['dep', 'Deportivo La Coruña', 'DEP', 66, 68, 60, 72, 74],
    ['rac', 'Racing Santander', 'RAC', 66, 60, 56, 66, 72],
    ['zar', 'Real Zaragoza', 'ZAR', 63, 64, 56, 68, 70],
    ['spo', 'Sporting Gijón', 'SPG', 64, 62, 56, 72, 82],
    ['cad', 'Cádiz', 'CAD', 64, 58, 58, 66, 66],
    ['lpa', 'UD Las Palmas', 'LPA', 66, 62, 60, 72, 80],
    ['leg', 'CD Leganés', 'LEG', 64, 56, 56, 64, 64],
    ['vll', 'Real Valladolid', 'VLL', 64, 62, 58, 68, 68],
    ['alm', 'UD Almería', 'ALM', 65, 58, 62, 70, 70],
    ['gra', 'Granada', 'GRA', 64, 60, 58, 68, 68],
    ['eib', 'SD Eibar', 'EIB', 63, 56, 54, 66, 70],
    ['hue', 'SD Huesca', 'HUE', 61, 52, 50, 62, 68],
    ['mir', 'CD Mirandés', 'MIR', 60, 48, 46, 58, 76],
    ['alb', 'Albacete', 'ALB', 59, 50, 46, 58, 64],
    ['mag', 'Málaga', 'MAG', 62, 62, 52, 66, 74],
    ['cas', 'CD Castellón', 'CAS', 59, 48, 48, 58, 62],
    ['bur', 'Burgos CF', 'BUR', 60, 48, 46, 58, 62],
    ['cor', 'Córdoba', 'COR', 59, 52, 46, 58, 64],
    ['and', 'FC Andorra', 'AND', 58, 46, 52, 60, 66],
    ['ceu', 'AD Ceuta', 'CEU', 57, 44, 44, 56, 62]
  ]);

  /* ── DEUTSCHLAND ─────────────────────────────────────────────────── */
  L('ger.1', [
    /* Leverkusen deutlich zurück: mit Wirtz, Frimpong, Xhaka und dem
       Trainer ging die halbe Meistermannschaft von 2024. Leipzig nach
       einer Saison ohne Europapokal ebenfalls tiefer, Mainz nach dem
       starken 24/25 höher als sein Etat vermuten lässt.               */
    ['bay', 'FC Bayern München', 'FCB', 94, 96, 96, 95, 58, '#DC052D'],
    ['bvb', 'Borussia Dortmund', 'BVB', 84, 92, 88, 92, 76, '#FDE100'],
    ['b04', 'Bayer 04 Leverkusen', 'B04', 82, 84, 80, 90, 74, '#E32221'],
    ['sge', 'Eintracht Frankfurt', 'SGE', 82, 79, 78, 82, 72, '#E1000F'],
    ['rbl', 'RB Leipzig', 'RBL', 80, 78, 86, 93, 80, '#DD0741'],
    ['vfb', 'VfB Stuttgart', 'VFB', 80, 78, 74, 84, 84, '#E32219'],
    ['scf', 'SC Freiburg', 'SCF', 78, 70, 68, 84, 86, '#000000'],
    ['m05', '1. FSV Mainz 05', 'M05', 77, 68, 64, 74, 80, '#C3141E'],
    ['svw', 'SV Werder Bremen', 'SVW', 74, 76, 66, 76, 76, '#1D9053'],
    ['wob', 'VfL Wolfsburg', 'WOB', 73, 70, 76, 84, 68, '#65B32E'],
    ['fca', 'FC Augsburg', 'FCA', 72, 62, 62, 74, 68, '#BA3733'],
    ['bmg', 'Borussia Mönchengladbach', 'BMG', 72, 76, 70, 82, 78, '#000000'],
    ['fcu', '1. FC Union Berlin', 'FCU', 71, 66, 64, 70, 62, '#EB1923'],
    ['tsg', 'TSG Hoffenheim', 'TSG', 70, 64, 70, 88, 82, '#1C63B7'],
    ['hsv', 'Hamburger SV', 'HSV', 70, 78, 66, 78, 74, '#0A2D6E'],
    ['koe', '1. FC Köln', 'KOE', 70, 74, 66, 78, 80, '#ED1C24'],
    ['stp', 'FC St. Pauli', 'STP', 69, 68, 56, 68, 68, '#614C3E'],
    ['fch', '1. FC Heidenheim', 'FCH', 68, 56, 52, 66, 64, '#E1001A']
  ]);
  L('ger.2', [
    ['s04', 'FC Schalke 04', 'S04', 70, 82, 68, 82, 78],
    ['bsc', 'Hertha BSC', 'BSC', 69, 74, 64, 78, 76],
    ['f95', 'Fortuna Düsseldorf', 'F95', 67, 62, 58, 70, 72],
    ['scp', 'SC Paderborn 07', 'SCP', 66, 54, 52, 66, 74],
    ['ksc', 'Karlsruher SC', 'KSC', 66, 58, 54, 68, 72],
    ['h96', 'Hannover 96', 'H96', 66, 66, 58, 72, 68],
    ['fck', '1. FC Kaiserslautern', 'FCK', 65, 68, 56, 68, 70],
    ['fcn', '1. FC Nürnberg', 'FCN', 65, 66, 56, 72, 76],
    ['sv98', 'SV Darmstadt 98', 'SVD', 64, 54, 52, 64, 66],
    ['ksv', 'Holstein Kiel', 'KSV', 64, 54, 52, 64, 72],
    ['bts', 'Eintracht Braunschweig', 'BTS', 62, 56, 48, 62, 66],
    ['elv', 'SV Elversberg', 'ELV', 64, 46, 46, 60, 74],
    ['sgf', 'SpVgg Greuther Fürth', 'SGF', 63, 54, 50, 66, 76],
    ['dsc', 'Arminia Bielefeld', 'DSC', 64, 58, 52, 66, 70],
    ['sgd', 'Dynamo Dresden', 'SGD', 62, 60, 50, 64, 66],
    ['boc', 'VfL Bochum', 'BOC', 66, 62, 56, 68, 68],
    ['pms', 'Preußen Münster', 'PMS', 61, 50, 46, 58, 66],
    ['fcm', '1. FC Magdeburg', 'FCM', 65, 54, 50, 64, 70]
  ]);

  /* ── ITALIEN ─────────────────────────────────────────────────────── */
  L('ita.1', [
    /* Napoli als Meister 24/25 auf Augenhöhe mit Inter. Milan tiefer:
       Platz 8 und keine europäische Teilnahme. Como steigt: mit Abstand
       der finanzstärkste Aufsteiger der letzten Jahre.                */
    ['nap', 'SSC Napoli', 'NAP', 89, 88, 86, 84, 58, '#12A0D7'],
    ['int', 'Inter', 'INT', 89, 91, 88, 89, 60, '#0068A8'],
    ['juv', 'Juventus', 'JUV', 85, 93, 88, 92, 68, '#000000'],
    ['mil', 'AC Milan', 'MIL', 85, 93, 86, 88, 62, '#FB090B'],
    ['ata', 'Atalanta', 'ATA', 84, 80, 80, 88, 84, '#1D4E9C'],
    ['rom', 'AS Roma', 'ROM', 82, 87, 80, 84, 70, '#8E1F2F'],
    ['bol', 'Bologna', 'BOL', 80, 74, 72, 78, 76, '#1A2F48'],
    ['laz', 'Lazio', 'LAZ', 79, 82, 74, 80, 64, '#87D8F7'],
    ['fio', 'Fiorentina', 'FIO', 79, 78, 74, 82, 72, '#592C82'],
    ['com', 'Como', 'COM', 77, 64, 78, 80, 64, '#0B3B7A'],
    ['tor', 'Torino', 'TOR', 74, 72, 66, 76, 74, '#8A1B1B'],
    ['udi', 'Udinese', 'UDI', 74, 68, 66, 78, 84, '#000000'],
    ['gen', 'Genoa', 'GEN', 72, 70, 62, 72, 72, '#B01B24'],
    ['cag', 'Cagliari', 'CAG', 71, 62, 58, 70, 76, '#B01B24'],
    ['sas', 'Sassuolo', 'SAS', 71, 60, 62, 78, 82, '#00A752'],
    ['par', 'Parma', 'PAR', 70, 66, 62, 74, 80, '#F7D117'],
    ['lec', 'Lecce', 'LEC', 69, 58, 54, 68, 74, '#E30613'],
    ['hel', 'Hellas Verona', 'HEL', 69, 62, 56, 68, 72, '#F1C40F'],
    ['pis', 'Pisa', 'PIS', 68, 56, 54, 66, 70, '#0B3B7A'],
    ['cre', 'Cremonese', 'CRE', 67, 54, 52, 66, 68, '#A31220']
  ]);
  L('ita.2', [
    ['pal', 'Palermo', 'PAL', 66, 62, 62, 70, 68],
    ['sam', 'Sampdoria', 'SAM', 64, 70, 58, 72, 74],
    ['ven', 'Venezia', 'VEN', 65, 56, 58, 68, 72],
    ['emp', 'Empoli', 'EMP', 66, 58, 56, 72, 88],
    ['mon', 'Monza', 'MON', 66, 58, 62, 72, 68],
    ['spe', 'Spezia', 'SPE', 65, 52, 52, 64, 70],
    ['bar', 'Bari', 'BAR', 63, 58, 56, 66, 66],
    ['fro', 'Frosinone', 'FRO', 62, 52, 50, 64, 74],
    ['cat', 'Catanzaro', 'CAT', 62, 48, 46, 60, 68],
    ['mod', 'Modena', 'MOD', 62, 50, 48, 62, 66],
    ['reg', 'Reggiana', 'REG', 60, 50, 46, 60, 66],
    ['ces', 'Cesena', 'CES', 61, 52, 48, 62, 72],
    ['sud', 'Südtirol', 'SUD', 60, 46, 46, 60, 64],
    ['jst', 'Juve Stabia', 'JST', 59, 44, 42, 56, 66],
    ['ave', 'Avellino', 'AVE', 60, 48, 46, 58, 64],
    ['pad', 'Padova', 'PAD', 59, 48, 46, 58, 66],
    ['pes', 'Pescara', 'PES', 59, 50, 46, 60, 72],
    ['crr', 'Carrarese', 'CRR', 58, 42, 42, 56, 64],
    ['man', 'Mantova', 'MAN', 58, 42, 42, 56, 64],
    ['ent', 'Virtus Entella', 'ENT', 58, 42, 42, 56, 66]
  ]);

  /* ── FRANKREICH ──────────────────────────────────────────────────── */
  L('fra.1', [
    /* PSG nach dem Triple mit Champions-League-Sieg 2025 auf dem Niveau
       von Real und Bayern. Lyon eine Stufe tiefer und mit deutlich
       engerer Kasse — die Lizenzauflagen der DNCG binden dort mehr als
       der Kader vermuten lässt.                                        */
    ['psg', 'Paris Saint-Germain', 'PSG', 95, 95, 97, 95, 68, '#004170'],
    ['mar', 'Olympique Marseille', 'OM', 83, 85, 80, 82, 62, '#2FAEE0'],
    ['mon', 'AS Monaco', 'ASM', 81, 78, 82, 88, 86, '#E63946'],
    ['lil', 'LOSC Lille', 'LIL', 80, 74, 72, 82, 82, '#E01E13'],
    ['lyo', 'Olympique Lyon', 'OL', 78, 84, 62, 88, 84, '#2B4C9B'],
    ['nic', 'OGC Nice', 'NIC', 77, 70, 74, 80, 76, '#C8102E'],
    ['str', 'RC Strasbourg', 'RCS', 77, 62, 70, 74, 88, '#0072BB'],
    ['len', 'RC Lens', 'RCL', 77, 70, 68, 76, 74, '#FFD700'],
    ['ren', 'Stade Rennais', 'REN', 75, 70, 74, 84, 82, '#E23C34'],
    ['tou', 'Toulouse FC', 'TOU', 72, 60, 58, 70, 80, '#7B1E7A'],
    ['bre', 'Stade Brestois', 'BRE', 71, 58, 56, 66, 68, '#E4032E'],
    ['nan', 'FC Nantes', 'NAN', 70, 68, 58, 72, 78, '#FCD800'],
    ['pfc', 'Paris FC', 'PFC', 70, 58, 72, 72, 72, '#0057A6'],
    ['aux', 'AJ Auxerre', 'AUX', 69, 60, 54, 70, 80, '#0058A8'],
    ['lor', 'FC Lorient', 'LOR', 68, 56, 52, 68, 80, '#F58220'],
    ['hav', 'Le Havre AC', 'HAV', 68, 56, 50, 68, 84, '#0B2B5B'],
    ['ang', 'Angers SCO', 'ANG', 67, 54, 50, 64, 74, '#000000'],
    ['met', 'FC Metz', 'MET', 67, 56, 50, 68, 84, '#8B1B3A']
  ]);
  L('fra.2', [
    ['ste', 'AS Saint-Étienne', 'STE', 68, 72, 62, 74, 82],
    ['rei', 'Stade Reims', 'REI', 67, 60, 58, 70, 76],
    ['mhs', 'Montpellier HSC', 'MHS', 66, 62, 58, 72, 80],
    ['tro', 'ESTAC Troyes', 'TRO', 63, 52, 56, 66, 72],
    ['gui', 'EA Guingamp', 'GUI', 62, 52, 48, 62, 74],
    ['ami', 'Amiens SC', 'AMI', 61, 48, 46, 60, 70],
    ['gre', 'Grenoble Foot', 'GRE', 61, 46, 44, 58, 70],
    ['pau', 'Pau FC', 'PAU', 59, 42, 42, 56, 68],
    ['rod', 'Rodez AF', 'ROD', 58, 40, 40, 54, 66],
    ['bas', 'SC Bastia', 'BAS', 60, 50, 44, 58, 70],
    ['clr', 'Clermont Foot', 'CLR', 61, 48, 46, 60, 72],
    ['dun', 'USL Dunkerque', 'DUN', 60, 42, 42, 56, 68],
    ['lav', 'Stade Lavallois', 'LAV', 59, 42, 40, 56, 68],
    ['rst', 'Red Star FC', 'RST', 58, 50, 42, 56, 70],
    ['ann', 'FC Annecy', 'ANN', 58, 40, 40, 54, 66],
    ['aca', 'AC Ajaccio', 'ACA', 58, 46, 42, 56, 68],
    ['ncy', 'AS Nancy', 'NAN', 58, 50, 42, 60, 74],
    ['man', 'Le Mans FC', 'LMS', 57, 44, 40, 56, 68]
  ]);

  /* ── PORTUGAL ────────────────────────────────────────────────────── */
  L('por.1', [
    /* Sporting mit zwei Meistertiteln in Folge knapp vorn, Porto nach
       einer titellosen Saison und grossem Umbruch dahinter.           */
    ['spo', 'Sporting CP', 'SCP', 85, 86, 78, 92, 90, '#008057'],
    ['ben', 'SL Benfica', 'BEN', 84, 88, 80, 92, 88, '#E30613'],
    ['fcp', 'FC Porto', 'FCP', 82, 88, 74, 88, 86, '#0033A0'],
    ['sbr', 'SC Braga', 'BRA', 78, 72, 66, 82, 84, '#E30613'],
    ['vsc', 'Vitória SC', 'VSC', 73, 66, 58, 74, 86, '#FFFFFF'],
    ['fam', 'FC Famalicão', 'FAM', 71, 54, 54, 68, 80, '#0B3B7A'],
    ['mor', 'Moreirense', 'MOR', 68, 50, 48, 62, 76, '#0B7A3B'],
    ['sca', 'Santa Clara', 'SCL', 67, 48, 46, 60, 74, '#E30613'],
    ['est', 'Estoril Praia', 'EST', 68, 50, 48, 64, 82, '#FFD700'],
    ['cpi', 'Casa Pia AC', 'CPI', 66, 46, 44, 58, 74, '#000000'],
    ['gil', 'Gil Vicente', 'GIL', 67, 48, 46, 60, 76, '#E30613'],
    ['rio', 'Rio Ave', 'RIO', 67, 50, 46, 62, 78, '#0B7A3B'],
    ['aro', 'FC Arouca', 'ARO', 66, 46, 44, 58, 74, '#FFD700'],
    ['nac', 'CD Nacional', 'NAC', 64, 46, 42, 58, 74, '#000000'],
    ['eam', 'Estrela Amadora', 'EAM', 63, 44, 42, 56, 72, '#E30613'],
    ['avs', 'AVS', 'AVS', 62, 42, 42, 56, 70, '#0B3B7A'],
    ['ton', 'CD Tondela', 'TON', 62, 44, 42, 56, 72, '#FFD700'],
    ['alv', 'FC Alverca', 'ALV', 62, 42, 42, 56, 72, '#E30613']
  ]);
  L('por.2', [
    ['lei', 'União de Leiria', 'LEI', 58, 44, 40, 54, 74],
    ['tor', 'SC Torreense', 'TOR', 57, 40, 38, 52, 72],
    ['cha', 'GD Chaves', 'CHA', 59, 48, 42, 56, 74],
    ['pfr', 'FC Paços de Ferreira', 'PFR', 59, 50, 42, 58, 76],
    ['avi', 'Académico de Viseu', 'AVI', 57, 42, 38, 54, 72],
    ['fei', 'CD Feirense', 'FEI', 57, 44, 38, 54, 74],
    ['mar', 'CS Marítimo', 'MAR', 60, 54, 44, 60, 78],
    ['ptm', 'Portimonense', 'PTM', 59, 48, 42, 58, 76],
    ['far', 'SC Farense', 'FAR', 58, 46, 40, 56, 74],
    ['pen', 'FC Penafiel', 'PEN', 56, 40, 36, 52, 72],
    ['viz', 'FC Vizela', 'VIZ', 58, 44, 40, 56, 74],
    ['lei2', 'Leixões SC', 'LEX', 57, 42, 38, 54, 76],
    ['mafra', 'CD Mafra', 'MAF', 55, 38, 36, 52, 72],
    ['bel', 'Belenenses', 'BEL', 56, 48, 38, 56, 78],
    ['tri', 'SC Covilhã', 'COV', 55, 38, 36, 52, 72],
    ['alv2', 'Lusitânia FC', 'LUS', 54, 36, 34, 50, 70]
  ]);

  /* ── NIEDERLANDE ─────────────────────────────────────────────────── */
  L('ned.1', [
    /* PSV klar vorn: Meister 24/25 nach dem Ajax-Einbruch im Endspurt.
       Go Ahead Eagles höher als der Etat sagt — Pokalsieg und Europa. */
    ['psv', 'PSV Eindhoven', 'PSV', 85, 84, 78, 90, 88, '#EE2A24'],
    ['aja', 'Ajax', 'AJA', 81, 89, 74, 94, 92, '#D2122E'],
    ['fey', 'Feyenoord', 'FEY', 80, 82, 72, 86, 86, '#E30613'],
    ['az', 'AZ Alkmaar', 'AZ', 77, 70, 64, 88, 92, '#E30613'],
    ['utr', 'FC Utrecht', 'UTR', 75, 64, 62, 78, 86, '#E30613'],
    ['twe', 'FC Twente', 'TWE', 74, 66, 60, 80, 86, '#E30613'],
    ['gae', 'Go Ahead Eagles', 'GAE', 72, 60, 54, 68, 84, '#E30613'],
    ['spa', 'Sparta Rotterdam', 'SPA', 68, 56, 50, 68, 84, '#E30613'],
    ['nec', 'NEC Nijmegen', 'NEC', 71, 58, 54, 72, 84, '#E30613'],
    ['hee', 'SC Heerenveen', 'HEE', 70, 58, 54, 76, 88, '#0B3B7A'],
    ['for', 'Fortuna Sittard', 'FOR', 67, 50, 48, 64, 80, '#FFD700'],
    ['pec', 'PEC Zwolle', 'PEC', 67, 52, 48, 66, 82, '#0B3B7A'],
    ['her', 'Heracles Almelo', 'HER', 66, 50, 46, 64, 80, '#000000'],
    ['gro', 'FC Groningen', 'GRO', 69, 58, 52, 74, 86, '#0B7A3B'],
    ['wil', 'Willem II', 'WIL', 66, 52, 46, 66, 82, '#E30613'],
    ['exc', 'Excelsior', 'EXC', 64, 46, 44, 62, 84, '#E30613'],
    ['nac', 'NAC Breda', 'NAC', 66, 52, 48, 66, 80, '#FFD700'],
    ['tel', 'Telstar', 'TEL', 62, 42, 40, 56, 78, '#FFFFFF']
  ]);
  L('ned.2', [
    ['gra', 'De Graafschap', 'GRA', 58, 46, 40, 58, 80],
    ['ado', 'ADO Den Haag', 'ADO', 59, 52, 42, 60, 80],
    ['rod', 'Roda JC', 'ROD', 58, 50, 40, 58, 80],
    ['vvv', 'VVV-Venlo', 'VVV', 57, 44, 38, 56, 80],
    ['ein', 'FC Eindhoven', 'EIN', 56, 42, 38, 56, 80],
    ['cam', 'SC Cambuur', 'CAM', 58, 46, 40, 58, 78],
    ['emm', 'FC Emmen', 'EMM', 58, 44, 40, 58, 78],
    ['alm', 'Almere City', 'ALM', 59, 44, 42, 58, 78],
    ['rkc', 'RKC Waalwijk', 'RKC', 60, 48, 44, 60, 80],
    ['vit', 'Vitesse', 'VIT', 60, 60, 44, 66, 84],
    ['mvv', 'MVV Maastricht', 'MVV', 55, 42, 36, 54, 78],
    ['hel', 'Helmond Sport', 'HEL', 54, 38, 34, 52, 78],
    ['top', 'TOP Oss', 'TOP', 54, 38, 34, 52, 78],
    ['dor', 'FC Dordrecht', 'DOR', 55, 40, 36, 54, 80],
    ['jaj', 'Jong Ajax', 'JAJ', 57, 50, 40, 90, 99],
    ['jps', 'Jong PSV', 'JPS', 57, 48, 40, 88, 99],
    ['jaz', 'Jong AZ', 'JAZ', 56, 44, 38, 86, 99],
    ['den', 'FC Den Bosch', 'DEN', 54, 40, 34, 52, 78]
  ]);

  /* ── TÜRKEI ──────────────────────────────────────────────────────── */
  L('tur.1', [
    /* Galatasaray mit drei Meistertiteln in Folge und den mit Abstand
       grössten Transfers der Liga vorn; Beşiktaş sportlich hinter dem
       eigenen Namen zurück.                                            */
    ['gal', 'Galatasaray', 'GAL', 85, 85, 84, 82, 56, '#A90432'],
    ['fen', 'Fenerbahçe', 'FEN', 83, 83, 82, 84, 60, '#FFED00'],
    ['bjk', 'Beşiktaş', 'BJK', 77, 80, 72, 78, 64, '#000000'],
    ['tra', 'Trabzonspor', 'TRA', 75, 74, 66, 76, 70, '#7A1B2B'],
    ['sam', 'Samsunspor', 'SAM', 74, 60, 60, 68, 66, '#E30613'],
    ['bas', 'İstanbul Başakşehir', 'IBS', 73, 62, 64, 76, 66, '#0B3B7A'],
    ['kon', 'Konyaspor', 'KON', 71, 56, 56, 66, 66, '#0B7A3B'],
    ['ant', 'Antalyaspor', 'ANT', 70, 56, 56, 66, 66, '#E30613'],
    ['ala', 'Alanyaspor', 'ALA', 70, 54, 56, 66, 64, '#F58220'],
    ['riz', 'Çaykur Rizespor', 'RIZ', 69, 52, 52, 64, 66, '#0B7A3B'],
    ['kay', 'Kayserispor', 'KAY', 68, 52, 52, 64, 66, '#FFD700'],
    ['gaz', 'Gaziantep FK', 'GAZ', 68, 50, 52, 62, 66, '#E30613'],
    ['goz', 'Göztepe', 'GOZ', 70, 54, 54, 66, 72, '#FFD700'],
    ['kas', 'Kasımpaşa', 'KAS', 67, 50, 50, 62, 66, '#0B3B7A'],
    ['eyu', 'Eyüpspor', 'EYU', 67, 48, 52, 62, 66, '#7A1B2B'],
    ['koc', 'Kocaelispor', 'KOC', 66, 50, 48, 60, 66, '#0B7A3B'],
    ['gen', 'Gençlerbirliği', 'GEN', 65, 52, 48, 62, 70, '#E30613'],
    ['kar', 'Fatih Karagümrük', 'KRG', 65, 48, 48, 60, 68, '#E30613']
  ]);
  L('tur.2', [
    ['ban', 'Bandırmaspor', 'BAN', 58, 42, 40, 54, 68],
    ['sak', 'Sakaryaspor', 'SAK', 59, 44, 42, 56, 68],
    ['erz', 'Erzurumspor FK', 'ERZ', 58, 44, 40, 54, 68],
    ['bol', 'Boluspor', 'BOL', 58, 44, 40, 54, 68],
    ['umr', 'Ümraniyespor', 'UMR', 57, 42, 40, 54, 68],
    ['man', 'Manisa FK', 'MAN', 58, 42, 40, 54, 70],
    ['kec', 'Keçiörengücü', 'KEC', 57, 40, 38, 52, 68],
    ['ada', 'Adana Demirspor', 'ADA', 61, 56, 46, 62, 72],
    ['ame', 'Amedspor', 'AME', 58, 46, 40, 54, 70],
    ['cor', 'Çorum FK', 'COR', 57, 40, 38, 52, 68],
    ['igd', 'Iğdır FK', 'IGD', 57, 38, 40, 52, 68],
    ['pen', 'Pendikspor', 'PEN', 58, 42, 40, 54, 68],
    ['hat', 'Hatayspor', 'HAT', 59, 48, 42, 58, 70],
    ['siv', 'Sivasspor', 'SIV', 62, 54, 46, 62, 70],
    ['bod', 'Bodrum FK', 'BOD', 58, 42, 42, 54, 68],
    ['ese', 'Esenler Erokspor', 'ESE', 56, 38, 38, 52, 68],
    ['ser', 'Serik Belediyespor', 'SER', 55, 36, 36, 50, 68],
    ['van', 'Vanspor FK', 'VAN', 55, 38, 36, 50, 68]
  ]);

  /* ── BELGIEN ─────────────────────────────────────────────────────── */
  L('bel.1', [
    ['clb', 'Club Brugge', 'CLB', 79, 76, 72, 84, 78, '#0B3B7A'],
    ['and', 'RSC Anderlecht', 'AND', 76, 78, 68, 84, 86, '#7A1B2B'],
    ['gnk', 'KRC Genk', 'GNK', 76, 68, 66, 86, 90, '#0B3B7A'],
    ['usg', 'Union Saint-Gilloise', 'USG', 77, 66, 66, 74, 74, '#FFD700'],
    ['ant', 'Royal Antwerp', 'ANT', 73, 64, 62, 74, 76, '#E30613'],
    ['gnt', 'KAA Gent', 'GNT', 74, 66, 62, 78, 80, '#0B3B7A'],
    ['stl', 'Standard Liège', 'STL', 71, 70, 58, 76, 82, '#E30613'],
    ['ceb', 'Cercle Brugge', 'CEB', 70, 54, 52, 68, 82, '#0B7A3B'],
    ['cha', 'Sporting Charleroi', 'CHA', 69, 54, 52, 66, 74, '#000000'],
    ['mec', 'KV Mechelen', 'MEC', 69, 54, 52, 68, 80, '#FFD700'],
    ['ohl', 'OH Leuven', 'OHL', 67, 50, 50, 66, 78, '#0B3B7A'],
    ['wes', 'KVC Westerlo', 'WES', 67, 48, 50, 66, 78, '#FFD700'],
    ['stt', 'Sint-Truiden', 'STT', 67, 50, 50, 66, 80, '#FFD700'],
    ['den', 'FCV Dender EH', 'DEN', 64, 42, 44, 60, 74, '#E30613'],
    ['zul', 'Zulte Waregem', 'ZUL', 66, 48, 48, 64, 78, '#E30613'],
    ['lal', 'RAAL La Louvière', 'LAL', 63, 42, 44, 58, 74, '#0B3B7A']
  ]);
  L('bel.2', [
    ['bee', 'Beerschot', 'BEE', 57, 48, 42, 56, 76],
    ['rwd', 'RWD Molenbeek', 'RWD', 57, 46, 42, 58, 76],
    ['lom', 'Lommel SK', 'LOM', 56, 42, 44, 60, 82],
    ['ser', 'RFC Seraing', 'SER', 55, 40, 38, 54, 76],
    ['lie', 'Lierse SK', 'LIE', 56, 44, 38, 56, 78],
    ['pat', 'Patro Eisden', 'PAT', 56, 40, 38, 54, 76],
    ['bev', 'SK Beveren', 'BEV', 57, 44, 40, 56, 78],
    ['nxt', 'Club NXT', 'NXT', 54, 40, 36, 84, 99],
    ['jgk', 'Jong Genk', 'JGK', 54, 40, 36, 84, 99],
    ['fut', 'RSCA Futures', 'FUT', 54, 42, 36, 84, 99],
    ['fbo', 'Francs Borains', 'FBO', 54, 36, 34, 52, 74],
    ['eup', 'KAS Eupen', 'EUP', 58, 48, 42, 60, 80],
    ['kor', 'KV Kortrijk', 'KOR', 59, 50, 44, 62, 78],
    ['dei', 'Olympic Charleroi', 'OLY', 54, 38, 34, 52, 74],
    ['hoo', 'Hoogstraten VV', 'HOO', 53, 34, 32, 50, 74],
    ['lvw', 'Lokeren-Temse', 'LOK', 55, 40, 36, 54, 76]
  ]);

  /* ── SCHWEIZ ─────────────────────────────────────────────────────── */
  L('sui.1', [
    ['yb', 'BSC Young Boys', 'YB', 74, 72, 66, 80, 78, '#FFD700'],
    ['bas', 'FC Basel', 'BAS', 74, 74, 66, 84, 86, '#E30613'],
    ['fcz', 'FC Zürich', 'FCZ', 69, 62, 56, 74, 84, '#0B3B7A'],
    ['ser', 'Servette FC', 'SER', 70, 62, 58, 72, 78, '#7A1B2B'],
    ['lug', 'FC Lugano', 'LUG', 70, 56, 56, 70, 74, '#000000'],
    ['stg', 'FC St. Gallen', 'STG', 69, 60, 54, 74, 86, '#0B7A3B'],
    ['luz', 'FC Luzern', 'LUZ', 68, 56, 52, 70, 82, '#0B3B7A'],
    ['lau', 'FC Lausanne-Sport', 'LAU', 67, 54, 54, 70, 80, '#0B3B7A'],
    ['gc', 'Grasshopper Club', 'GC', 66, 66, 52, 72, 84, '#0B3B7A'],
    ['sio', 'FC Sion', 'SIO', 67, 58, 54, 68, 76, '#E30613'],
    ['win', 'FC Winterthur', 'WIN', 63, 46, 44, 62, 80, '#E30613'],
    ['thu', 'FC Thun', 'THU', 65, 48, 46, 64, 84, '#E30613']
  ]);
  L('sui.2', [
    ['aar', 'FC Aarau', 'AAR', 58, 46, 40, 58, 82],
    ['xam', 'Neuchâtel Xamax', 'XAM', 58, 48, 40, 58, 80],
    ['vad', 'FC Vaduz', 'VAD', 57, 44, 42, 58, 78],
    ['wil', 'FC Wil 1900', 'WIL', 57, 42, 40, 58, 82],
    ['yve', 'Yverdon-Sport', 'YVE', 57, 42, 40, 56, 80],
    ['nyo', 'Stade Nyonnais', 'NYO', 54, 36, 34, 52, 78],
    ['sch', 'FC Schaffhausen', 'SCH', 55, 40, 36, 54, 80],
    ['car', 'Étoile Carouge', 'CAR', 54, 38, 34, 52, 78],
    ['bel', 'AC Bellinzona', 'BEL', 55, 40, 36, 54, 78],
    ['rap', 'FC Rapperswil-Jona', 'RAP', 54, 36, 34, 52, 80]
  ]);

  /* ── SCHOTTLAND ──────────────────────────────────────────────────── */
  L('sco.1', [
    ['cel', 'Celtic', 'CEL', 78, 82, 72, 82, 74, '#018749'],
    ['ran', 'Rangers', 'RAN', 75, 80, 68, 80, 72, '#0B3B7A'],
    ['hib', 'Hibernian', 'HIB', 68, 60, 54, 70, 80, '#018749'],
    ['abe', 'Aberdeen', 'ABE', 68, 62, 54, 70, 78, '#E30613'],
    ['hea', 'Heart of Midlothian', 'HEA', 69, 62, 56, 72, 78, '#7A1B2B'],
    ['dun', 'Dundee United', 'DUN', 65, 54, 48, 64, 78, '#F58220'],
    ['mot', 'Motherwell', 'MOT', 65, 52, 46, 64, 80, '#7A1B2B'],
    ['stm', 'St Mirren', 'STM', 64, 50, 44, 62, 78, '#0B3B7A'],
    ['kil', 'Kilmarnock', 'KIL', 63, 50, 44, 62, 78, '#0B3B7A'],
    ['dee', 'Dundee FC', 'DEE', 63, 50, 44, 62, 78, '#0B3B7A'],
    ['fal', 'Falkirk', 'FAL', 62, 46, 42, 58, 78, '#0B3B7A'],
    ['liv', 'Livingston', 'LIV', 62, 44, 42, 58, 78, '#FFD700']
  ]);
  L('sco.2', [
    ['ayr', 'Ayr United', 'AYR', 55, 40, 36, 52, 76],
    ['par', 'Partick Thistle', 'PAR', 56, 44, 38, 54, 78],
    ['rai', 'Raith Rovers', 'RAI', 56, 42, 36, 54, 76],
    ['mor', 'Greenock Morton', 'MOR', 54, 40, 34, 52, 76],
    ['dfl', 'Dunfermline Athletic', 'DFL', 55, 44, 36, 54, 78],
    ['qpk', "Queen's Park", 'QPK', 55, 44, 40, 58, 84],
    ['ros', 'Ross County', 'ROS', 58, 46, 40, 58, 76],
    ['stj', 'St Johnstone', 'STJ', 59, 50, 42, 60, 78],
    ['air', 'Airdrieonians', 'AIR', 53, 38, 32, 50, 76],
    ['arb', 'Arbroath', 'ARB', 52, 36, 32, 48, 74]
  ]);

  /* ── BRASILIEN ───────────────────────────────────────────────────── */
  L('bra.1', [
    /* Flamengo und Palmeiras spielen inzwischen in einer eigenen
       Gehaltsklasse. Santos und Corinthians dagegen sportlich weit unter
       ihrem Namen — Santos kämpfte zuletzt gegen den Abstieg, was die
       Schere zwischen `strength` und `prestige` gut zeigt. Mirassol
       steigt deutlich: der Aufsteiger spielte oben mit.               */
    ['fla', 'Flamengo', 'FLA', 87, 88, 84, 84, 76, '#E30613'],
    ['pal', 'Palmeiras', 'PAL', 85, 84, 82, 86, 88, '#0B7A3B'],
    ['cru', 'Cruzeiro', 'CRU', 80, 74, 72, 78, 82, '#0B3B7A'],
    ['bot', 'Botafogo', 'BOT', 78, 74, 72, 74, 74, '#000000'],
    ['cam', 'Atlético Mineiro', 'CAM', 77, 76, 72, 78, 78, '#000000'],
    ['flu', 'Fluminense', 'FLU', 77, 76, 64, 76, 84, '#7A1B2B'],
    ['bah', 'EC Bahia', 'BAH', 76, 66, 68, 76, 78, '#0B3B7A'],
    ['sao', 'São Paulo', 'SAO', 76, 82, 66, 82, 86, '#E30613'],
    ['cor', 'Corinthians', 'COR', 75, 84, 66, 78, 82, '#000000'],
    ['gre', 'Grêmio', 'GRE', 74, 78, 64, 78, 82, '#0B3B7A'],
    ['int', 'Internacional', 'INT', 74, 76, 64, 78, 84, '#E30613'],
    ['mir', 'Mirassol', 'MIR', 74, 52, 54, 62, 74, '#FFD700'],
    ['rbb', 'Red Bull Bragantino', 'RBB', 74, 58, 68, 80, 86, '#E30613'],
    ['for', 'Fortaleza', 'FOR', 73, 62, 60, 70, 72, '#0B3B7A'],
    ['vas', 'Vasco da Gama', 'VAS', 73, 74, 62, 72, 82, '#000000'],
    ['san', 'Santos', 'SAN', 70, 82, 58, 76, 92, '#FFFFFF'],
    ['vit', 'Vitória', 'VIT', 69, 56, 50, 64, 76, '#E30613'],
    ['cea', 'Ceará', 'CEA', 68, 54, 50, 64, 76, '#000000'],
    ['spo', 'Sport Recife', 'SPO', 67, 58, 50, 66, 78, '#E30613'],
    ['juv', 'Juventude', 'JUV', 67, 52, 48, 62, 74, '#0B7A3B']
  ]);
  L('bra.2', [
    ['cor', 'Coritiba', 'CTB', 64, 58, 50, 66, 80],
    ['cap', 'Athletico Paranaense', 'CAP', 68, 66, 58, 74, 84],
    ['goi', 'Goiás', 'GOI', 63, 54, 48, 62, 78],
    ['cha', 'Chapecoense', 'CHA', 62, 52, 46, 60, 76],
    ['nov', 'Novorizontino', 'NOV', 64, 44, 46, 58, 72],
    ['cri', 'Criciúma', 'CRI', 63, 48, 46, 60, 74],
    ['ava', 'Avaí', 'AVA', 62, 48, 44, 60, 76],
    ['cui', 'Cuiabá', 'CUI', 64, 50, 50, 62, 72],
    ['rem', 'Remo', 'REM', 61, 46, 42, 58, 74],
    ['ope', 'Operário Ferroviário', 'OPE', 60, 42, 40, 56, 72],
    ['fer', 'Ferroviária', 'FER', 60, 42, 40, 56, 74],
    ['ame', 'América Mineiro', 'AME', 63, 54, 48, 66, 86],
    ['vno', 'Vila Nova', 'VNO', 61, 44, 42, 58, 74],
    ['pay', 'Paysandu', 'PAY', 61, 48, 42, 58, 74],
    ['crb', 'CRB', 'CRB', 61, 44, 42, 58, 74],
    ['ath', 'Athletic Club', 'ATC', 59, 40, 40, 56, 72],
    ['amz', 'Amazonas', 'AMZ', 59, 40, 40, 56, 72],
    ['bsp', 'Botafogo-SP', 'BSP', 60, 44, 42, 58, 74],
    ['vre', 'Volta Redonda', 'VRE', 58, 40, 38, 54, 74],
    ['acg', 'Atlético Goianiense', 'ACG', 62, 48, 46, 60, 74]
  ]);

  /* ── ARGENTINIEN ─────────────────────────────────────────────────── */
  L('arg.1', [
    /* River knapp vor Boca; Racing nach dem Sudamericana-Titel und
       Estudiantes als Meister rücken auf, Boca sportlich hinter dem
       Namen. Argentinien ist die Liga mit dem höchsten `youthTrust` im
       Spiel — dort spielen Achtzehnjährige tatsächlich.               */
    ['riv', 'River Plate', 'RIV', 82, 88, 76, 86, 88, '#E30613'],
    ['boc', 'Boca Juniors', 'BOC', 80, 89, 74, 82, 86, '#0B3B7A'],
    ['rac', 'Racing Club', 'RAC', 79, 76, 66, 76, 82, '#7EC0EE'],
    ['est', 'Estudiantes', 'EST', 77, 72, 62, 76, 84, '#E30613'],
    ['vel', 'Vélez Sarsfield', 'VEL', 77, 70, 62, 78, 90, '#0B3B7A'],
    ['tal', 'Talleres', 'TAL', 74, 62, 62, 74, 80, '#0B3B7A'],
    ['lan', 'Lanús', 'LAN', 74, 64, 58, 74, 86, '#7A1B2B'],
    ['ind', 'Independiente', 'IND', 74, 74, 60, 74, 84, '#E30613'],
    ['roc', 'Rosario Central', 'ROC', 74, 64, 58, 72, 84, '#0B3B7A'],
    ['arg', 'Argentinos Juniors', 'ARG', 73, 60, 54, 74, 92, '#E30613'],
    ['sl', 'San Lorenzo', 'SL', 72, 70, 56, 72, 86, '#0B3B7A'],
    ['now', "Newell's Old Boys", 'NOB', 72, 66, 56, 74, 90, '#E30613'],
    ['dyj', 'Defensa y Justicia', 'DYJ', 72, 54, 54, 70, 86, '#FFD700'],
    ['hur', 'Huracán', 'HUR', 71, 58, 52, 68, 84, '#FFFFFF'],
    ['ban', 'Banfield', 'BAN', 70, 56, 50, 68, 88, '#0B7A3B'],
    ['bel', 'Belgrano', 'BEL', 70, 54, 50, 66, 82, '#7EC0EE'],
    ['god', 'Godoy Cruz', 'GOD', 69, 52, 48, 66, 82, '#0B3B7A'],
    ['tig', 'Tigre', 'TIG', 69, 52, 48, 66, 82, '#0B3B7A'],
    ['pla', 'Platense', 'PLA', 68, 50, 46, 64, 82, '#7A1B2B'],
    ['ins', 'Instituto', 'INS', 68, 50, 46, 64, 82, '#E30613']
  ]);
  L('arg.2', [
    ['gim', 'Gimnasia Mendoza', 'GIM', 58, 42, 38, 56, 82],
    ['mor', 'Deportivo Morón', 'MOR', 57, 40, 36, 54, 82],
    ['smt', 'San Martín Tucumán', 'SMT', 59, 46, 40, 58, 82],
    ['cha', 'Chacarita Juniors', 'CHA', 57, 44, 36, 56, 84],
    ['fer', 'Ferro Carril Oeste', 'FER', 58, 46, 38, 58, 84],
    ['col', 'Colón', 'COL', 62, 54, 46, 64, 84],
    ['alb', 'Almirante Brown', 'ALB', 56, 38, 34, 52, 80],
    ['nch', 'Nueva Chicago', 'NCH', 56, 40, 34, 52, 80],
    ['alb2', 'All Boys', 'ALL', 56, 40, 34, 52, 82],
    ['tem', 'Temperley', 'TEM', 55, 38, 34, 52, 80],
    ['atl', 'Atlanta', 'ATL', 56, 40, 34, 54, 82],
    ['erc', 'Estudiantes Río Cuarto', 'ERC', 55, 36, 34, 52, 80],
    ['qui', 'Quilmes', 'QUI', 58, 46, 38, 58, 84],
    ['los', 'Los Andes', 'LOS', 54, 36, 32, 50, 80],
    ['mad', 'Deportivo Madryn', 'MAD', 56, 38, 36, 54, 80],
    ['ste', 'San Telmo', 'STE', 55, 36, 34, 52, 80]
  ]);

  /* ── MEXIKO ──────────────────────────────────────────────────────── */
  L('mex.1', [
    ['ame', 'Club América', 'AME', 80, 82, 78, 82, 70, '#FFD700'],
    ['gua', 'CD Guadalajara', 'GDL', 76, 80, 72, 82, 88, '#E30613'],
    ['crz', 'Cruz Azul', 'CAZ', 78, 76, 72, 80, 74, '#0B3B7A'],
    ['tig', 'Tigres UANL', 'TIG', 79, 74, 78, 82, 68, '#FFD700'],
    ['mty', 'CF Monterrey', 'MTY', 79, 74, 80, 84, 70, '#0B3B7A'],
    ['pum', 'Pumas UNAM', 'PUM', 73, 72, 62, 78, 90, '#0B3B7A'],
    ['tol', 'Toluca', 'TOL', 77, 68, 68, 76, 76, '#E30613'],
    ['san', 'Santos Laguna', 'SAN', 71, 64, 62, 76, 80, '#0B7A3B'],
    ['pac', 'CF Pachuca', 'PAC', 76, 68, 68, 88, 92, '#0B3B7A'],
    ['leo', 'Club León', 'LEO', 73, 64, 64, 74, 78, '#0B7A3B'],
    ['atl', 'Atlas', 'ATL', 71, 62, 58, 72, 80, '#E30613'],
    ['nec', 'Club Necaxa', 'NEC', 69, 56, 56, 68, 76, '#E30613'],
    ['pue', 'Club Puebla', 'PUE', 67, 54, 52, 66, 76, '#0B3B7A'],
    ['que', 'Querétaro', 'QRO', 67, 52, 52, 64, 74, '#000000'],
    ['tij', 'Club Tijuana', 'TIJ', 69, 56, 58, 72, 82, '#E30613'],
    ['maz', 'Mazatlán FC', 'MAZ', 67, 48, 54, 66, 76, '#7A1B2B'],
    ['jua', 'FC Juárez', 'JUA', 68, 48, 54, 66, 74, '#0B7A3B'],
    ['asl', 'Atlético San Luis', 'ASL', 69, 52, 56, 68, 76, '#E30613']
  ]);
  L('mex.2', [
    ['atn', 'Atlante', 'ATE', 58, 50, 42, 58, 80],
    ['cor', 'Correcaminos', 'COR', 55, 38, 34, 52, 80],
    ['cel', 'Celaya', 'CEL', 57, 42, 38, 56, 80],
    ['tep', 'Tepatitlán', 'TEP', 55, 36, 34, 52, 80],
    ['dor', 'Dorados de Sinaloa', 'DOR', 57, 44, 38, 56, 80],
    ['leo', 'Leones Negros', 'LEN', 56, 42, 36, 56, 82],
    ['ven', 'Venados FC', 'VEN', 56, 40, 36, 54, 80],
    ['can', 'Cancún FC', 'CAN', 56, 40, 38, 54, 80],
    ['tla', 'Tlaxcala FC', 'TLA', 55, 36, 34, 52, 80],
    ['min', 'Mineros de Zacatecas', 'MIN', 56, 40, 36, 54, 80],
    ['ale', 'Alebrijes de Oaxaca', 'ALE', 56, 40, 36, 54, 80],
    ['cim', 'Cimarrones de Sonora', 'CIM', 55, 38, 34, 52, 80],
    ['ira', 'Irapuato', 'IRA', 55, 40, 34, 52, 80],
    ['tam', 'Tampico Madero', 'TAM', 55, 40, 34, 52, 80],
    ['mor', 'Atlético Morelia', 'MRL', 58, 48, 40, 58, 80],
    ['dur', 'Durango', 'DUR', 54, 36, 32, 50, 80]
  ]);

  /* ── USA ─────────────────────────────────────────────────────────── */
  L('usa.1', [
    ['mia', 'Inter Miami CF', 'MIA', 76, 84, 82, 78, 66, '#F7B5CD'],
    ['laf', 'Los Angeles FC', 'LAFC', 77, 74, 78, 80, 70, '#000000'],
    ['lag', 'LA Galaxy', 'LAG', 73, 74, 72, 78, 72, '#0B3B7A'],
    ['sea', 'Seattle Sounders', 'SEA', 74, 70, 68, 78, 74, '#0B7A3B'],
    ['clb', 'Columbus Crew', 'CLB', 75, 66, 68, 78, 76, '#FFD700'],
    ['cin', 'FC Cincinnati', 'CIN', 75, 62, 68, 76, 72, '#0B3B7A'],
    ['phi', 'Philadelphia Union', 'PHI', 73, 62, 62, 82, 92, '#0B3B7A'],
    ['atl', 'Atlanta United', 'ATL', 71, 68, 72, 78, 74, '#7A1B2B'],
    ['nyc', 'New York City FC', 'NYC', 72, 66, 70, 76, 76, '#7EC0EE'],
    ['rbn', 'New York Red Bulls', 'RBNY', 72, 64, 66, 80, 86, '#E30613'],
    ['por', 'Portland Timbers', 'POR', 71, 64, 64, 74, 72, '#0B7A3B'],
    ['rsl', 'Real Salt Lake', 'RSL', 71, 58, 62, 76, 80, '#7A1B2B'],
    ['aus', 'Austin FC', 'AUS', 70, 58, 64, 74, 74, '#0B7A3B'],
    ['nsh', 'Nashville SC', 'NSH', 71, 58, 64, 74, 72, '#FFD700'],
    ['orl', 'Orlando City', 'ORL', 72, 60, 66, 76, 76, '#7A1B2B'],
    ['tor', 'Toronto FC', 'TOR', 69, 64, 68, 74, 72, '#E30613'],
    ['van', 'Vancouver Whitecaps', 'VAN', 73, 60, 62, 74, 78, '#0B3B7A'],
    ['min', 'Minnesota United', 'MIN', 70, 56, 62, 72, 72, '#7EC0EE'],
    ['chi', 'Chicago Fire', 'CHI', 69, 60, 66, 74, 76, '#E30613'],
    ['skc', 'Sporting Kansas City', 'SKC', 69, 60, 62, 74, 76, '#7EC0EE']
  ]);
  L('usa.2', [
    ['lou', 'Louisville City FC', 'LOU', 60, 48, 44, 60, 82],
    ['sac', 'Sacramento Republic', 'SAC', 59, 46, 44, 58, 80],
    ['san', 'San Antonio FC', 'SAT', 59, 44, 44, 58, 80],
    ['ind', 'Indy Eleven', 'IND', 57, 42, 40, 56, 80],
    ['tam', 'Tampa Bay Rowdies', 'TBR', 58, 44, 42, 56, 80],
    ['phx', 'Phoenix Rising', 'PHX', 59, 46, 44, 58, 82],
    ['col', 'Colorado Springs Switchbacks', 'COS', 57, 40, 40, 56, 80],
    ['det', 'Detroit City FC', 'DET', 58, 46, 42, 56, 80],
    ['bir', 'Birmingham Legion', 'BHM', 57, 40, 40, 54, 80],
    ['chs', 'Charleston Battery', 'CHS', 58, 42, 40, 56, 82],
    ['pit', 'Pittsburgh Riverhounds', 'PIT', 57, 40, 40, 54, 80],
    ['rhi', 'Rhode Island FC', 'RIFC', 56, 38, 40, 54, 80],
    ['har', 'Hartford Athletic', 'HFD', 56, 38, 38, 54, 80],
    ['mem', 'Memphis 901 FC', 'MEM', 57, 40, 40, 54, 80],
    ['ocs', 'Orange County SC', 'OCSC', 58, 42, 40, 58, 86],
    ['elp', 'El Paso Locomotive', 'ELP', 57, 40, 40, 54, 80]
  ]);

  /* ── SAUDI-ARABIEN ───────────────────────────────────────────────── */
  L('ksa.1', [
    ['hil', 'Al-Hilal', 'HIL', 84, 78, 96, 84, 48, '#0B3B7A'],
    ['nas', 'Al-Nassr', 'NAS', 82, 78, 95, 82, 46, '#FFD700'],
    ['itt', 'Al-Ittihad', 'ITT', 81, 74, 92, 80, 48, '#FFD700'],
    ['ahl', 'Al-Ahli', 'AHL', 80, 72, 92, 80, 48, '#0B7A3B'],
    ['qad', 'Al-Qadsiah', 'QAD', 75, 58, 82, 74, 52, '#0B3B7A'],
    ['sha', 'Al-Shabab', 'SHA', 73, 62, 74, 72, 56, '#000000'],
    ['ett', 'Al-Ettifaq', 'ETT', 72, 58, 74, 70, 56, '#0B7A3B'],
    ['taa', 'Al-Taawoun', 'TAA', 71, 52, 66, 68, 58, '#FFD700'],
    ['kha', 'Al-Khaleej', 'KHA', 69, 48, 62, 66, 58, '#0B3B7A'],
    ['fat', 'Al-Fateh', 'FAT', 69, 50, 62, 66, 58, '#0B7A3B'],
    ['riy', 'Al-Riyadh', 'RIY', 68, 46, 60, 64, 58, '#7A1B2B'],
    ['fay', 'Al-Fayha', 'FAY', 68, 46, 60, 64, 58, '#0B3B7A'],
    ['okh', 'Al-Okhdood', 'OKH', 66, 42, 56, 62, 58, '#000000'],
    ['dam', 'Damac', 'DAM', 67, 44, 58, 62, 58, '#0B7A3B'],
    ['naj', 'Al-Najma', 'NAJ', 65, 42, 56, 60, 58, '#0B3B7A'],
    ['haz', 'Al-Hazem', 'HAZ', 65, 42, 54, 60, 58, '#FFD700'],
    ['kho', 'Al-Kholood', 'KHO', 65, 40, 56, 60, 58, '#7A1B2B'],
    ['neo', 'Neom SC', 'NEO', 72, 46, 78, 74, 52, '#0B3B7A']
  ]);
  L('ksa.2', [
    ['fai', 'Al-Faisaly', 'FAI', 57, 44, 46, 56, 62],
    ['weh', 'Al-Wehda', 'WEH', 58, 46, 48, 58, 62],
    ['jab', 'Al-Jabalain', 'JAB', 54, 36, 40, 52, 62],
    ['ohd', 'Ohod Club', 'OHD', 55, 40, 42, 54, 62],
    ['ada', 'Al-Adalah', 'ADA', 54, 36, 40, 52, 62],
    ['bat', 'Al-Batin', 'BAT', 55, 38, 42, 54, 62],
    ['ain', 'Al-Ain FC', 'AIN', 55, 38, 42, 54, 62],
    ['oro', 'Al-Orobah', 'ORO', 55, 38, 42, 54, 62],
    ['tai', 'Al-Tai', 'TAI', 56, 40, 44, 56, 62],
    ['ara', 'Al-Arabi', 'ARA', 54, 36, 40, 52, 62],
    ['jed', 'Jeddah Club', 'JED', 54, 36, 40, 52, 62],
    ['buk', 'Al-Bukayriyah', 'BUK', 53, 34, 38, 50, 62],
    ['haj', 'Hajer FC', 'HAJ', 53, 34, 38, 50, 62],
    ['nah', 'Al-Nahda', 'NAH', 54, 36, 40, 52, 62],
    ['zul', 'Al-Zulfi', 'ZUL', 53, 34, 38, 50, 62],
    ['saf', 'Al-Safa', 'SAF', 53, 34, 38, 50, 62]
  ]);

  FKC.data.clubs = clubs;

  var clubIndex = {};
  clubs.forEach(function (c) { clubIndex[c.id] = c; });

  FKC.data.clubById = function (id) { return clubIndex[id] || null; };

  /* ── Aktuelle Liga eines Vereins ──────────────────────────────────
     Vereine steigen im Lauf einer Karriere auf und ab. Die Zuordnung
     liegt deshalb nicht mehr fest in den Daten, sondern als Overlay im
     Spielstand (game.world.clubLeague). Die Basisdaten bleiben sauber,
     jede Karriere hat ihre eigene Liga-Welt.                        */

  FKC.data.leagueIdOf = function (club) {
    if (!club) return null;
    var g = FKC.state && FKC.state.game;
    var map = g && g.world && g.world.clubLeague;
    return (map && map[club.id]) || club.leagueId;
  };

  FKC.data.leagueOf = function (club) {
    return FKC.data.leagueById(FKC.data.leagueIdOf(club));
  };

  FKC.data.clubsOf = function (leagueId) {
    return clubs.filter(function (c) { return FKC.data.leagueIdOf(c) === leagueId; });
  };

  FKC.data.clubsOfCountry = function (country) {
    var ids = FKC.data.leaguesOf(country).map(function (l) { return l.id; });
    return clubs.filter(function (c) { return ids.indexOf(FKC.data.leagueIdOf(c)) >= 0; });
  };

  /** Gesamtniveau eines Vereins: Vereinsstärke gewichtet mit Liganiveau */
  FKC.data.clubLevel = function (club) {
    var lg = FKC.data.leagueOf(club);
    return Math.round(club.strength * 0.7 + (lg ? lg.strength : 60) * 0.3);
  };

  /** Vereine mit ernsthafter Nachwuchsarbeit (NLZ / Akademie) */
  FKC.data.academyClubs = function (country) {
    var pool = country ? FKC.data.clubsOfCountry(country) : clubs;
    return pool.filter(function (c) {
      return c.facilities >= 60 && c.youthTrust >= 60;
    });
  };

})(window.FKC);
