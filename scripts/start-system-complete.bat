@echo off
echo 🚀 INICIANDO SISTEMA BKCRM COMPLETO
echo =====================================

echo.
echo 📡 Iniciando servidor WebSocket/Webhook na porta 4000...
start "BKCRM WebSocket" cmd /k "node webhook-evolution-websocket.cjs"

echo.
echo ⏳ Aguardando 3 segundos para WebSocket inicializar...
timeout /t 3 /nobreak >nul

echo.
echo 🌐 Iniciando frontend na porta 3001...
start "BKCRM Frontend" cmd /k "npm run dev"

echo.
echo ✅ Sistema iniciado com sucesso!
echo.
echo 📋 Serviços ativos:
echo    • WebSocket/Webhook: http://localhost:4000
echo    • Frontend: http://localhost:3001
echo    • Health Check: http://localhost:4000/webhook/health
echo.
echo 🔍 Para monitorar:
echo    • node scripts/test-integration.mjs
echo.
echo Pressione qualquer tecla para sair...
pause >nul 