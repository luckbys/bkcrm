# 🔧 CORREÇÃO RÁPIDA DO WEBHOOK EVOLUTION API
# Execute: powershell -ExecutionPolicy Bypass -File backend/scripts/fix-webhook-curl.ps1

Write-Host "🔧 [WEBHOOK-FIX] Corrigindo URL do webhook na Evolution API..." -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Gray

# Configurações
$EVOLUTION_API_URL = "https://evochat.devsible.com.br"
$API_KEY = "AE69F672-751C-41DC-81E7-86BF5074208E"
$INSTANCE_NAME = "atendimento-ao-cliente-suporte-n1"
$WEBHOOK_URL = "http://localhost:4000/webhook/evolution"

Write-Host "📋 Configurações:" -ForegroundColor Yellow
Write-Host "   API URL: $EVOLUTION_API_URL" -ForegroundColor White
Write-Host "   Instância: $INSTANCE_NAME" -ForegroundColor White
Write-Host "   Webhook URL: $WEBHOOK_URL" -ForegroundColor White
Write-Host ""

# Headers para requisições
$headers = @{
    "apikey" = $API_KEY
    "Content-Type" = "application/json"
}

try {
    # 1. Verificar instância atual
    Write-Host "1️⃣ Verificando instância atual..." -ForegroundColor Green
    $instanceResponse = Invoke-RestMethod -Uri "$EVOLUTION_API_URL/instance/fetchInstances" -Method Get -Headers $headers
    
    $targetInstance = $instanceResponse | Where-Object { $_.instance.instanceName -eq $INSTANCE_NAME }
    
    if ($targetInstance) {
        Write-Host "✅ Instância encontrada: $($targetInstance.instance.instanceName)" -ForegroundColor Green
        Write-Host "   Status: $($targetInstance.instance.status)" -ForegroundColor White
        Write-Host "   Estado: $($targetInstance.instance.connectionStatus.state)" -ForegroundColor White
    } else {
        Write-Host "❌ Instância não encontrada: $INSTANCE_NAME" -ForegroundColor Red
        Write-Host "📋 Instâncias disponíveis:" -ForegroundColor Yellow
        $instanceResponse | ForEach-Object {
            Write-Host "   - $($_.instance.instanceName) ($($_.instance.status))" -ForegroundColor White
        }
        exit 1
    }
    
    Write-Host ""

    # 2. Verificar webhook atual
    Write-Host "2️⃣ Verificando webhook atual..." -ForegroundColor Green
    try {
        $webhookResponse = Invoke-RestMethod -Uri "$EVOLUTION_API_URL/webhook/find/$INSTANCE_NAME" -Method Get -Headers $headers
        Write-Host "📋 Webhook atual:" -ForegroundColor Yellow
        Write-Host "   URL: $($webhookResponse.webhook.url)" -ForegroundColor White
        Write-Host "   Enabled: $($webhookResponse.webhook.enabled)" -ForegroundColor White
        Write-Host "   Events: $($webhookResponse.webhook.events -join ', ')" -ForegroundColor White
    } catch {
        Write-Host "⚠️ Webhook não configurado ainda" -ForegroundColor Yellow
    }
    
    Write-Host ""

    # 3. Configurar webhook correto
    Write-Host "3️⃣ Configurando webhook correto..." -ForegroundColor Green
    
    $webhookConfig = @{
        enabled = $true
        url = $WEBHOOK_URL
        events = @("MESSAGES_UPSERT", "CONNECTION_UPDATE", "QRCODE_UPDATED")
        webhook_by_events = $false
        webhook_base64 = $false
    } | ConvertTo-Json -Depth 3

    Write-Host "📤 Enviando configuração:" -ForegroundColor Yellow
    Write-Host $webhookConfig -ForegroundColor White
    Write-Host ""

    $setWebhookResponse = Invoke-RestMethod -Uri "$EVOLUTION_API_URL/webhook/set/$INSTANCE_NAME" -Method Post -Headers $headers -Body $webhookConfig
    
    Write-Host "✅ [WEBHOOK-FIX] Webhook configurado com sucesso!" -ForegroundColor Green
    Write-Host "📋 Resposta: $($setWebhookResponse | ConvertTo-Json -Depth 2)" -ForegroundColor White
    
    Write-Host ""

    # 4. Verificar configuração final
    Write-Host "4️⃣ Verificando configuração final..." -ForegroundColor Green
    $finalWebhookResponse = Invoke-RestMethod -Uri "$EVOLUTION_API_URL/webhook/find/$INSTANCE_NAME" -Method Get -Headers $headers
    
    Write-Host "📋 Configuração final:" -ForegroundColor Yellow
    Write-Host "   URL: $($finalWebhookResponse.webhook.url)" -ForegroundColor White
    Write-Host "   Enabled: $($finalWebhookResponse.webhook.enabled)" -ForegroundColor White
    Write-Host "   Events: $($finalWebhookResponse.webhook.events -join ', ')" -ForegroundColor White
    
    Write-Host ""

    # 5. Testar webhook
    Write-Host "5️⃣ Testando webhook..." -ForegroundColor Green
    
    $testPayload = @{
        event = "TEST"
        instance = $INSTANCE_NAME
        data = @{
            message = "Teste de configuração do webhook"
            timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
        }
    } | ConvertTo-Json -Depth 3

    try {
        $testHeaders = @{
            "Content-Type" = "application/json"
        }
        
        $testResponse = Invoke-RestMethod -Uri $WEBHOOK_URL -Method Post -Headers $testHeaders -Body $testPayload -TimeoutSec 10
        
        Write-Host "✅ [WEBHOOK-FIX] Teste do webhook bem-sucedido!" -ForegroundColor Green
        Write-Host "🧪 Resposta: $($testResponse | ConvertTo-Json -Depth 2)" -ForegroundColor White
    } catch {
        Write-Host "⚠️ [WEBHOOK-FIX] Erro no teste do webhook: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "💡 Certifique-se de que o servidor WebSocket está rodando na porta 4000" -ForegroundColor Cyan
    }
    
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Gray
    Write-Host "🎉 [WEBHOOK-FIX] Correção concluída!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
    Write-Host "1. Verificar se servidor WebSocket está rodando (porta 4000)" -ForegroundColor White
    Write-Host "2. Enviar mensagem de teste via WhatsApp" -ForegroundColor White
    Write-Host "3. Verificar logs do servidor WebSocket" -ForegroundColor White
    Write-Host "4. Confirmar se mensagens aparecem no CRM" -ForegroundColor White
    Write-Host ""
    Write-Host "🔗 URLs importantes:" -ForegroundColor Yellow
    Write-Host "   Webhook: $WEBHOOK_URL" -ForegroundColor White
    Write-Host "   Health: http://localhost:4000/webhook/health" -ForegroundColor White
    Write-Host "   Evolution API: $EVOLUTION_API_URL" -ForegroundColor White

} catch {
    Write-Host "❌ [WEBHOOK-FIX] Erro na correção: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "🔑 [WEBHOOK-FIX] Erro de autenticação - verificar API key" -ForegroundColor Yellow
    } elseif ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "🔍 [WEBHOOK-FIX] Instância não encontrada - verificar nome" -ForegroundColor Yellow
    }
    
    Write-Host "📋 Detalhes do erro:" -ForegroundColor Yellow
    Write-Host $_.Exception -ForegroundColor Red
    exit 1
} 