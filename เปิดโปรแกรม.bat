@echo off
chcp 65001 >nul
title PropertyScout AI
cd /d "%~dp0"

echo.
echo  PropertyScout AI Agent Platform
echo  http://localhost:8080
echo.
echo  Browser will open in 4 seconds.
echo  Close this window to stop the server.
echo.

start /b "" cmd /c "timeout /t 4 >nul && start http://localhost:8080"

python server.py
if errorlevel 1 (
    py server.py
)

echo.
echo  Server stopped. Press any key to close.
pause >nul
