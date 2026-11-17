@echo off
set "PATH=D:\Tools\nodejs;%PATH%"
cd /d "D:\isa-lead-website\frontend"
node.exe node_modules\vite\bin\vite.js --host 0.0.0.0 --port 5173
