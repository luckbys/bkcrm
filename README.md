# Sistema de CRM com WhatsApp - Evolution API

Sistema completo de CRM integrado com Evolution API para comunicação via WhatsApp por setor.

## 🚀 Versão de Produção - Evolution API

### **Configurações Implementadas:**

- **Servidor Evolution API:** `https://press-evolution-api.jhkbgs.easypanel.host/`
- **API Key:** `429683C4C977415CAAFCCE10F7D57E11`
- **Integração Real:** Chamadas HTTP diretas para Evolution API
- **Gestão de Instâncias:** Sistema completo de criação e gerenciamento por setor

### **Funcionalidades Principais:**

#### 🔗 **Integração WhatsApp por Setor**
- Acesso via: **Setor → ⋮ → Editar Setor → Aba "WhatsApp"**
- Configuração individual para cada setor
- Instâncias independentes por departamento
- Status visual: conectado/desconectado
- QR Code para pareamento

#### 📱 **Indicadores Visuais**
- **Ícone 📱:** Aparece quando WhatsApp está conectado
- **Badge "WA":** Exibido ao lado do nome do setor
- **Círculo Verde:** Status de conexão ativo
- **Status em Tempo Real:** Sincronização automática a cada 30 segundos

#### ⚙️ **Configurações Avançadas**
- **Sempre Online:** Manter WhatsApp sempre online
- **Auto-read:** Marcar mensagens como lidas automaticamente
- **Rejeitar Chamadas:** Com mensagem personalizada
- **Ignorar Grupos:** Não processar mensagens de grupos
- **Webhook:** URL para receber callbacks

### **Interface de Usuário:**

#### 🎛️ **Sistema de Abas**
1. **Configurações Gerais:** Nome, ícone, cor, prioridade
2. **WhatsApp:** Todas as configurações Evolution API

#### 🔘 **Botões de Ação**
- **Conectar/Reconectar:** Estabelece conexão com Evolution API
- **QR Code:** Gera código para pareamento (quando conectado)
- **Desconectar:** Remove conexão WhatsApp (botão vermelho)

### **Arquitetura Técnica:**

#### 📁 **Arquivos Principais**
```
src/
├── lib/
│   ├── evolution-api.ts        # Classes de serviço Evolution API
│   └── evolution-config.ts     # Configurações e instâncias globais
├── components/crm/
│   └── Sidebar.tsx            # Interface principal integrada
└── types/
    └── evolution-api.ts       # Tipos TypeScript
```

#### 🔧 **Classes de Serviço**

**`EvolutionAPIService`**
- Comunicação HTTP com Evolution API
- Métodos: getInfo(), createInstance(), connectInstance(), etc.
- Tratamento de erros e autenticação

**`DepartmentInstanceManager`**
- Gerenciamento de instâncias por departamento
- Persistência no localStorage
- Sincronização de status

#### 💾 **Persistência de Dados**
- **localStorage:** Configurações por setor
- **Chaves:** `whatsapp_config_{sectorId}` e `department_instances`
- **Sincronização:** Automática entre interface e Evolution API

### **Fluxo de Funcionamento:**

#### 1️⃣ **Configuração Inicial**
```javascript
// Credenciais carregadas automaticamente
serverUrl: 'https://press-evolution-api.jhkbgs.easypanel.host/'
apiKey: '429683C4C977415CAAFCCE10F7D57E11'
```

#### 2️⃣ **Criação de Instância**
```javascript
// Quando conectar WhatsApp pela primeira vez
await departmentInstanceManager.createDepartmentInstance(
  sectorId.toString(),
  sectorName,
  { phoneNumber, webhookUrl, settings }
);
```

#### 3️⃣ **Conexão e QR Code**
```javascript
// Conectar e obter QR Code
await departmentInstanceManager.connectDepartmentInstance(sectorId);
const qrCode = await departmentInstanceManager.getDepartmentQRCode(sectorId);
```

#### 4️⃣ **Sincronização Contínua**
```javascript
// A cada 30 segundos
await departmentInstanceManager.syncAllInstances();
```

### **Melhorias na Interface:**

#### 🎨 **UX/UI Aprimorada**
- **Auto-refresh inteligente:** Pausa quando modais estão abertos
- **Feedback visual:** Toasts informativos para todas as ações
- **Estados de loading:** Spinners durante operações assíncronas
- **Controle de abas:** Mantém posição selecionada

#### 🔄 **Sistema de Estados**
- `configurationMode`: Controla quando modais estão ativos
- `isTestingConnection`: Estado de loading para conexões
- `activeTab`: Controle de abas independente

### **Tratamento de Erros:**

#### ⚠️ **Validações**
- Verificação de campos obrigatórios
- Teste de conectividade antes de operações
- Validação de formato de dados

#### 🚨 **Mensagens de Erro**
- Toasts específicos para cada tipo de erro
- Logs detalhados no console para debug
- Fallbacks para operações que falham

### **Diferenças da Versão Mock:**

| Aspecto | Versão Mock | Versão Produção |
|---------|-------------|-----------------|
| **Conexão** | `setTimeout(2000)` | `evolutionAPIService.getInfo()` |
| **QR Code** | Base64 fixo | `getDepartmentQRCode()` real |
| **Instâncias** | localStorage apenas | Evolution API + localStorage |
| **Status** | Simulado | Sincronização real via API |
| **Erros** | Fictícios | Reais da Evolution API |

### **Como Usar:**

#### 🚀 **Primeiro Uso**
1. Abrir setor → ⋮ → Editar Setor
2. Ir para aba "WhatsApp"
3. Configurar número e webhook (opcional)
4. Clicar em "Conectar"
5. Aguardar conexão estabelecida
6. Clicar em "QR Code" e escanear com WhatsApp
7. Salvar configurações

#### 🔧 **Configurações Avançadas**
1. Após conectar, configurar switches:
   - Sempre online
   - Auto-read de mensagens
   - Rejeitar chamadas (com mensagem customizada)
   - Ignorar grupos
2. Salvar alterações

#### 📱 **Verificação de Status**
- **Ícone 📱:** Aparece automaticamente quando conectado
- **Badge "WA":** Visível na lista de setores
- **Sincronização:** Automática a cada 30 segundos

### **Requisitos Técnicos:**

#### 🌐 **Conectividade**
- Acesso à internet para Evolution API
- URL do servidor Evolution API acessível
- API Key válida

#### 💻 **Dependências**
```json
{
  "@/lib/evolution-api": "Classes de serviço",
  "@/types/evolution-api": "Tipos TypeScript",
  "react": "Interface reativa",
  "localStorage": "Persistência local"
}
```

### **Próximos Passos:**

#### 🔄 **Melhorias Futuras**
- [ ] Dashboard de mensagens por setor
- [ ] Histórico de conversas
- [ ] Templates de mensagens
- [ ] Relatórios de uso
- [ ] Backup/restore de configurações

#### 🧪 **Testes Recomendados**
- [ ] Teste de conectividade com diferentes redes
- [ ] Validação de QR Code em diferentes dispositivos
- [ ] Teste de sincronização com múltiplos setores
- [ ] Verificação de persistência após refresh

---

**Status:** ✅ **Versão de Produção Implementada e Funcional**

A integração Evolution API está completamente implementada com chamadas reais e gerenciamento profissional de instâncias por setor.
