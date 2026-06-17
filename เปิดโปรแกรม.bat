@echo off
chcp 65001 >nul
title PropertyScout AI — Starting...

:: Check if port 8080 is already in use
netstat -an | find "0.0.0.0:8080" >nul 2>&1
if %errorlevel%==0 (
    echo Server already running on port 8080
    timeout /t 1 >nul
    start "" "http://localhost:8080/AI Agent Platform.html"
    exit /b
)

:: Start Python HTTP server in background
echo Starting PropertyScout AI Agent Platform...
start "PropertyScout Server" /min cmd /c "python -m http.server 8080 2>nul"

:: Wait for server to be ready
timeout /t 2 >nul

:: Open browser
start "" "http://localhost:8080/AI Agent Platform.html"

echo.
echo PropertyScout is running at http://localhost:8080
echo Close this window to stop the server, or just leave it minimized.
echo.
pause
