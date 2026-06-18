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
echo Server starting... browser will open automatically.
echo To stop: close this window or press Ctrl+C
echo.

:: Open browser after 3 seconds (in background, doesn't block)
start /b "" cmd /c "timeout /t 3 >nul && start http://localhost:8080"

:: Run server in THIS window (stays open, shows logs)
python server.py

:: If server crashes, keep window open so user can read the error
echo.
echo Server stopped. Press any key to close.
pause >nul
