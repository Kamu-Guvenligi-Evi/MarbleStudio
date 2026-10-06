param([string]$Destination,[string]$BrowserDirectory)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
if (-not $Destination) { $Destination = Join-Path $projectRoot ('MarbleStudio-Friends-' + (Get-Date -Format 'yyyyMMdd') + '.zip') }
$Destination = [IO.Path]::GetFullPath($Destination)
if (Test-Path -LiteralPath $Destination) { throw "Arşiv zaten var: $Destination" }
$nodeBinary = (Get-Command node.exe -ErrorAction Stop).Source
if (-not (Test-Path -LiteralPath (Join-Path $projectRoot 'node_modules/ffmpeg-static/ffmpeg.exe'))) { throw 'FFmpeg bağımlılığı eksik. Önce npm install çalıştır.' }
if (-not $BrowserDirectory) {
    $browserCandidate = Get-ChildItem -LiteralPath (Join-Path $projectRoot 'artifacts/portable-browser-cache') -Filter 'chrome-headless-shell.exe' -Recurse -File -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($browserCandidate) { $BrowserDirectory = $browserCandidate.DirectoryName }
}
if (-not $BrowserDirectory -or -not (Test-Path -LiteralPath (Join-Path $BrowserDirectory 'chrome-headless-shell.exe'))) { throw 'Taşınabilir tarayıcı eksik. PLAYWRIGHT_BROWSERS_PATH=artifacts/portable-browser-cache ile playwright install chromium --only-shell çalıştır.' }

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [IO.Compression.ZipFile]::Open($Destination,[IO.Compression.ZipArchiveMode]::Create)
try {
    $folders = @('src','public','scripts','node_modules')
    if (Test-Path -LiteralPath (Join-Path $projectRoot 'work-videos')) { $folders += 'work-videos' }
    $files = @('index.html','factory.html','factory-render.html','vite.config.js','package.json','package-lock.json','Baslat.cmd','Start-Factory.cmd','Start-Studio.ps1','README.md','FACTORY.md')
    foreach ($folder in $folders) {
        $base = Join-Path $projectRoot $folder
        Get-ChildItem -LiteralPath $base -Recurse -File | ForEach-Object {
            $relative = $_.FullName.Substring($projectRoot.Length + 1).Replace('\','/')
            if ($relative -match '^scripts/(statistics-cache|__pycache__)/') { return }
            [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive,$_.FullName,"MarbleStudio/$relative",[IO.Compression.CompressionLevel]::Optimal) | Out-Null
        }
    }
    foreach ($name in $files) {
        [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive,(Join-Path $projectRoot $name),"MarbleStudio/$name",[IO.Compression.CompressionLevel]::Optimal) | Out-Null
    }
    [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive,$nodeBinary,'MarbleStudio/tools/node.exe',[IO.Compression.CompressionLevel]::Optimal) | Out-Null
    [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive,(Join-Path (Split-Path $nodeBinary) 'LICENSE'),'MarbleStudio/tools/LICENSE',[IO.Compression.CompressionLevel]::Optimal) | Out-Null
    $stamp = $archive.CreateEntry('MarbleStudio/tools/dependencies.sha256')
    $stampWriter = [IO.StreamWriter]::new($stamp.Open(),[Text.Encoding]::ASCII)
    try { $stampWriter.Write((Get-FileHash -LiteralPath (Join-Path $projectRoot 'package-lock.json') -Algorithm SHA256).Hash) } finally { $stampWriter.Dispose() }
    $BrowserDirectory = [IO.Path]::GetFullPath($BrowserDirectory).TrimEnd([IO.Path]::DirectorySeparatorChar)
    Get-ChildItem -LiteralPath $BrowserDirectory -Recurse -File | ForEach-Object {
        $relative = $_.FullName.Substring($BrowserDirectory.Length + 1).Replace('\','/')
        [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive,$_.FullName,"MarbleStudio/tools/browser/$relative",[IO.Compression.CompressionLevel]::Optimal) | Out-Null
    }
    $guide = @'
MARBLE STUDIO - ARKADAS PAKETI

1. ZIP dosyasini bir klasore ayikla.
2. MarbleStudio klasorundeki Baslat.cmd dosyasina cift tikla.
3. Node.js, npm veya Google Chrome kurulumu gerekmez. Gerekli calistiricilar paketin icindedir.
4. Studio http://127.0.0.1:5173 adresinde, Icerik Atolyesi http://127.0.0.1:5180 adresinde acilir.
5. Uretilen videolar bu klasordeki output altina kaydedilir.

YouTube yuklemesi baslangicta kapali. Kendi Google OAuth bilgilerini ve kanallarini baglamak icin FACTORY.md dosyasina bak.
Muzik ve gorsel kaynaklarini disarida paylasmadan once ilgili kullanim kosullarini kontrol et.
'@
    $entry = $archive.CreateEntry('MarbleStudio/BENI-OKU.txt')
    $writer = [IO.StreamWriter]::new($entry.Open(),[Text.Encoding]::UTF8)
    try { $writer.Write($guide) } finally { $writer.Dispose() }
} finally { $archive.Dispose() }
Get-Item -LiteralPath $Destination | Select-Object FullName,Length
