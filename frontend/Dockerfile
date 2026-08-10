# Multi-stage production Dockerfile for Frontend React 19 App
FROM node:22-alpine AS builder
WORKDIR /app

# Build arguments for production environment
ARG VITE_API_GATEWAY_URL=https://api.quiz.mzsk.fun/api
ENV VITE_API_GATEWAY_URL=${VITE_API_GATEWAY_URL}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production Nginx Server
FROM nginx:alpine AS runner

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy production build artifacts from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
