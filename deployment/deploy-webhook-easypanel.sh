#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Iniciando deploy do webhook no EasyPanel...${NC}"

# Verificar se os arquivos necessários existem
if [ ! -f "webhook-evolution-complete-corrigido.cjs" ]; then
    echo -e "${RED}❌ Erro: arquivo webhook-evolution-complete-corrigido.cjs não encontrado${NC}"
    exit 1
fi

if [ ! -f "Dockerfile.webhook" ]; then
    echo -e "${RED}❌ Erro: arquivo Dockerfile.webhook não encontrado${NC}"
    exit 1
fi

if [ ! -f "webhook.env" ]; then
    echo -e "${RED}❌ Erro: arquivo webhook.env não encontrado${NC}"
    exit 1
fi

# Criar diretório temporário para deploy
DEPLOY_DIR="deploy-webhook-$(date +%s)"
mkdir -p $DEPLOY_DIR

echo -e "${YELLOW}📁 Copiando arquivos para pasta de deploy...${NC}"

# Copiar arquivos necessários
cp webhook-evolution-complete-corrigido.cjs $DEPLOY_DIR/
cp Dockerfile.webhook $DEPLOY_DIR/Dockerfile
cp webhook.env $DEPLOY_DIR/.env
cp package.json $DEPLOY_DIR/
cp package-lock.json $DEPLOY_DIR/

# Gerar arquivo de configuração do EasyPanel
cat > $DEPLOY_DIR/easypanel.json << EOL
{
  "name": "evolution-webhook",
  "type": "app",
  "source": {
    "type": "dockerfile",
    "dockerfile": "Dockerfile"
  },
  "domains": [
    {
      "host": "bkcrm.devsible.com.br",
      "path": "/webhook",
      "port": 4000,
      "https": true
    }
  ],
  "healthcheck": {
    "path": "/health",
    "port": 4000,
    "interval": 30,
    "timeout": 10,
    "retries": 3
  }
}
EOL

echo -e "${GREEN}✅ Arquivos preparados em $DEPLOY_DIR${NC}"
echo -e "${YELLOW}📝 Instruções:${NC}"
echo "1. Faça upload da pasta $DEPLOY_DIR para o EasyPanel"
echo "2. No EasyPanel, vá em Apps > evolution-webhook"
echo "3. Clique em Deploy para atualizar"
echo "4. Aguarde o health check ficar verde"
echo -e "${YELLOW}🔍 Para verificar logs:${NC}"
echo "1. No EasyPanel, vá em Apps > evolution-webhook > Logs"
echo "2. Verifique se não há erros"
echo -e "${GREEN}✨ Deploy preparado com sucesso!${NC}" 