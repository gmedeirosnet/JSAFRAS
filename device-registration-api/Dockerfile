# ================================
# Stage 1: Build
# ================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

# ================================
# Stage 2: Production
# ================================
FROM node:20-alpine AS production

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules

COPY src ./src
COPY package*.json ./

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3001/health || exit 1

ENV NODE_ENV=production
ENV DEVICE_REGISTRATION_API_PORT=3001

CMD ["node", "src/index.js"]
