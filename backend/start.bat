@echo off
title ISA Sales Backend (FastAPI)
cd /d "%~dp0"
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
if errorlevel 1 (
    echo.
    echo Trying fallback Python path...
    "D:\Tools\Python 3.10\python.exe" -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
)
pause
