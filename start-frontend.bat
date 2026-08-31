@echo off
title Frontend - Loyalty App
echo.
echo  Deteniendo proceso en puerto 5173...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)
echo  Puerto 5173 libre.
echo.
echo  Iniciando frontend...
echo.
cd /d "%~dp0frontend"
npm run dev
