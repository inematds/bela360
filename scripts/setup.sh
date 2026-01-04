#!/bin/bash

# ===========================================
# bela360 - Initial Setup Script
# ===========================================

set -e

echo "🎨 bela360 - Initial Project Setup"
echo "==================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

# Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 20+${NC}"
    exit 1
fi
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}❌ Node.js version must be 20 or higher. Current: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

# pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}⚠️  pnpm not found. Installing...${NC}"
    corepack enable
    corepack prepare pnpm@latest --activate
fi
echo -e "${GREEN}✅ pnpm $(pnpm -v)${NC}"

# Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker $(docker -v | cut -d' ' -f3 | tr -d ',')${NC}"

# Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker Compose available${NC}"

echo ""
echo -e "${BLUE}📦 Setting up project structure...${NC}"

# Create directory structure
mkdir -p apps/api/src/{modules,common,config}
mkdir -p apps/api/src/modules/{auth,scheduling,crm,notifications,analytics,whatsapp}
mkdir -p apps/api/prisma
mkdir -p apps/api/tests/{unit,integration,fixtures}
mkdir -p apps/web/src/{app,components,hooks,lib,styles}
mkdir -p apps/web/src/app/\(auth\)
mkdir -p apps/web/src/app/\(dashboard\)/{agenda,clientes,servicos,relatorios,config}
mkdir -p apps/web/src/components/{ui,forms,dashboard,layout}
mkdir -p apps/web/public
mkdir -p packages/shared/src/{types,utils}

echo -e "${GREEN}✅ Directory structure created${NC}"

# Create .env if not exists
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created from template${NC}"
    echo -e "${YELLOW}⚠️  Please update .env with your configuration${NC}"
else
    echo -e "${BLUE}ℹ️  .env file already exists${NC}"
fi

# Make scripts executable
chmod +x scripts/*.sh
echo -e "${GREEN}✅ Scripts made executable${NC}"

echo ""
echo -e "${BLUE}📥 Installing dependencies...${NC}"

# Initialize pnpm workspace if needed
if [ ! -f "pnpm-workspace.yaml" ]; then
    cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
  - 'packages/*'
EOF
    echo -e "${GREEN}✅ pnpm workspace configured${NC}"
fi

# Create root package.json if needed
if [ ! -f "package.json" ]; then
    cat > package.json << 'EOF'
{
  "name": "bela360",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "docker-compose up -d && pnpm -r dev",
    "dev:docker": "./scripts/dev.sh start",
    "build": "pnpm -r build",
    "lint": "pnpm -r lint",
    "test": "pnpm -r test",
    "clean": "pnpm -r clean && rm -rf node_modules",
    "db:migrate": "pnpm --filter api prisma migrate dev",
    "db:seed": "pnpm --filter api prisma db seed",
    "db:studio": "pnpm --filter api prisma studio"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "typescript": "^5.3.3",
    "prettier": "^3.2.0",
    "eslint": "^8.56.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  },
  "packageManager": "pnpm@8.14.0"
}
EOF
    echo -e "${GREEN}✅ Root package.json created${NC}"
fi

# Create apps/api/package.json
if [ ! -f "apps/api/package.json" ]; then
    cat > apps/api/package.json << 'EOF'
{
  "name": "api",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "lint": "eslint src --ext .ts",
    "test": "vitest",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "express": "^4.18.2",
    "@prisma/client": "^5.8.0",
    "bullmq": "^5.1.0",
    "ioredis": "^5.3.2",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.22.4",
    "pino": "^8.17.0",
    "pino-pretty": "^10.3.0",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "express-rate-limit": "^7.1.5",
    "axios": "^1.6.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/jsonwebtoken": "^9.0.5",
    "prisma": "^5.8.0",
    "tsx": "^4.7.0",
    "vitest": "^1.2.0",
    "typescript": "^5.3.3"
  }
}
EOF
    echo -e "${GREEN}✅ API package.json created${NC}"
fi

# Create apps/web/package.json
if [ ! -f "apps/web/package.json" ]; then
    cat > apps/web/package.json << 'EOF'
{
  "name": "web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "clean": "rm -rf .next"
  },
  "dependencies": {
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.3"
  }
}
EOF
    echo -e "${GREEN}✅ Web package.json created${NC}"
fi

# Create packages/shared/package.json
if [ ! -f "packages/shared/package.json" ]; then
    cat > packages/shared/package.json << 'EOF'
{
  "name": "@bela360/shared",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf dist"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
EOF
    echo -e "${GREEN}✅ Shared package.json created${NC}"
fi

echo ""
echo -e "${BLUE}🐳 Starting Docker services...${NC}"
docker-compose up -d postgres redis

# Wait for PostgreSQL
echo -e "${BLUE}⏳ Waiting for PostgreSQL to be ready...${NC}"
sleep 5

# Install dependencies
echo ""
echo -e "${BLUE}📥 Installing npm dependencies...${NC}"
pnpm install || echo -e "${YELLOW}⚠️  pnpm install failed, you may need to run it manually${NC}"

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Setup complete!${NC}"
echo "=========================================="
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Update .env with your configuration"
echo "2. Run: ./scripts/dev.sh start"
echo "3. Access: http://localhost:3000"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "  ./scripts/dev.sh start    - Start all services"
echo "  ./scripts/dev.sh logs     - View logs"
echo "  ./scripts/dev.sh db migrate - Run migrations"
echo "  ./scripts/dev.sh whatsapp - Open WhatsApp manager"
echo ""
