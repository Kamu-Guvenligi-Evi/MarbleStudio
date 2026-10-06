function Get-MarbleServiceRecord($File) {
    if (Test-Path -LiteralPath $File) { try { return Get-Content -LiteralPath $File -Raw | ConvertFrom-Json } catch { } }
    return $null
}
function Stop-MarbleService($Record) {
    if (-not $Record) { return $false }
    $serviceProcess = Get-Process -Id $Record.pid -ErrorAction SilentlyContinue
    if (-not $serviceProcess -or $serviceProcess.StartTime.ToUniversalTime().Ticks.ToString() -ne $Record.started) { return $false }
    Stop-Process -Id $serviceProcess.Id -Force
    $serviceProcess.WaitForExit(10000) | Out-Null
    return $true
}
function Save-MarbleService($File,$Process) {
    @{pid=$Process.Id;started=$Process.StartTime.ToUniversalTime().Ticks.ToString();revision=$env:MARBLE_RUNTIME_REVISION} | ConvertTo-Json | Set-Content -LiteralPath $File -Encoding UTF8
}
