FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY webhook-evolution-complete-corrigido.cjs ./

# Argumentos de build para configuração
ARG NODE_ENV=production
ARG WEBHOOK_PORT=4000
ARG BASE_URL
ARG EVOLUTION_API_URL
ARG EVOLUTION_API_KEY
ARG SUPABASE_URL
ARG SUPABASE_ANON_KEY

# Configurar variáveis de ambiente
ENV NODE_ENV=$NODE_ENV
ENV WEBHOOK_PORT=$WEBHOOK_PORT
ENV BASE_URL=$BASE_URL
ENV EVOLUTION_API_URL=$EVOLUTION_API_URL
ENV EVOLUTION_API_KEY=$EVOLUTION_API_KEY
ENV SUPABASE_URL=$SUPABASE_URL
ENV SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

EXPOSE 4000

CMD ["node", "webhook-evolution-complete-corrigido.cjs"] 