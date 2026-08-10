# Multi-stage production Dockerfile for API Gateway Service
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Security: Run as non-root user
USER node

# Copy built production dependencies and app source
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node . .

EXPOSE 8000

# Container Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8000/health || exit 1

CMD ["node", "server.js"]
