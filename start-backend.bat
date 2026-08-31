@echo off
title Backend - Loyalty App
echo.
echo  Deteniendo proceso en puerto 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)
echo  Puerto 3000 libre.
echo.
echo  Iniciando backend...
echo.
cd /d "%~dp0backend"
npm run dev
