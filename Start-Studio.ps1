param([switch]$NoBrowser,[int]$StudioPort=5173,[int]$FactoryPort=5180)
$ErrorActionPreference = 'Stop'
$studioRoot = $PSScriptRoot
& (Join-Path $studioRoot 'scripts/bootstrap-runtime.ps1')
. (Join-Path $studioRoot 'scripts/service-state.ps1')
$studioAddress = "http://127.0.0.1:$StudioPort"
$studioState = Join-Path $studioRoot "tools/studio-$StudioPort.json"
$studioRecord = Get-MarbleServiceRecord $studioState
$studioSetup = Get-Content -LiteralPath (Join-Path $studioRoot 'tools/setup-state.json') -Raw | ConvertFrom-Json
if ($studioRecord -and $studioRecord.revision -ne $env:MARBLE_RUNTIME_REVISION) { Stop-MarbleService $studioRecord | Out-Null }
$studioOnline = $false
try {
    $response = Invoke-WebRequest -Uri $studioAddress -UseBasicParsing -TimeoutSec 2
    $studioOnline = $response.Content.Contains('Marble Studio')
    if (-not $studioOnline) { throw "Port $StudioPort is in use by another application." }
} catch [System.Net.WebException] { }
if (-not $studioOnline) {
    $studioNode = $studioSetup.node
    $studioScript = Join-Path $studioRoot 'node_modules/vite/bin/vite.js'
    $studioProcess = Start-Process -FilePath $studioNode -ArgumentList @('"' + $studioScript + '"','--host','127.0.0.1','--port',"$StudioPort",'--strictPort') -WorkingDirectory $studioRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $studioRoot 'server.log') -RedirectStandardError (Join-Path $studioRoot 'server-error.log') -PassThru
    Save-MarbleService $studioState $studioProcess
    for ($attempt = 0; $attempt -lt 100; $attempt++) {
        Start-Sleep -Milliseconds 200
        try {
            $response = Invoke-WebRequest -Uri $studioAddress -UseBasicParsing -TimeoutSec 1
            if ($response.Content.Contains('Marble Studio')) { $studioOnline = $true; break }
        } catch { }
    }
}
if (-not $studioOnline) { throw 'Marble Studio could not start. See server-error.log.' }
try { & (Join-Path $studioRoot 'scripts\start-factory.ps1') -NoBrowser -Port $FactoryPort }
catch { Write-Warning 'Video hizmeti açılamadı. Studio içinde yeniden deneyebilirsin.' }
if (-not $NoBrowser) { Start-Process $studioAddress }
