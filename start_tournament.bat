@echo off
title PRO KABADDI TOURNAMENT SERVER
color 0A
cls
echo =====================================================================
echo                PRO KABADDI TOURNAMENT SERVER & SCOREBOARD
echo =====================================================================
echo.
echo  * Starting local broadcast server on port 8081...
echo.

:: Detect Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Python was not found in your system PATH!
    echo Please install Python 3 or add it to PATH.
    pause
    exit /b 1
)

:: Read local IP
for /f "tokens=4" %%a in ('route print^|findstr 0.0.0.0.*0.0.0.0^|findstr /v "127.0.0.1"') do (
    set LOCAL_IP=%%a
    goto :found_ip
)
:found_ip

echo  =====================================================================
echo   MATCH CONSOLE & BROADCAST LINKS:
echo  =====================================================================
echo   - Local PC Screen (Big Display / TV):
echo       http://localhost:8081
echo.
echo   - Mobile Scorer Control (Scorekeeper Phone):
echo       http://%LOCAL_IP%:8081/?role=scorer
echo.
echo   - Spectator Live View (Audience / Mobile QR):
echo       http://%LOCAL_IP%:8081/?role=viewer
echo.
echo  =====================================================================
echo   OFFICIAL SCORER CREDENTIALS:
echo  =====================================================================
echo   Default Scorer ID:   admin
echo   Default Password:    1234
echo.
echo   * You can change Scorer ID and Password anytime from the UI:
echo     Click "Set ID/Pass" in the scorer banner or login modal.
echo  =====================================================================
echo.
echo  Launching browser...
timeout /t 2 >nul
start http://localhost:8081

echo.
echo  [SERVER RUNNING] Press Ctrl+C in this window to stop the tournament server.
echo.
python server.py
pause
