# Epic 1: Foundation & Core Setup

**Status:** Ready for Development
**Priority:** P0 - Critical
**Estimated Stories:** 6

## Epic Goal

Estabelecer a base técnica do projeto incluindo setup do monorepo, configuração de CI/CD, integração inicial com WhatsApp e autenticação. Entregar uma página de status funcional e login básico via WhatsApp.

## Prerequisites

- Nenhum (primeiro épico)

## Dependencies

- Conta GitHub
- Conta Vercel
- Conta Railway ou Render
- Conta Supabase
- Instance Evolution API ou WhatsApp Cloud API

---

## Story 1.1: Project Setup & Infrastructure

**Status:** Ready
**Priority:** P0
**Complexity:** Medium

### User Story

**As a** developer,
**I want** a properly configured monorepo with frontend and backend,
**so that** I can start building features on a solid foundation.

### Acceptance Criteria

1. Monorepo configurado com pnpm workspaces
2. Frontend Next.js 14+ com TypeScript configurado em `/apps/web`
3. Backend Node.js com Express e TypeScript configurado em `/apps/api`
4. Package compartilhado em `/packages/shared` para tipos
5. ESLint e Prettier configurados com regras consistentes
6. GitHub repository inicializado com `.gitignore` adequado
7. README.md com instruções de setup local
8. Scripts `dev`, `build`, `lint`, `test` funcionando no root

### Technical Notes

- Usar pnpm 8.x com workspace protocol
- Next.js 14 com App Router
- Express 4.18+ com TypeScript
- Configurar path aliases (@/...) em todos os packages

### Definition of Done

- [ ] Código commitado no GitHub
- [ ] `pnpm install` roda sem erros
- [ ] `pnpm dev` inicia frontend e backend
- [ ] `pnpm build` compila sem erros
- [ ] `pnpm lint` passa sem erros

---

## Story 1.2: CI/CD Pipeline

**Status:** Ready
**Priority:** P0
**Complexity:** Medium

### User Story

**As a** developer,
**I want** automated testing and deployment,
**so that** changes are validated and deployed automatically.

### Acceptance Criteria

1. GitHub Actions workflow `.github/workflows/ci.yml` para CI
   - Roda em push e PR para main
   - Executa: install, lint, type-check, tests
2. Deploy automático do frontend para Vercel em push para main
3. Deploy automático do backend para Railway/Render em push para main
4. Status checks obrigatórios antes de merge em main
5. Notificação de falha visível no GitHub PR

### Technical Notes

- Usar Node.js 20 no CI
- Cache de pnpm para builds mais rápidos
- Vercel CLI ou GitHub integration
- Railway/Render CLI ou GitHub integration

### Definition of Done

- [ ] PR criado e CI roda automaticamente
- [ ] Merge em main faz deploy automático
- [ ] Frontend acessível em URL Vercel
- [ ] Backend acessível em URL Railway/Render
- [ ] Health check retorna 200

---

## Story 1.3: Database Setup

**Status:** Ready
**Priority:** P0
**Complexity:** Low

### User Story

**As a** developer,
**I want** a PostgreSQL database configured,
**so that** I can persist application data.

### Acceptance Criteria

1. PostgreSQL provisionado no Supabase (free tier)
2. Prisma ORM configurado em `/apps/api`
3. Schema inicial com tabelas: businesses, services, clients, appointments
4. Comando `pnpm db:migrate` executa migrations
5. Comando `pnpm db:seed` popula dados de desenvolvimento
6. Variáveis de ambiente configuradas:
   - `DATABASE_URL` para conexão
   - Diferentes valores para dev/staging/prod

### Technical Notes

- Prisma 5.x com TypeScript
- Usar Prisma Migrate para versionamento
- Seed com dados fictícios mas realistas

### Definition of Done

- [ ] Prisma schema válido
- [ ] Migrations aplicadas no Supabase
- [ ] Seed funciona localmente
- [ ] Conexão funcionando em produção

---

## Story 1.4: WhatsApp Integration Setup

**Status:** Ready
**Priority:** P0
**Complexity:** High

### User Story

**As a** developer,
**I want** WhatsApp messaging capability,
**so that** the system can send and receive messages.

### Acceptance Criteria

1. Evolution API configurada (Docker local ou cloud)
2. Endpoint POST `/api/webhooks/whatsapp` recebe mensagens
3. Serviço `WhatsAppService` com método `sendText(phone, message)`
4. Health check GET `/api/health/whatsapp` retorna status da conexão
5. Logs de mensagens enviadas/recebidas no console
6. Documentação de setup no README

### Technical Notes

- Evolution API v2 ou WhatsApp Cloud API
- Webhook deve validar assinatura/token
- Usar queue para envios (mesmo que síncrono agora)
- Timeout de 10s para envio

### Definition of Done

- [ ] Evolution API rodando
- [ ] Webhook recebe mensagens de teste
- [ ] Envio de mensagem funciona
- [ ] Health check retorna status correto
- [ ] Documentação atualizada

---

## Story 1.5: Authentication via WhatsApp

**Status:** Ready
**Priority:** P0
**Complexity:** High

### User Story

**As a** business owner,
**I want** to login using my WhatsApp number,
**so that** I don't need to remember another password.

### Acceptance Criteria

1. Endpoint POST `/api/auth/request-code` recebe telefone
   - Gera código de 6 dígitos
   - Salva código com TTL de 5 minutos (Redis)
   - Envia código via WhatsApp
2. Endpoint POST `/api/auth/verify` recebe telefone + código
   - Valida código
   - Cria business se não existir
   - Retorna accessToken (JWT 1h) e refreshToken (7d)
3. Endpoint POST `/api/auth/refresh` renova tokens
4. Middleware de autenticação protege rotas
5. Página de login no frontend com input de telefone e código

### Technical Notes

- JWT com secret seguro
- Refresh token armazenado no banco
- Código deve ser numérico (fácil de digitar)
- Rate limit: 3 tentativas por minuto

### Definition of Done

- [ ] Fluxo completo de login funciona
- [ ] Código chega via WhatsApp
- [ ] Token válido acessa rotas protegidas
- [ ] Refresh renova sessão
- [ ] Frontend permite login

---

## Story 1.6: Health Check & Status Page

**Status:** Ready
**Priority:** P1
**Complexity:** Low

### User Story

**As a** developer,
**I want** a health check endpoint and status page,
**so that** I can monitor system availability.

### Acceptance Criteria

1. GET `/api/health` retorna JSON com status:
   ```json
   {
     "status": "healthy",
     "services": {
       "database": "connected",
       "redis": "connected",
       "whatsapp": "connected"
     },
     "timestamp": "2025-01-04T12:00:00Z"
   }
   ```
2. Resposta em menos de 500ms
3. Página `/status` no frontend mostra status visual
4. Integração com Uptime Robot configurada (ou similar)

### Technical Notes

- Health check não deve autenticar
- Cada serviço verifica conexão real
- Página de status pode ser estática com fetch

### Definition of Done

- [ ] Endpoint retorna status correto
- [ ] Página de status renderiza
- [ ] Uptime Robot monitora e alerta

---

## Epic Completion Checklist

- [ ] Todas as 6 stories completadas
- [ ] Testes passando no CI
- [ ] Deploy em produção funcionando
- [ ] Login via WhatsApp funcional
- [ ] Documentação atualizada
