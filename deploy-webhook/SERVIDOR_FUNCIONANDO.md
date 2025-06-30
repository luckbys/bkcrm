# ✅ Servidor WebSocket BKCRM - FUNCIONANDO!

## 🎉 Status: **ONLINE e FUNCIONANDO**

- **URL**: http://localhost:4000
- **Health Check**: http://localhost:4000/health ✅
- **Status Code**: 200 OK
- **Resposta**: `{"status":"ok","version":"1.0.0"}`

---

## 🚀 Como foi executado:

```powershell
# 1. Instalação das dependências
npm install
npm audit fix

# 2. Execução do servidor
Start-Job -ScriptBlock { 
    Set-Location "C:\Users\jarvi\OneDrive\Imagens\projeto 1\bkcrm\deploy-webhook"
    node server.js 
}

# 3. Teste de funcionamento
Invoke-WebRequest -Uri "http://localhost:4000/health" -UseBasicParsing
```

---

## 📊 Comandos Úteis

### Verificar se está rodando:
```powershell
Invoke-WebRequest -Uri "http://localhost:4000/health" -UseBasicParsing
```

### Ver processos Node.js:
```powershell
Get-Process | Where-Object {$_.ProcessName -eq "node"}
```

### Ver jobs em background:
```powershell
Get-Job
```

### Ver logs do job:
```powershell
Receive-Job -Id 1
```

### Parar o servidor:
```powershell
Stop-Job -Id 1
Remove-Job -Id 1
```

### Iniciar novamente:
```powershell
Start-Job -ScriptBlock { 
    Set-Location "C:\Users\jarvi\OneDrive\Imagens\projeto 1\bkcrm\deploy-webhook"
    node server.js 
}
```

---

## 🌐 Endpoints Disponíveis

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/health` | GET | Health check do servidor |
| `/webhook/evolution` | POST | Recebe webhooks da Evolution API |
| `/send-message` | POST | Envia mensagens via Evolution API |

---

## 🔧 Configuração Atual

- **Porta**: 4000
- **CORS**: Habilitado para todas as origens
- **WebSocket**: Socket.IO habilitado
- **Environment**: Produção

---

## 📝 Próximos Passos

1. **Configurar Evolution API**: Edite o arquivo `webhook.env` com suas credenciais
2. **Testar WebSocket**: Conecte seu frontend na URL `http://localhost:4000`
3. **Monitorar Logs**: Use `Receive-Job -Id 1` para ver logs em tempo real
4. **Deploy em Produção**: Use Docker para deploy em servidor

---

## 🚨 Importante

- O servidor está rodando em **background job**
- Para parar: `Stop-Job -Id 1; Remove-Job -Id 1`
- Para logs: `Receive-Job -Id 1`
- Para reiniciar: Execute novamente o comando `Start-Job`

---

**🎯 Status**: ✅ **SERVIDOR ONLINE E FUNCIONANDO**  
**📅 Data**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")  
**🔗 URL**: http://localhost:4000 