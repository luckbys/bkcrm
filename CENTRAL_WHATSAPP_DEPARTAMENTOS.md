# Central WhatsApp por Departamento

## 📋 Visão Geral

Cada departamento/setor do CRM agora possui sua própria central de configuração da Evolution API, permitindo gerenciar instâncias WhatsApp de forma isolada e organizada.

## 🎯 Funcionalidades

### Para Cada Departamento:
- **Gerenciamento Independente**: Cada setor configura suas próprias instâncias
- **Isolamento de Dados**: Instâncias ficam restritas ao departamento
- **Instância Padrão**: Definir qual instância usar por padrão no setor
- **QR Code Dedicado**: Conectar WhatsApp específico para cada departamento
- **Monitoramento Status**: Visualizar conexões em tempo real

## 🏗️ Estrutura Implementada

### 1. **DepartmentEvolutionManager.tsx**
Componente principal para cada departamento:

```typescript
interface DepartmentEvolutionManagerProps {
  departmentId: string;
  departmentName: string;
  departmentColor?: string;
}
```

**Recursos:**
- ✅ Criação de instâncias por departamento
- ✅ Configuração de instância padrão
- ✅ QR Code para conectar WhatsApp
- ✅ Monitoramento de status em tempo real
- ✅ Desconexão e exclusão de instâncias
- ✅ Interface responsiva e intuitiva

### 2. **Tabela `evolution_instances`**
Banco de dados com Row Level Security:

```sql
CREATE TABLE evolution_instances (
    id UUID PRIMARY KEY,
    instance_name VARCHAR(255) UNIQUE,
    department_id UUID REFERENCES departments(id),
    department_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'close',
    phone VARCHAR(20),
    is_default BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Políticas de Segurança:**
- ✅ Usuários só veem instâncias do seu departamento
- ✅ Admins podem ver todas as instâncias
- ✅ Controle de criação/edição por departamento

### 3. **Integração na Interface**
Nova aba "WhatsApp" no menu de cada setor:

```
Dashboard | Conversas | Funil | WhatsApp
```

## 📱 Como Usar

### 1. **Acessar Central do Departamento**
1. Selecione seu setor na sidebar
2. Clique na aba **"WhatsApp"** no menu superior
3. Visualize as instâncias do seu departamento

### 2. **Criar Nova Instância**
1. Clique em **"Nova Instância"**
2. Digite um nome (ex: "principal", "vendas", "suporte")
3. Marque "Definir como padrão" se necessário
4. Clique em **"Criar Instância"**

**Nomenclatura Automática:**
- Input: `principal`
- Nome final: `atendimento-principal`
- Formato: `{departamento}-{nome}`

### 3. **Conectar WhatsApp**
1. Clique em **"Conectar"** na instância
2. Escaneie o QR Code com WhatsApp
3. Aguarde confirmação de conexão
4. Status mudará para "Conectado" 🟢

### 4. **Gerenciar Instâncias**
- **Definir Padrão**: Instância usada automaticamente nos tickets
- **Desconectar**: Remove conexão WhatsApp
- **Deletar**: Remove instância permanentemente
- **Atualizar Status**: Verifica conexão em tempo real

## 🔧 Configuração Técnica

### **Variáveis de Ambiente**
```env
VITE_EVOLUTION_API_URL=http://localhost:8080
VITE_EVOLUTION_API_KEY=your-api-key
```

### **Migração Banco de Dados**
Execute no Supabase SQL Editor:
```bash
supabase/migrations/20240321000003_create_evolution_instances_table.sql
```

### **Dependências**
- ✅ Departamentos configurados (`departments` table)
- ✅ Evolution API rodando e acessível
- ✅ Usuários com departamento atribuído

## 📊 Funcionalidades por Setor

### **Atendimento**
- Instância: `atendimento-principal`
- Uso: Tickets de suporte geral
- Equipe: Agentes de atendimento

### **Vendas**
- Instância: `vendas-comercial`
- Uso: Contatos comerciais e follow-up
- Equipe: Vendedores e SDRs

### **Cobrança**
- Instância: `cobranca-financeiro`
- Uso: Notificações de pagamento
- Equipe: Setor financeiro

### **Qualidade**
- Instância: `qualidade-pesquisas`
- Uso: Pesquisas de satisfação
- Equipe: Analistas de qualidade

## 🛡️ Segurança e Permissões

### **Row Level Security (RLS)**
```sql
-- Usuários só veem instâncias do seu departamento
CREATE POLICY evolution_instances_select_policy ON evolution_instances
FOR SELECT USING (
    department_id IN (
        SELECT p.department_id FROM profiles p WHERE p.id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
);
```

### **Controles de Acesso**
- ✅ **Agents**: Só veem instâncias do próprio departamento
- ✅ **Admins**: Podem ver todas as instâncias
- ✅ **Customers**: Sem acesso à configuração
- ✅ **Auditoria**: Logs de criação e modificação

## 🔄 Fluxo de Integração

### **1. Criação de Ticket**
```typescript
// TicketChat detecta instância padrão do departamento
const defaultInstance = await getDefaultInstance(departmentId);
if (defaultInstance && whatsappPhone) {
    await sendWhatsAppMessage(defaultInstance.name, message);
}
```

### **2. Recebimento de Mensagem**
```typescript
// Webhook identifica departamento pela instância
const instance = await getInstanceByName(instanceName);
const ticket = await createTicket({
    department_id: instance.department_id,
    metadata: { evolution_instance_name: instanceName }
});
```

### **3. Status Monitoring**
```typescript
// Auto-refresh a cada 45 segundos
const checkInstanceStatus = async () => {
    const status = await evolutionApiService.getInstanceStatus(instanceName);
    updateInstanceStatus(instanceName, status.instance.status);
};
```

## 🚀 Benefícios

### **Organização**
- ✅ Cada setor controla suas próprias instâncias
- ✅ Nomenclatura padronizada e clara
- ✅ Segregação de responsabilidades

### **Escalabilidade**
- ✅ Múltiplas instâncias por departamento
- ✅ Configuração independente
- ✅ Crescimento conforme demanda

### **Segurança**
- ✅ Isolamento entre departamentos
- ✅ Controle de acesso granular
- ✅ Auditoria completa

### **Usabilidade**
- ✅ Interface intuitiva por setor
- ✅ QR Code integrado
- ✅ Status em tempo real
- ✅ Configuração simplificada

## 📋 Checklist de Implementação

### ✅ **Concluído**
- [x] Componente DepartmentEvolutionManager
- [x] Migração da tabela evolution_instances
- [x] Integração na interface (aba WhatsApp)
- [x] Row Level Security configurado
- [x] Auto-refresh de status
- [x] QR Code modal integrado
- [x] Nomenclatura automática
- [x] Instância padrão por departamento

### 🔄 **Em Desenvolvimento**
- [ ] Dashboard de estatísticas por departamento
- [ ] Relatórios de uso das instâncias
- [ ] Backup/restore de configurações
- [ ] Notificações de desconexão

### 📋 **Próximos Passos**
- [ ] Webhooks específicos por departamento
- [ ] Templates de mensagem por setor
- [ ] Horário de funcionamento por instância
- [ ] Integração com chatbots

## 🐛 Troubleshooting

### **Instância não aparece**
1. Verifique se usuário tem departamento atribuído
2. Execute migração da tabela evolution_instances
3. Confirme permissões RLS

### **QR Code não gera**
1. Verifique conexão com Evolution API
2. Confirme variáveis de ambiente
3. Teste endpoint de QR Code manualmente

### **Status sempre "unknown"**
1. Instância pode não existir na Evolution API
2. Verifique nome da instância
3. Confirme API Key e URL

### **Não consegue criar instância**
1. Verifique permissões do usuário
2. Nome da instância pode já existir
3. Confirme departamento está ativo

## 📞 Suporte

- **Logs**: Console do navegador para debug
- **Database**: Supabase logs para troubleshooting
- **API**: Evolution API logs para conexões
- **Docs**: INTEGRACAO_EVOLUTION_API.md para detalhes técnicos

---

**Nota**: Esta implementação permite que cada departamento seja completamente independente na gestão de suas instâncias WhatsApp, mantendo a segurança e organização do sistema. 