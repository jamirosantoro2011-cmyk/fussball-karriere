# Veröffentlichen

Ziel: **ein** Link, den alle mit Zugangscode besuchen. Wird etwas
geändert und neu hochgeladen, sehen beim nächsten Öffnen automatisch
alle die neue Version.

---

## Was zuerst passieren muss

```powershell
powershell -ExecutionPolicy Bypass -File .\build.ps1
```

Das schreibt `dist\` — und **nur** dieser Ordner wird hochgeladen:

| Datei | Inhalt |
|-------|--------|
| `index.html` | Gerüst und Sperrbildschirm |
| `a.css` | alle vier Stylesheets, zusammengefasst |
| `a.js` | nur die Zugangssperre |
| `g.js` | das Spiel, kodiert — wird erst nach richtigem Code geholt |
| `.nojekyll` | nötig, sonst filtert GitHub Pages Dateien weg |

Vor dem Hochladen einmal lokal ansehen:

```powershell
powershell -ExecutionPolicy Bypass -File .\serve.ps1 -Pfad dist
```

Dann <http://localhost:8778> öffnen. Wichtig: **über den Server prüfen,
nicht per Doppelklick** — manche Browser leeren bei `file://` den
Speicher, und die Sperre merkt sich den Code genau dort.

---

## Weg 1 — GitHub Pages (baut selbst, empfohlen)

Der mitgelieferte Ablauf in `.github/workflows/pages.yml` führt
`build.ps1` bei jedem Push aus. `dist\` gehört deshalb **nicht** ins
Repository (steht schon in `.gitignore`).

**Einmalig:**

1. Auf github.com ein Repository anlegen — **privat oder öffentlich, das
   ist egal**, denn Pages liefert die Seite so oder so öffentlich aus.
   Der Zugangscode ist die Hürde, nicht die Repo-Sichtbarkeit.
2. Im Projektordner:

   ```bash
   git init -b main
   git add -A
   git commit -m "Fussball-Karriere-Simulator"
   git remote add origin https://github.com/BENUTZERNAME/REPOSITORY.git
   git push -u origin main
   ```

3. Im Browser: **Settings → Pages → Source** auf **GitHub Actions**
   stellen.

Nach ein bis zwei Minuten steht die Seite unter

```
https://BENUTZERNAME.github.io/REPOSITORY/
```

**Ab dann für jede Änderung nur noch:**

```bash
git add -A && git commit -m "Was geändert wurde" && git push
```

Unter *Actions* lässt sich zusehen; ist der Haken grün, ist die neue
Version live.

---

## Weg 2 — Cloudflare Pages (ohne Git)

Cloudflare kann kein PowerShell, baut also nicht selbst. Der Build läuft
lokal, hochgeladen wird das Ergebnis.

1. `build.ps1` ausführen.
2. <https://dash.cloudflare.com> → **Workers & Pages** → **Create** →
   **Pages** → **Upload assets**.
3. Den **Inhalt** von `dist\` hineinziehen — nicht den Ordner selbst,
   sonst landet alles eine Ebene zu tief und die Seite bleibt weiss.
4. Projektname vergeben. Die Adresse lautet dann
   `https://PROJEKTNAME.pages.dev`.

**Für jede Änderung:** `build.ps1` erneut ausführen, im Projekt
**Create new deployment**, `dist\` wieder hineinziehen. Derselbe Link
zeigt danach die neue Version.

> Cloudflare kann auch aus einem GitHub-Repo bauen. Das nützt hier
> nichts — dort steht nur der Quellcode, und ohne `build.ps1` gäbe es
> weder `a.js` noch `g.js`. Entweder Weg 1 komplett, oder Weg 2 mit
> lokalem Build.

---

## Zugangscodes ändern

Ganz oben in **`js/core/gate.js`**:

```js
var FKC_CODES = [
  'ANPFIFF-2026',
  'KABINE-11',
  'NACHSPIELZEIT'
];
```

Zeile dazu = neuer Code. Zeile weg = Zugang entzogen, auch auf Geräten,
die schon freigeschaltet waren: Der gemerkte Code wird bei **jedem**
Start neu gegen diese Liste geprüft.

Gross-/Kleinschreibung und Leerzeichen sind egal, Bindestriche zählen
mit. `anpfiff 2026` öffnet also `ANPFIFF-2026`, `ANPFIFF2026` nicht.

Danach neu bauen und hochladen (Weg 1: nur pushen).

---

## Was die Sperre leistet — und was nicht

**Leistet sie:**

- Ohne gültigen Code wird `g.js` nie geholt. Wer keinen Code hat, hat
  den Spielcode nicht auf dem Rechner.
- Der Code wird pro Gerät gemerkt, muss also nur einmal eingegeben
  werden.
- Ein zurückgezogener Code sperrt beim nächsten Öffnen wieder aus.
- Nach fünf Fehlversuchen zehn Sekunden Pause.

**Leistet sie nicht:** echten Schutz. Wer einen gültigen Code hat, kann
`g.js` speichern, den Base64-Block dekodieren und den Code weitergeben.
Die Zugangscodes stehen danach im Klartext darin. Das ist keine
Schwäche dieser Umsetzung, sondern gilt für jede reine Browser-Lösung:
Alles, was im Browser läuft, gehört dem, der den Browser bedient.

Wer echten Schutz braucht, kommt um einen Server nicht herum, der die
Prüfung übernimmt und den Spielcode erst danach ausliefert. Für den
Zweck hier — ein Link, den man im Freundeskreis teilt, ohne dass ihn
zufällig jemand findet — reicht die Hürde.

Zusätzlich steht `<meta name="robots" content="noindex, nofollow">` in
der Seite: Suchmaschinen nehmen sie nicht auf.
