@echo off
echo ====================================
echo   LogiTrack - Iniciando Servicos
echo ====================================
echo.

echo Iniciando Auth Service (porta 3001)...
start "Auth Service" cmd /k "cd auth-service && npm run dev"
timeout /t 2 /nobreak >nul

echo Iniciando Tracking Service (porta 3002)...
start "Tracking Service" cmd /k "cd tracking-service && npm run dev"
timeout /t 2 /nobreak >nul

echo.
echo ✅ Servicos iniciados em janelas separadas
echo.
echo URLs dos servicos:
echo - Auth Service: http://localhost:3001
echo - Tracking Service: http://localhost:3002
echo.
echo Para o app mobile, execute em outra janela:
echo cd trabalho-2025-1-mobile-logitrack-sistema-de-gestao-logistica-main\mobile
echo flutter run
echo.
pause 