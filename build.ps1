<#
  ══════════════════════════════════════════════════════════════════════
  Build für die Veröffentlichung
  ══════════════════════════════════════════════════════════════════════

  Aufruf im Projektordner:

      powershell -ExecutionPolicy Bypass -File .\build.ps1

  Ergebnis liegt danach in .\dist\ und ist genau das, was hochgeladen
  wird (GitHub Pages, Cloudflare Pages, jeder Webspace).

  Was der Build macht:

    1. Liest die Skript-Reihenfolge direkt aus index.html (data-src) —
       eine zweite, handgepflegte Liste würde irgendwann auseinanderlaufen.
    2. Hängt alle Programmdateien zu **einer** Datei zusammen.
    3. Entfernt sämtliche Kommentare und Einrückungen. Das ist der
       eigentliche Effekt: Der ganze erklärende Text — und damit das
       meiste, was den Code lesbar macht — verschwindet.
    4. Kodiert das Ergebnis, sodass in den Entwicklerwerkzeugen kein
       lesbares Programm mehr steht, sondern ein Datenblock.
    5. Dasselbe (ohne Kodierung) für die CSS-Dateien.
    6. Schreibt index.html mit nur noch zwei eingebundenen Dateien.

  WICHTIG, ohne Beschönigung: Das ist Verschleierung, keine Sicherheit.
  Wer die Entwicklerwerkzeuge bedienen kann, kommt an den entschlüsselten
  Code und damit auch an die Zugangscodes. Es hält Gelegenheitsblicke ab,
  mehr nicht. Alles, was im Browser läuft, gehört dem, der den Browser
  bedient.

  Der Quellcode bleibt unangetastet — es wird nur nach dist\ geschrieben.
#>

[CmdletBinding()]
param(
  [string]$Out = 'dist'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

function Sag($text, $farbe = 'Gray') { Write-Host $text -ForegroundColor $farbe }

Sag ''
Sag '  Fussball-Karriere — Build' 'Cyan'
Sag '  ─────────────────────────' 'DarkGray'

# ── Minifizierer ──────────────────────────────────────────────────────
#
# Als eingebettetes C#, aus zwei Gründen: Ein zeichenweiser Durchlauf
# über 1,2 MB dauert in PowerShell selbst zig Sekunden, und `continue`
# innerhalb eines `switch` verhält sich dort anders als erwartet — beides
# sind vermeidbare Fehlerquellen in einem Werkzeug, das den ganzen
# Programmcode durchreicht.
#
# Bewusst kein regulärer Ausdruck: Ein Regex über JavaScript verwechselt
# früher oder später einen Schrägstrich in einem String mit dem Beginn
# eines Kommentars und zerlegt die Datei still.
#
# Der Code enthält **keine** Template-Literale (geprüft: jeder Backtick
# steht in einem Kommentar). Deshalb kann kein String über ein Zeilenende
# laufen, und zeilenweises Aufräumen ist gefahrlos. Zeilenumbrüche
# bleiben erhalten — sie kosten fast nichts und ersparen jedes Risiko mit
# der automatischen Semikolon-Ergänzung.

if (-not ('FkcMin' -as [type])) {
  Add-Type -Language CSharp -TypeDefinition @'
using System;
using System.Text;

public static class FkcMin
{
  // Nach diesen Zeichen beginnt ein "/" einen regulaeren Ausdruck,
  // nicht eine Division.
  const string VorRegex = "(,=:[!&|?{};+-*%~^<>";

  public static string Js(string src)
  {
    var sb = new StringBuilder(src.Length);
    int n = src.Length, i = 0;
    // 0 Code | 1 '..' | 2 ".." | 3 /*..*/ | 4 //.. | 5 /../ Regex
    int z = 0;
    char letzt = '\0';

    while (i < n)
    {
      char c = src[i];
      char next = (i + 1 < n) ? src[i + 1] : '\0';

      if (z == 0)
      {
        if (c == '/' && next == '*') { z = 3; i += 2; continue; }
        if (c == '/' && next == '/') { z = 4; i += 2; continue; }
        if (c == '\'') z = 1;
        else if (c == '"') z = 2;
        else if (c == '/')
        {
          if (letzt == '\0' || VorRegex.IndexOf(letzt) >= 0) z = 5;
        }
        sb.Append(c);
        if (!char.IsWhiteSpace(c)) letzt = c;
      }
      else if (z == 1 || z == 2 || z == 5)
      {
        sb.Append(c);
        if (c == '\\')
        {
          if (i + 1 < n) { sb.Append(next); i++; }
        }
        else if ((z == 1 && c == '\'') || (z == 2 && c == '"') || (z == 5 && c == '/'))
        {
          z = 0; letzt = c;
        }
        else if (c == '\n') { z = 0; }   // Notbremse: String bleibt nie offen
      }
      else if (z == 3)
      {
        if (c == '*' && next == '/') { z = 0; i += 2; continue; }
      }
      else if (z == 4)
      {
        if (c == '\n') { z = 0; sb.Append(c); }
      }
      i++;
    }
    return Zeilen(sb.ToString(), "\n");
  }

  // Einrueckung und Leerzeilen entfernen
  public static string Zeilen(string s, string trenner)
  {
    var teile = s.Replace("\r\n", "\n").Split('\n');
    var sb = new StringBuilder(s.Length);
    bool erste = true;
    foreach (var t in teile)
    {
      var x = t.Trim();
      if (x.Length == 0) continue;
      if (!erste) sb.Append(trenner);
      sb.Append(x);
      erste = false;
    }
    return sb.ToString();
  }
}
'@
}

# ── 1. Reihenfolge aus index.html lesen ───────────────────────────────

$html = Get-Content -Path 'index.html' -Raw -Encoding UTF8

$spielDateien = @([regex]::Matches($html, 'data-src\s*=\s*"([^"]+)"') |
                  ForEach-Object { $_.Groups[1].Value })

if ($spielDateien.Count -lt 10) { throw 'Skriptliste aus index.html sieht falsch aus.' }
Sag ("  {0} Spieldateien aus index.html gelesen" -f $spielDateien.Count)

$stempel = Get-Date -Format 'yyyyMMddHHmm'

# ── 2. Zwei Bündel, nicht eines ───────────────────────────────────────
#
# Die Sperre (a.js) und der Spielcode (g.js) müssen getrennt bleiben.
# In einer gemeinsamen Datei liefe das ganze Spiel schon, während der
# Sperrbildschirm noch steht — man käme mit einem Blick in die Konsole
# daran vorbei, und der Code wäre auch ohne gültigen Zugang längst
# heruntergeladen. Getrennt gilt in dist\ dasselbe wie im Quellcode:
# ohne richtigen Code holt der Browser kein Byte Spielcode.

Sag ''
Sag '  Sperre (a.js) …' 'DarkGray'
$gateRoh = Get-Content -Path 'js/core/gate.js' -Raw -Encoding UTF8
$gate = [FkcMin]::Js($gateRoh)

# Betriebsart umstellen: eine gebündelte Datei statt der data-src-Liste,
# und kein CSS nachladen — das steckt vollständig in a.css.
$vorher = $gate
$gate = [regex]::Replace($gate, 'var\s+BUENDEL\s*=\s*null\s*;', "var BUENDEL=`"g.js?v=$stempel`";")
if ($gate -eq $vorher) { throw 'BUENDEL nicht gefunden — gate.js verändert?' }

$vorher = $gate
$gate = [regex]::Replace($gate, 'var\s+CSS_NACH\s*=\s*\[[^\]]*\]\s*;', 'var CSS_NACH=[];')
if ($gate -eq $vorher) { throw 'CSS_NACH nicht gefunden — gate.js verändert?' }

Sag ("    {0:N0} → {1:N0} Zeichen" -f $gateRoh.Length, $gate.Length)

Sag '  Spielcode (g.js) …' 'DarkGray'
$teile = New-Object System.Collections.Generic.List[string]
$roh = 0
foreach ($f in $spielDateien) {
  if (-not (Test-Path $f)) { throw "Datei fehlt: $f" }
  $inhalt = Get-Content -Path $f -Raw -Encoding UTF8
  $roh += $inhalt.Length
  $teile.Add([FkcMin]::Js($inhalt))
}
$js = [string]::Join("`n", $teile)

Sag ("    {0:N0} → {1:N0} Zeichen  ({2:N0} % kleiner)" -f `
     $roh, $js.Length, (100 - ($js.Length / $roh * 100)))

# ── 3. Kodieren ───────────────────────────────────────────────────────
#
# Base64 über UTF-8. Im Sources-Panel steht danach ein Datenblock statt
# eines lesbaren Programms. Wiederherstellbar ist es trotzdem — siehe
# den Hinweis ganz oben.

$b64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($js))

$lader = @'
(function(){var a=atob(P),b=new Uint8Array(a.length),i=0;
for(;i<a.length;i++)b[i]=a.charCodeAt(i);
var e=document.createElement("script");
e.text=new TextDecoder("utf-8").decode(b);
document.head.appendChild(e);})();
'@
$lader = [FkcMin]::Zeilen($lader, '')

$spielJs = "var P=`"$b64`";" + $lader

# ── 4. CSS bündeln ────────────────────────────────────────────────────

Sag '  CSS …' 'DarkGray'
$alleCss = @('css/tokens.css', 'css/gate.css', 'css/layout.css', 'css/components.css')
$cssTeile = New-Object System.Collections.Generic.List[string]
$cssVor = 0
foreach ($f in $alleCss) {
  if (-not (Test-Path $f)) { throw "Datei fehlt: $f" }
  $inhalt = Get-Content -Path $f -Raw -Encoding UTF8
  $cssVor += $inhalt.Length
  $ohneKommentar = [regex]::Replace($inhalt, '/\*[\s\S]*?\*/', '')
  $eine = [FkcMin]::Zeilen($ohneKommentar, '')
  $eine = [regex]::Replace($eine, '\s*([{};:,>])\s*', '$1')
  $eine = $eine.Replace(';}', '}')
  $cssTeile.Add($eine)
}
$css = [string]::Join('', $cssTeile)
Sag ("    {0:N0} → {1:N0} Zeichen  ({2:N0} % kleiner)" -f `
     $cssVor, $css.Length, (100 - ($css.Length / $cssVor * 100)))

# ── 5. index.html schreiben ───────────────────────────────────────────
#
# Der Zeitstempel an jeder Datei ist der Cache-Buster: Ohne ihn sehen
# Besucher nach einem Upload noch tagelang die alte Version — und genau
# das soll zentrales Hosting ja verhindern.

$gateMarkup = [regex]::Match($html, '(?s)<div id="gate".*?\n</div>').Value
$appMarkup  = [regex]::Match($html, '(?s)<div id="app">.*?\n</div>').Value
if (-not $gateMarkup) { throw 'Sperr-Markup nicht in index.html gefunden.' }
if (-not $appMarkup)  { throw 'App-Markup nicht in index.html gefunden.' }

# ACHTUNG: nicht $out nennen — PowerShell-Variablen sind nicht
# case-sensitiv, $out und der Parameter $Out wären dasselbe.
$htmlOut = @"
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0b1211">
<meta name="robots" content="noindex, nofollow">
<title>Karriere — Fussball Lebenssimulator</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="a.css?v=$stempel">
</head>
<body class="is-locked">
$gateMarkup
$appMarkup
<script src="a.js?v=$stempel"></script>
</body>
</html>
"@

# ── 6. Schreiben ──────────────────────────────────────────────────────

if (Test-Path $Out) { Remove-Item $Out -Recurse -Force }
New-Item -ItemType Directory -Path $Out | Out-Null

$utf8 = New-Object System.Text.UTF8Encoding($false)   # ohne BOM
[IO.File]::WriteAllText((Join-Path $Out 'index.html'), $htmlOut, $utf8)
[IO.File]::WriteAllText((Join-Path $Out 'a.js'), $gate, $utf8)
[IO.File]::WriteAllText((Join-Path $Out 'g.js'), $spielJs, $utf8)
[IO.File]::WriteAllText((Join-Path $Out 'a.css'), $css, $utf8)

# GitHub Pages würde Ordner mit Unterstrich sonst wegfiltern
[IO.File]::WriteAllText((Join-Path $Out '.nojekyll'), '', $utf8)

$gesamt = (Get-ChildItem $Out -Recurse -File -Force | Measure-Object Length -Sum).Sum

Sag ''
Sag ("  Fertig → {0}\" -f $Out) 'Green'
Sag ("  index.html + a.js (Sperre) + g.js (Spiel) + a.css — {0:N0} KB" -f ($gesamt / 1KB)) 'DarkGray'
Sag ''
Sag '  Vor dem Hochladen prüfen:' 'DarkGray'
Sag ("    powershell -ExecutionPolicy Bypass -File .\serve.ps1 -Pfad {0}" -f $Out) 'Gray'
Sag ''
