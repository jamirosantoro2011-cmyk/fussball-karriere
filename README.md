# Fussball-Karriere-Simulator

Ein Karriere-Lebenssimulator im Browser: vom sechsjährigen Kind im Dorfverein
über Stützpunkt und Nachwuchsleistungszentrum bis zum Profivertrag — und
später bis zum Karriereende.

## Starten

`index.html` doppelklicken. Keine Installation, kein Build, kein Server nötig
(bewusst klassische `<script>`-Tags statt ES-Modulen, damit `file://` funktioniert).

Beim ersten Öffnen fragt die Seite nach einem **Zugangscode** — die gültigen
Codes stehen ganz oben in `js/core/gate.js`. Siehe *Zugangssperre* weiter unten.

Zuverlässiger ist der Weg über einen lokalen Server, weil manche Browser bei
`file://` den Speicher beim Schliessen leeren — und dort liegt sowohl der
Spielstand als auch der gemerkte Zugangscode:

```powershell
powershell -ExecutionPolicy Bypass -File .\serve.ps1
```

Dann <http://localhost:8777> öffnen.

## Veröffentlichen

`build.ps1` erzeugt `dist\` — vier Dateien, die auf jeden Webspace passen.
Der komplette Weg (GitHub Pages oder Cloudflare Pages) steht in
**[DEPLOY.md](DEPLOY.md)**.

## Aufbau

```
index.html          Ladereihenfolge der Skripte (Daten → Core → Engine → UI)
build.ps1           Erzeugt dist\ für die Veröffentlichung
serve.ps1           Lokaler Testserver
DEPLOY.md           Anleitung zum Hochladen
css/                tokens (Farben/Typo) · gate (Sperre) · layout (Shell) ·
                    components (Bausteine)
data/               Ligen, Vereine, Nationen, Flaggen, Namen, Positionen,
                    Nachwuchsweg, Charakterzüge und Ereignisse — reine Daten
i18n/               de.js / en.js — identische Schlüsselmengen, flache Keys
js/core/            Zugangssperre (gate.js), RNG (seeded), State,
                    Save (localStorage), i18n
js/engine/          Attribute, Entwicklung, Effekte, Ereignisse, Karriere-Phasen,
                    Trikot und Rückennummern (kit.js)
js/ui/              Router, Bausteine, Screens
```

### Wichtige Konventionen

- Alles hängt am globalen Objekt `FKC`. Neue Dateien in `index.html` an der
  passenden Stelle einhängen — die Reihenfolge zählt.
- Kein Text steht im Code. Jeder sichtbare String ist ein i18n-Schlüssel und
  liegt in `i18n/de.js` **und** `i18n/en.js`. Fehlende Schlüssel meldet die
  Konsole; `FKC.i18n.missingKeys()` listet sie auf.
- Ereignisse und Entscheidungen liefern **deklarative Effektlisten**
  (`{type:'attr', key:'shooting', delta:+2}`). Dadurch lassen sie sich anwenden
  und automatisch als Chips anzeigen. Effekttypen stehen in `js/engine/effects.js`.
- Der RNG-Zustand liegt im Spielstand. Eine Karriere ist damit reproduzierbar,
  und ein Neuladen würfelt ein bereits gesehenes Ereignis nicht neu aus.

## Zahlenmodell

- **Jede Karriere startet mit OVR 50.** `FKC.attributes.startingSet()` würfelt
  die Attribute und kalibriert sie anschliessend über `A.calibrate()` exakt auf
  diesen Wert — der Spezialisten-Bonus im OVR ist nicht linear, deshalb die
  Iteration.
- Attribute 1–99, OVR positionsgewichtet (`data/positions.js`). Torhüter haben
  ein eigenes Attributset.
- **Playstyle**: eine Signaturstärke passend zur Position (`data/positions.js`,
  `FKC.data.playstyles`). Startet 9–13 Punkte über dem Rest, wächst mit
  Faktor 1.7 und darf die Alterskurve um 8 Punkte überschreiten.
- `hidden.potential` ist der Wert am **Zenit**, nicht beim Profidebüt, und eine
  harte Obergrenze — auch Entwicklungsboni aus Ereignissen kommen nicht darüber
  hinaus. Nur Verletzungen können das Potenzial nachträglich senken (dann liegt
  der historische Höchstwert über dem verbliebenen Potenzial, das ist gewollt).

### Positionswahl auf dem Spielfeld

Die Position wird nicht aus einer Liste gewählt, sondern direkt auf einem
gezeichneten Spielfeld angetippt (`FKC.ui.art.pitch()`). Das Feld ist ein SVG
im Raster 300 × 420 mit Mähstreifen, Strafräumen, Anstosskreis und
Elfmeterbögen; die zehn Positionen stehen als `A.PITCH_SPOTS` in Feldprozent,
eigenes Tor unten.

Jede Marke besteht aus drei Kreisen: eine unsichtbare Trefferfläche (r 26),
der Ring und der Punkt mit dem Kürzel. Die Trefferfläche ist bewusst deutlich
grösser als der sichtbare Punkt — auf dem Handy sind das 59 px, auf dem Desktop
66 px, klar über den 44 px, die man für einen Daumen braucht.

Beim Klick wird **nicht** der ganze Screen neu gezeichnet
(`selectPosition()` in `js/ui/screens/create.js`), sondern nur die Klasse
`is-on` umgehängt und der Textkasten darunter ersetzt. Sonst springt die Seite
bei jedem Klick an den Anfang zurück. Bedienbar ist das Feld auch per Tastatur:
jede Marke hat `tabindex`, Enter und Leertaste wählen aus.

`.pitch-wrap` ist auf 380 px Breite begrenzt — bei voller Breite wäre das Feld
auf dem Desktop über 800 px hoch und würde den Rest der Charaktererstellung
wegschieben.

### Startpunkt der Karriere

Bei der Charaktererstellung wird neben Wohlstand und Rückhalt der Familie auch
gewählt, **wo** die Ausbildung beginnt. Der Verein kommt immer aus dem
gewählten Herkunftsland (`youth.startClub`):

| Wahl | Verein | Ausbildung | Konkurrenz |
|------|--------|-----------|-----------|
| `village` | generierter Dorf-/Amateurverein | einfach | kaum vorhanden |
| `nlz` | echter Profiverein aus dem Mittelfeld des Landes | solide | normal |
| `academy` | einer der vier besten Nachwuchsbetriebe des Landes | beste | hart |

Die Rangfolge für `nlz`/`academy` ergibt sich aus `facilities * 2 + prestige +
youthTrust`. Die vier Akademie-Adressen sind aus dem NLZ-Pool **ausgeschlossen**
— sonst landet man als „normaler Profiverein" plötzlich bei Flamengo.

Bei der Erstellung stehen drei konkrete Adressen zur Wahl
(`youth.startClubOptions`), stärkste zuerst. Jede Karte trägt einen Chip mit
dem gewählten Startpunkt und einen Niveaubalken:

> In kleinen Ländern spielen NLZ- und Akademievereine in **derselben** Liga —
> in der Schweiz stehen bei beiden Wegen Super-League-Vereine. Ohne
> Kategoriechip und Niveauanzeige sahen die beiden Auswahlen deshalb gleich
> aus, und die Wahl des Startpunkts wirkte folgenlos, obwohl die Bänder sich
> nie überschneiden.

Der Startpunkt wirkt an vier Stellen: Startverein und Umfeldqualität
(`growth.envQuality`), ein Entwicklungsbonus und Ansehen beim Start, ein
kleiner Versatz auf das Potenzial (`academy +3 / nlz +1 / village −2`, bewusst
klein — das Rohtalent bleibt die bestimmende Grösse) und die Härte der
Jugendkonkurrenz (`season.js` skaliert den Tabellenplatz mit dem Vereinsniveau).

Gemessen über je 30 Karrieren bis zum 19. Lebensjahr:

| Start | OVR mit 19 | Potenzial | Umfeld | Ansehen | Jugendspiele |
|-------|-----------|-----------|--------|---------|--------------|
| village | 63.0 | 70.7 | 67.2 | 33.5 | 173 |
| nlz | 65.8 | 74.1 | 72.4 | 35.9 | 147 |
| academy | 66.9 | 76.3 | 87.9 | 37.4 | 125 |

Die Akademie bildet also am besten aus, kostet aber deutlich Spielzeit — genau
der beabsichtigte Handel. Wer bereits in einem echten NLZ startet, bekommt bei
der Vereinswahl mit zwölf eine echte **„bleiben"-Option** mit den Zahlen des
eigenen Vereins (`stayReal`); ohne die wäre die Startwahl nach sechs Jahren
wieder wertlos gewesen.

### Die eine Frage: Potenzialsprung mit 16–18

Einmal pro Karriere kommt zwischen 16 und 18 jemand vorbei, der nicht die
Beine prüft, sondern den Kopf — ein Sichter, ein Nachwuchskoordinator, der
Athletiktrainer. Er stellt **eine Frage mit genau einer richtigen Antwort**
(`data/events/events.potential.js`, sechs Varianten, eine davon nur für
Torhüter). Wer richtig antwortet, macht einen Potenzialsprung, wie ihn die
normale Entwicklung nie hergibt.

Die Sprunghöhe hängt vom bereits festgelegten Potenzial ab — und **ab 85 fällt
sie deutlich grösser aus**:

```js
pot >= 85 : leap = clamp(round((99 - pot) * 0.62) + rng(3,7), 6, 14)
pot <  85 : leap = clamp(round((99 - pot) * 0.34) + 4,        4, 11)
```

| Potenzial | Sprung | danach | Wachstumsbonus |
|-----------|--------|--------|----------------|
| 70 | +11 | 81 | 10 |
| 84 | +9 | 93 | 9 |
| **85** | **+12…14** | 97–99 | **21** |
| **88** | **+11** | 99 | **20** |
| **92** | **+7** | 99 | **18** |

> Vorher lief die Formel rein über den Abstand zu 99 und fiel damit ausgerechnet
> bei den grössten Talenten am kleinsten aus: wer bei 88 stand, bekam 8 Punkte,
> wer bei 70 stand, elf. Genau verkehrt herum.

Der Wachstumsbonus ist bei den ≥85ern mehr als doppelt so hoch. Ohne ihn
verschiebt sich nur eine Obergrenze, die man erst mit fünfundzwanzig erreicht —
im Moment der Szene passiert dann gefühlt nichts.

Zwei Dinge, die dabei wichtig waren:

- **Der 50-%-Wurf passiert genau einmal**, in `C.beginYear` beim Erreichen von
  16 (`flags.potQuiz`), zusammen mit dem Jahr (`flags.potQuizAge`, 16–18).
  Er darf **nicht** in ein `when()` — Bedingungen werden bei jeder Prüfung neu
  ausgewertet und dürfen deshalb nie würfeln.
- **Die Szene braucht einen eigenen Slot** in `C.nextScene`, keinen Platz im
  allgemeinen Pool. Über den gezogen kam sie nur in 35 % der Karrieren vor,
  obwohl der Wurf 50 % sagt: sie konkurriert dort mit zwanzig anderen
  Ereignissen und hat nur zwei, drei Jahre Zeit. Derselbe Fall wie beim
  Mentor in Runde 10.

Gemessen über 240 Karrieren: die Szene kam in **50 %** vor, nie zweimal, alle
sechs Varianten traten auf. Höchstes Rating am Ende der Karriere:

| | Ø Peak-OVR |
|---|---|
| richtig geantwortet | **82.3** |
| falsch geantwortet | 72.5 |
| Szene kam nicht | 72.1 |

Die richtige Antwort ist also rund zehn Ratingpunkte wert; die falsche kostet
gegenüber „kam gar nicht" nichts. Das ist beabsichtigt — bestraft wird nicht,
belohnt schon.

### Titelfeier

Ein gewonnener Titel bekommt eine eigene Inszenierung statt einer Textzeile
(`js/ui/celebrate.js`): Lichtkegel, rotierender Strahlenkranz, der Pokal aus
`trophyart.js` gross in der Mitte, 46 Konfettistücke und ein kurzer Dreiklang.

Der Ton ist **per WebAudio erzeugt**, keine Audiodatei — nichts nachzuladen,
und unter `file://` funktioniert es genauso. Fehler bleiben still: ohne Ton
ist die Feier immer noch eine Feier.

Ausgelöst wird sie beim Saisonrückblick. Vorgemerkt wird sie in `render()`,
gestartet in `bind()` — so liegt sie über einem fertig gezeichneten
Bildschirm. Der Merker enthält **Karriere und Saison** (`meta.createdAt`),
nicht nur die Saison: sonst verschluckt eine zweite Karriere ihre erste
Feier, sobald sie dieselbe Saisonbezeichnung erreicht.

> WM- und EM-Titel stehen **nicht** in `record.titles` — `national.js`
> schreibt sie direkt in den Schrank. Ohne einen eigenen Zweig dafür liefe
> ausgerechnet der grösste Titel des Spiels ohne Feier durch. Über 16
> Karrieren geprüft: 129 von 129 Ehrungen werden gefeiert.

`prefers-reduced-motion` bekommt dieselbe Karte ohne Flug, Kreisel und
Konfetti, und sie schliesst früher.

### Verknüpfte Ereignisse

Ereignisse stehen nicht mehr nur nebeneinander. Über das Feld `follows`
hängt ein Ereignis an einem früheren — wahlweise an einer bestimmten Antwort
und innerhalb eines Altersfensters (`data/events/events.chains.js`):

```js
follows: { ev: 'social_media', choice: 'build', minGap: 2, maxGap: 12 }
follows: { any: [{ ev: 'mentor_farewell', minGap: 1, maxGap: 14 }, … ] }
```

Damit das funktioniert, merkt sich `events.resolve()` nicht nur **dass** ein
Ereignis vorkam (`flags['ev.<id>']` = Alter), sondern auch **wie** es ausging
(`flags['evc.<id>']` = gewählte Antwort). Ohne das könnte eine Folge nur auf
das Vorkommen reagieren, nicht auf die Entscheidung.

`maxGap` hält die Kette beisammen — eine Konsequenz nach fünfzehn Jahren
liest sich nicht mehr als Konsequenz.

Gebaut sind sechs Stränge:

| Auslöser | Folge | Abschluss |
|----------|-------|-----------|
| erster Berater (unterschrieben) | sein Versprechen von damals | — |
| erster Berater (abgelehnt) | ohne Berater geht es nicht ewig | — |
| Social Media aufgebaut | alte Posts holen dich ein | — |
| Jugendkonkurrent | er steht wieder gegenüber | — |
| schwere Jugendverletzung | es meldet sich wieder | was der Arzt nicht sagt |
| Mentor-Abschied | er ruft an, wenn es nicht läuft | — |

Dazu zwei Folgen, die nicht an einem Ereignis hängen, sondern am
Karrierezustand: die Frage nach dem Abschluss (wenn Schule zugunsten des
Balls zurückstand) und das Banner der Fans (bei niedriger Treue und
Fansympathie nach mehreren Wechseln).

Gemessen über 120 Karrieren: alle neun Folgeereignisse traten auf, im Schnitt
1,33 pro Karriere — und **kein einziges ohne seinen Auslöser**. Die dreistufige
Verletzungskette erreichte ihre letzte Stufe zweimal; eine Kette über drei
Ebenen soll selten sein.

### Ereignisse je Startpunkt

Die drei Startwege erzählen dieselbe Kindheit sehr verschieden, deshalb hat
jeder einen eigenen Satz Ereignisse (`data/events/events.start.js`).

Gesteuert wird das über ein Feld **`starts`** am Ereignis:

```js
{ id: 'vil_scout_visit', starts: ['village'], … }   // nur Dorfverein
{ id: 'winter_pitch',    starts: ['village', 'nlz'] } // Topakademie hat Halle
{ id: 'growth_spurt' }                              // ohne Feld: überall
```

Gefiltert wird **zentral** in `js/engine/events.js` (`startsMatch`), und zwar
für den Ereignispool *und* die festen Stationen — `C.dueSpine()` ruft dieselbe
Funktion auf. Genau daran hing der Fehler aus Runde 15: die Station mit sechs
Jahren erzählte vom Anmelden beim Dorfverein, auch wenn die Karriere im NLZ
begonnen hatte. Fehlt `origin.startKind` (Spielstände von vor Runde 11), gilt
`village`.

Jeder Weg hat jetzt eigene Stationen mit 6, 9 und 11 Jahren:

| Alter | village | nlz | academy |
|-------|---------|-----|---------|
| 6 | `first_ball` | `first_ball_nlz` | `first_ball_aca` |
| 9 | `support_invite` / `overlooked` | `nlz_first_review` | `aca_first_cut` |
| 11 | `academy_trial` | `nlz_step_up` | `aca_internal_ranking` |

> Alle drei Stationen mit elf Jahren **müssen** `trialGrade` setzen — davon
> hängen die Vereinsangebote mit zwölf ab (`C.buildClubOffers`).

Dazu je fünf eigene Zufallsereignisse:

- **Dorfverein** — der Sichter am Zaun, weite Anfahrten, ein Platz, der es
  nicht mehr lange macht, ein Trainer am Ende seines Wissens, ein Jahrgang,
  der sich aufzulösen droht
- **Topakademie** — dreissig gleich gute Talente, das Wappen auf der Brust,
  Heimweh im Ausland, der Tag im Mai mit den Gesprächen, ein Tag bei den Profis
- **NLZ** — der Entwicklungsplan, eine Anfrage aus einem grösseren NLZ, die
  Sichtung für die Junioren-Nationalmannschaft, Schule gegen Verein, der Sprung
  in die zweite Mannschaft

Gemessen über 75 Karrieren (25 je Startpunkt): **null** Ereignisse aus einem
fremden Startpunkt, die drei festen Stationen in 25 von 25 Fällen, und pro Weg
40–44 verschiedene Jugendereignisse bei rund 22 Szenen je Karriere. Der Pool
läuft in keinem Fall leer.

### Mentor

Beim Eintritt in die Nachwuchsabteilung wählt der Spieler einen von drei
Mentoren (`data/mentors.js`), jeder mit generiertem Namen und Rolle:

| Typ | Wirkung |
|-----|---------|
| technisch | Passspiel/Dribbling wachsen 1.75-fach gewichtet |
| physisch | Tempo/Physis wachsen 1.75-fach gewichtet |
| mental | stabilere Form: weniger Schwankung, höherer Boden, Formkrisen-Ereignis auf 45 % Gewicht |

Die Stärke hängt an der Bindung (`bond`, 0–100), die sich über die Momente
entwickelt. Der Mentor hat einen **eigenen Ereignis-Slot** pro Jugendjahr
(`tick.mentorDue`, 70 %) — ohne den ging er zwischen den allgemeinen
Ereignissen unter und tauchte nur in der Hälfte der Karrieren überhaupt auf.
Ergebnis: 3–4 Momente pro Karriere, Bindung streut über die ganze Spanne.

### Positionsprofil der Startwerte

`A.startingSet()` verteilt die Startattribute **nach Positionsgewicht**. Der
Abstand zwischen dem wichtigsten und dem unwichtigsten Attribut ist für jede
Position gleich gross (`SPREAD = 24`), dazwischen wird interpoliert; darauf
kommen σ = 3 Rauschen und der Playstyle-Bonus (+7…10).

> Vorher lief die Neigung über einen festen Faktor auf das Rohgewicht und ergab
> nur ±5 Punkte — **weniger als das Rauschen und weniger als der
> Playstyle-Bonus**. Ergebnis: in zwei von drei Karrieren war das stärkste
> Attribut nicht das der Position. Es gab Innenverteidiger mit Physis 61 und
> Zweikampf 48 und Torhüter, deren beste Anlage der Spielaufbau war.

Über 300 Karrieren je Position: das stärkste Attribut liegt zu **99 %** in den
Top 3 der Positionsgewichte, das schwächste zu **100 %** in den unteren 3, und
die Rangkorrelation zwischen Gewicht und Wert liegt bei **0.94**. Die
Signaturstärke färbt das Profil weiter ein, dreht es aber nicht mehr um.

### Talentklassen und die Verteilung der Verläufe

Zuerst fällt die Klasse, dann das Potenzial darin (`rollHidden` in
`data/traits.js`):

| Klasse | Anteil | Potenzial |
|--------|--------|-----------|
| `low` | 25 % | N(57, 5), 44–66 |
| `mid` | 50 % | N(70, 4), 64–78 |
| `high` | 25 % | N(84, 6), 77–99 |

Vorher lag über allem eine einzige Glockenkurve, und wie eine Karriere ausging,
hing vor allem daran, wie man spielte — die Verteilung der Verläufe war
Nebenprodukt statt Absicht. Der Familienrückhalt verschiebt jetzt nur noch
*innerhalb* der Klasse, sonst wäre sie wieder ausgehebelt.

Zielbild und Ergebnis, gemessen über drei Seed-Sätze zu je 140–150 Karrieren,
einmal mit überlegtem und einmal mit zufälligem Spiel:

| | schwach | mittel | stark |
|---|---------|--------|-------|
| Ziel | 25 % | 50 % | 25 % |
| gemessen (Mittel) | **24 %** | **51 %** | **26 %** |

Die Zuordnung der Verdikte zu den drei Stufen steht in `FKC.data.verdicts`;
die Grenzen `journeyman` (schwach→mittel) und `worldclass` (mittel→stark) sind
an der gemessenen Punkteverteilung geeicht. Ausnahmetalente
(`archetype: 'prodigy'`) bleiben mit 2–5 % die Seltenheit und sind eine
Teilmenge der starken Klasse, nicht deren Regel.

### Talent-Archetypen

Es gibt zwei Entwicklungsverläufe (`PROFILE` in `js/engine/growth.js`), gekoppelt
an das Potenzial:

- **standard** — klassische Peak-Kurve: Aufbau in der Jugend, bestes Alter
  25–31, danach spürbarer Rückgang (`declineMult` 1.2).
- **prodigy** — Ausnahmetalent: eigene, steilere `REACH`-Kurve plus
  `youthMult` 1.3 auf das Jahresbudget bis 19, dafür später Abbaubeginn (32)
  und gedämpfter Verfall (0.85).

Zugeteilt in `data/traits.js`: Potenzial ≥ 90 mit 60 % Chance, ≥ 86 mit 22 % —
zusammen mit dem seltenen Ausreisser in der Potenzialverteilung ergibt das
**rund 4 % Ausnahmetalente**.

Referenzkurven (Trainingsqualität 82, volle Spielzeit):

| Alter | 16 | 18 | 20 | 25 | 28 | 31 | 34 | 37 |
|-------|----|----|----|----|----|----|----|----|
| standard, Pot 75 | 63 | 65 | 68 | 73 | 74 | 73 | 70 | 64 |
| standard, Pot 90 | 69 | 74 | 78 | 85 | 85 | 84 | 80 | 75 |
| prodigy, Pot 90  | 79 | 85 | 86 | 88 | 88 | 88 | 88 | 85 |
- Jahresbudget (`CURVE`) mal Restabstand mal Umfeld mal Arbeitseinstellung.
  Ab 30 wird das Budget negativ — Tempo und Physis fallen zuerst.

**Körpergrösse** folgt dem Landesdurchschnitt (`nations.js`, Spalte `height`)
plus positionstypischer Abweichung (`FKC.data.heightBias`) plus 3 cm, weil
Profis grösser sind als die Gesamtbevölkerung. Die aktuelle Grösse ergibt sich
über `HEIGHT_CURVE` aus dem Alter — mit 16 sind es ~96.6 % der Endgrösse,
ausgewachsen ist man mit 19. `state.syncAge()` hält beides synchron.

### Vereinsstärke: an der Realität geeicht

`strength` bildet ab, was eine Mannschaft **heute** kann — nicht, wie gross
ihr Name ist. Grundlage sind, in dieser Reihenfolge: die Abschlusstabelle der
letzten vollen Saison, der laufende Formstand samt europäischer Beteiligung,
und Kaderwert plus Transferaktivität des letzten Sommers. Stand der Eichung
ist die Saison 2025/26.

Entscheidend ist, dass die drei Werte **getrennt** bleiben:

| Wert | bedeutet |
|------|----------|
| `strength` | was die Mannschaft heute auf dem Platz kann |
| `prestige` | was der Name wiegt (Medien, Fandruck, Reputationsgewinn) |
| `finances` | was der Verein zahlen kann |

Daraus entsteht die interessante Schere. Manchester United steht sportlich bei
79, im Ansehen aber bei 96 und im Etat bei 95: der Verein zahlt weiter
Spitzengehälter, ist aber kein sportlicher Selbstläufer mehr. Sevilla, Lyon
und Santos zeigen dieselbe Schere in die andere Richtung — grosser Name,
dünner Kader, enge Kasse.

Über 40 simulierte Saisons je Liga folgt der durchschnittliche Tabellenplatz
der Einstufung fast exakt (Rangkorrelation **0.983–0.998**). Stichproben aus
200 Saisons:

| Verein | Ø Platz | Titel | Europa | Abstiegsplatz |
|--------|---------|-------|--------|---------------|
| Bayer Leverkusen | 4.6 | 4 % | 57 % | 1 % |
| Manchester United | 10.6 | 0 % | 5 % | 3 % |
| Sevilla | 13.4 | 0 % | 0 % | 19 % |
| Santos | 14.6 | 0 % | 2 % | 28 % |
| Burnley | 17.8 | 0 % | 0 % | 67 % |

> **Wer nachjustiert, sollte ganze Ligen auf einmal durchgehen.** Stärke wirkt
> relativ innerhalb der Liga — ein einzelner geänderter Wert verschiebt die
> ganze Tabellensimulation.

Der Etat schlägt sich jetzt auch spürbar im Gehalt nieder. Mit dem alten
Faktor `0.5 + finances/95` lagen zwischen Real Oviedo (54) und Real Madrid
(98) nur das 1.4-fache; jetzt sind es rund 1.8, bei gleichem Mittelwert.

**Angebote skalieren mit dem Rating.** `T.marketLevel()` liegt bewusst dicht am
OVR; `sampleClubs()` filtert zusätzlich nach Prestige, sodass Spitzenklubs erst
ab genügend Bekanntheit überhaupt anfragen:

| OVR | angebotenes Vereinsniveau (Median) | typische Anfragen |
|-----|-----------------------------------|-------------------|
| 62  | 70                                | Heidenheim, Pisa, Rosario |
| 72  | 81                                | Atalanta, Newcastle, Flamengo |
| 82  | 92                                | Arsenal, Real, Barça, Bayern |
| 90  | 93                                | die europäische Spitze |

**Saisonablauf**: Vorbereitung → Saisonbilanz → Transferfenster, jede Saison.
Allgemeine Lebensereignisse kommen ab 18 nur alle zwei bis drei Jahre
(`flags.nextEventYear`), dafür mit harten Folgen.

## Umfang aktuell

- 16 Länder, 32 Ligen (je 1. und 2. Liga), 558 echte Vereine
- 16 nationale Pokale im echten K.-o.-Format über sechs Runden mit den
  Zweitligisten im Feld, 9 kontinentale Wettbewerbe (Champions League, Europa
  League und **Conference League** in Europa), 6 Nationalturniere
- 13 feste Stationen + 78 Zufallsereignisse, davon 21 nur für den jeweils
  gewählten Startpunkt, 6 Varianten der einmaligen Potenzialfrage und 9
  Folgeereignisse, die an früheren Entscheidungen hängen
- Bei der Charaktererstellung wählbar: Name, Land, Position auf dem Spielfeld,
  Fuss, Rückennummer, Herkunft, Startpunkt **und drei konkrete Startvereine**
- Titelfeier mit Konfetti, Strahlenkranz und erzeugtem Klang bei jedem
  gewonnenen Titel und jeder Auszeichnung
- Kindheit (6–11), Jugend (12–17), Profikarriere (ab 18), Karriereende mit
  Verdikt — wahlweise oben, oder ab 32 bewusst ausklingend beim kleinen
  Verein bis hinunter zum Dorfverein aus der Kindheit
- Trophäenschrank mit eigenen SVG-Pokalen: Meisterschale, Pokal, beide
  Kontinentalwettbewerbe, WM-Globus, Nationalturnier, Goldener Ball,
  Goldener Schuh, Medaille und Stern. Sieben individuelle Auszeichnungen:
  Fussballer des Jahres, Talent des Jahres (nur 16–19), Goldener Ball für
  ein Turnier, Goldener Schuh, bester Jugendspieler, bester
  Nachwuchsspieler und Spieler der Saison der Liga. **Alle** gewonnenen
  Titel werden angezeigt, mehrfach gewonnene mit Anzahl am Pokal
- Tabellenansicht **für alle 32 Ligen** im gewohnten Format — Platz, Verein mit
  Badge, Spiele, S/U/N, Tore, Tordifferenz, Punkte; sortiert nach Punkten und
  Tordifferenz, mit farbigen Zonen für Champions League, Europa League,
  Conference League, Aufstieg und Abstieg. Die Tabelle der eigenen Liga steht
  zusätzlich **direkt im Saisonrückblick**, unter der eigenen Platzierung.
  Erreichbar über das ☰-Menü, **ab dem ersten
  Karrierejahr** (die Profiwelt spielt auch während der Kindheit weiter).
  Für die eigene Liga zusätzlich Auf-/Abstiegsliste, Ligaphase und K.-o.-Weg im
  internationalen Wettbewerb, Pokalweg sowie Gruppentabelle und K.-o.-Runde
  bei WM/EM
- Auch Kindheit und Jugend haben eine Saisonbilanz (Spiele, Tore, Vorlagen,
  Ø-Note, Tabellenplatz der Juniorenmannschaft, Rolle im Team) und eine
  Potenzialanzeige als Spanne, die mit Alter und Ausbildung schmaler wird
- Auf- und Abstieg in allen 32 Ligen, unabhängig von der eigenen Karriere
- Karriereende mit aufgeschlüsselter Wertung und Stimmen von Fans, Experten,
  Mitspielern und Trainern
- Vereinswappen werden aus Vereinsfarbe, Initialen, Wappenform und Muster
  generiert (`FKC.ui.c.badge`) — deterministisch aus der Vereins-ID, bewusst
  keine Nachbildung echter Logos (siehe *Wappen und Pokale* weiter unten)
- Weitere generierte Grafik in `js/ui/art.js`, alles im selben Stil und ohne
  echte Vorlagen:
  - **Avatar** (`A.avatar`) mit vier Altersstufen — Kind, Jugendlicher,
    Erwachsener, Routinier; Hautton und Frisur aus dem Namen, Trikot aus den
    Vereinsfarben
  - **Flaggen** (`A.flag`) für alle 51 Nationen — als einziges Bildmaterial
    **originalgetreu** statt stilisiert (siehe *Landesflaggen* weiter unten)
  - **Karriere-Zeitstrahl** (`A.clubTimeline`) mit den Wappen aller Stationen
  - **Schlagzeilen-Karten** (`A.headline`) im Zeitungslook für Titel,
    Ballon d'Or, Sperren, Auf-/Abstieg und Vertragsunterschriften — jede mit
    einem **Kommentar des Reporters** (siehe unten)
  - **Verlaufsdiagramme** (`A.historyChart`) für Rating, Form und Marktwert —
    dafür hält `pushHistory` pro Jahr alle drei Werte fest
  - **Saison-Poster** (`A.seasonPoster`) am Ende jeder Saison

### Landesflaggen

Hier gilt bewusst die **umgekehrte** Regel zu Wappen und Trikots: Nationalflaggen
sind offizielle, gemeinfreie Hoheitszeichen, keine geschützten Designs. Sie
werden deshalb originalgetreu gezeichnet — echte Farben, echte Konstruktion,
echte Seitenverhältnisse.

Die Zeichnungen stehen in `data/flags.js`, jede in ihren **eigenen**
Konstruktionseinheiten: Deutschland 5 × 3, USA 19 × 10, die Schweiz 32 × 32,
Katar 28 × 11. `A.flag(code, breite)` rahmt und skaliert nur noch; die Höhe
folgt dem echten Verhältnis. Die Schweiz erscheint also quadratisch und Katar
sehr breit — genau richtig, und unproblematisch, weil im Spiel nie mehrere
Flaggen nebeneinander in einer Spalte stehen.

Umgesetzt sind alle 51 Nationen, davon rund 40 geometrisch exakt (Streifen,
Kreuze, Kantone, Dreiecke, Sterne — inklusive der 50 US-Sterne in der
6/5-Anordnung, des koreanischen Taegeuk mit den vier Trigrammen, der 27
brasilianischen Sterne und der neunzackigen Zackenlinie Katars). Wo ein
Staatswappen für 20 Pixel zu fein ist — Spanien, Portugal, Mexiko, Ägypten,
Serbien, Ecuador, Iran, Wales — steht eine bewusst reduzierte, aber
lagerichtige Zeichnung. Farben, Streifen und Geometrie stimmen überall.

Geprüft wird das nicht per Augenmass: `data/flags.js` lässt sich rastern und an
definierten Punkten abtasten. 149 Farbproben über alle 51 Flaggen — etwa
„Deutschland bei 15 % Höhe muss schwarz sein, bei 50 % rot, bei 85 % gold".
Genau so ist aufgefallen, dass Koreas Taegeuk auf dem Kopf stand.

Das Nationaltrikot (`FKC.kit.nationalDesign`) liest seine Farben über
`A.flagColors()` aus **derselben** Zeichnung, damit Flagge und Trikot nicht
auseinanderlaufen.

### Wie viele Entscheidungen eine Saison kostet

Zwischen zwei Spielzeiten sollen wenige, dafür schwere Entscheidungen stehen.
Gemessen über 202 Profisaisons:

| | vorher | jetzt |
|---|--------|-------|
| Trainingsschwerpunkt | 1.00 | 1.00 |
| Saisonplan | 1.00 | **0** (im Training) |
| Transferfenster | 1.00 | **0.69** |
| Rückennummer | 0.50 | 0.44 |
| Vertrag | 0.45 | 0.38 |
| Ereignis | 0.44 | 0.43 |
| **pro Saison** | **4.39** | **2.94** |

Drei Hebel dafür:

1. **Saisonplan und Trainingsschwerpunkt stehen auf einem Bildschirm.** Als
   eigene Szene war das eine Pflichtfrage mehr pro Saison. Der Plan ist jetzt
   ein Umschalter über den Trainingsoptionen; beides wird zusammen aufgelöst.
2. **Das Transferfenster öffnet nur, wenn etwas zu entscheiden ist**
   (`C.transferDue`): letztes Vertragsjahr, vertragslos, Wechselwunsch, ab 35,
   kaum Einsätze, schlechte Moral — oder wenn der Spieler seinem Verein um
   fünf Ratingpunkte entwachsen ist. Jedes Jahr zu fragen, während der Vertrag
   noch drei Jahre läuft und kein Angebot besser ist, war eine Frage ohne
   Inhalt.
3. **Die Rückennummer wird nur bei einem Vereinswechsel gewählt**, nicht bei
   einer Verlängerung — dort behält man sie ohnehin.

### Saisonvorbereitung: alles geben oder normal

Vor jeder Profisaison steht eine Grundsatzfrage (`kind: 'seasonPlan'`, vor der
Trainingswahl). Sie schreibt `status.seasonPlan`, ausgewertet in `season.js`:

| | Verletzungsrisiko | Pokal-/Europachance | Ø-Note | Team-Boost |
|---|---|---|---|---|
| Alles geben | **+5 / +3 Prozentpunkte** | +0.10 Perzentil | +0.16 | +1.6 |
| Wie immer | unverändert | — | — | — |

Der Handel ist bewusst spürbar in beide Richtungen: eine Saison alles zu geben
erhöht die Titelchance messbar, aber auch das Verletzungsrisiko.

### Verletzungen: 10 % leicht, 5 % schwer

`S.rollInjury()` zieht **einen** Wurf und teilt ihn auf: unterhalb der
Schwerverletzungsgrenze wird es ernst, darüber bis zur Gesamtgrenze leicht,
darüber passiert nichts. Grundwerte 10 % und 5 %; Anlage
(`injuryProneness`), Alter ab 32 und schlechte Fitness verschieben das, aber
nur in einem engen Rahmen (leicht 4–22 %, schwer 1.5–14 %).

| Fall | leicht | schwer |
|------|--------|--------|
| Standard (26 J., 45 Anlage, 70 Fitness) | 9.5 % | 4.8 % |
| jung und frisch (21 J., 35, 85) | 9.0 % | 4.0 % |
| alt und anfällig (34 J., 70, 55) | 15.2 % | 7.3 % |
| „Alles geben" | 14.8 % | 8.2 % |

Dauer: leicht 2–5 oder 6–14 Wochen, schwer 16–28 oder 32–46 Wochen. Ab 16
Wochen steigt die Anfälligkeit dauerhaft, ab 32 Wochen sinkt das Potenzial.
Über 1343 gespielte Saisons gemessen: **10.1 % leicht, 4.6 % schwer**. Vorher
lag die Gesamtquote bei 25 bis 35 %.

### Marktwert in echten Grössenordnungen

Die Kurve in `A.marketValue` ist an Transfermarkt-Niveaus geeicht:

| OVR | Marktwert |
|-----|-----------|
| 60 | rund 1 Mio. |
| 70 | rund 6 Mio. |
| 80 | rund 30 Mio. |
| 90 | rund 120 Mio. |

Der Exponent war mit 1.19 zu steil — ein Spieler mit 90 kam auf fast 300 Mio.,
während der reale Spitzenwert bei etwa 200 Mio. liegt. Jetzt 1.163, und über
OVR 88 flacht die Kurve zusätzlich ab: ganz oben wird der Markt dünn, weil nur
noch eine Handvoll Vereine zahlen kann. Jugendspieler bleiben im symbolischen
Bereich (ab der B-Jugend spürbar). Darauf wirken weiter Alterskurve,
Restpotenzial, Ligastärke, Restlaufzeit und Form.

### Goldener Schuh: gewichtet wie der European Golden Shoe

Tore werden nicht roh gezählt, sondern nach Ligastärke gewichtet
(`S.shoeFactor`) — wie beim echten Vorbild:

| Ligastärke | Faktor | Ligen |
|------------|--------|-------|
| ≥ 86 | **×2** | Premier League, LaLiga, Bundesliga, Serie A, Ligue 1 |
| 74–85 | **×1.5** | Brasilien, Portugal, Niederlande, Argentinien, Türkei, Mexiko, MLS |
| darunter | **×1** | alle übrigen |

Gewertet werden nur **Ligatore** — Pokal und Europapokal zählen nicht mit;
`line.goals` enthält alle Wettbewerbe, deshalb der Anteil der Ligaspiele.

Die europäische Bestmarke (`S.shoeMark`) liegt zwischen 48 und 68 Punkten, also
24–34 Toren in einer Spitzenliga. Aus einer schwachen Liga ist der Goldene
Schuh damit praktisch unerreichbar — und genau so ist die echte Auszeichnung
auch. Bei Punktegleichstand entscheiden der Reihe nach weniger Einsatzminuten,
mehr Vorlagen, weniger Elfmetertore.

Bei WM und EM (`national.js`) gilt weiter die einfache Torzahl gegen eine Marke
von 4 bis 7 Toren — die Grössenordnung eines Turnier-Torschützenkönigs.

### Die Auszeichnungen und wie sie sich unterscheiden

Fünf Preise, die im echten Fussball fünf verschiedene Dinge sind — und im Spiel
deshalb auch. Die IDs bleiben aus Kompatibilitätsgründen wie sie sind, die
Namen folgen dem realen Vorbild:

| ID | deutsch | englisch | wofür | Vorbild |
|----|---------|----------|-------|---------|
| `ballon` | Fussballer des Jahres | Player of the Year | beste Gesamtsaison, Verein **und** Nationalmannschaft | Ballon d'Or |
| `kopa` | Talent des Jahres | Young Player of the Year | dieselbe Leistung, aber nur **16 bis 19** | Kopa Trophy |
| `goldenBallTournament` | Goldener Ball | Golden Ball | bester Spieler **eines Turniers** | WM/EM-Goldener Ball |
| `goldenBoot` | Goldener Schuh | Golden Boot | gewichtete Ligatore einer Saison | European Golden Shoe |
| `youthPlayer` | Bester Jugendspieler | Youth Player of the Season | eigene Juniorentrophäe, ab 12 | — |
| `youngPlayer` | Bester Nachwuchsspieler | League Newcomer of the Season | Ligapreis für junge Profis | — |
| `teamOfSeason` | Spieler der Saison der Liga | League Player of the Season | Bestleistung innerhalb der eigenen Liga | — |

Der Goldene Ball war früher der Name der allgemeinen Saisonauszeichnung. Alte
Spielstände werden in `save.js` migriert (`playerOfSeason`, `goldenBall` →
`ballon`), damit dieselbe Trophäe nicht plötzlich zwei Bedeutungen hat.

Gemessen über 70 Karrieren quer durch alle Positionen:

| Peak-OVR | Karrieren | Fussballer d. J. | Talent d. J. | Goldener Schuh | Bester Jugendspieler |
|----------|-----------|------------------|--------------|----------------|----------------------|
| 90+ | 10 | 9 | 7 | 8 | 18 |
| 85–89 | 10 | 6 | 2 | 8 | 10 |
| 78–84 | 6 | 0 | 0 | 0 | 4 |
| unter 78 | 44 | 0 | 0 | 0 | 2 |

Die grossen Preise gehören ausschliesslich Weltklassekarrieren, die
Jugendtrophäe ist breiter gestreut, hängt aber ebenfalls am Talent.

**Alle Titel werden überall angezeigt.** Der Trophäenschrank im Hub zeigte
früher nur die letzten drei Pokale und zwei Auszeichnungen (`slice(-3)` /
`slice(-2)`), die Titelfeier höchstens vier Stück. Beide zeigen jetzt den
vollständigen Bestand, gruppiert nach Wettbewerb, mit der Anzahl als Marke am
Pokal (`3×`).

### Ballon d'Or: die drei echten Kriterien

`S.ballonScore()` bewertet die **ganze Saison**, Verein und Nationalmannschaft
zusammen, in der Gewichtung des echten Preises:

| Kriterium | Gewicht | fliesst ein |
|-----------|---------|-------------|
| individuelle Leistung | **55** | Tore, Vorlagen, Ø-Note, Einsatzzeit, Ligastärke |
| Mannschaftserfolge | **33** | Kontinentaltitel 15, Meisterschaft 11, Pokal 5, Turniersieg 14 |
| Klasse und Fair Play | **12** | Karten, Sperren, Disziplin |

Gewonnen hat, wer den Bestwert der Konkurrenz übertrifft (72–82, deterministisch
pro Saison). Vorher hing die Vergabe an Rating und einem Würfelwurf — eine
überragende Saison ohne Titel konnte damit gewinnen, eine mit Meisterschaft
und Champions League verlieren.

Gemessen: über 45 gemischte Karrieren mit Zufallsspiel **null** Goldene Schuhe
und **null** Ballons d'Or; bei einem Weltklassestürmer aus einer Topakademie
0.55 bzw. 0.85 pro Karriere. Beide Preise sind erreichbar, aber nur für eine
Karriere, die es wirklich hergibt.

### Karrierenote 0–100

Die Punktzahl des Verdikts reicht von 0 bis über 3000 und ist nach oben offen —
sie sagt niemandem etwas. `C.careerRating()` bildet sie über Stützpunkte auf
eine Skala 0–100 ab, die an den Verdikt-Schwellen ausgerichtet ist:

| Punkte | 0 | 165 | 340 | 720 | 1400 | 2600 |
|--------|---|-----|-----|-----|------|------|
| Note | 0 | **25** | 42 | **75** | 93 | 99 |

25 ist die Grenze schwach/mittel, 75 die Grenze mittel/stark. Ohne
entsprechendes Höchstrating ist die Spitze gedeckelt — dieselbe Regel, die auch
die Verdikte begrenzt (Peak < 70 → höchstens 62).

### Trikot und Rückennummer

`js/engine/kit.js` hält beides zusammen: welche Nummer man bekommen kann und
wie das Trikot aussieht, auf dem sie steht. Gezeichnet wird es in
`FKC.ui.art.shirtBack()` — Rückenansicht mit Name im Bogen und Nummer darunter.

Wie bei den Wappen ist das ein **eigenes** Design, kein Nachbau: übernommen
werden nur die Farbwelt und ein Musterstil aus sieben Varianten (schlicht,
Längsstreifen, Ringel, Schrägband, geteilt, Schulterjoch, Brustband).

> `clubs.js` kennt pro Verein nur **eine** Farbe — das reicht für ein Wappen,
> nicht für ein Trikot. Fast jedes echte Heimtrikot hat zwei Farben, und bei
> manchen Vereinen ist die gespeicherte Farbe gar nicht die Trikotfarbe (Real
> Madrid steht dort auf Gold, spielt aber in Weiss). Solange die Zweitfarbe als
> Helligkeitsvariante der ersten abgeleitet wurde, kam Juventus in Grau statt
> Schwarz-Weiss und Inter in zwei Blautönen statt Blau-Schwarz.

Deshalb gibt es in `kit.js` die Tabelle `HOME` mit den Heimfarben von rund
110 bekannten Vereinen als `[Grundfarbe, Zweitfarbe, Muster]`. Alle übrigen
Vereine bekommen als Zweitfarbe Weiss auf dunklem Grund bzw. Schwarz auf
hellem — immer zwei **verschiedene** Farben, nie zwei Töne derselben. Das Nationaltrikot nimmt die Farben aus der Flagge des
Herkunftslands (`A.flagColors`), wobei Schwarz und Weiss als **Grundfarbe**
übersprungen werden — sonst spielt Deutschland im schwarzen Trikot. Beide
bleiben als Akzent nutzbar.

Gezeigt wird das Trikot an vier Stellen: bei der Charaktererstellung (erstes
Trikot des Startvereins), bei jedem neuen Vertrag, bei jeder Verlängerung und
bei der ersten A-Nominierung. Dauerhaft steht es ausserdem im Hub unter
*Verein*.

**Die Nummer wird selbst gewählt.** Nach jeder Unterschrift kommt eine eigene
Szene (`kind: 'shirtNumber'`), verkettet über `p.next` an den Vertrag. Zur
Auswahl stehen 1–45 plus 50, 70 und 99; das Trikot daneben trägt die Nummer
sofort, man sieht also, was man wählt.

Belegt oder frei wird pro Nummer deterministisch aus Verein und Jahr gewürfelt,
nicht aus dem laufenden RNG — sonst änderte sich die Liste beim Neuzeichnen
derselben Szene. Die Wahrscheinlichkeiten bilden einen 25-Mann-Kader ab:

| Bereich | belegt |
|---------|--------|
| 1–11 | 60 % |
| 12–25 | 46 % |
| 26–45 | 16 % |
| 50 / 70 / 99 | 7 % |

Dazu vier feste Regeln: die **1** gehört dem Stammtorhüter (ausser man ist
selbst einer), die eigene Nummer bleibt bei einer Verlängerung **immer** frei,
die grossen Nummern **7, 9, 10, 11** bekommt nur, wer sich gegenüber dem
Vereinsniveau durchgesetzt hat (die 10 verlangt am meisten), und mindestens
eine positionstypische Nummer ist garantiert frei — sonst könnte ein Stürmer
in einem dichten Kader keine einzige Neunerreihe bekommen, und das liest sich
wie ein Fehler.

Gemessen über 120 Verein/Jahr-Kombinationen: von den Nummern 1–25 sind 4–17
frei (Median 12), insgesamt 23–37 von 48, und in keinem Fall fehlte eine
positionstypische Nummer.

### Wappen und Pokale

Beides ist selbst gezeichnet. Es wird **nichts** von anderen Seiten übernommen —
weder Logos noch Bilddateien noch Icons. Vorbild ist nur die Machart: klare
Silhouetten, ruhige Farben, eine ordentliche Präsentation. (Die Ausnahme sind
Landesflaggen — die sind gemeinfrei und deshalb originalgetreu, siehe oben.)

**Wappen** (`FKC.ui.c.badge`) setzen sich aus vier Formen (Spitzschild,
Rundwappen, moderner Schild, Sechseck) und sieben Mustern (schlicht,
Längsstreifen, Querbänder, Schrägband, geteilt, Winkel, Brustband) zusammen —
Form, Muster und Zweitfarbe kommen per Hash aus der Vereins-ID, ein Verein sieht
also überall gleich aus. Über 558 Vereine verteilen sich die vier Formen auf
138–144 und die sieben Muster auf 66–93 Vereine.

Die Zweitfarbe ist immer ein Ton **derselben** Vereinsfarbe oder ein weisser
Schleier — nie eine fremde Farbe, sonst zerfällt die Farbwelt einer Liga in
Konfetti. Dazu kommen ein Feldverlauf über drei Stopps, ein Glanzbogen oben, ein
Bodenschatten unten, eine dunkle Gravurkante und ein Metallrand. Das Kürzel
bekommt einen Kontrastsaum über `paint-order="stroke"` — mit einem zweiten
Textknoten stünde das Kürzel doppelt im Textinhalt der Seite.

**Pokale** (`js/ui/trophyart.js`) sind nach einem festen Schema aufgebaut:
Sockel (Stein mit Metalldeckplatte und Gravurstreifen) → Korpus im
Metallverlauf → Glanz- und Schattenkante → Spitzlicht. Die Metallverläufe haben
**fünf Stopps** statt zwei: Gold braucht die dunkle Zone zwischen zwei Lichtern,
sonst sieht es aus wie eine gelbe Fläche. Henkel und Stiele bekommen einen
eigenen, waagrechten Verlauf, weil der diagonale Körperverlauf an schmalen
Teilen kippt.

Wertigkeit entsteht dabei nicht allein im SVG: `.trophy-card` ist als kleine
Vitrine gebaut — Lichtkegel von oben, Podestschein unter dem Pokal, Kontaktschatten
und ein goldenes Zählabzeichen. Ein Pokal auf flachem Grund wirkt immer wie ein Icon.

### Kommentar des Reporters

Jede Schlagzeilen-Karte trägt unter der Meldung eine wertende Stimme — mal Lob,
mal Kritik, mal ein Achselzucken. Der Ton steht als `data-take`
(`good`/`bad`/`neutral`) am Kasten und färbt die linke Kante.

Die Texte liegen als `take.<art>.<n>` in den i18n-Dateien, der Ton daneben als
`take.<art>.<n>.tone`. Wie viele Varianten es je Art gibt, steht in der Tabelle
`TAKES` in `js/ui/screens/story.js` — **beides muss zusammenpassen**:

| Art | Varianten | Anlass |
|-----|-----------|--------|
| `champion` | 7 | Meistertitel |
| `cont` | 7 | Kontinentaler Titel |
| `ballon` | 6 | Weltfussballer des Jahres |
| `ban` | 5 | Sperre nach Skandal |
| `promoted` / `relegated` | je 5 | Auf- und Abstieg |
| `signed` | 9 | Vertragsunterschrift |

Variante und Reportername kommen aus `A.pickTake()` und `A.reporterFor()` —
beide leiten sich per `hash()` aus Saison und Art ab und **nicht** aus dem RNG.
Sonst hätte dieselbe Schlagzeile beim Neuzeichnen plötzlich einen anderen
Kommentar von einem anderen Reporter. Der Name stammt aus dem Namenspool des
Herkunftslands, ein Schweizer Spieler bekommt also Schweizer Reporter.

### Saisonablauf im Profibereich

Bewusst kurz gehalten — wenige, dafür schwere Entscheidungen:

```
Vorbereitung (Trainingsschwerpunkt)
  → Saison simulieren (Liga, Pokal, Europapokal, Nationalteam)
  → Saisonbilanz
  → 1–2 Ereignisse mit echten Folgen
  → Transferfenster (nur wenn relevant)
  → Jahreswechsel, ggf. Karriereende
```

### Liga-Welt: Auf- und Abstieg

`js/engine/world.js` rechnet **jede Saison alle 32 Ligen** durch, nicht nur die
des Spielers. Danach steigen pro Ligapaar 1–3 Vereine auf und ebenso viele ab
(`W.exchangeCount`, ~14 % der Ligagrösse). Ligagrössen bleiben dadurch stabil.

Die Zuordnung Verein → Liga liegt **nicht** mehr fest in `data/clubs.js`,
sondern als Overlay im Spielstand (`game.world.clubLeague`). Jede Karriere hat
so ihre eigene Liga-Welt; die Basisdaten bleiben unangetastet. Deshalb gilt:

> Nie `club.leagueId` direkt lesen. Immer `FKC.data.leagueOf(club)` bzw.
> `FKC.data.leagueIdOf(club)` benutzen — sonst zeigt die Anzeige die Liga von
> vor zehn Jahren.

Ein Absteiger verliert seinen Europapokalplatz; Auf- und Abstieg des eigenen
Vereins erscheinen im Saisonrückblick, im Zeitstrahl und in der Tabellenansicht
(dort für alle Vereine des Landes).

### Tabelle und eigene Platzierung stehen zusammen

Die Liga-Tabelle steht **im Saisonrückblick**, direkt unter der eigenen
Platzierung — nicht mehr nur auf einem eigenen Bildschirm, den man erst
aufsuchen muss. `tables.js` reicht `leagueTable()` und `viewRows()` als
`FKC.ui.leagueTable` / `FKC.ui.leagueRows` nach aussen, `story.js` benutzt
dieselbe Funktion. Eine zweite Umsetzung wäre sofort auseinandergelaufen.

Die eigene Zeile ist hervorgehoben (`tr.is-own`), die Zonen sind farbig
markiert und beschriftet: Champions League, Europa League, **Conference
League** (neu, `z.uecl`), Auf- und Abstieg.

### Nationale Pokale: echtes K.-o.-Format

Der Pokal läuft über **sechs Runden** statt fünf (`S.CUP_STAGES` mit der
zusätzlichen Stufe `r64`) und im Teilnehmerfeld stehen **alle Vereine des
Landes**, auch die der zweiten Liga (`FKC.data.clubsOfCountry`). In der ersten
Runde wird der Gegner bewusst *unterhalb* der eigenen Stärke gesucht, und die
Durchkommenswahrscheinlichkeit steigt dort um 34 Punkte — ein Erstligist
übersteht sie fast immer, und ein Ausscheiden ist die Schlagzeile, die es im
echten Pokal auch ist. Dazu ein Zufallsanteil von −12 bis +6 Prozentpunkten:
der Pokal hat seine eigenen Gesetze.

Die Schwierigkeit hängt am **Abstand zum Finale**, nicht am Listenindex —
sonst wäre der Pokal allein dadurch schwerer geworden, dass er eine Runde
mehr hat.

Gemessen über 1343 Saisons: 216× frühes Aus, 574× zweite Runde, 255×
Achtelfinale, 158× Viertelfinale, 83× Halbfinale, 32× Finale, 25× Titel.

### Qualifikation nach echten Häufigkeiten

**Nationalmannschaft:** `FKC.data.qualRate` in `data/nations.js` hält für rund
45 Nationen den Anteil der Endrunden, für die sie sich historisch qualifiziert
haben — getrennt nach WM und Kontinentalturnier. Das lässt sich nicht aus der
Mannschaftsstärke ableiten: Norwegen war seit 1998 bei keiner WM, Katar
erreicht die WM praktisch nie, aber den Asien-Cup fast immer.

| Nation | WM | Kontinental |
|--------|----|-------------|
| Deutschland, Brasilien | 100 % | 100 % |
| Italien | 77 % | 92 % |
| Japan | 85 % | 92 % |
| Katar | 15 % | 85 % |
| Norwegen | 15 % | 23 % |
| Schottland | 15 % | 31 % |

Fehlt ein Eintrag, wird aus der Stärke geschätzt (`N.qualChance`).

**Vereine:** Die Startplätze stehen als Dreiergruppe in `CONT_SLOTS`
(`data/leagues.js`) — Königsklasse, zweiter Wettbewerb, Conference League.
England 4/2/1, Frankreich 3/2/1, Schweiz 1/1/1. `S.qualification()` vergibt sie
der Reihe nach; der dritte Platz existiert nur dort, wo `FKC.data.contFor(conf, 3)`
einen Wettbewerb findet, also in Europa.

Die **UEFA Conference League** (`cont.uecl`) ist als dritter europäischer
Wettbewerb neu. Ihr Teilnehmerfeld ist deutlich schwächer, deshalb bekommt der
eigene Verein dort +32 Perzentilpunkte (Europa League: +18). Gemessen über 1343
Saisons: 38 Champions-League-, 50 Europa-League- und 36 Conference-League-Teilnahmen.

### Vertragssystem

Ein Vertrag besteht aus genau zwei Werten: **Laufzeit** und **Gehalt**.
Daraus folgt die Wechsellogik in `js/engine/transfer.js`:

- **Unter Vertrag** geht ein Wechsel nur, wenn sich die Vereine einigen
  (`T.clubsAgree`). Ein laufender Vertrag ist dabei ein echtes Hindernis:
  ohne einen der drei Hebel bleibt die Grundbereitschaft bei 5 %. Die drei
  Hebel sind:

  1. **Ausstiegsklausel** — wird beim Unterschreiben gewürfelt
     (`T.rollReleaseClause`, 2.2–4.5-facher Marktwert). Wie häufig es sie gibt,
     hängt am Land: Spanien 92 % (dort sind sie gesetzlich vorgeschrieben),
     Portugal/Brasilien/Argentinien 55 %, sonst 32 %. Zahlt der interessierte
     Verein die Klausel, ist der Wechsel **nicht verhandelbar** — er findet statt.
  2. **Letztes Vertragsjahr** — der Verein will keine Ablösefreiheit riskieren.
  3. **Wechselwunsch** (`transfer.demand`) — öffentlich um Freigabe bitten.
     Wirkt, kostet aber Fansympathie (−22), Vereinstreue (−25), Ansehen (−4)
     und Moral (−6) und bleibt bis zum nächsten Vertrag bestehen.

  Gemessen über 50 Karrieren, 541 tatsächliche Anfragen im Spiel:

  | Lage | Chance | tatsächlich zustande gekommen |
  |------|--------|-------------------------------|
  | kein Hebel erfüllt | 15 % | 16 % |
  | letztes Vertragsjahr | 82 % | 83 % |
  | Ablöseklausel gedeckt | 88 % | 77 % |
  | vertragslos | 82 % | 82 % |
  | **gesamt, Hebel erfüllt** | **75 %** | **75 %** |

  > Zwei Nachjustierungen stecken darin. Nach Runde 11 lagen die Werte bei
  > 9 / 15 / 57 % — so selten, dass ein Wechsel unter laufendem Vertrag
  > praktisch nicht mehr vorkam. Ursachen: die Grundbereitschaft lag bei 5 %,
  > und die **Ablöseklausel griff nie**, weil sie beim 2.2- bis 4.5-fachen
  > Marktwert lag, während die Kaufkraft selbst eines Spitzenvereins bei gut
  > 80 Mio. gedeckelt war. Danach kippte es ins Gegenteil: **97 %** aller
  > Anfragen gingen durch, weil „vertragslos" und „Klausel gedeckt" hart
  > `chance: 1` zurückgaben — und vier von fünf Transfers laufen über genau
  > diese beiden Wege. Beide würfeln jetzt ebenfalls (82 % bzw. 93 %):
  > Gehaltsverhandlung und Medizincheck können auch einen ablösefreien
  > Wechsel noch platzen lassen.

  **Jedes Angebot zeigt seine eigene Prozentzahl** (`transfer.chance`,
  farbcodiert ab 60 % grün / ab 30 % gelb). Die angezeigte Zahl ist dieselbe,
  die anschliessend gewürfelt wird — in der Messung oben decken sich Anzeige
  und Ausgang auf den Prozentpunkt.

  Die **Heimweh-Mechanik** bei Auslandswechseln (Runde 3) ist ersatzlos
  entfernt. Sie bestrafte eine Entscheidung, die der Spieler bewusst und aus
  gutem Grund getroffen hat.

  Dazu kommen Modifikatoren: Kapitäne werden ungern abgegeben (−12 %), wer
  deutlich besser ist als sein Verein, wird festgehalten (−1.6 % je OVR-Punkt
  über dem Vereinsniveau), ein Angebot klar über der Ablöseforderung hilft
  (bis +28 %). Die Ablöse selbst (`T.askingPrice`) hängt an Marktwert und
  Restlaufzeit.

- **Vertragslos** wechselt man ablösefrei, hat aber in der Verhandlung
  weniger Hebel — und bekommt mit steigendem Alter immer weniger Angebote.
- **Verhandeln** (`T.negotiate`): annehmen, mehr Gehalt fordern, längere
  Laufzeit fordern oder ablehnen. Jede weitere Runde kostet 0.34 Hebel,
  irgendwann zieht der Verein das Angebot zurück. Ein starker Spieler setzt
  sich in der ersten Runde zu ~65 % durch, ein Durchschnittsspieler zu ~10 %.
- **Ab 35** kommt im Transferfenster die Option dazu, die Karriere aktiv zu
  beenden. Wer keinen Vertrag mehr findet, kann eine Saison abwarten — das
  kostet Form, Fitness, Bekanntheit und Substanz.
- **Ab 32** steht daneben *Karriere ausklingen lassen* (siehe unten).

### Karriereausklang beim kleinen Verein

Ab 32 öffnet sich das Transferfenster jedes Jahr — in diesen Jahren ist die
Frage, wie es zu Ende geht, die einzige echte Entscheidung. Neben Bleiben und
Aufhören steht *Karriere ausklingen lassen*: dieselbe Liste, anderer Inhalt
(`T.windDownOffers`).

| # | Angebot | Bedingung |
|---|---------|-----------|
| 0 | beim aktuellen Verein bleiben | nur wenn der Ausklang schon läuft |
| 1 | **der Dorfverein aus der Kindheit** | existiert immer |
| 2 | der Jugend-/NLZ-Verein | nur wenn mindestens 4 Niveaustufen tiefer |
| 3 | zwei kleine Vereine der Heimat | Niveau unter `aktueller Verein − 8` |

Der Dorfverein liegt nur im Spielstand, nicht in `data/clubs.js`. Damit er ein
gültiges Wechselziel ist, lösen `FKC.state.clubById()` und `T.signContract()`
solche synthetischen Vereine mit auf — vorher lief die Heimkehr ins Leere.

Beim Amateurverein läuft eine **eigene Saison** (`S.amateurSeason`): Spielzeit,
Tore und Vorlagen, aber keine Tabelle, kein Pokal, kein Europapokal — der
Verein hat ja keine Liga. Der Klassenunterschied ist gedeckelt (`ueber` max.
2.4), sonst kam ein ehemaliger Weltklassestürmer auf 77 Saisontore; jetzt sind
41 das Maximum, 21 der Median.

`game.flags.windDown` hält den Zustand fest. Solange es gesetzt ist, fragt
`C.transferDue()` **nicht** mehr nach dem Niveauunterschied zum Verein —
sonst hätte der Auslöser „du bist deinem Verein entwachsen" die Heimkehr noch
im selben Jahr wieder aufgelöst, und dieselbe Karriere wäre unmittelbar zurück
in der zweiten Liga gelandet. Genau das ist beim ersten Anlauf passiert.

Gemessen: von 16 Karrieren, die den Ausklang konsequent wählen, enden **12 bis
13 beim Amateurverein**, mit 1 bis 5 Amateursaisons. Die übrigen hören vor 32
auf und bekommen die Option nie zu sehen.

### Transfers: Geld gegen Sport

Jedes Angebot hat drei sichtbare Achsen — *sportlich sinnvoll*, *finanziell*,
*Anpassungsrisiko*. Liegt Geld deutlich über Sport (> 25 Punkte Differenz),
folgt ein harter Formeinbruch, Fanverlust und eine Anpassungskrise über zwei
Saisons. Sportlich schlüssige Wechsel geben Form, Moral und Entwicklungsbonus.
Vereinstreue zahlt ab 5 Saisons mit der Kapitänsbinde und ab 8 mit
Legendenstatus. Wer kaum spielt, bekommt garantiert Ausweichangebote — sonst
versauert man auf der Tribüne eines zu grossen Vereins.

### Karriere-Verdikt

`FKC.career.scoreCareer()` setzt die Wertung aus fünf benannten Bereichen
zusammen, die der Rückblick einzeln ausweist: höchstes Rating (überproportional
gewichtet), Titel nach Art, Nationalmannschaft, Karrierestatistik und
individuelle Auszeichnungen.

Die Schwellen in `data/traits.js` haben zusätzlich ein **`minPeak`**: Ohne
entsprechendes Höchstrating gibt es die Spitzenstufen nicht, egal wie gross die
Zahlen sonst sind — sonst wird ein Vielspieler mit 300 Toren und Rating 77 zur
„unsterblichen Legende". Wer sein Potenzial um 12+ Punkte verfehlt hat und unter
500 Punkten bleibt, bekommt unabhängig davon „Unerfülltes Talent".

Über 16 Testkarrieren mit zufälligen Entscheidungen: 3× Kämpfer, 4× ehrliches
Handwerk, 1× solide, 3× grosser Name, 4× Weltklasse, 1× unerfülltes Talent —
Legende und unsterblich bleiben gutem Spiel vorbehalten.

Dazu liefert der Rückblick drei Perspektiven aus `data/voices.js`: eine
Fan-Stimme und je eine von Experte, ehemaligem Mitspieler und früherem Trainer,
mit generiertem Namen und Rolle. Die Auswahl hängt an den Kennzahlen der
Karriere (`FKC.career.voiceContext`).

## Zugangssperre

Die Seite ist nicht öffentlich. Vor dem Spiel steht ein Eingabefeld; erst mit
gültigem Code wird der Spielcode überhaupt geladen.

**Codes ändern:** ganz oben in `js/core/gate.js`, im Array `FKC_CODES`. Eine
Zeile dazu = neuer Code, Zeile weg = Zugang entzogen. Ein gemerkter Code wird
bei **jedem** Start neu gegen die Liste geprüft, ein gestrichener Code sperrt
also auch Geräte wieder aus, die schon freigeschaltet waren.

Gross-/Kleinschreibung und Leerzeichen sind egal, Bindestriche zählen mit:
`anpfiff 2026` öffnet `ANPFIFF-2026`, `ANPFIFF2026` nicht.

### Wie sie technisch greift

Die entscheidende Stelle ist, **wann** der Spielcode geholt wird:

- **Quellcode:** In `index.html` stehen die 60 Programmdateien als
  `<script data-src="…">` — ohne `src` lädt der Browser nichts. Erst nach
  richtigem Code macht `gate.js` daraus echte `<script src>`-Elemente.
  `async = false` erhält dabei die Reihenfolge; ohne das liefe `career.js`
  vor `rng.js`.
- **Build:** `a.js` enthält nur die Sperre, `g.js` das kodierte Spiel.
  `g.js` wird erst nach richtigem Code angefordert.

Beides wurde geprüft: Vor der Eingabe ist `window.FKC` `undefined` und `g.js`
taucht in den Netzwerkanfragen nicht auf.

Dazu kommen: Fehlermeldung statt Absturz bei falschem Code, zehn Sekunden
Pause nach fünf Fehlversuchen, `noindex, nofollow` gegen Suchmaschinen, und
ein Auffangnetz, das nach sechs Sekunden ohne geladenes Spiel eine
verständliche Meldung zeigt statt einer weissen Seite.

### Was das nicht ist

Kein Schutz. Wer einen gültigen Code hat, kann `g.js` speichern, den
Base64-Block dekodieren und die Codes im Klartext auslesen. Das ist keine
Schwäche dieser Umsetzung, sondern gilt für jede reine Browser-Lösung — alles,
was im Browser läuft, gehört dem, der den Browser bedient. Echter Schutz
bräuchte einen Server, der prüft und den Spielcode erst danach ausliefert.

Für den Zweck — ein Link, den man weitergibt, ohne dass ihn zufällig jemand
findet — reicht die Hürde.

### Minifizierung

`build.ps1` fasst alles zu vier Dateien zusammen und entfernt dabei sämtliche
Kommentare und Einrückungen: **1 009 278 → 795 290 Zeichen** JavaScript
(−21 %), **51 998 → 42 632** CSS (−18 %). Der grösste Effekt ist nicht die
Zahl, sondern dass der ganze erklärende Text verschwindet — und danach wird
das Ergebnis noch kodiert, sodass im Sources-Panel ein Datenblock steht statt
eines lesbaren Programms.

Der Minifizierer läuft als eingebettetes C# (`Add-Type`), aus zwei Gründen:
Ein zeichenweiser Durchlauf über 1 MB dauert in PowerShell selbst zig
Sekunden, und `continue` innerhalb eines `switch` verhält sich dort anders als
erwartet. Bewusst **kein** regulärer Ausdruck — ein Regex über JavaScript
verwechselt früher oder später einen Schrägstrich in einem String mit einem
Kommentarbeginn und zerlegt die Datei still.

Identifikatoren werden **nicht** umbenannt. Das bräuchte einen echten Parser;
von Hand wäre es die sicherste Art, das Spiel unbemerkt kaputtzumachen, weil
überall dynamisch auf Eigenschaften zugegriffen wird (`attributes[k]`,
`pos.w[k]`, Effekt-`type`-Strings). Nach dem Build laufen deshalb 25 volle
Karrieren gegen das kodierte Bündel, bevor irgendetwas hochgeladen wird.

## Admin-Panel

Erreichbar über den unauffälligen Punkt unten rechts oder **Umschalt+D**
(`js/ui/screens/admin.js`). Greift direkt in den Spielstand ein: Rating und
Einzelattribute, Potenzial, Alter, Form/Moral/Fitness/Ruf, Position, Geld,
Gehalt, Vertragslaufzeit und Kaderrolle, Verletzung setzen und heilen,
Vereinswechsel erzwingen, vertragslos machen, Titel und Auszeichnungen
hinzufügen oder den Schrank leeren, Nationalmannschaftsstatus, Saisons
überspringen, direkt zum Profivertrag springen, Karriere sofort beenden.

Zwei Regeln, die dort schon Ärger gemacht haben:

- Zahlenfelder wirken beim **`change`**, nicht beim Klick auf einen
  Aktionsknopf. Sonst schreibt ein späterer Klick veraltete Werte aus einem
  bereits neu gerenderten DOM zurück.
- `apply()` rechnet neu, speichert und rendert — jede Aktion muss darüber
  laufen, sonst driften Rating und Marktwert auseinander.

## Fehlersuche

`js/core/errors.js` wird als erstes Skript geladen und hängt sich an
`window.onerror` und `unhandledrejection`. Jeder unerwartete Fehler landet in
einem sichtbaren Panel am unteren Rand — mit Meldung, Datei, Zeile und Stack,
dazu Knöpfe zum Kopieren und zum Löschen des Spielstands. **Eine stille leere
Seite darf es nicht mehr geben.**

Dazu:

- `FKC.guard(label, fn, fallback)` kapselt einzelne Startschritte in `main.js`.
- `router.render()` fängt Fehler aus `render()` und `bind()` einzeln ab und
  zeigt statt des Screens eine Fehlerkarte — die App-Hülle bleibt bedienbar.
- `main.js` prüft beim Start, ob alle Programmteile geladen sind, und nennt die
  fehlenden namentlich (deckt eine nicht geladene Skriptdatei sofort auf).
- `save.isUsable()` prüft die Mindeststruktur eines Spielstands. Unvollständige
  Stände werden abgelehnt statt geladen; das Menü bietet dann an, sie zu löschen.

## Fallstricke, die schon einmal zugeschlagen haben

- **Screen-Knoten ersetzen, nicht nur `innerHTML` setzen.** `bind()` hängt bei
  jedem Render einen Listener an. Bleibt das Element bestehen, sammeln sich die
  Listener an und ein Klick löst N Aktionen aus. Siehe `js/ui/router.js`.
- **Alter niemals separat hochzählen.** Einzige Quelle ist `identity.year`;
  `FKC.state.advanceCalendar()` und `syncAge()` leiten Alter und Körpergrösse ab.
- **Obergrenze 99 an jeder Stelle prüfen.** Der Playstyle darf die Alterskurve
  überschreiten — aber `styleCap` muss trotzdem bei 99 gedeckelt werden, sonst
  laufen Einzelattribute darüber hinaus. `A.enforceCaps()` ist das Sicherheitsnetz.
- **Der Spielername liegt redundant in `meta.playerName`.** Beim Laden wird eine
  leere Identität daraus rekonstruiert (`save.migrate`), nie durch einen neuen
  Zufallsnamen ersetzt. `initDraft()` in der Charaktererstellung darf den
  globalen RNG nicht neu setzen — gewürfelt wird erst beim Anlegen.
- **`localStorage` unter `file://`** wird von manchen Browsern beim Schliessen
  geleert. Das Menü erkennt das über `fkc.lastPlayer` und weist darauf hin.
- **Reihenfolge in Formeln beachten.** `bonusPoints` wurden im Wachstum erst
  *nach* der Multiplikation mit dem Potenzialabstand addiert und hebelten die
  Obergrenze damit komplett aus — Spieler landeten 9 Punkte über ihrem
  Potenzial. Boni gehören ins Grundbudget, vor die Begrenzung.
- **Ein Feld, das nur gelesen und nie geschrieben wird, fällt nicht auf.**
  `league.contSlots` wurde in `season.qualification()` und in der
  Tabellenansicht ausgewertet, aber der Mapper in `data/leagues.js` hat es nie
  erzeugt. Ergebnis: Europapokal-Qualifikation über die Tabellenplatzierung war
  unmöglich (nur über Pokalsieg), und die Tabelle zeigte keine
  Europapokalzonen. Bei neuen Datenfeldern immer gegenprüfen, dass sie auch
  wirklich entstehen.
- **Eine Neigung muss stärker sein als das Rauschen, das über ihr liegt.**
  Die Positionsneigung der Startattribute war mit ±5 Punkten kleiner als
  Streuung (σ 4) und Playstyle-Bonus (+9…13) — beide haben sie regelmässig
  überstimmt. Wer eine Tendenz einbaut, muss sie gegen alles rechnen, was
  danach noch draufkommt.
- **Die Charaktererstellung darf den globalen RNG nicht anfassen.** Die
  Vorschau der drei Startvereine würfelt bei jedem Klick — mit `FKC.rng` wäre
  allein das Blättern durch den Bildschirm eine Veränderung an einer geladenen
  Karriere. Dafür gibt es `FKC.rng.fork(seed)`: gleicher Funktionsumfang,
  eigener Zustand.
- **Die Liga eines Vereins steht im Spielstand, nicht in den Stammdaten.**
  Ein Test, der `season.simulateTable()` ohne frischen Spielstand aufruft,
  simuliert in der **verschobenen** Liga-Welt des vorigen Durchlaufs weiter:
  plötzlich spielt Middlesbrough in der Premier League und West Ham taucht
  nirgends auf. Wer Ligen misst, legt pro Durchlauf einen neuen Spielstand an.
- **Deklarierte und tatsächliche Ligagrösse können auseinanderlaufen.**
  `esp.2`, `por.2`, `ned.2` und `arg.2` gaben in `leagues.js` je zwei Vereine
  mehr an, als in `clubs.js` standen. `clubCount` steuert Auf-/Abstiegszahl
  und die Abstiegszone — ein stiller Fehler, den erst ein Abgleich beider
  Dateien sichtbar macht.
- **Ein Ereignis im allgemeinen Pool ist nicht garantiert.** Der
  Potenzialsprung sollte laut Vorgabe in 50 % der Karrieren vorkommen. Der
  Wurf sagte auch 50 % — angekommen sind 35 %, weil die Szene im Pool gegen
  zwanzig andere Ereignisse antritt und nur zwei, drei Jahre Zeit hat. Wer
  eine feste Häufigkeit zusagt, braucht einen eigenen Slot, keine Gewichtung.
- **Ein Schwellenwert ist nur so gut wie die Skala darunter.** Die
  Jugendtrophäe verlangte `rating >= 7.3 && standing >= 14`. Gemessen liegt
  `standing` im Median bei −4 und erreicht in der Spitze 9, die Note endet
  faktisch bei 7.27 — die Trophäe war in 480 Jugendsaisons **nie** zu
  gewinnen. Dasselbe umgekehrt beim Talent des Jahres: Marke 44–53 gegen
  Saisonwerte, die bei 55 aufhören, ergab einen Gewinner unter siebzig
  Karrieren. Wer eine Schwelle setzt, misst vorher die Verteilung.
- **Wer einen Sonderweg einbaut, muss prüfen, was ihn wieder auflöst.** Die
  Heimkehr zum Dorfverein funktionierte — und wurde noch im selben Jahr
  rückgängig gemacht, weil `transferDue()` bei „Spieler ist seinem Verein
  entwachsen" sofort wieder ein Transferfenster öffnete und ein Amateurverein
  in `proScene` als „vereinslos" galt. Ein neuer Zustand braucht ein Flag,
  das die bestehenden Automatismen kennt.
- **`chance: 1` ist kein Wert, sondern ein Kurzschluss.** Vertragslos und
  gedeckte Ablöseklausel gaben hart 100 % zurück. Da vier von fünf Transfers
  über genau diese beiden Wege laufen, lag die gemessene Gesamtchance bei
  97 % — obwohl die eigentliche Formel daneben sauber bei 70 % rechnete. Eine
  Sonderbehandlung, die den Normalfall überstimmt, verfälscht die Messung des
  Normalfalls.
- **PowerShell-Variablen sind nicht case-sensitiv.** Im Build hiess der
  Parameter `$Out` (Zielordner) und eine Hilfsvariable `$out` (der fertige
  HTML-Text). Das ist **dieselbe** Variable: `New-Item -Path $Out` bekam
  plötzlich ein ganzes HTML-Dokument als Pfad. Wer aus anderen Sprachen kommt,
  sucht diesen Fehler lange.
- **PowerShell 5.1 liest `.ps1` ohne BOM als ANSI.** Umlaute und Gedankenstriche
  in der Konsolenausgabe werden dann zu `â€"`. Skripte mit deutschem Text
  brauchen ein UTF-8-BOM — anders als alle anderen Dateien im Projekt, die
  bewusst ohne BOM geschrieben werden.
- **`var top = …` auf oberster Ebene schlägt fehl.** `window.top` ist im
  Browser schreibgeschützt; die Zuweisung läuft still ins Leere und die
  Variable bleibt das Window-Objekt. In Testskripten kosten solche Namen
  (`top`, `self`, `parent`, `name`, `status`) eine halbe Stunde Suche.
- **`when()` darf niemals würfeln.** Bedingungen werden bei jeder
  Eignungsprüfung neu ausgewertet, teils mehrmals pro Szene. Ein `chance()`
  darin würde bei jedem Aufruf ein anderes Ergebnis liefern. Zufall gehört
  einmalig in `beginYear` und danach in ein Flag.
- **Eine neue Wahl bei der Erstellung macht alte Texte still falsch.**
  Der wählbare Startpunkt kam in Runde 11 dazu, die Ereignisse blieben, wie
  sie waren — und erzählten einer NLZ-Karriere weiterhin vom Anmelden beim
  Dorfverein. Nichts hat gemeldet, nichts ist abgestürzt, es passte nur
  inhaltlich nicht mehr. Wer eine Startbedingung einführt, muss die
  vorhandenen Texte danach durchgehen: welcher davon setzt stillschweigend
  den alten Standardfall voraus?
- **Ein Screen ohne Einstiegspunkt existiert nicht.** Die Tabellenansicht war
  fertig, hing aber nur an einem Knopf im Hub — und der Hub war während
  Kindheit und Jugend praktisch unerreichbar. Deshalb gibt es jetzt das
  ☰-Navigationsmenü (`router.navMenu`) mit allen Screens.
- **Anzeige und Datenschreibung dürfen nie getrennt entschieden werden.**
  Der Saisonrückblick zeigte „Sieg" direkt aus `record.cup`, während der
  Eintrag in den Trophäenschrank an einer Einsatzhürde (`apps >= 3`) hing —
  Ergebnis: gemeldete Titel, die im Schrank fehlten. Jetzt läuft beides über
  `S.recordTrophy()`, das den Eintrag schreibt **und** ein `counted`-Flag
  zurückgibt, das der Rückblick anzeigt.
- **Nie ungeprüft aus dem Spielstand lesen.** `save.peek()` griff direkt auf
  `g.identity.firstName` zu; bei einem unvollständigen Stand warf das einen
  TypeError, der aus `router.render()` bis in `main.js` flog — und weil
  `router.go('menu')` dort vor allem anderen stand, blieb die Seite komplett
  leer. Deshalb: Struktur prüfen, defensiv lesen, Startschritte guarden.
- **`[hidden]` braucht `!important`.** Klassen- und ID-Regeln überstimmen das
  eingebaute `display:none` sonst — das Overlay lag unsichtbar über allem.
- **Ein Startwert reicht nicht, es braucht Durchmischung.** Die Belegung der
  Rückennummern kam zuerst aus Bits eines einzigen Hashes
  (`(seed >> n) & 3`), danach aus `hashOf(club + '#' + jahr + '#' + n)`.
  Beides ergab **Blöcke** statt Streuung: `hashOf` unterscheidet sich zwischen
  „…#7" und „…#8" nur um eins, `% 100` läuft also in Einerschritten durch.
  Ergebnis: Vereine, bei denen 24 von 25 Stammnummern belegt waren. Erst ein
  Avalanche-Schritt (`h ^= h>>>16; h = imul(h, 0x45d9f3b); h ^= h>>>16`) macht
  aus benachbarten Eingaben unabhängige Ausgaben.
- **`textLength` auf einem `<textPath>` wirkt nicht zuverlässig.** Der Versuch,
  lange Namen damit auf den Bogen zu stauchen, wurde in Chrome ignoriert —
  „SCHWEINSTEIGER" lief weiter über den Trikotrand. Die Schriftgrösse wird
  jetzt aus der Bogenlänge zurückgerechnet, mit **0.7 em** als mittlerer
  Zeichenbreite von Outfit in Versalien (mit 0.6 waren elfstellige Namen 15 %
  zu breit).
- **Inline-Stile schlagen jede CSS-Regel — auch Custom Properties.**
  `U.badge()` schrieb die Grösse als `style="width:34px"` ins Markup. Damit
  waren `.ltable .ta-club .crest{ width:20px }` und `.ctl-badge .crest` seit
  jeher wirkungslos, ohne dass irgendetwas gemeldet hätte: Wappen standen in
  der Ligatabelle so gross wie auf der Spielerkarte. Der Umweg über eine
  Custom Property allein hilft **nicht** — `style="--crest-w:34px"` gewinnt
  genauso. Deshalb steht für die beiden Standardgrössen jetzt gar nichts im
  style-Attribut; die Grösse kommt aus `.crest` bzw. `.crest-lg`, und nur echte
  Sondergrössen setzen `--crest-w` inline.
- **Eine Erweiterungsdatei darf keinen Basis-Schlüssel überschreiben.**
  `i18n/de.pro.js` definierte `create.start` als Abschnittstitel („Wo es
  losgeht") — derselbe Schlüssel war in `de.js` die Beschriftung des
  Startknopfs („Kindheit beginnen"). Der Knopf hiess dann plötzlich „Wo es
  losgeht", ohne dass irgendetwas einen Fehler meldete. Neue Schlüssel in den
  `.pro`-Dateien gegen die Basisdatei prüfen; Kollisionen finden sich mit einem
  Regex-Abgleich beider Dateien.

## Was noch fehlt

Feinschliff am Balancing, mehr Ereignisse für die späte Karriere, und eine
detailliertere Darstellung der Ligatabelle.
