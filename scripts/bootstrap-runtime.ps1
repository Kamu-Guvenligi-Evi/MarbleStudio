param([switch]$SkipBrowser)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$projectRoot = Split-Path -Parent $PSScriptRoot
$toolsRoot = Join-Path $projectRoot 'tools'
$lockHash = (Get-FileHash -LiteralPath (Join-Path $projectRoot 'package-lock.json') -Algorithm SHA256).Hash
if ($env:MARBLE_SETUP_READY -eq "$projectRoot|$lockHash") { return }
New-Item -ItemType Directory -Force -Path $toolsRoot | Out-Null
$setupLock = $null
for ($attempt=0;$attempt -lt 600 -and -not $setupLock;$attempt++) {
    try { $setupLock = [IO.File]::Open((Join-Path $toolsRoot 'setup.lock'),[IO.FileMode]::OpenOrCreate,[IO.FileAccess]::ReadWrite,[IO.FileShare]::None) }
    catch [IO.IOException] { if ($attempt -eq 0) { Write-Host 'Diger acilis hazirlaniyor; tamamlanmasi bekleniyor.' }; Start-Sleep -Milliseconds 500 }
}
if (-not $setupLock) { throw 'Another startup is still preparing the app. Try again when it finishes.' }
try {
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
function Get-LocalNode {
    $runtimeRoot = Join-Path $toolsRoot 'node-runtime'
    $runtimeNode = Join-Path $runtimeRoot 'node-v24.21.0-win-x64/node.exe'
    if (-not (Test-Path -LiteralPath $runtimeNode)) {
        if (-not [Environment]::Is64BitOperatingSystem) { throw 'Marble Studio requires 64-bit Windows.' }
        Write-Host 'Ilk acilis: Node.js calistiricisi indiriliyor. Kurulum veya yonetici izni gerekmez.'
        $zip = Join-Path $toolsRoot 'node-runtime.zip'
        Invoke-WebRequest -Uri 'https://nodejs.org/dist/v24.21.0/node-v24.21.0-win-x64.zip' -OutFile $zip -UseBasicParsing -TimeoutSec 300
        $expected = '158f7685b44de51f6c0df1d153526cbcd3e1bc739a8dfc607721cef75de9e541'
        if ((Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expected) { throw 'Node.js verification failed. Run Baslat.cmd again.' }
        New-Item -ItemType Directory -Force -Path $runtimeRoot | Out-Null
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [IO.Compression.ZipFile]::ExtractToDirectory($zip,$runtimeRoot)
    }
    return $runtimeNode
}
$nodeBinary = $null
foreach ($candidate in @((Join-Path $toolsRoot 'node.exe'),(Join-Path $toolsRoot 'node-runtime/node-v24.21.0-win-x64/node.exe'),(Get-Command node.exe -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source))) {
    if ($candidate -and (Test-Path -LiteralPath $candidate)) {
        $version = (& $candidate --version) -replace '^v',''
        if ($LASTEXITCODE -eq 0 -and [version]$version -ge [version]'22.12.0') { $nodeBinary = $candidate; break }
    }
}
if (-not $nodeBinary) { $nodeBinary = Get-LocalNode }
$env:PATH = (Split-Path -Parent $nodeBinary) + ';' + $env:PATH
$stateFile = Join-Path $toolsRoot 'setup-state.json'
$state = $null
if (Test-Path -LiteralPath $stateFile) { try { $state = Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json } catch { } }
$portableStamp = Join-Path $toolsRoot 'dependencies.sha256'
if (-not $state -and (Test-Path -LiteralPath $portableStamp)) { $state = @{lockHash=(Get-Content -LiteralPath $portableStamp -Raw).Trim()} }
$depsReady = (Test-Path -LiteralPath (Join-Path $projectRoot 'node_modules/vite/bin/vite.js')) -and (Test-Path -LiteralPath (Join-Path $projectRoot 'node_modules/playwright/cli.js')) -and (Test-Path -LiteralPath (Join-Path $projectRoot 'node_modules/ffmpeg-static/ffmpeg.exe'))
if (-not $depsReady -or $state.lockHash -ne $lockHash) {
    . (Join-Path $PSScriptRoot 'service-state.ps1')
    $managedServices = @(Get-ChildItem -LiteralPath $toolsRoot -File | Where-Object { $_.Name -match '^(studio|factory)-\d+\.json$' })
    foreach ($service in $managedServices) {
        if ($service.Name -match '^factory-(\d+)\.json$') {
            $servicePort = $Matches[1]
            $busy = $false
            try { $busy = (Invoke-RestMethod "http://127.0.0.1:$servicePort/api/factory" -TimeoutSec 2).summary.pending -gt 0 } catch { }
            if ($busy) { throw 'Finish the queued videos before updating dependencies, then run Baslat.cmd again.' }
        }
    }
    foreach ($service in $managedServices) { Stop-MarbleService (Get-MarbleServiceRecord $service.FullName) | Out-Null }
    $npmCli = Join-Path (Split-Path -Parent $nodeBinary) 'node_modules/npm/bin/npm-cli.js'
    if (-not (Test-Path -LiteralPath $npmCli)) { $nodeBinary = Get-LocalNode; $env:PATH = (Split-Path -Parent $nodeBinary) + ';' + $env:PATH; $npmCli = Join-Path (Split-Path -Parent $nodeBinary) 'node_modules/npm/bin/npm-cli.js' }
    Write-Host 'Uygulama dosyalari hazirlaniyor. Ilk acilista veya bagimliliklar degisince bir kez yapilir.'
    Push-Location -LiteralPath $projectRoot
    try { & $nodeBinary $npmCli ci --no-audit --no-fund | Out-Host; if ($LASTEXITCODE -ne 0) { throw 'Dependency download failed. Check your connection and run Baslat.cmd again.' } }
    finally { Pop-Location }
}
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path $toolsRoot 'playwright'
if (-not $SkipBrowser) {
    $browserManifest = Get-Content -LiteralPath (Join-Path $projectRoot 'node_modules/playwright-core/browsers.json') -Raw | ConvertFrom-Json
    $revision = ($browserManifest.browsers | Where-Object { $_.name -eq 'chromium-headless-shell' }).revision
    $cachedBrowser = Join-Path $env:PLAYWRIGHT_BROWSERS_PATH "chromium_headless_shell-$revision/chrome-headless-shell-win64/chrome-headless-shell.exe"
    $bundledReady = (Test-Path -LiteralPath (Join-Path $toolsRoot 'browser/chrome-headless-shell.exe')) -and $state.lockHash -eq $lockHash
    if (-not $bundledReady -and -not (Test-Path -LiteralPath $cachedBrowser)) {
        Write-Host 'Video uretim tarayicisi hazirlaniyor. Chrome kurmaniz gerekmez.'
        & $nodeBinary (Join-Path $projectRoot 'node_modules/playwright/cli.js') install chromium --only-shell | Out-Host
        if ($LASTEXITCODE -ne 0) { throw 'Video browser download failed. Check your connection and run Baslat.cmd again.' }
    }
}
$revisionFiles = @((Get-ChildItem -LiteralPath (Join-Path $projectRoot 'src'),(Join-Path $projectRoot 'scripts') -Recurse -File | Where-Object { $_.Extension -in @('.js','.mjs','.ps1') -and $_.FullName -notmatch '[\\/]statistics-cache[\\/]' }) | Sort-Object FullName)
$revisionText = $lockHash + (($revisionFiles | ForEach-Object { $_.FullName.Substring($projectRoot.Length) + ':' + (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash }) -join '|')
$sha = [Security.Cryptography.SHA256]::Create()
try { $env:MARBLE_RUNTIME_REVISION = [BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($revisionText))).Replace('-','') } finally { $sha.Dispose() }
@{lockHash=$lockHash;node=$nodeBinary;revision=$env:MARBLE_RUNTIME_REVISION} | ConvertTo-Json | Set-Content -LiteralPath $stateFile -Encoding UTF8
$env:MARBLE_SETUP_READY = "$projectRoot|$lockHash"
} finally { $setupLock.Dispose() }
