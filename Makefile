# ===========================================
# bela360 - Makefile
# ===========================================

.PHONY: help dev start stop restart logs status build clean setup db-migrate db-seed db-studio

# Default target
help:
	@echo "🐳 bela360 - Available Commands"
	@echo ""
	@echo "Development:"
	@echo "  make setup      - Initial project setup"
	@echo "  make dev        - Start development environment"
	@echo "  make start      - Start all Docker services"
	@echo "  make stop       - Stop all Docker services"
	@echo "  make restart    - Restart all services"
	@echo "  make logs       - Show all logs"
	@echo "  make status     - Show service status"
	@echo ""
	@echo "Database:"
	@echo "  make db-migrate - Run Prisma migrations"
	@echo "  make db-seed    - Seed the database"
	@echo "  make db-studio  - Open Prisma Studio"
	@echo "  make db-reset   - Reset database (destructive!)"
	@echo ""
	@echo "Build & Deploy:"
	@echo "  make build      - Build all services"
	@echo "  make build-prod - Build production images"
	@echo "  make clean      - Clean up Docker resources"
	@echo ""
	@echo "Testing:"
	@echo "  make test       - Run all tests"
	@echo "  make lint       - Run linters"
	@echo ""

# Setup
setup:
	@./scripts/setup.sh

# Development
dev:
	@./scripts/dev.sh start

start:
	@docker-compose up -d

stop:
	@docker-compose down

restart:
	@docker-compose restart

logs:
	@docker-compose logs -f

logs-api:
	@docker-compose logs -f api

logs-web:
	@docker-compose logs -f web

status:
	@docker-compose ps

# Database
db-migrate:
	@docker-compose exec api pnpm --filter api prisma migrate dev

db-seed:
	@docker-compose exec api pnpm --filter api prisma db seed

db-studio:
	@docker-compose exec api pnpm --filter api prisma studio

db-reset:
	@docker-compose exec api pnpm --filter api prisma migrate reset

# Build
build:
	@pnpm build

build-prod:
	@docker-compose -f docker-compose.prod.yml build

# Testing
test:
	@pnpm test

lint:
	@pnpm lint

# Cleanup
clean:
	@docker-compose down -v --remove-orphans
	@docker system prune -f
	@rm -rf node_modules apps/*/node_modules packages/*/node_modules
	@rm -rf apps/web/.next apps/api/dist

# Production
prod-up:
	@docker-compose -f docker-compose.prod.yml up -d

prod-down:
	@docker-compose -f docker-compose.prod.yml down

prod-logs:
	@docker-compose -f docker-compose.prod.yml logs -f
