@echo off
chcp 65001 >nul
title PropertyScout AI — Starting...

:: Check if server is already LISTENING on port 8080
netstat -ano 2>nul | findstr "LISTENING" | findstr ":8080" >nul 2>&1
if %errorlevel%==0 (
    echo Server already running — opening browser...
    timeout /t 1 >nul
    start "" "http://localhost:8080"
    exit /b
)

:: Start Flask server — window visible so errors can be seen
echo Starting PropertyScout AI Agent Platform...
echo (You can minimise this window once the server shows "Running on http://...")
echo.
start "PropertyScout AI Server" cmd /k "python server.py"

:: Wait for Flask to be ready (max ~12s, checks every second)
set tries=0
:waitloop
timeout /t 1 >nul
netstat -ano 2>nul | findstr "LISTENING" | findstr ":8080" >nul 2>&1
if %errorlevel%==0 goto ready
set /a tries+=1
if %tries% lss 12 goto waitloop

echo.
echo WARNING: Server took too long to start.
echo Check the server window for errors (Flask not installed?)
echo Try running: pip install flask
goto done

:ready
echo Server is ready!
start "" "http://localhost:8080"

:done
