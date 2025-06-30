# 🚀 Servidor WebSocket BKCRM - Evolution API

Servidor WebSocket integrado com Evolution API para o sistema BKCRM.

## 📋 Pré-requisitos

- Docker (versão 20.10 ou superior)
- Docker Compose (versão 1.29 ou superior)
- Git

## 🛠️ Instalação Rápida

### 1. Clone o repositório
```bash
git clone <seu-repositorio>
cd deploy-webhook
```

### 2. Configure as variáveis de ambiente
```bash
cp webhook.env.example webhook.env
nano webhook.env  # Edite com suas credenciais
```

### 3. Execute o deploy automatizado
```bash
chmod +x deploy.sh
./deploy.sh
```

## ⚙️ Configuração Manual

### 1. Construir a imagem Docker
```bash
docker-compose build
```

### 2. Iniciar o servidor
```bash
docker-compose up -d
```

### 3. Verificar se está funcionando
```bash
curl http://localhost:4000/health
```

## 📊 Comandos Úteis

### Ver logs em tempo real
```bash
docker-compose logs -f
```

### Parar o servidor
```bash
docker-compose down
```

### Reiniciar o servidor
```bash
docker-compose restart
```

### Limpar tudo e reconstruir
```bash
./deploy.sh --clean
```

### Ver logs durante o deploy
```bash
./deploy.sh --logs
```

## 🔧 Variáveis de Ambiente

Configure o arquivo `webhook.env`:

```env
# Configurações do Servidor
NODE_ENV=production
PORT=4000

# Evolution API
EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
EVOLUTION_API_KEY=sua-chave-aqui
```

## 🌐 Endpoints Disponíveis

- `GET /health` - Health check do servidor
- `POST /webhook/evolution` - Recebe webhooks da Evolution API
- `POST /send-message` - Envia mensagens via Evolution API

## 🔍 Monitoramento

### Health Check
```bash
curl http://localhost:4000/health
```

### Estatísticas do Docker
```bash
docker stats bkcrm-webhook-server
```

### Logs específicos
```bash
docker logs bkcrm-webhook-server --tail 100 -f
```

## 🚨 Troubleshooting

### Servidor não inicia
1. Verifique se a porta 4000 está livre:
   ```bash
   lsof -i :4000
   ```

2. Verifique os logs:
   ```bash
   docker-compose logs
   ```

### Problemas de conexão
1. Teste a conectividade:
   ```bash
   curl -v http://localhost:4000/health
   ```

2. Verifique as configurações de rede:
   ```bash
   docker network ls
   docker network inspect deploy-webhook_bkcrm-network
   ```

### Limpar tudo e recomeçar
```bash
docker-compose down -v
docker system prune -f
./deploy.sh --clean
```

## 📈 Performance

O servidor está configurado com:
- **Memória**: 512MB (limite), 256MB (reservado)
- **CPU**: 0.5 cores (limite), 0.25 cores (reservado)
- **Health Check**: A cada 30 segundos
- **Restart Policy**: unless-stopped

## 🔒 Segurança

- Container roda com usuário não-root
- Timezone configurado para America/Sao_Paulo
- Health checks automáticos
- Logs estruturados
- Variáveis de ambiente isoladas

## 📞 Suporte

Em caso de problemas:

1. Verifique os logs: `docker-compose logs -f`
2. Teste o health check: `curl http://localhost:4000/health`
3. Reinicie o container: `docker-compose restart`

---

**Versão**: 1.0.0  
**Última atualização**: $(date +%Y-%m-%d) 