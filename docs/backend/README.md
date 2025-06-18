# BKCRM - Sistema de Gerenciamento de Tickets

Sistema de gerenciamento de tickets com integração WhatsApp usando Supabase como backend.

## Requisitos

- Node.js 18+
- Docker (para Supabase local)
- Supabase CLI

## Configuração do Ambiente

1. Instale as dependências:
```bash
npm install
```

2. Instale a CLI do Supabase:
```bash
npm install -g supabase
```

3. Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon
VITE_SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
```

4. Inicie o Supabase localmente:
```bash
npm run supabase:start
```

5. Aplique as migrações do banco de dados:
```bash
npm run supabase:db:push
```

6. Gere os tipos TypeScript do Supabase:
```bash
npm run supabase:types
```

7. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## Estrutura do Projeto

```
src/
  ├── components/     # Componentes React
  │   ├── crm/       # Componentes específicos do CRM
  │   └── ui/        # Componentes de UI reutilizáveis
  ├── hooks/         # Hooks personalizados
  ├── lib/           # Bibliotecas e configurações
  ├── pages/         # Páginas da aplicação
  ├── services/      # Serviços e integrações
  ├── types/         # Definições de tipos
  └── utils/         # Utilitários

supabase/
  ├── config.toml    # Configuração do Supabase
  └── migrations/    # Migrações do banco de dados
```

## Funcionalidades

- Autenticação de usuários
- Gerenciamento de tickets
- Chat em tempo real
- Upload de arquivos
- Notificações em tempo real
- Integração com WhatsApp
- Diferentes níveis de acesso (admin, agente, cliente)

## Desenvolvimento

### Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Compila o projeto para produção
- `npm run preview` - Visualiza a build de produção localmente
- `npm run lint` - Executa o linter
- `npm run supabase:start` - Inicia o Supabase localmente
- `npm run supabase:stop` - Para o Supabase local
- `npm run supabase:status` - Verifica o status do Supabase
- `npm run supabase:db:reset` - Reseta o banco de dados
- `npm run supabase:db:push` - Aplica as migrações
- `npm run supabase:types` - Gera os tipos TypeScript

### Banco de Dados

O esquema do banco de dados inclui as seguintes tabelas:

- `profiles` - Perfis de usuários
- `tickets` - Tickets de suporte
- `messages` - Mensagens dos tickets
- `notifications` - Notificações do sistema

### Segurança

- Row Level Security (RLS) implementado em todas as tabelas
- Políticas de acesso baseadas em função do usuário
- Autenticação via Supabase Auth
- Uploads de arquivos seguros via Supabase Storage

## Produção

1. Configure as variáveis de ambiente no seu servidor
2. Execute a build do projeto:
```bash
npm run build
```

3. Sirva os arquivos da pasta `dist`

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Crie um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.
