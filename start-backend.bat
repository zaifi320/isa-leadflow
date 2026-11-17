@echo off
title ISA Sales Backend (FastAPI)
echo ======================================================
echo Starting ISA Sales Dashboard Backend API
echo Host: http://127.0.0.1:8000
echo API Docs: http://127.0.0.1:8000/docs
echo ======================================================
cd /d "D:\isa-lead-website\backend"
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
if errorlevel 1 (
    echo.
    echo Trying fallback Python path...
    "D:\Tools\Python 3.10\python.exe" -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
)
pause
