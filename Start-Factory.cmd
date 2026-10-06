@echo off
cd /d "%~dp0"
if exist "%~dp0tools\node.exe" set "PATH=%~dp0tools;%PATH%"
where node.exe >nul 2>nul
if errorlevel 1 (
  echo Node.js bulunamadi. Pakette tools\node.exe olmali veya Node.js kurulu olmali.
  pause
  exit /b 1
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-factory.ps1"
if errorlevel 1 pause
