param([switch]$NoBrowser,[int]$StudioPort=5173,[int]$FactoryPort=5180)
$ErrorActionPreference = 'Stop'
$studioRoot = $PSScriptRoot
. (Join-Path $studioRoot 'scripts/service-state.ps1')
# A different extracted copy may still own the default ports. Never reuse it.
function Get-StudioPort([int]$Preferred,[string]$Service) {
    $listeners = @([Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners() | ForEach-Object { $_.Port })
    for ($candidate = $Preferred; $candidate -lt $Preferred + 100; $candidate++) {
        if ($candidate -notin $listeners) { return $candidate }
        $record = Get-MarbleServiceRecord (Join-Path $studioRoot "tools/$Service-$candidate.json")
        if ($record) {
            $managed = Get-Process -Id $record.pid -ErrorAction SilentlyContinue
            if ($managed -and $managed.StartTime.ToUniversalTime().Ticks.ToString() -eq $record.started) { return $candidate }
        }
    }
    throw 'Uygulama icin bos yerel port bulunamadi.'
}
$StudioPort = Get-StudioPort $StudioPort 'studio'
$FactoryPort = Get-StudioPort $FactoryPort 'factory'
if ($FactoryPort -eq $StudioPort) { $FactoryPort = Get-StudioPort ($FactoryPort + 1) 'factory' }
$env:VITE_FACTORY_ORIGIN = "http://127.0.0.1:$FactoryPort"
$env:MARBLE_STUDIO_PORT = "$StudioPort"
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
& (Join-Path $studioRoot 'scripts\start-factory.ps1') -NoBrowser -Port $FactoryPort
# Do not open a partly working application when files are missing after extraction.
$catalog = Invoke-RestMethod "$studioAddress/catalog/manifest.json" -TimeoutSec 10
if (-not $catalog.items.Count) { throw 'Gorsel kutuphanesi eksik. ZIP dosyasinin tamamini yeni bir klasore cikartin ve Baslat.cmd ile acin.' }
foreach ($page in @('spiral-breaker.html','glass-breaker.html','ball-duel.html','ring-escape.html','rock-paper-scissors.html')) {
    $reply = Invoke-WebRequest "$studioAddress/$page" -UseBasicParsing -TimeoutSec 10
    if (-not $reply.Content.Contains('/src/' + $page.Replace('.html','-app.js'))) { throw "Oyun dosyasi eksik: $page. Paketin tamamini yeni bir klasore cikartin." }
}
if (-not $NoBrowser) { Start-Process $studioAddress }
Write-Host "Marble Studio hazir: $studioAddress"
