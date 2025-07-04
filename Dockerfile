FROM node:18-alpine

WORKDIR /app

# Copiar arquivos de dependência
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Construir a aplicação
RUN npm run build

# Expor a porta (será substituída pela variável PORT do EasyPanel)
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "start"]
