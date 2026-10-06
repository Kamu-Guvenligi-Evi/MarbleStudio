param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$factoryAddress = 'http://127.0.0.1:5180'
function Test-Factory {
    try { $reply = Invoke-RestMethod "$factoryAddress/api/factory" -TimeoutSec 2; return $null -ne $reply.jobs }
    catch { return $false }
}
if (-not (Test-Factory)) {
    $logFolder = Join-Path $projectRoot 'artifacts'
    New-Item -ItemType Directory -Force -Path $logFolder | Out-Null
    Start-Process -FilePath (Get-Command node.exe).Source -ArgumentList 'scripts/factory-server.mjs' -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logFolder 'factory-server.log') -RedirectStandardError (Join-Path $logFolder 'factory-server-error.log')
    for ($attempt = 0; $attempt -lt 120; $attempt++) {
        if (Test-Factory) { break }
        Start-Sleep -Milliseconds 500
    }
    if (-not (Test-Factory)) { throw 'Uretim hizmeti baslatilamadi. artifacts/factory-server-error.log dosyasini kontrol et.' }
}
if (-not $NoBrowser) { Start-Process $factoryAddress }
