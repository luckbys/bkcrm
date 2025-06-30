# 📋 Guia de Instalação - Servidor WebSocket BKCRM

Este guia oferece duas opções para executar o servidor: **com Docker** (recomendado) ou **diretamente com Node.js**.

## 🐳 Opção 1: Com Docker (Recomendado)

### Pré-requisitos
- Windows 10/11 (64-bit)
- WSL2 habilitado
- Pelo menos 4GB de RAM disponível

### 1. Instalar Docker Desktop

1. **Baixar Docker Desktop:**
   - Acesse: https://www.docker.com/products/docker-desktop/
   - Clique em "Download for Windows"
   - Execute o instalador `Docker Desktop Installer.exe`

2. **Configurar Docker Desktop:**
   - Durante a instalação, marque "Use WSL 2 instead of Hyper-V"
   - Reinicie o computador quando solicitado
   - Abra Docker Desktop e faça login (ou crie uma conta gratuita)

3. **Verificar instalação:**
   ```powershell
   docker --version
   docker-compose --version
   ```

### 2. Executar o Deploy
```powershell
# Na pasta deploy-webhook
powershell -ExecutionPolicy Bypass -File deploy.ps1
```

### 3. Opções de Deploy
```powershell
# Deploy normal
powershell -ExecutionPolicy Bypass -File deploy.ps1

# Deploy com limpeza de cache
powershell -ExecutionPolicy Bypass -File deploy.ps1 -Clean

# Deploy com logs em tempo real
powershell -ExecutionPolicy Bypass -File deploy.ps1 -Logs
```

---

## 🟢 Opção 2: Diretamente com Node.js (Alternativa)

### Pré-requisitos
- Node.js 18+ (https://nodejs.org/)
- NPM (incluído com Node.js)

### 1. Instalar Node.js

1. **Baixar Node.js:**
   - Acesse: https://nodejs.org/
   - Baixe a versão LTS (recomendada)
   - Execute o instalador

2. **Verificar instalação:**
   ```powershell
   node --version
   npm --version
   ```

### 2. Configurar o Projeto

1. **Instalar dependências:**
   ```powershell
   npm install
   ```

2. **Configurar variáveis de ambiente:**
   ```powershell
   # Copiar arquivo de exemplo
   copy webhook.env webhook.env.local
   
   # Editar o arquivo webhook.env.local com suas credenciais
   notepad webhook.env.local
   ```

### 3. Executar o Servidor

```powershell
# Desenvolvimento (com reinicialização automática)
npm run dev

# Produção
npm start

# Com arquivo de ambiente específico
$env:NODE_ENV="production"; node server.js
```

### 4. Verificar se está funcionando
```powershell
# Testar health check
curl http://localhost:4000/health

# Ou abrir no navegador
start http://localhost:4000/health
```

---

## 🔧 Configuração de Variáveis de Ambiente

Edite o arquivo `webhook.env` (ou `webhook.env.local`):

```env
# Configurações do Servidor
NODE_ENV=production
PORT=4000

# Evolution API - CONFIGURE SUAS CREDENCIAIS
EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
EVOLUTION_API_KEY=SUA_CHAVE_AQUI

# Opcional: Configurações adicionais
DEBUG=true
LOG_LEVEL=info
```

---

## 🚀 Scripts Disponíveis

### Para Docker:
```powershell
# Deploy completo
powershell -ExecutionPolicy Bypass -File deploy.ps1

# Ver logs
docker-compose logs -f

# Parar servidor
docker-compose down

# Reiniciar
docker-compose restart
```

### Para Node.js:
```powershell
# Iniciar servidor
npm start

# Desenvolvimento com hot-reload
npm run dev

# Verificar saúde
curl http://localhost:4000/health
```

---

## 🔍 Verificação de Funcionamento

1. **Health Check:**
   ```powershell
   curl http://localhost:4000/health
   ```
   
   Resposta esperada:
   ```json
   {"status": "ok", "version": "1.0.0"}
   ```

2. **Teste WebSocket:**
   - Abra: http://localhost:4000
   - Verifique se a conexão WebSocket é estabelecida

3. **Logs:**
   ```powershell
   # Docker
   docker-compose logs -f
   
   # Node.js direto
   # Os logs aparecerão no terminal onde você executou o servidor
   ```

---

## 🚨 Troubleshooting

### Problema: "Docker não está instalado"
**Solução:** Instale Docker Desktop ou use a Opção 2 (Node.js)

### Problema: "Porta 4000 já está em uso"
```powershell
# Verificar o que está usando a porta
netstat -ano | findstr :4000

# Matar o processo (substitua PID pelo número encontrado)
taskkill /PID <PID> /F
```

### Problema: "Erro de permissão no PowerShell"
```powershell
# Permitir execução de scripts temporariamente
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Problema: "Módulos Node.js não encontrados"
```powershell
# Limpar cache e reinstalar
npm cache clean --force
rm -rf node_modules
npm install
```

---

## 📞 Suporte

Se você encontrar problemas:

1. ✅ Verifique se Node.js está instalado: `node --version`
2. ✅ Verifique se as dependências estão instaladas: `npm list`
3. ✅ Verifique se a porta 4000 está livre
4. ✅ Verifique os logs para erros específicos
5. ✅ Teste o health check: `curl http://localhost:4000/health`

---

**💡 Dica:** Para desenvolvimento, recomendamos usar Node.js diretamente. Para produção, use Docker para maior estabilidade e isolamento. 