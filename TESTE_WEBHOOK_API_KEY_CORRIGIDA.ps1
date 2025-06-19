# 🧪 Teste do Webhook com API Key Corrigida
Write-Host "🧪 Testando webhook com API key corrigida..." -ForegroundColor Cyan

$body = @{
    event = "messages.upsert"
    instance = "teste-api-key-corrigida-nunmsg"
    data = @{
        key = @{
            remoteJid = "5511999887766@s.whatsapp.net"
            fromMe = $false
            id = "TEST_NUNMSG_$(Get-Date -Format 'yyyyMMddHHmmss')"
        }
        message = @{
            conversation = "[TESTE NUNMSG] Verificando se campo nunmsg está sendo salvo automaticamente"
        }
        messageTimestamp = [int][double]::Parse((Get-Date -UFormat %s))
        pushName = "Teste Campo Nunmsg"
    }
} | ConvertTo-Json -Depth 10

Write-Host "📤 Enviando mensagem de teste..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:4000/webhook/evolution" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Resposta do webhook:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
    
    if ($response.success -eq $true) {
        Write-Host ""
        Write-Host "🎯 Sucesso! Agora verificando no banco de dados..." -ForegroundColor Green
        Write-Host "📱 Procure por um ticket com nunmsg = '+5511999887766'" -ForegroundColor Yellow
        Write-Host "🗄️ Query SQL para verificar:" -ForegroundColor Cyan
        Write-Host "SELECT id, title, nunmsg, channel, created_at FROM tickets WHERE nunmsg = '+5511999887766' ORDER BY created_at DESC LIMIT 1;" -ForegroundColor White
        
        Write-Host ""
        Write-Host "✅ RESULTADO ESPERADO:" -ForegroundColor Green
        Write-Host "  - Cliente criado na tabela profiles ✅" -ForegroundColor Green
        Write-Host "  - Ticket criado com campo nunmsg preenchido ✅" -ForegroundColor Green
        Write-Host "  - Mensagem salva corretamente ✅" -ForegroundColor Green
        Write-Host "  - Sem mais erros 'Invalid API key' ✅" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Erro no teste:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Message -like "*Invalid API key*") {
        Write-Host ""
        Write-Host "🔴 AINDA HÁ PROBLEMA COM A API KEY!" -ForegroundColor Red
        Write-Host "Verifique se o webhook foi reiniciado corretamente." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🔄 Para reiniciar o webhook se necessário:" -ForegroundColor Cyan
Write-Host "taskkill /f /im node.exe" -ForegroundColor White
Write-Host "cd backend\webhooks" -ForegroundColor White  
Write-Host "node webhook-evolution-complete-corrigido.js" -ForegroundColor White 