<#
  Kleiner lokaler Webserver zum Prüfen — nur zum Testen, nichts für den
  echten Betrieb.

      powershell -ExecutionPolicy Bypass -File .\serve.ps1            # Quellcode
      powershell -ExecutionPolicy Bypass -File .\serve.ps1 -Pfad dist # Build

  Danach http://localhost:8777 im Browser öffnen. Beenden mit Strg+C.

  Warum überhaupt ein Server, wo das Spiel doch per Doppelklick läuft?
  Weil manche Browser bei file:// den localStorage beim Schliessen
  leeren — und die Zugangssperre merkt sich den Code genau dort. Über
  http://localhost verhält sich alles wie auf dem späteren Webspace.
#>

param(
  [string]$Pfad = '.',
  [int]$Port = 8777
)

$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) $Pfad)

$typen = @{
  '.html' = 'text/html; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.ico'  = 'image/x-icon'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()

Write-Host ''
Write-Host "  Serviert $root" -ForegroundColor DarkGray
Write-Host "  http://localhost:$Port" -ForegroundColor Cyan
Write-Host '  Beenden mit Strg+C' -ForegroundColor DarkGray
Write-Host ''

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
    if ([string]::IsNullOrWhiteSpace($rel)) { $rel = 'index.html' }

    $datei = Join-Path $root $rel
    # Nicht aus dem Wurzelverzeichnis herausservieren
    $voll = [IO.Path]::GetFullPath($datei)
    if (-not $voll.StartsWith([IO.Path]::GetFullPath($root))) {
      $ctx.Response.StatusCode = 403; $ctx.Response.Close(); continue
    }

    if (Test-Path $voll -PathType Leaf) {
      $bytes = [IO.File]::ReadAllBytes($voll)
      $ext = [IO.Path]::GetExtension($voll).ToLower()
      $ctx.Response.ContentType = if ($typen[$ext]) { $typen[$ext] } else { 'application/octet-stream' }
      $ctx.Response.Headers.Add('Cache-Control', 'no-store')
      $ctx.Response.ContentLength64 = $bytes.Length
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $ctx.Response.StatusCode = 404
      $msg = [Text.Encoding]::UTF8.GetBytes('404')
      $ctx.Response.OutputStream.Write($msg, 0, $msg.Length)
    }
    $ctx.Response.Close()
  }
} finally {
  $listener.Stop()
  $listener.Close()
}
