# ===========================================
# bela360 API - Dockerfile
# ===========================================

# Base stage with pnpm
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache libc6-compat openssl openssl-dev
WORKDIR /app

# ===========================================
# Dependencies stage
# ===========================================
FROM base AS deps

# Copy workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# ===========================================
# Development stage
# ===========================================
FROM base AS development

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy source code
COPY . .

# Generate Prisma client
RUN cd apps/api && pnpm prisma generate || true

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Start development server
CMD ["pnpm", "--filter", "api", "dev"]

# ===========================================
# Builder stage
# ===========================================
FROM base AS builder

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy source code
COPY . .

# Generate Prisma client and build shared + api
RUN cd apps/api && pnpm prisma generate
RUN pnpm --filter @bela360/shared build
RUN pnpm --filter api build

# ===========================================
# Production stage
# ===========================================
FROM base AS production

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

# Copy built application
COPY --from=builder --chown=expressjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=expressjs:nodejs /app/apps/api/package.json ./apps/api/
COPY --from=builder --chown=expressjs:nodejs /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder --chown=expressjs:nodejs /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder --chown=expressjs:nodejs /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=expressjs:nodejs /app/packages/shared/package.json ./packages/shared/
COPY --from=builder --chown=expressjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=expressjs:nodejs /app/package.json ./

USER expressjs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

CMD ["node", "apps/api/dist/server.js"]
