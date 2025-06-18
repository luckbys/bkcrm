# Criar diretório temporário
New-Item -ItemType Directory -Force -Path deploy-temp

# Copiar arquivos necessários
Copy-Item Dockerfile -Destination deploy-temp/
Copy-Item webhook-evolution-complete-corrigido.cjs -Destination deploy-temp/
Copy-Item package.json -Destination deploy-temp/
Copy-Item package-lock.json -Destination deploy-temp/

# Criar arquivo .env com as configurações
@"
NODE_ENV=production
WEBHOOK_PORT=4000
BASE_URL=https://bkcrm.devsible.com.br
EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU
"@ | Out-File -FilePath deploy-temp/.env -Encoding UTF8

# Criar arquivo zip
Compress-Archive -Path deploy-temp/* -DestinationPath deploy-easypanel.zip -Force

# Limpar diretório temporário
Remove-Item -Recurse -Force deploy-temp

Write-Host "✅ Arquivo deploy-easypanel.zip criado com sucesso!" -ForegroundColor Green
Write-Host "📋 Instruções:" -ForegroundColor Yellow
Write-Host "1. Faça upload do arquivo deploy-easypanel.zip no EasyPanel"
Write-Host "2. Configure as variáveis de ambiente no EasyPanel"
Write-Host "3. Inicie o deploy" 