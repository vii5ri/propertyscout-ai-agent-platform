@echo off
chcp 65001 >nul
title PropertyScout AI Agent Platform
cd /d "%~dp0"

echo.
echo =============================================
echo   PropertyScout AI Agent Platform
echo   http://localhost:8080
echo =============================================
echo.

:: Kill any existing process on port 8080 (old server)
echo Checking for existing server on port 8080...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":8080" ^| findstr "LISTENING"') do (
    echo Stopping old server (PID %%a)...
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 1 >nul

echo Starting new server...
echo.

:: Open browser after 4 seconds (in background)
start /b "" cmd /c "timeout /t 4 >nul && start http://localhost:8080"

:: Run server in THIS window (stays open, shows logs)
python server.py

:: If server crashes, keep window open so user can read the error
echo.
echo =============================================
echo  Server stopped. Check error above if any.
echo  Press any key to close this window.
echo =============================================
pause >nul
