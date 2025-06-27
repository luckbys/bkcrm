# Criar diretório temporário
New-Item -ItemType Directory -Force -Path .\temp-deploy

# Copiar arquivos necessários
Copy-Item webhook-evolution-websocket.js -Destination .\temp-deploy
Copy-Item webhook.env -Destination .\temp-deploy
Copy-Item package.json -Destination .\temp-deploy
Copy-Item package-lock.json -Destination .\temp-deploy
Copy-Item Dockerfile -Destination .\temp-deploy

# Criar arquivo ZIP
Compress-Archive -Path .\temp-deploy\* -DestinationPath .\bkcrm-websocket-deploy-v5.zip -Force

# Limpar diretório temporário
Remove-Item -Path .\temp-deploy -Recurse -Force

Write-Host "✅ Pacote de deploy criado: bkcrm-websocket-deploy-v5.zip" 