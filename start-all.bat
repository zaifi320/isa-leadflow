@echo off
title Launch ISA Sales Dashboard
echo ======================================================
echo Launching ISA Sales Dashboard (Backend + Frontend)
echo ======================================================

start "ISA Backend API" cmd /k "call D:\isa-lead-website\start-backend.bat"
timeout /t 2 /nobreak >nul
start "ISA Frontend" cmd /k "call D:\isa-lead-website\start-frontend.bat"

echo.
echo Both servers have been launched in separate windows!
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo.

