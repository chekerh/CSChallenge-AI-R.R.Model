# Multi-stage build for UtopiaHire Server (npm workspace root context)
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Dependencies (production only)
FROM base AS deps
COPY package.json package-lock.json* ./
COPY shared/package.json shared/package.json
COPY server/package.json server/package.json
COPY frontend/package.json frontend/package.json
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

# Build (full install incl. dev tooling)
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY shared/ shared/
COPY server/ server/
COPY frontend/package.json frontend/package.json
RUN npm install --no-audit --no-fund
RUN npm run build:shared && npm run build:server

# Production
FROM base AS production
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built app and dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/package.json ./

# Set permissions
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

CMD ["node", "dist/index.js"]
