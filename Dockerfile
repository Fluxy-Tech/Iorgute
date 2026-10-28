# syntax=docker/dockerfile:1

# ─── Dependências ───────────────────────────────────────────────
FROM node:24-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

# ─── Build ──────────────────────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# prisma generate precisa de uma URL válida no formato, mas não conecta no banco
ARG DATABASE_URL="postgres://sturnus:SturnusFlow@147.79.110.10:8002/data_operation_iorgute?sslmode=disable"
ENV DATABASE_URL=${DATABASE_URL}
RUN npm run build

# ─── Ferramenta de migração (Prisma CLI isolado) ────────────────
FROM node:24-alpine AS migrator
WORKDIR /migrate
RUN npm init -y >/dev/null \
  && npm install --omit=dev --no-audit --no-fund prisma@7.10.0 dotenv@18 \
  && npm cache clean --force

# ─── Runtime ────────────────────────────────────────────────────
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8001 \
    HOSTNAME=0.0.0.0 \
    RUN_MIGRATIONS=true

RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

COPY --from=migrator --chown=nextjs:nodejs /migrate/node_modules ./migrate/node_modules
COPY --chown=nextjs:nodejs prisma/schema.prisma ./migrate/prisma/schema.prisma
COPY --chown=nextjs:nodejs prisma/migrations ./migrate/prisma/migrations
COPY --chown=nextjs:nodejs prisma.config.ts ./migrate/prisma.config.ts
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 8001
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
