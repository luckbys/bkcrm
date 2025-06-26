# BKCRM - Sistema de CRM com Integração WhatsApp

## 🚀 Deploy Status
- ✅ **Build Fixed**: Problemas de dependências e ES modules resolvidos
- ✅ **Production Ready**: Configurado para deploy no EasyPanel
- ✅ **Bundle Optimized**: 751.52 kB (gzip: 202.83 kB)
- ✅ **Server Working**: Vite preview servidor funcionando na porta 3000

## 📦 Tecnologias
- **Frontend**: React 18.3.1 + TypeScript 5.6.3 + Vite 5.4.10
- **UI Framework**: Tailwind CSS 3.4.17 + Radix UI + shadcn/ui
- **Estado**: Zustand 4.4.0 + React Query 5.0.0
- **Backend**: Supabase 2.50.0
- **Real-time**: Socket.IO Client 4.8.1
- **Notificações**: Sonner 1.4.0

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Servidor de desenvolvimento na porta 5173

# Build de produção
npm run build           # Build otimizado para produção

# Preview da build
npm run preview         # Preview da build na porta 3000

# Deploy (usado pelo EasyPanel)
npm run start          # Servidor de produção na porta 3000
npm run heroku-postbuild # Build automático no deploy
```

## 🚀 Deploy no EasyPanel

### Configuração no EasyPanel:
1. **Build Command**: `npm run heroku-postbuild`
2. **Start Command**: `npm run start`
3. **Port**: `3000`
4. **Node Version**: `18.x`

### Variáveis de Ambiente:
```env
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
VITE_EVOLUTION_API_URL=sua_url_evolution_api
```

## 📂 Estrutura do Projeto

```
src/
├── components/         # Componentes React
│   ├── chat/          # Sistema de chat
│   ├── crm/           # Gestão de CRM
│   └── ui/            # Componentes UI (shadcn/ui)
├── hooks/             # Custom hooks
├── services/          # Serviços e APIs
├── stores/            # Estado global (Zustand)
├── types/             # Tipos TypeScript
└── utils/             # Utilitários
```

## 🔧 Correções Implementadas

### **Problema ES Modules Resolvido**
- ❌ **Antes**: `ReferenceError: require is not defined in ES module scope`
- ✅ **Depois**: Removido server.js problemático, usando apenas Vite preview

### **Dependencies Fixed**
- ✅ Adicionadas 45+ dependências faltantes
- ✅ Versões sincronizadas entre package.json e package-lock.json
- ✅ Rollup platform-specific dependencies para Linux

### **CSS Build Issues Fixed**
- ❌ **Antes**: `@apply border-border` causando erros PostCSS
- ✅ **Depois**: Convertido para CSS variables puro

### **Bundle Optimization**
- ✅ Code splitting inteligente (5 vendor chunks)
- ✅ React vendor: 162.96 kB
- ✅ Radix vendor: 127.82 kB  
- ✅ Supabase vendor: 118.65 kB
- ✅ Utils vendor: 80.15 kB
- ✅ UI vendor: 56.63 kB

## 📊 Performance

- **Build Time**: ~10s (2861 modules)
- **Bundle Size**: 751.52 kB (gzip: 202.83 kB)
- **Startup Time**: <3s
- **First Load**: <1s (otimizado)

## 🔄 Workflow de Deploy

1. **Push para GitHub**: `git push origin main`
2. **Auto-deploy**: EasyPanel detecta mudanças
3. **Build**: `npm run heroku-postbuild`
4. **Start**: `npm run start`
5. **Live**: Aplicação rodando em produção

## 🛡️ Compatibilidade

- ✅ **Node.js**: 18.x (especificado no engines)
- ✅ **Browsers**: Modernos com ES2020+ support
- ✅ **Mobile**: Responsivo completo
- ✅ **Desktop**: Layout otimizado

## 📞 Suporte

Para problemas de deploy:
1. Verificar logs do EasyPanel
2. Confirmar variáveis de ambiente
3. Testar build local: `npm run build && npm run start`

---

**Status**: ✅ **PRONTO PARA PRODUÇÃO** 