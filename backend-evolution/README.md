# Backend Evolution

Backend responsável pelo processamento de webhooks e integração com a Evolution API.

## Rodando localmente

```bash
cd backend-evolution
npm install
npm start
```

## Build Docker

```bash
docker build -t evolution-backend .
docker run -p 4000:4000 --env-file config/webhook.env evolution-backend
```

## Estrutura

- `src/` - Código-fonte principal
- `scripts/` - Scripts auxiliares
- `config/` - Arquivos de configuração e variáveis de ambiente
- `tests/` - Testes automatizados 