# Stage 1: Build
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --silent

# Copy source
COPY . .

# Create missing directories
RUN mkdir -p src/config src/services/database src/services/whatsapp
RUN echo "export default {};" > src/config/index.ts
RUN echo "export default {};" > src/services/database/index.ts
RUN echo "export default {};" > src/services/whatsapp/index.ts

# Build
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
