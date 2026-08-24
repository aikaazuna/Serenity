@echo off
setlocal
cd /d "%~dp0"

title Serenity Hub - Lancement...

:: Detection automatique du chemin Node.js si non present dans le PATH
if exist "C:\Program Files\nodejs" set "PATH=C:\Program Files\nodejs;%PATH%"
if exist "C:\Program Files (x86)\nodejs" set "PATH=C:\Program Files (x86)\nodejs;%PATH%"

:: Nettoie les anciens processus zombies electron et node sur le port 5188
taskkill /f /im electron.exe >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5188" ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo ========================================================
echo                     Serenity Hub
echo ========================================================
echo Demarrage de l'application...
echo.

call npm run app:dev
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Une erreur est survenue lors du lancement.
    pause
)
