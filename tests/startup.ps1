param([Parameter(Mandatory=$true)][string]$CloneRoot,[int]$StudioPort=5177,[int]$FactoryPort=5187)
$ErrorActionPreference = 'Stop'
$sourceRoot = Split-Path -Parent $PSScriptRoot
$CloneRoot = (Resolve-Path -LiteralPath $CloneRoot).Path
if (-not $CloneRoot.StartsWith((Join-Path $sourceRoot 'artifacts') + '\',[StringComparison]::OrdinalIgnoreCase)) { throw 'Use a disposable clone inside artifacts.' }
foreach ($relativeFile in @('Baslat.cmd','Start-Factory.cmd','Start-Studio.ps1','scripts/bootstrap-runtime.ps1','scripts/service-state.ps1','scripts/start-factory.ps1','scripts/browser-runtime.mjs')) {
    Copy-Item -LiteralPath (Join-Path $sourceRoot $relativeFile) -Destination (Join-Path $CloneRoot $relativeFile)
}
$env:PATH = 'C:\Windows\System32;C:\Windows;C:\Windows\System32\WindowsPowerShell\v1.0'
if (Get-Command node.exe -ErrorAction SilentlyContinue) { throw 'Test unexpectedly has system Node.' }
function Start-TestClone {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $CloneRoot 'Start-Studio.ps1') -NoBrowser -StudioPort $StudioPort -FactoryPort $FactoryPort
    if ($LASTEXITCODE -ne 0) { throw 'Clone launcher failed.' }
    if (-not (Invoke-WebRequest "http://127.0.0.1:$StudioPort" -UseBasicParsing).Content.Contains('Marble Studio')) { throw 'Studio not available.' }
    if ($null -eq (Invoke-RestMethod "http://127.0.0.1:$FactoryPort/api/factory").jobs) { throw 'Factory not available.' }
}
function ServiceIds {
    return @((Get-Content -LiteralPath (Join-Path $CloneRoot "tools/studio-$StudioPort.json") -Raw | ConvertFrom-Json).pid,(Get-Content -LiteralPath (Join-Path $CloneRoot "tools/factory-$FactoryPort.json") -Raw | ConvertFrom-Json).pid)
}
try {
    Start-TestClone
    $warmIds = ServiceIds
    $stateFile = Join-Path $CloneRoot 'tools/setup-state.json'
    $before = (Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json).lockHash
    Start-TestClone
    if ((ServiceIds) -join ',' -ne ($warmIds -join ',')) { throw 'Warm startup unnecessarily replaced servers.' }
    Write-Host 'PASS: clone starts without system Node; warm startup reuses servers and dependencies.'
    Add-Content -LiteralPath (Join-Path $CloneRoot 'src/territory.js') -Value "`n// startup integration revision" -Encoding UTF8
    Start-TestClone
    $updatedIds = ServiceIds
    if ($updatedIds[0] -eq $warmIds[0] -or $updatedIds[1] -eq $warmIds[1]) { throw 'Source updates did not restart the managed servers.' }
    Write-Host 'PASS: new source code restarts both managed servers.'
    Add-Content -LiteralPath (Join-Path $CloneRoot 'package-lock.json') -Value ' ' -Encoding UTF8
    Start-TestClone
    $after = (Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json).lockHash
    if ($before -eq $after) { throw 'Dependency lock update was not applied.' }
    Write-Host 'PASS: dependency lock changes trigger automatic installation.'
} finally {
    . (Join-Path $sourceRoot 'scripts/service-state.ps1')
    foreach ($name in @("studio-$StudioPort.json","factory-$FactoryPort.json")) { Stop-MarbleService (Get-MarbleServiceRecord (Join-Path $CloneRoot "tools/$name")) | Out-Null }
}
