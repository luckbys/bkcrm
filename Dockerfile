FROM node:18-slim

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar o código do servidor
COPY . .

# Expor porta (Heroku define a porta via $PORT)
ENV PORT=4000
EXPOSE $PORT

# Iniciar servidor
CMD ["npm", "start"]
