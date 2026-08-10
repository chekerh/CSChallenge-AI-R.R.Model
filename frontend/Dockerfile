# Multi-stage build for UtopiaHire Frontend (npm workspace root context)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY shared/ shared/
COPY frontend/ frontend/
COPY server/package.json server/package.json
RUN npm install --no-audit --no-fund
RUN npm run build:shared && npm run build:frontend

# Production with nginx
FROM nginx:alpine AS production
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
