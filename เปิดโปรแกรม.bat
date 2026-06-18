@echo off
chcp 65001 >nul
title PropertyScout AI — Starting...

:: Check if port 8080 is already in use (Flask server running)
netstat -an 2>nul | find "0.0.0.0:8080" >nul 2>&1
if %errorlevel%==0 (
    echo Server already running — opening browser...
    timeout /t 1 >nul
    start "" "http://localhost:8080"
    exit /b
)

:: Start Flask server (supports Upload & Run)
echo Starting PropertyScout AI Agent Platform...
start "PropertyScout Server" /min cmd /c "python server.py"

:: Wait for Flask to be ready
timeout /t 3 >nul

:: Open browser
start "" "http://localhost:8080"

echo.
echo PropertyScout is running at http://localhost:8080
echo Close the minimized window to stop the server.
echo.
