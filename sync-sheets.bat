@echo off
title Sync Leads from Google Sheets
echo ======================================================
echo Synchronizing Leads from Google Sheets into Database
echo ======================================================
cd /d "D:\isa-lead-website\backend"
python sync_service.py
pause

