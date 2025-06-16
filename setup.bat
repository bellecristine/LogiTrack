@echo off
echo ====================================
echo    LogiTrack - Script de Setup
echo ====================================
echo.

echo [1/5] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao encontrado. Instale o Node.js primeiro.
    echo Baixe em: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js encontrado

echo.
echo [2/5] Instalando dependencias do Auth Service...
cd auth-service
call npm install
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependencias do Auth Service
    pause
    exit /b 1
)
echo ✅ Auth Service configurado

echo.
cd ..
echo [3/5] Instalando dependencias do Tracking Service...
cd tracking-service
call npm install
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependencias do Tracking Service
    pause
    exit /b 1
)
echo ✅ Tracking Service configurado

echo.
cd ..
echo [4/5] Verificando Flutter...
cd trabalho-2025-1-mobile-logitrack-sistema-de-gestao-logistica-main\mobile
flutter --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Flutter nao encontrado. 
    echo.
    echo Para usar o app mobile, instale o Flutter:
    echo 1. Baixe: https://flutter.dev/docs/get-started/install/windows
    echo 2. Extraia o ZIP em C:\flutter
    echo 3. Adicione C:\flutter\bin ao PATH do sistema
    echo 4. Execute: flutter doctor
    echo.
    echo Continuando sem o Flutter...
) else (
    echo ✅ Flutter encontrado
    echo [5/5] Instalando dependencias do Flutter...
    call flutter pub get
    if %errorlevel% neq 0 (
        echo ❌ Erro ao instalar dependencias do Flutter
        echo Execute manualmente: flutter clean && flutter pub get
    ) else (
        echo ✅ App mobile configurado
    )
)

echo.
cd ..\..
echo ====================================
echo         Setup Concluido!
echo ====================================
echo.
echo Proximos passos:
echo 1. Configure o PostgreSQL (para tracking-service)
echo 2. Execute: npm run dev (em cada servico)
echo 3. Para o mobile: flutter run
echo.
pause 