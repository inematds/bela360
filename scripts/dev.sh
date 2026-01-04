#!/bin/bash

# ===========================================
# bela360 - Development Environment Script
# ===========================================

set -e

echo "🚀 Starting bela360 Development Environment..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created. Please update it with your values.${NC}"
fi

# Function to show status
show_status() {
    echo ""
    echo -e "${BLUE}📊 Service Status:${NC}"
    docker-compose ps
}

# Function to show logs
show_logs() {
    docker-compose logs -f --tail=100 $1
}

# Parse command
case "$1" in
    start|up)
        echo -e "${GREEN}▶️  Starting all services...${NC}"
        docker-compose up -d
        echo ""
        echo -e "${GREEN}✅ All services started!${NC}"
        echo ""
        echo -e "${BLUE}🌐 Access URLs:${NC}"
        echo "   Frontend:      http://localhost:3000"
        echo "   API:           http://localhost:3001"
        echo "   Evolution API: http://localhost:8080"
        echo "   Bull Board:    http://localhost:3002"
        echo "   Adminer:       http://localhost:8081 (use --profile dev-tools)"
        show_status
        ;;
    stop|down)
        echo -e "${YELLOW}⏹️  Stopping all services...${NC}"
        docker-compose down
        echo -e "${GREEN}✅ All services stopped.${NC}"
        ;;
    restart)
        echo -e "${YELLOW}🔄 Restarting services...${NC}"
        docker-compose restart $2
        show_status
        ;;
    logs)
        show_logs $2
        ;;
    status)
        show_status
        ;;
    rebuild)
        echo -e "${YELLOW}🔨 Rebuilding services...${NC}"
        docker-compose down
        docker-compose build --no-cache $2
        docker-compose up -d
        echo -e "${GREEN}✅ Services rebuilt and started!${NC}"
        ;;
    clean)
        echo -e "${RED}🧹 Cleaning up Docker resources...${NC}"
        docker-compose down -v --remove-orphans
        docker system prune -f
        echo -e "${GREEN}✅ Cleanup complete.${NC}"
        ;;
    shell)
        SERVICE=${2:-api}
        echo -e "${BLUE}🐚 Opening shell in $SERVICE...${NC}"
        docker-compose exec $SERVICE sh
        ;;
    db)
        case "$2" in
            migrate)
                echo -e "${BLUE}📦 Running database migrations...${NC}"
                docker-compose exec api pnpm --filter api prisma migrate dev
                ;;
            seed)
                echo -e "${BLUE}🌱 Seeding database...${NC}"
                docker-compose exec api pnpm --filter api prisma db seed
                ;;
            studio)
                echo -e "${BLUE}🔍 Opening Prisma Studio...${NC}"
                docker-compose exec api pnpm --filter api prisma studio
                ;;
            reset)
                echo -e "${RED}⚠️  Resetting database...${NC}"
                docker-compose exec api pnpm --filter api prisma migrate reset
                ;;
            *)
                echo "Usage: $0 db [migrate|seed|studio|reset]"
                ;;
        esac
        ;;
    whatsapp)
        echo -e "${BLUE}📱 Opening Evolution API Manager...${NC}"
        echo "Access: http://localhost:8080/manager"
        xdg-open http://localhost:8080/manager 2>/dev/null || open http://localhost:8080/manager 2>/dev/null || echo "Open http://localhost:8080/manager in your browser"
        ;;
    *)
        echo "🐳 bela360 Development Script"
        echo ""
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  start, up      Start all services"
        echo "  stop, down     Stop all services"
        echo "  restart [svc]  Restart services (optionally specify service)"
        echo "  logs [svc]     Show logs (optionally specify service)"
        echo "  status         Show service status"
        echo "  rebuild [svc]  Rebuild and restart services"
        echo "  clean          Clean up Docker resources"
        echo "  shell [svc]    Open shell in service (default: api)"
        echo "  db migrate     Run database migrations"
        echo "  db seed        Seed the database"
        echo "  db studio      Open Prisma Studio"
        echo "  db reset       Reset database (destructive!)"
        echo "  whatsapp       Open Evolution API manager"
        echo ""
        echo "Examples:"
        echo "  $0 start           # Start everything"
        echo "  $0 logs api        # Follow API logs"
        echo "  $0 restart web     # Restart only frontend"
        echo "  $0 db migrate      # Run migrations"
        ;;
esac
