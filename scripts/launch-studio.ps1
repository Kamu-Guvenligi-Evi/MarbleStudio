param([switch]$NoBrowser,[int]$StudioPort=5173,[int]$FactoryPort=5180)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$transcribing = $false
$result = 0
try {
    $logRoot = Join-Path $projectRoot 'artifacts'
    New-Item -ItemType Directory -Force -Path $logRoot | Out-Null
    $logFile = Join-Path $logRoot ('startup-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff') + '.log')
    Start-Transcript -LiteralPath $logFile | Out-Null
    $transcribing = $true
    Write-Host 'Marble Studio aciliyor. Ilk kurulum internet gerektirir; bu pencereyi kapatmayin.'
    & (Join-Path $projectRoot 'Start-Studio.ps1') -NoBrowser:$NoBrowser -StudioPort $StudioPort -FactoryPort $FactoryPort
} catch {
    $result = 1
    Write-Host ('Marble Studio baslatilamadi: ' + $_.Exception.Message) -ForegroundColor Red
    Write-Host $_.InvocationInfo.PositionMessage
    if ($transcribing) { Write-Host ('Hata kaydi: ' + $logFile) }
    Write-Host 'ZIP indirdiyseniz once tum dosyalari bir klasore cikartin, sonra Baslat.cmd dosyasini acin.'
} finally {
    if ($transcribing) { Stop-Transcript | Out-Null }
}
exit $result
