# 🎨 bela360

Sistema de automação para negócios de beleza no Brasil via WhatsApp.

## 🚀 Quick Start

### Pré-requisitos

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose

### Setup Inicial

```bash
# Clone e entre no diretório
cd bela360

# Execute o setup inicial
./scripts/setup.sh

# Ou manualmente:
cp .env.example .env
# Edite .env com suas configurações
```

### Iniciar Desenvolvimento

```bash
# Usando o script
./scripts/dev.sh start

# Ou usando Make
make dev

# Ou usando Docker Compose diretamente
docker-compose up -d
```

### URLs de Acesso

| Serviço | URL | Descrição |
|---------|-----|-----------|
| Frontend | http://localhost:3000 | App Next.js |
| API | http://localhost:3001 | Backend Express |
| Evolution API | http://localhost:8080 | WhatsApp API |
| Bull Board | http://localhost:3002 | Dashboard de filas |
| Adminer | http://localhost:8081 | Database UI (dev) |

---

## 📁 Estrutura do Projeto

```
bela360/
├── apps/
│   ├── api/                 # Backend Express + Prisma
│   │   ├── src/
│   │   │   ├── modules/     # Módulos de negócio
│   │   │   ├── common/      # Middleware, utils
│   │   │   └── config/      # Configurações
│   │   └── prisma/          # Schema e migrations
│   └── web/                 # Frontend Next.js
│       └── src/
│           ├── app/         # App Router pages
│           └── components/  # React components
├── packages/
│   └── shared/              # Tipos compartilhados
├── docker/                  # Dockerfiles e configs
├── scripts/                 # Scripts de automação
└── docs/                    # Documentação
```

---

## 🐳 Docker

### Serviços Disponíveis

| Serviço | Imagem | Porta |
|---------|--------|-------|
| postgres | postgres:15-alpine | 5432 |
| redis | redis:7-alpine | 6379 |
| evolution-api | atendai/evolution-api | 8080 |
| api | Custom (Node.js) | 3001 |
| web | Custom (Next.js) | 3000 |
| bull-board | deadly0/bull-board | 3002 |

### Comandos Docker

```bash
# Iniciar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f api

# Parar todos os serviços
docker-compose down

# Reconstruir imagens
docker-compose build --no-cache

# Limpar tudo (cuidado: apaga volumes!)
docker-compose down -v --remove-orphans
```

---

## 🛠 Comandos Úteis

### Usando o Script dev.sh

```bash
./scripts/dev.sh start      # Iniciar serviços
./scripts/dev.sh stop       # Parar serviços
./scripts/dev.sh restart    # Reiniciar
./scripts/dev.sh logs       # Ver logs
./scripts/dev.sh logs api   # Logs do API
./scripts/dev.sh status     # Status dos containers
./scripts/dev.sh shell api  # Shell no container
./scripts/dev.sh db migrate # Rodar migrations
./scripts/dev.sh db seed    # Popular banco
./scripts/dev.sh db studio  # Abrir Prisma Studio
./scripts/dev.sh whatsapp   # Abrir manager WhatsApp
./scripts/dev.sh clean      # Limpar recursos Docker
```

### Usando Make

```bash
make help        # Ver todos os comandos
make dev         # Iniciar desenvolvimento
make start       # Iniciar Docker
make stop        # Parar Docker
make logs        # Ver logs
make db-migrate  # Migrations
make db-seed     # Seed
make test        # Rodar testes
make lint        # Linter
make clean       # Limpar tudo
```

---

## 🔧 Configuração

### Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

```env
# Database
DATABASE_URL=postgresql://bela360:senha@localhost:5432/bela360

# Redis
REDIS_URL=redis://localhost:6379

# JWT (gere com: openssl rand -base64 32)
JWT_SECRET=sua_chave_secreta_aqui
JWT_REFRESH_SECRET=outra_chave_secreta

# Evolution API (WhatsApp)
EVOLUTION_API_KEY=sua_api_key
EVOLUTION_INSTANCE_NAME=bela360
```

### WhatsApp (Evolution API)

1. Acesse http://localhost:8080
2. Crie uma instância com nome `bela360`
3. Escaneie o QR Code com WhatsApp
4. Configure o webhook: `http://api:3001/api/webhooks/whatsapp`

---

## 📚 Documentação

- [Project Brief](docs/brief.md)
- [PRD - Requisitos](docs/prd.md)
- [Arquitetura](docs/architecture.md)
- [Backlog](docs/backlog.md)
- [Stories](docs/stories/)

---

## 🧪 Testes

```bash
# Todos os testes
pnpm test

# Apenas API
pnpm --filter api test

# Com coverage
pnpm --filter api test --coverage

# Watch mode
pnpm --filter api test --watch
```

---

## 🚀 Deploy

### Build de Produção

```bash
# Build das imagens
docker-compose -f docker-compose.prod.yml build

# Ou
make build-prod
```

### Rodar em Produção

```bash
# Iniciar
docker-compose -f docker-compose.prod.yml up -d

# Ou
make prod-up

# Ver logs
make prod-logs
```

---

## 📝 Licença

Privado - Todos os direitos reservados.

---

## 👥 Contribuição

1. Crie uma branch: `git checkout -b feature/nova-feature`
2. Commit: `git commit -m 'Add nova feature'`
3. Push: `git push origin feature/nova-feature`
4. Abra um Pull Request

---

Desenvolvido com ❤️ para o mercado de beleza brasileiro.
