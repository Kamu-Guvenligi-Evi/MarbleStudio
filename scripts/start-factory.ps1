param([switch]$NoBrowser,[int]$Port=5180)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
& (Join-Path $PSScriptRoot 'bootstrap-runtime.ps1')
. (Join-Path $PSScriptRoot 'service-state.ps1')
$factoryAddress = "http://127.0.0.1:$Port"
$env:FACTORY_PORT = "$Port"
$factoryState = Join-Path $projectRoot "tools/factory-$Port.json"
$factoryRecord = Get-MarbleServiceRecord $factoryState
if ($factoryRecord -and $factoryRecord.revision -ne $env:MARBLE_RUNTIME_REVISION) {
    $pending = $false
    try { $pending = (Invoke-RestMethod "$factoryAddress/api/factory" -TimeoutSec 2).summary.pending -gt 0 } catch { }
    if ($pending) { Write-Warning 'Video uretimi suruyor. Uretim bitince Baslat.cmd dosyasini tekrar acin.' }
    else { Stop-MarbleService $factoryRecord | Out-Null }
}
function Test-Factory {
    try { $reply = Invoke-RestMethod "$factoryAddress/api/factory" -TimeoutSec 2; return $null -ne $reply.jobs }
    catch { return $false }
}
if (-not (Test-Factory)) {
    $logFolder = Join-Path $projectRoot 'artifacts'
    New-Item -ItemType Directory -Force -Path $logFolder | Out-Null
    $setup = Get-Content -LiteralPath (Join-Path $projectRoot 'tools/setup-state.json') -Raw | ConvertFrom-Json
    $factoryScript = Join-Path $projectRoot 'scripts/factory-server.mjs'
    $factoryProcess = Start-Process -FilePath $setup.node -ArgumentList ('"' + $factoryScript + '"') -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logFolder 'factory-server.log') -RedirectStandardError (Join-Path $logFolder 'factory-server-error.log') -PassThru
    Save-MarbleService $factoryState $factoryProcess
    for ($attempt = 0; $attempt -lt 120; $attempt++) {
        if (Test-Factory) { break }
        Start-Sleep -Milliseconds 500
    }
    if (-not (Test-Factory)) { throw 'Uretim hizmeti baslatilamadi. artifacts/factory-server-error.log dosyasini kontrol et.' }
}
if (-not $NoBrowser) { Start-Process $factoryAddress }
