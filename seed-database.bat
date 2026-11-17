@echo off
title Seed ISA Database
echo ======================================================
echo Seeding ISA Sales Leads Database
echo ======================================================
cd /d "D:\isa-lead-website\backend"
python seed_data.py
if errorlevel 1 (
    echo.
    echo Trying fallback Python path...
    "D:\Tools\Python 3.10\python.exe" seed_data.py
)
pause
