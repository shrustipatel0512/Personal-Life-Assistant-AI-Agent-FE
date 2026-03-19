@echo off
cd /d "%~dp0"
call npm.cmd start -- --host 0.0.0.0 --port 4200
