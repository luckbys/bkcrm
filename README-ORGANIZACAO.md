# 📁 Estrutura Organizacional do Projeto BKCRM

## 🎯 Estrutura Geral
O projeto foi completamente reorganizado para melhorar a manutenibilidade e facilitar o desenvolvimento. Aqui está a nova estrutura:

```
bkcrm/
├── 📂 backend/           # Backend e scripts do sistema
├── 📂 deployment/        # Arquivos de deploy e infraestrutura  
├── 📂 docs/             # Documentação completa
├── 📂 src/              # Frontend React/TypeScript
├── 📂 supabase/         # Configurações do Supabase
└── 📂 public/           # Arquivos públicos
```

## 🔧 Backend (`backend/`)

### 📊 **database/** - Scripts SQL e banco de dados
- Scripts de correção do banco
- Configurações SQL do Supabase
- Migrations e ajustes de schema
- Funções RPC e triggers

### 🧪 **tests/** - Arquivos de teste
- Testes do webhook Evolution API
- Scripts de teste de integração
- Validações de banco de dados
- Testes de envio de mensagens

### 📜 **scripts/** - Scripts utilitários
- Configuração de webhooks
- Scripts de migração
- Utilitários de desenvolvimento
- Automatizações

### 🔗 **webhooks/** - Implementação de webhooks
- Webhook principal Evolution API
- Backups e versões
- Configurações de webhook

### ⚙️ **config/** - Configurações
- Credenciais do Supabase
- Arquivos de ambiente
- Configurações de produção

## 🚀 Deployment (`deployment/`)

### Arquivos inclusos:
- Scripts de deploy para EasyPanel
- Configurações Docker (Dockerfile, docker-compose)
- Configurações Nginx
- Scripts de build e teste

## 📚 Documentação (`docs/`)

### 📱 **frontend/** - Documentação do frontend
- Guias de interface de usuário
- Documentação de componentes React
- Melhorias de UX/UI
- Sistema de chat e tickets

### 🔧 **backend/** - Documentação do backend
- Configurações do Supabase
- Documentação de APIs
- Realtime e WebSockets
- Integração com bancos de dados

### 🔗 **webhooks/** - Documentação de webhooks
- Evolution API integration
- Configuração de webhooks
- Troubleshooting de conexões
- Guias de implementação

### 🆘 **troubleshooting/** - Resolução de problemas
- Correção de erros comuns
- Soluções para problemas conhecidos
- Debugging e diagnósticos
- Guias de recuperação

### 🚀 **deployment/** - Documentação de deploy
- Deploy em produção
- Configuração de servidores
- SSL e domínios
- Monitoramento

## 🎨 Frontend (`src/`)

Mantém a estrutura original do React/TypeScript:
- **components/** - Componentes React organizados por funcionalidade
- **hooks/** - Hooks customizados
- **pages/** - Páginas da aplicação
- **services/** - Serviços e integrações
- **types/** - Definições TypeScript
- **utils/** - Utilitários diversos

## 📋 Benefícios da Nova Estrutura

✅ **Organização Clara**: Cada tipo de arquivo tem seu local específico  
✅ **Fácil Manutenção**: Encontrar e modificar arquivos é mais simples  
✅ **Escalabilidade**: Estrutura preparada para crescimento do projeto  
✅ **Colaboração**: Equipe pode navegar facilmente pela base de código  
✅ **Documentação**: Tudo documentado e categorizado adequadamente  

## 🔍 Como Encontrar Arquivos

| Precisa de... | Vá para... |
|---------------|------------|
| Corrigir webhook | `backend/webhooks/` |
| Script SQL | `backend/database/` |
| Teste de funcionalidade | `backend/tests/` |
| Documentação de erro | `docs/troubleshooting/` |
| Guia de deploy | `docs/deployment/` |
| Configuração frontend | `src/components/` |

## 🚀 Próximos Passos

1. **Familiarizar-se** com a nova estrutura
2. **Atualizar scripts** que referenciam caminhos antigos
3. **Usar a documentação** organizada para desenvolvimento
4. **Manter a organização** ao adicionar novos arquivos

---

*Estrutura organizada em Junho 2025 para otimizar o desenvolvimento e manutenção do BKCRM.* 