@echo off
echo ============================================
echo    AttendancePro - Starting Application
echo ============================================
echo.
echo Starting Backend (port 5001)...
start "AttendancePro Backend" cmd /k "cd /d "%~dp0backend" && node server.js"
echo.
timeout /t 5 /nobreak >nul
echo Starting Frontend (port 3000)...
start "AttendancePro Frontend" cmd /k "cd /d "%~dp0frontend" && npm start"
echo.
echo ============================================
echo  Backend  : http://localhost:5001
echo  Frontend : http://localhost:3000
echo  Admin    : admin@company.com / Admin@123
echo ============================================
pause
