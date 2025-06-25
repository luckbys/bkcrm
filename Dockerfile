# Multi-stage build para EasyPanel via GitHub
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --silent --only=production

# Copy source code
COPY . .

# Create missing directories if they don't exist
RUN mkdir -p src/config src/services/database src/services/whatsapp || true
RUN echo "export default {};" > src/config/index.ts || true
RUN echo "export default {};" > src/services/database/index.ts || true
RUN echo "export default {};" > src/services/whatsapp/index.ts || true

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Install curl for healthchecks
RUN apk add --no-cache curl

# Copy built application
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.deploy.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
