$ErrorActionPreference = 'Stop'
$studioRoot = $PSScriptRoot
$studioAddress = 'http://127.0.0.1:5173'
$studioOnline = $false
try {
    $response = Invoke-WebRequest -Uri $studioAddress -UseBasicParsing -TimeoutSec 2
    $studioOnline = $response.Content.Contains('Marble Studio')
    if (-not $studioOnline) { throw '5173 port is in use by another application.' }
} catch [System.Net.WebException] { }
if (-not $studioOnline) {
    $studioNode = (Get-Command node.exe).Source
    Start-Process -FilePath $studioNode -ArgumentList 'node_modules/vite/bin/vite.js' -WorkingDirectory $studioRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $studioRoot 'server.log') -RedirectStandardError (Join-Path $studioRoot 'server-error.log')
    for ($attempt = 0; $attempt -lt 25; $attempt++) {
        Start-Sleep -Milliseconds 200
        try {
            $response = Invoke-WebRequest -Uri $studioAddress -UseBasicParsing -TimeoutSec 1
            if ($response.Content.Contains('Marble Studio')) { $studioOnline = $true; break }
        } catch { }
    }
}
if (-not $studioOnline) { throw 'Marble Studio could not start. See server-error.log.' }
try { & (Join-Path $studioRoot 'scripts\start-factory.ps1') -NoBrowser }
catch { Write-Warning 'Video hizmeti açılamadı. Studio içinde yeniden deneyebilirsin.' }
Start-Process $studioAddress
