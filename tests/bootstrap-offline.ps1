$ErrorActionPreference = 'Stop'
$sourceRoot = Split-Path -Parent $PSScriptRoot
$fixture = Join-Path $sourceRoot ('artifacts/startup offline ' + [Guid]::NewGuid().ToString('N'))
$oldSetup = $env:MARBLE_SETUP_READY
$oldBrowser = $env:MARBLE_BROWSER_READY
$oldPath = $env:PATH
$oldBrowserPath = $env:PLAYWRIGHT_BROWSERS_PATH
$oldRevision = $env:MARBLE_RUNTIME_REVISION
function Invoke-TestLauncher([int]$Port=5173) {
    $launcher = Join-Path $fixture 'scripts/launch-studio.ps1'
    $process = Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$launcher`" -NoBrowser -StudioPort $Port" -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $fixture 'launcher-output.log') -RedirectStandardError (Join-Path $fixture 'launcher-error.log')
    $processHandle = $process.Handle
    if (-not $process.WaitForExit(30000)) { throw 'Test launcher timed out.' }
    return $process.ExitCode
}
try {
    foreach ($folder in @('scripts','src','tools','node_modules/vite/bin','node_modules/playwright','node_modules/playwright-core','node_modules/ffmpeg-static')) {
        New-Item -ItemType Directory -Force -Path (Join-Path $fixture $folder) | Out-Null
    }
    Copy-Item (Join-Path $sourceRoot 'scripts/bootstrap-runtime.ps1') (Join-Path $fixture 'scripts/bootstrap-runtime.ps1')
    $runtime = (Get-Content (Join-Path $sourceRoot 'tools/setup-state.json') -Raw | ConvertFrom-Json).node
    New-Item -ItemType HardLink -Path (Join-Path $fixture 'tools/node.exe') -Target $runtime | Out-Null
    Set-Content (Join-Path $fixture 'package-lock.json') '{}' -Encoding ASCII
    Set-Content (Join-Path $fixture 'node_modules/vite/bin/vite.js') ''
    Set-Content (Join-Path $fixture 'node_modules/ffmpeg-static/ffmpeg.exe') ''
    Set-Content (Join-Path $fixture 'node_modules/playwright-core/browsers.json') '{"browsers":[{"name":"chromium-headless-shell","revision":"test"}]}' -Encoding ASCII
    $cli = Join-Path $fixture 'node_modules/playwright/cli.js'
    Set-Content $cli 'process.exit(1)' -Encoding ASCII
    $hash = (Get-FileHash (Join-Path $fixture 'package-lock.json') -Algorithm SHA256).Hash
    @{lockHash=$hash} | ConvertTo-Json | Set-Content (Join-Path $fixture 'tools/setup-state.json')
    $env:MARBLE_SETUP_READY = ''
    $env:MARBLE_BROWSER_READY = ''
    $bootstrap = Join-Path $fixture 'scripts/bootstrap-runtime.ps1'
    & $bootstrap -SkipBrowser
    if ($env:MARBLE_SETUP_READY -ne "$fixture|$hash") { throw 'Core setup did not complete without browser.' }
    if ($env:MARBLE_BROWSER_READY) { throw 'Core setup incorrectly marked browser ready.' }
    $failed = $false
    try { & $bootstrap } catch {
        if ($_.Exception.Message -notmatch 'Video browser download failed') { throw }
        $failed = $true
    }
    if (-not $failed) { throw 'Factory skipped required browser setup after core setup.' }
    & $bootstrap -SkipBrowser
    if ($env:MARBLE_BROWSER_READY) { throw 'Failed browser setup was cached as success.' }
    $cached = Join-Path $fixture 'tools/playwright/chromium_headless_shell-test/chrome-headless-shell-win64'
    New-Item -ItemType Directory -Force -Path $cached | Out-Null
    Set-Content (Join-Path $cached 'chrome-headless-shell.exe') ''
    & $bootstrap
    if ($env:MARBLE_BROWSER_READY -ne "$fixture|$hash") { throw 'Browser setup could not recover.' }
    Write-Host 'PASS: core starts without video browser, failed browser setup remains retryable, cached browser recovers. No downloads.'
    Copy-Item (Join-Path $sourceRoot 'scripts/launch-studio.ps1') (Join-Path $fixture 'scripts/launch-studio.ps1')
    Set-Content (Join-Path $fixture 'Start-Studio.ps1') "throw 'Simulated startup failure'" -Encoding ASCII
    if ((Invoke-TestLauncher) -ne 1) { throw 'Launcher did not report startup failure.' }
    $logs = @(Get-ChildItem (Join-Path $fixture 'artifacts') -Filter 'startup-*.log')
    if ($logs.Count -ne 1 -or (Get-Content $logs[0].FullName -Raw) -notmatch 'Simulated startup failure') { throw 'Startup error was not saved.' }
    Set-Content (Join-Path $fixture 'Start-Studio.ps1') "Write-Host 'Simulated startup success'" -Encoding ASCII
    if ((Invoke-TestLauncher) -ne 0) { throw 'Launcher failed on successful startup.' }
    Write-Host 'PASS: launcher preserves failure details in a log and returns correct success/failure exit codes.'
    Copy-Item (Join-Path $sourceRoot 'Start-Studio.ps1') (Join-Path $fixture 'Start-Studio.ps1')
    Copy-Item (Join-Path $sourceRoot 'scripts/service-state.ps1') (Join-Path $fixture 'scripts/service-state.ps1')
    Set-Content (Join-Path $fixture 'scripts/start-factory.ps1') "throw 'Simulated video service failure'" -Encoding ASCII
    Set-Content (Join-Path $fixture 'node_modules/vite/bin/vite.js') "require('http').createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end('<title>Marble Studio</title>');}).listen(Number(process.argv[process.argv.indexOf('--port')+1]),'127.0.0.1');" -Encoding ASCII
    $listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback,0)
    $listener.Start()
    $port = $listener.LocalEndpoint.Port
    $listener.Stop()
    try {
        if ((Invoke-TestLauncher $port) -ne 0) { throw 'Video failure prevented studio startup.' }
        if ((Invoke-WebRequest "http://127.0.0.1:$port" -UseBasicParsing -TimeoutSec 5).Content -notmatch 'Marble Studio') { throw 'Studio was not reachable after video failure.' }
        Write-Host 'PASS: real studio launcher leaves the HTTP studio reachable when video startup fails (isolated server).'
    } finally {
        . (Join-Path $sourceRoot 'scripts/service-state.ps1')
        Stop-MarbleService (Get-MarbleServiceRecord (Join-Path $fixture "tools/studio-$port.json")) | Out-Null
    }
} finally {
    $env:MARBLE_SETUP_READY = $oldSetup
    $env:MARBLE_BROWSER_READY = $oldBrowser
    $env:PATH = $oldPath
    $env:PLAYWRIGHT_BROWSERS_PATH = $oldBrowserPath
    $env:MARBLE_RUNTIME_REVISION = $oldRevision
    # Keep the small fixture under artifacts for inspection; never touch live services.
}
