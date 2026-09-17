@echo off
setlocal
cd /d "%~dp0"
title CSD Attendance Portal

echo ================================================
echo        CSD ATTENDANCE PORTAL - STARTING
echo ================================================
echo.

where py >nul 2>&1
if %errorlevel%==0 (
    set "PYTHON=py -3"
) else (
    where python >nul 2>&1
    if %errorlevel%==0 (
        set "PYTHON=python"
    ) else (
        echo Python 3 is not installed or is not in PATH.
        echo.
        echo Install Python 3 from https://www.python.org/downloads/
        echo During installation, tick "Add Python to PATH".
        echo.
        pause
        exit /b 1
    )
)

if not exist "attendance.db" (
    echo Database file not found. It will be created automatically.
)

echo Starting server...
start "CSD Attendance Server" /min cmd /c "%PYTHON% server.py"
timeout /t 2 /nobreak >nul

echo Opening website in your browser...
start "" "http://localhost:8000"
echo.
echo Website: http://localhost:8000
echo Keep the server window open while using the portal.
echo.
pause
endlocal
