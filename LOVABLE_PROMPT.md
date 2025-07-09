# Prompt de Design para Recriação no Lovable

## Visão Geral do Sistema

O sistema é um **CRM Omnichannel** focado em integração e automação de atendimento via WhatsApp, com arquitetura modular, interface moderna e recursos avançados de testes, monitoramento e configuração. O design segue padrões de usabilidade, acessibilidade e performance, com forte ênfase em integração via API (Evolution API) e experiência do usuário.

---

## Estrutura de Diretórios e Módulos

```
root/
  src/
    components/
      chat/
        messages/     # Componentes de mensagens
        inputs/       # Inputs customizados
        controls/     # Botões e controles
        modals/       # Modais de configuração
        ai/           # Componentes de IA
      ui/            # UI reutilizável
      shared/        # Componentes compartilhados
    hooks/           # Custom hooks
    stores/          # Gerenciamento de estado
    services/        # Serviços e APIs
    contexts/        # Contextos React
    styles/          # Estilos globais
    utils/           # Utilitários
    types/           # Tipos TypeScript
    lib/             # Bibliotecas/configs
```

---

## Design System
- **Glassmorphism**: fundos translúcidos, bordas suaves, sombra sutil.
- **Cores**: Primária (#3B82F6), Secundária (#6366F1), Sucesso (#22C55E), Erro (#EF4444), Fundo (#F8FAFC), Texto (#1E293B).
- **Espaçamento**: base 4px, escalas 2, 4, 8, 12, 16, 24, 32, 48, 64.
- **Acessibilidade**: WCAG 2.1 AA, contraste mínimo 4.5:1, labels ARIA, navegação por teclado.
- **Animações**: transições suaves (300ms, cubic-bezier).

---

## Módulos Principais

### 1. **Setup Wizard (WhatsApp)**
- Wizard passo a passo para configurar instâncias WhatsApp.
- Templates predefinidos, validação em tempo real, configuração de webhook.
- Interface glassmorphism, responsiva.

### 2. **Instance Testing**
- Hook customizado para testes automáticos (conectividade, autenticação, envio/recebimento, webhooks, QR code, etc).
- Retry automático, health check, exportação de relatórios.

### 3. **Message Flow Validator**
- Validação ponta a ponta do fluxo de mensagens WhatsApp.
- Testes de envio, recebimento, persistência, WebSocket.
- Métricas de performance e recomendações.

### 4. **Complete Flow Validator**
- Interface unificada para rodar todos os testes e validações.
- Progresso visual, relatórios, recomendações.

### 5. **Instance Manager**
- Gerenciamento de instâncias WhatsApp por departamento.
- Status em tempo real, troubleshooting, logs, ações rápidas.

### 6. **Modais de Configuração**
- Modais para criar, editar, validar e monitorar integrações WhatsApp por departamento.
- Migalhas de pão (breadcrumbs) para guiar o usuário.

### 7. **Integração com Evolution API**
- Comunicação via REST para criar instâncias, enviar mensagens, consultar status.
- Recebimento de webhooks via backend.

---

## Fluxo de Usuário (Exemplo)
1. Usuário acessa o departamento e abre o modal de configuração WhatsApp.
2. Wizard orienta a configuração inicial (nome, webhook, templates).
3. Após criar a instância, usuário pode rodar testes automáticos e validação completa.
4. Status, logs e recomendações são exibidos em tempo real.
5. Usuário pode remover, reconfigurar ou validar novamente a qualquer momento.

---

## Requisitos Técnicos
- **React + TypeScript**
- **Componentização máxima** (cada função/fluxo é um componente ou hook)
- **Arquitetura modular**
- **Design system próprio** (cores, espaçamento, glassmorphism)
- **Testes automáticos (Jest, Testing Library)**
- **Documentação por componente (README, JSDoc)**

---

## Prompt para Lovable

> Crie um sistema CRM Omnichannel com foco em integração WhatsApp, arquitetura modular, design glassmorphism, acessibilidade, testes automáticos e integração via Evolution API. Implemente wizard de configuração, testes automáticos, validação de fluxo de mensagens, gerenciamento de instâncias e modais de configuração com breadcrumbs. Siga padrões de componentização, responsividade e documentação. Use React + TypeScript. 