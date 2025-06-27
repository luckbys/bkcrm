# Deploy do Frontend no EasyPanel

## Pré-requisitos
- Acesso ao EasyPanel
- Repositório com o código fonte
- Domínio configurado (bkcrm.devsible.com.br)

## Passos para Deploy

### 1. Criar Novo Serviço
1. No EasyPanel, vá para "Services" e clique em "Create Service"
2. Selecione "Custom Service"
3. Preencha as informações:
   - Name: bkcrm-frontend
   - Image: Use Custom Dockerfile
   - Dockerfile Path: Dockerfile.frontend
   - Port: 80
   - Domain: bkcrm.devsible.com.br

### 2. Configurar Variáveis de Ambiente
```env
NODE_ENV=production
VITE_API_URL=https://api.bkcrm.devsible.com.br
VITE_WEBSOCKET_URL=wss://websocket.bkcrm.devsible.com.br
```

### 3. Configurar Build
1. Source: Git Repository
2. Branch: main
3. Build Command: não necessário (definido no Dockerfile)
4. Build Context: . (root do projeto)

### 4. Configurar Recursos
- CPU: 0.5 cores (mínimo)
- Memory: 512MB
- Replicas: 1

### 5. Configurar Rede
- HTTP Port: 80
- Enable HTTPS: Yes
- Auto SSL: Yes

### 6. Deploy
1. Clique em "Deploy"
2. Aguarde o build e deploy completarem
3. Verifique os logs para garantir que tudo está funcionando

## Verificação
1. Acesse https://bkcrm.devsible.com.br
2. Verifique se a aplicação carrega corretamente
3. Teste a navegação entre rotas
4. Verifique se os assets estáticos estão sendo servidos corretamente

## Troubleshooting

### Erro de Build
- Verifique os logs do build
- Confirme se todos os arquivos necessários estão presentes
- Verifique se o Dockerfile.frontend está correto

### Erro 502 Bad Gateway
- Verifique se o serviço está rodando (Status: Running)
- Verifique os logs do container
- Confirme se a porta 80 está exposta corretamente

### Assets não carregam
- Verifique a configuração do nginx (nginx.frontend.conf)
- Confirme se o build foi gerado corretamente
- Verifique os logs do nginx

## Manutenção
- Monitore o uso de recursos
- Verifique os logs regularmente
- Mantenha o certificado SSL atualizado
- Faça backup regular da configuração 