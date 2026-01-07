# Bela360

**Sistema completo de gestao e automacao para negocios de beleza via WhatsApp**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.3-blue.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue.svg)

---

## Indice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Stack Tecnologica](#stack-tecnologica)
- [Instalacao](#instalacao)
- [Configuracao](#configuracao)
- [Deploy em Producao](#deploy-em-producao)
- [Conectar WhatsApp](#conectar-whatsapp)
- [API Endpoints](#api-endpoints)
- [Comandos Uteis](#comandos-uteis)
- [Troubleshooting](#troubleshooting)

---

## Sobre o Projeto

O **Bela360** e uma plataforma SaaS desenvolvida para saloes de beleza, barbearias, clinicas de estetica e SPAs. O sistema integra agendamento inteligente, CRM de clientes, gestao financeira e automacao de mensagens via WhatsApp em uma unica solucao.

### Principais Diferenciais

| Diferencial | Descricao |
|-------------|-----------|
| **WhatsApp Nativo** | Integracao direta com Evolution API v2 para envio de mensagens, confirmacoes e lembretes automaticos |
| **Agenda Inteligente** | Visao por profissional, deteccao de conflitos e lista de espera |
| **CRM Completo** | Historico de atendimentos, segmentacao de clientes e preferencias salvas |
| **Automacoes** | Confirmacao automatica, lembretes 24h, reativacao de inativos, aniversarios |
| **Multi-Profissional** | Gestao de equipe com comissoes e ranking de desempenho |
| **Programa de Fidelidade** | Sistema de pontos e recompensas |
| **Controle de Estoque** | Gestao de produtos e alertas de reposicao |

### Para quem e?

- Saloes de beleza
- Barbearias
- Clinicas de estetica
- SPAs e centros de bem-estar
- Studios de manicure/pedicure
- Clinicas de depilacao

---

## Funcionalidades

### 1. Dashboard

```
/dashboard
```

- KPIs em tempo real (agendamentos, faturamento, clientes)
- Graficos de evolucao semanal/mensal
- Alertas e notificacoes pendentes
- Resumo do dia (agendamentos, confirmacoes)

### 2. Agenda Inteligente

```
/agenda
```

- Visao por dia/semana/mes
- Filtragem por profissional
- Drag-and-drop para reagendar
- Status: Pendente, Confirmado, Concluido, Cancelado, No-show
- Lista de espera automatica
- Cores por tipo de servico

**Fluxo de Agendamento:**
```
Cliente agenda → Sistema envia confirmacao WhatsApp →
Cliente confirma → 24h antes: lembrete automatico →
Atendimento → Pos-atendimento: pesquisa de satisfacao
```

### 3. Clientes (CRM)

```
/clientes
```

- Cadastro completo com foto
- Historico de todos os atendimentos
- Segmentacao automatica:
  - **VIP**: Clientes frequentes/alto ticket
  - **Regular**: Clientes ativos
  - **Inativo**: Sem visita ha 60+ dias
  - **Novo**: Primeiro atendimento
- Preferencias salvas (cor do cabelo, corte preferido, produtos)
- Timeline de interacoes
- Aniversario e lembretes

### 4. Servicos

```
/servicos
```

- Catalogo completo de servicos
- Preco e duracao
- Profissionais habilitados por servico
- Categorias (Cabelo, Unhas, Estetica, etc)
- Combos e pacotes promocionais
- Comissao por servico

### 5. WhatsApp

```
/whatsapp
```

- Conexao via QR Code
- Status da conexao em tempo real
- Envio de mensagens:
  - Texto
  - Imagem
  - Video
  - Documento
  - Audio
- Templates de mensagem pre-definidos
- Historico de mensagens enviadas
- Webhooks para recebimento de respostas

### 6. Automacoes

```
/automacao
```

| Automacao | Trigger | Acao |
|-----------|---------|------|
| Confirmacao | Agendamento criado | Envia WhatsApp pedindo confirmacao |
| Lembrete 24h | 24h antes do horario | Envia lembrete com detalhes |
| Pos-atendimento | Servico concluido | Envia agradecimento + pesquisa |
| Aniversario | Data de nascimento | Envia felicitacao + cupom |
| Reativacao 30d | 30 dias sem visita | Envia convite para retorno |
| Reativacao 60d | 60 dias sem visita | Envia promocao especial |
| Reativacao 90d | 90 dias sem visita | Ultima tentativa + desconto |
| Vaga disponivel | Cancelamento na agenda | Notifica lista de espera |

### 7. Marketing

```
/marketing
```

- Campanhas por segmento de cliente
- Disparo em massa via WhatsApp
- Agendamento de campanhas
- Metricas: enviados, entregues, lidos, respondidos
- Templates de campanha
- A/B testing

### 8. Financeiro

```
/financeiro
```

- Controle de caixa diario
- Gestao de pagamentos (Dinheiro, Pix, Cartao)
- Comissoes por profissional
- Relatorios de faturamento
- Contas a pagar/receber
- Fluxo de caixa
- Ticket medio por cliente/servico

### 9. Estoque

```
/estoque
```

- Cadastro de produtos
- Controle de entradas/saidas
- Alertas de estoque minimo
- Vinculacao com servicos (ex: tintura gasta por coloracao)
- Historico de movimentacoes
- Fornecedores

### 10. Fidelidade

```
/fidelidade
```

- Sistema de pontos (1 real = X pontos)
- Niveis de fidelidade (Bronze, Prata, Ouro, Diamante)
- Catalogo de recompensas
- Resgate de pontos
- Bonus de aniversario
- Indicacao premiada

### 11. Equipe

```
/configuracoes → Equipe
```

- Cadastro de profissionais
- Especialidades e servicos habilitados
- Horarios de trabalho por dia
- Comissoes configuraveis (% ou fixo)
- Ranking de desempenho
- Metas individuais

### 12. Lista de Espera

```
/lista-espera
```

- Cadastro de clientes aguardando vaga
- Preferencias de horario
- Notificacao automatica quando abre vaga
- Prioridade por ordem de cadastro

### 13. Analytics

```
/analiticos
```

- Graficos de faturamento
- Taxa de ocupacao da agenda
- Servicos mais vendidos
- Profissionais mais produtivos
- Taxa de retorno de clientes
- Horarios de pico
- Comparativo mensal/anual

---

## Arquitetura

```
bela360/
├── apps/
│   ├── api/                     # Backend Express.js + TypeScript
│   │   ├── src/
│   │   │   ├── modules/         # Modulos de negocio
│   │   │   │   ├── auth/        # Autenticacao JWT
│   │   │   │   ├── business/    # Gestao do negocio
│   │   │   │   ├── clients/     # CRM de clientes
│   │   │   │   ├── appointments/# Agendamentos
│   │   │   │   ├── services/    # Servicos oferecidos
│   │   │   │   ├── professionals/# Equipe
│   │   │   │   ├── whatsapp/    # Integracao WhatsApp
│   │   │   │   ├── finance/     # Financeiro
│   │   │   │   ├── inventory/   # Estoque
│   │   │   │   ├── loyalty/     # Fidelidade
│   │   │   │   ├── marketing/   # Campanhas
│   │   │   │   └── notifications/# Notificacoes
│   │   │   ├── config/          # Configuracoes (env, logger)
│   │   │   ├── middlewares/     # Auth, validation, error
│   │   │   └── utils/           # Helpers
│   │   └── prisma/
│   │       ├── schema.prisma    # Modelo de dados
│   │       └── migrations/      # Migrations do banco
│   │
│   └── web/                     # Frontend Next.js 14
│       └── src/
│           ├── app/             # App Router (pages)
│           │   ├── (auth)/      # Login, registro
│           │   └── (dashboard)/ # Paginas autenticadas
│           │       ├── dashboard/
│           │       ├── agenda/
│           │       ├── clientes/
│           │       ├── servicos/
│           │       ├── whatsapp/
│           │       ├── automacao/
│           │       ├── marketing/
│           │       ├── financeiro/
│           │       ├── estoque/
│           │       ├── fidelidade/
│           │       └── configuracoes/
│           ├── components/      # Componentes reutilizaveis
│           ├── hooks/           # Custom hooks
│           └── lib/             # Utilitarios
│
├── docker/                      # Dockerfiles e configs
│   ├── api/Dockerfile
│   ├── web/Dockerfile
│   ├── nginx/nginx.conf
│   └── postgres/init.sql
│
├── docs/                        # Documentacao
└── scripts/                     # Scripts de automacao
```

### Diagrama de Fluxo

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Cliente   │────▶│   Nginx     │────▶│  Next.js    │
│  (Browser)  │     │  (Proxy)    │     │  (Frontend) │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  Express.js │
                                        │  (API)      │
                                        └──────┬──────┘
                           ┌───────────────────┼───────────────────┐
                           ▼                   ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
                    │ PostgreSQL  │     │    Redis    │     │ Evolution   │
                    │ (Database)  │     │   (Cache)   │     │ (WhatsApp)  │
                    └─────────────┘     └─────────────┘     └─────────────┘
```

---

## Stack Tecnologica

| Camada | Tecnologia | Versao | Uso |
|--------|------------|--------|-----|
| **Frontend** | Next.js (App Router) | 14.x | Interface do usuario |
| **UI Components** | TailwindCSS + shadcn/ui | 3.x | Estilizacao |
| **Backend** | Express.js + TypeScript | 4.x | API REST |
| **ORM** | Prisma | 5.x | Acesso ao banco |
| **Banco de Dados** | PostgreSQL | 15 | Persistencia |
| **Cache/Filas** | Redis | 7 | Cache e jobs |
| **WhatsApp** | Evolution API | v2.3.7 | Mensagens |
| **Monorepo** | pnpm workspaces | 8.x | Gerenciamento |
| **Deploy** | Docker Compose | - | Containerizacao |
| **Proxy** | Nginx | Alpine | Reverse proxy + SSL |
| **Validacao** | Zod | 3.x | Schema validation |
| **Logs** | Pino | 8.x | Logging estruturado |

---

## Instalacao

### Pre-requisitos

- **Node.js** >= 20.0.0
- **pnpm** >= 8.0.0
- **Docker** e **Docker Compose**
- **Git**

### 1. Clonar o Repositorio

```bash
git clone https://github.com/seu-usuario/bela360.git
cd bela360
```

### 2. Instalar Dependencias

```bash
pnpm install
```

### 3. Configurar Variaveis de Ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` (veja secao [Configuracao](#configuracao)).

### 4. Iniciar Banco de Dados

```bash
# Subir PostgreSQL e Redis
docker-compose up -d postgres redis

# Aguardar containers ficarem saudaveis
docker-compose ps
```

### 5. Rodar Migrations

```bash
pnpm db:migrate
```

### 6. (Opcional) Popular com Dados de Exemplo

```bash
pnpm db:seed
```

### 7. Iniciar em Desenvolvimento

```bash
# API + Web em paralelo
pnpm dev
```

### 8. Acessar

| Servico | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:3001 |
| Evolution API | http://localhost:8080 |

---

## Configuracao

### Variaveis de Ambiente

```env
# ===========================================
# Database
# ===========================================
POSTGRES_USER=bela360
POSTGRES_PASSWORD=sua_senha_segura_aqui
POSTGRES_DB=bela360
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}

# ===========================================
# Redis
# ===========================================
REDIS_URL=redis://localhost:6379

# ===========================================
# JWT (gere com: openssl rand -base64 32)
# ===========================================
JWT_SECRET=sua_chave_jwt_muito_segura_aqui
JWT_REFRESH_SECRET=outra_chave_segura_para_refresh

# ===========================================
# Evolution API (WhatsApp)
# ===========================================
EVOLUTION_API_KEY=sua_api_key_evolution
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_INSTANCE_NAME=bela360
EVOLUTION_PUBLIC_URL=https://seu-dominio.com/evolution

# ===========================================
# Frontend
# ===========================================
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=ws://localhost:3001
FRONTEND_URL=http://localhost:3000

# ===========================================
# Producao (adicionar quando for deploy)
# ===========================================
# NODE_ENV=production
# SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Gerar Chaves JWT

```bash
# JWT_SECRET
openssl rand -base64 32

# JWT_REFRESH_SECRET
openssl rand -base64 32
```

### Gerar API Key da Evolution

```bash
# Gerar uma chave aleatoria
openssl rand -hex 32
```

---

## Deploy em Producao

### Requisitos do Servidor

| Recurso | Minimo | Recomendado |
|---------|--------|-------------|
| vCPUs | 2 | 4 |
| RAM | 4GB | 8GB |
| Disco | 40GB SSD | 80GB SSD |
| SO | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

### 1. Preparar Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo apt install docker-compose-plugin

# Relogar para aplicar grupo docker
exit
# Conectar novamente
```

### 2. Clonar Projeto

```bash
git clone https://github.com/seu-usuario/bela360.git
cd bela360
```

### 3. Configurar Ambiente

```bash
cp .env.example .env
nano .env
```

Configurar com valores de producao:

```env
NODE_ENV=production
POSTGRES_PASSWORD=senha_muito_forte_producao
JWT_SECRET=chave_unica_producao
FRONTEND_URL=https://seu-dominio.com
NEXT_PUBLIC_API_URL=https://seu-dominio.com/api
EVOLUTION_PUBLIC_URL=https://seu-dominio.com/evolution
```

### 4. Configurar SSL (Certificados)

```bash
# Criar diretorio para certificados
mkdir -p docker/nginx/certs

# Opcao 1: Usar Certbot (Let's Encrypt)
sudo apt install certbot
sudo certbot certonly --standalone -d seu-dominio.com

# Copiar certificados
sudo cp /etc/letsencrypt/live/seu-dominio.com/fullchain.pem docker/nginx/certs/
sudo cp /etc/letsencrypt/live/seu-dominio.com/privkey.pem docker/nginx/certs/
```

### 5. Build e Deploy

```bash
# Build das imagens
docker-compose -f docker-compose.prod.yml build

# Subir todos os servicos
docker-compose -f docker-compose.prod.yml up -d

# Verificar status
docker-compose -f docker-compose.prod.yml ps

# Rodar migrations
docker-compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
```

### 6. Verificar Logs

```bash
# Todos os servicos
docker-compose -f docker-compose.prod.yml logs -f

# Servico especifico
docker-compose -f docker-compose.prod.yml logs -f api
```

### 7. Configurar Renovacao Automatica de SSL

```bash
# Adicionar ao crontab
sudo crontab -e

# Adicionar linha:
0 0 1 * * certbot renew --quiet && docker-compose -f /path/to/bela360/docker-compose.prod.yml restart nginx
```

---

## Conectar WhatsApp

### Via Dashboard

1. Acesse `/whatsapp` no sistema
2. Clique em "Conectar WhatsApp"
3. Escaneie o QR Code com o WhatsApp do celular
4. Aguarde a confirmacao de conexao

### Via Evolution Manager

1. Acesse `https://seu-dominio.com/evolution` (ou `http://localhost:8080`)
2. Faca login com a API Key configurada
3. Crie uma nova instancia com nome `bela360`
4. Escaneie o QR Code
5. Configure o webhook: `http://api:3001/api/webhooks/whatsapp`

### Eventos de Webhook

| Evento | Descricao |
|--------|-----------|
| `MESSAGES_UPSERT` | Nova mensagem recebida |
| `MESSAGES_UPDATE` | Mensagem atualizada (lida, entregue) |
| `CONNECTION_UPDATE` | Mudanca no status da conexao |
| `QRCODE_UPDATED` | Novo QR Code gerado |

### Testar Envio

```bash
# Via curl
curl -X POST http://localhost:3001/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "number": "5511999999999",
    "text": "Teste de mensagem do Bela360!"
  }'
```

---

## API Endpoints

### Autenticacao

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | `/api/auth/register` | Registrar novo usuario |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/refresh` | Renovar token |
| GET | `/api/auth/me` | Usuario atual |

### Negocios

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | `/api/businesses` | Criar negocio |
| GET | `/api/businesses/:id` | Detalhes do negocio |
| PUT | `/api/businesses/:id` | Atualizar negocio |

### Clientes

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/clients` | Listar clientes |
| POST | `/api/clients` | Criar cliente |
| GET | `/api/clients/:id` | Detalhes do cliente |
| PUT | `/api/clients/:id` | Atualizar cliente |
| DELETE | `/api/clients/:id` | Remover cliente |
| GET | `/api/clients/:id/history` | Historico de atendimentos |

### Agendamentos

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/appointments` | Listar agendamentos |
| POST | `/api/appointments` | Criar agendamento |
| GET | `/api/appointments/:id` | Detalhes |
| PUT | `/api/appointments/:id` | Atualizar |
| DELETE | `/api/appointments/:id` | Cancelar |
| POST | `/api/appointments/:id/confirm` | Confirmar |
| POST | `/api/appointments/:id/complete` | Concluir |
| POST | `/api/appointments/:id/no-show` | Marcar falta |

### Servicos

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/services` | Listar servicos |
| POST | `/api/services` | Criar servico |
| PUT | `/api/services/:id` | Atualizar servico |
| DELETE | `/api/services/:id` | Remover servico |

### Profissionais

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/professionals` | Listar profissionais |
| POST | `/api/professionals` | Criar profissional |
| GET | `/api/professionals/:id` | Detalhes |
| PUT | `/api/professionals/:id` | Atualizar |
| GET | `/api/professionals/:id/schedule` | Agenda do profissional |

### WhatsApp

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | `/api/whatsapp/instance` | Criar instancia |
| GET | `/api/whatsapp/instance` | Status da instancia |
| GET | `/api/whatsapp/qrcode` | Obter QR Code |
| POST | `/api/whatsapp/send` | Enviar mensagem |
| POST | `/api/webhooks/whatsapp` | Webhook de recebimento |

### Financeiro

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/finance/summary` | Resumo financeiro |
| GET | `/api/finance/transactions` | Listar transacoes |
| POST | `/api/finance/transactions` | Nova transacao |
| GET | `/api/finance/commissions` | Comissoes |

### Marketing

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/campaigns` | Listar campanhas |
| POST | `/api/campaigns` | Criar campanha |
| POST | `/api/campaigns/:id/send` | Disparar campanha |
| GET | `/api/campaigns/:id/stats` | Estatisticas |

---

## Comandos Uteis

### Desenvolvimento

```bash
pnpm dev              # Iniciar API e Web
pnpm dev:api          # Apenas API
pnpm dev:web          # Apenas Web
```

### Build

```bash
pnpm build            # Build completo
pnpm build:api        # Build API
pnpm build:web        # Build Web
```

### Database

```bash
pnpm db:migrate       # Rodar migrations
pnpm db:generate      # Gerar Prisma Client
pnpm db:studio        # Abrir Prisma Studio (GUI)
pnpm db:seed          # Popular banco
pnpm db:reset         # Reset completo
```

### Testes

```bash
pnpm test             # Todos os testes
pnpm test:api         # Testes da API
```

### Lint e Formatacao

```bash
pnpm lint             # Verificar linting
pnpm lint:fix         # Corrigir linting
pnpm format           # Formatar codigo
```

### Docker

```bash
pnpm docker:dev       # Subir containers dev
pnpm docker:stop      # Parar containers
pnpm docker:logs      # Ver logs
```

### Producao

```bash
# Build
docker-compose -f docker-compose.prod.yml build

# Subir
docker-compose -f docker-compose.prod.yml up -d

# Parar
docker-compose -f docker-compose.prod.yml down

# Logs
docker-compose -f docker-compose.prod.yml logs -f

# Migrations
docker-compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
```

---

## Troubleshooting

### Container nao inicia

```bash
# Ver logs detalhados
docker-compose -f docker-compose.prod.yml logs api

# Verificar saude dos containers
docker-compose -f docker-compose.prod.yml ps

# Reiniciar container especifico
docker-compose -f docker-compose.prod.yml restart api
```

### Erro de conexao com banco

```bash
# Verificar se PostgreSQL esta rodando
docker-compose -f docker-compose.prod.yml exec postgres pg_isready

# Testar conexao
docker-compose -f docker-compose.prod.yml exec api npx prisma db pull

# Ver logs do PostgreSQL
docker-compose -f docker-compose.prod.yml logs postgres
```

### WhatsApp nao conecta

1. Verificar se Evolution API esta saudavel:
   ```bash
   curl http://localhost:8080
   ```

2. Conferir API Key nas variaveis de ambiente

3. Verificar logs:
   ```bash
   docker logs bela360-evolution
   ```

4. Tentar reconectar via QR Code

5. Verificar se webhook esta configurado:
   ```bash
   curl -X GET "http://localhost:8080/instance/connectionState/bela360" \
     -H "apikey: SUA_API_KEY"
   ```

### Erro de CORS

Em producao, verificar se `FRONTEND_URL` esta correto no `.env`.

```env
FRONTEND_URL=https://seu-dominio-correto.com
```

### Memoria insuficiente

Se containers estiverem reiniciando, pode ser falta de memoria:

```bash
# Ver uso de memoria
docker stats

# Aumentar limites no docker-compose.prod.yml se necessario
```

### Certificado SSL expirado

```bash
# Renovar certificado
sudo certbot renew

# Copiar novos certificados
sudo cp /etc/letsencrypt/live/seu-dominio.com/fullchain.pem docker/nginx/certs/
sudo cp /etc/letsencrypt/live/seu-dominio.com/privkey.pem docker/nginx/certs/

# Reiniciar nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

---

## Status do Projeto

### Implementado (~70%)

- [x] Dashboard com KPIs
- [x] Agenda visual por profissional
- [x] CRM de clientes
- [x] Cadastro de servicos
- [x] Integracao WhatsApp (Evolution API)
- [x] Gestao financeira
- [x] Controle de estoque
- [x] Programa de fidelidade
- [x] Lista de espera
- [x] Marketing/Campanhas
- [x] Configuracoes do negocio

### Em Desenvolvimento (~25%)

- [ ] Conexao frontend-backend (mock data → APIs reais)
- [ ] Autenticacao completa (JWT funcionando)
- [ ] Automacoes agendadas (BullMQ)
- [ ] Webhooks de WhatsApp

### Pendente (~5%)

- [ ] App mobile (React Native)
- [ ] Integracao pagamentos (Stripe/PagSeguro)
- [ ] Relatorios exportaveis (PDF/Excel)

---

## Licenca

Este projeto esta sob a licenca MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## Contribuindo

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudancas (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

---

## Suporte

- **Issues**: [GitHub Issues](https://github.com/seu-usuario/bela360/issues)
- **Documentacao**: [docs/](./docs/)

---

## Links Uteis

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Evolution API Documentation](https://doc.evolution-api.com/)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)

---

**Desenvolvido para o mercado de beleza brasileiro**

*Ultima atualizacao: Janeiro 2026*
