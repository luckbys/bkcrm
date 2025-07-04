# 🔧 CORREÇÃO RÁPIDA DO WEBHOOK EVOLUTION API

$EVOLUTION_API_URL = "https://evochat.devsible.com.br"
$API_KEY = "AE69F672-751C-41DC-81E7-86BF5074208E"
$INSTANCE_NAME = "atendimento-ao-cliente-suporte-n1"
$WEBHOOK_URL = "http://localhost:4000/webhook/evolution"

Write-Host "🔧 Corrigindo webhook Evolution API..." -ForegroundColor Cyan

$headers = @{
    "apikey" = $API_KEY
    "Content-Type" = "application/json"
}

$webhookConfig = @{
    enabled = $true
    url = $WEBHOOK_URL
    events = @("MESSAGES_UPSERT", "CONNECTION_UPDATE", "QRCODE_UPDATED")
    webhook_by_events = $false
    webhook_base64 = $false
} | ConvertTo-Json -Depth 3

Write-Host "📤 Configurando webhook para: $WEBHOOK_URL" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$EVOLUTION_API_URL/webhook/set/$INSTANCE_NAME" -Method Post -Headers $headers -Body $webhookConfig
    Write-Host "✅ Webhook configurado com sucesso!" -ForegroundColor Green
    
    # Verificar configuração
    $verify = Invoke-RestMethod -Uri "$EVOLUTION_API_URL/webhook/find/$INSTANCE_NAME" -Method Get -Headers $headers
    Write-Host "📋 URL configurada: $($verify.webhook.url)" -ForegroundColor White
    
    # Testar webhook
    $testPayload = '{"event":"TEST","instance":"' + $INSTANCE_NAME + '","data":{"message":"Teste"}}'
    try {
        $testResponse = Invoke-RestMethod -Uri $WEBHOOK_URL -Method Post -Body $testPayload -ContentType "application/json" -TimeoutSec 5
        Write-Host "✅ Teste do webhook bem-sucedido!" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Erro no teste - verifique se servidor está rodando na porta 4000" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "🎉 Correção concluída!" -ForegroundColor Green 