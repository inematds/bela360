# bela360 - Product Requirements Document (PRD)

## Goals and Background Context

### Goals

- Automatizar o fluxo completo de agendamento para negócios de beleza via WhatsApp
- Reduzir no-shows (faltas) em pelo menos 50% através de lembretes automáticos
- Permitir que donos de negócio economizem 10+ horas/semana em tarefas administrativas
- Oferecer MVP gratuito que gere valor percebido em menos de 7 dias
- Criar base para modelo freemium escalável

### Background Context

O mercado de beleza no Brasil é fragmentado, com milhões de pequenos negócios operando de forma manual. WhatsApp é o canal dominante de comunicação, mas usado de forma desorganizada. Soluções existentes são caras, complexas e ignoram a realidade mobile-first dos profissionais. O bela360 resolve isso com automação inteligente via WhatsApp, curva de aprendizado zero e custo inicial gratuito.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-01-04 | 0.1 | Versão inicial do PRD | BMad Orchestrator |

---

## Requirements

### Functional Requirements

**FR1:** O sistema deve permitir que clientes finais agendem serviços via chatbot WhatsApp, selecionando serviço, profissional e horário disponível.

**FR2:** O sistema deve exibir apenas horários disponíveis na agenda do profissional durante o processo de agendamento.

**FR3:** O sistema deve enviar confirmação automática via WhatsApp imediatamente após agendamento realizado.

**FR4:** O sistema deve enviar lembrete automático 24 horas antes do horário agendado.

**FR5:** O sistema deve enviar lembrete com opção de confirmação 2 horas antes do agendamento.

**FR6:** O sistema deve permitir que o cliente cancele ou reagende via WhatsApp respondendo ao lembrete.

**FR7:** O sistema deve notificar o profissional sobre novos agendamentos, cancelamentos e no-shows.

**FR8:** O sistema deve manter cadastro de clientes com nome, telefone, histórico de atendimentos e observações.

**FR9:** O sistema deve fornecer dashboard web responsivo para o profissional visualizar agenda do dia/semana.

**FR10:** O sistema deve permitir que o profissional bloqueie horários na agenda (folgas, almoço, etc).

**FR11:** O sistema deve permitir cadastro de serviços oferecidos com nome, duração e preço.

**FR12:** O sistema deve gerar relatórios básicos: agendamentos do período, taxa de no-show, clientes novos vs recorrentes.

**FR13:** O sistema deve permitir que o profissional configure horários de funcionamento (dias e horários).

**FR14:** O sistema deve permitir onboarding completo do negócio em menos de 15 minutos.

**FR15:** O sistema deve funcionar 24/7, permitindo agendamentos fora do horário comercial.

### Non-Functional Requirements

**NFR1:** O sistema deve responder a mensagens do WhatsApp em menos de 3 segundos.

**NFR2:** O dashboard web deve carregar em menos de 2 segundos em conexões 4G.

**NFR3:** O sistema deve ter disponibilidade de 99.5% (downtime máximo de ~3.6h/mês).

**NFR4:** O sistema deve ser compatível com LGPD, com opção de exclusão de dados do cliente.

**NFR5:** O sistema deve usar free tiers de cloud sempre que possível para minimizar custos.

**NFR6:** O sistema deve suportar pelo menos 100 negócios simultâneos no MVP.

**NFR7:** O sistema deve ser mobile-first, com todas as funcionalidades acessíveis via smartphone.

**NFR8:** O sistema deve ter interface em português brasileiro.

**NFR9:** O sistema deve manter logs de auditoria de todas as ações críticas (agendamentos, cancelamentos).

**NFR10:** O sistema deve ter backup automático diário dos dados.

---

## User Interface Design Goals

### Overall UX Vision

Interface minimalista, mobile-first, com foco em ações rápidas. O profissional deve conseguir ver a agenda do dia e agir (confirmar, cancelar, bloquear horário) em no máximo 3 toques. Visual limpo, cores neutras com acentos em roxo/rosa (remetendo ao universo da beleza).

### Key Interaction Paradigms

- **Dashboard único:** Tudo que importa em uma tela
- **Cards de agendamento:** Visualização rápida com ações inline
- **Bottom navigation:** Navegação mobile-friendly
- **Pull-to-refresh:** Atualização natural
- **Skeleton loading:** Feedback visual durante carregamento

### Core Screens and Views

1. **Tela de Login/Onboarding** - Cadastro simplificado via WhatsApp
2. **Dashboard Principal** - Agenda do dia com próximos agendamentos
3. **Agenda Semanal** - Visualização calendário da semana
4. **Lista de Clientes** - CRM básico com busca
5. **Perfil do Cliente** - Histórico e observações
6. **Configurações** - Serviços, horários, preferências
7. **Relatórios** - Métricas básicas do negócio

### Accessibility

WCAG AA - Garantir contraste adequado, navegação por teclado, labels em formulários.

### Branding

- **Cores principais:** Roxo (#7C3AED), Rosa (#EC4899), Branco (#FFFFFF)
- **Tipografia:** Inter ou similar (moderna, legível)
- **Ícones:** Linha fina, estilo minimalista
- **Tom:** Profissional mas acolhedor, sem ser infantil

### Target Devices and Platforms

Web Responsive - Mobile-first, mas funcional em desktop. Foco em smartphones Android e iOS via browser.

---

## Technical Assumptions

### Repository Structure

**Monorepo** - Simplicidade para MVP com frontend e backend no mesmo repositório. Estrutura sugerida:

```
/bela360
├── /apps
│   ├── /web          # Frontend Next.js
│   └── /api          # Backend Node.js
├── /packages
│   └── /shared       # Tipos e utilitários compartilhados
└── /infra            # IaC e configurações
```

### Service Architecture

**Monolito Modular** - Arquitetura monolítica com separação clara de módulos internos para facilitar futura extração para microserviços se necessário.

Módulos principais:
- **Auth:** Autenticação via WhatsApp
- **Scheduling:** Agendamentos e agenda
- **Notifications:** Mensagens WhatsApp
- **CRM:** Gestão de clientes
- **Analytics:** Métricas e relatórios

### Testing Requirements

- **Unit tests:** Cobertura mínima de 70% em lógica de negócio
- **Integration tests:** Fluxos críticos (agendamento, notificações)
- **E2E tests:** Fluxo principal de agendamento (Playwright)
- **Manual testing:** QA em dispositivos reais antes de releases

### Additional Technical Assumptions

- **WhatsApp API:** Usar Evolution API (open source) para MVP, migrar para Cloud API oficial se escalar
- **Database:** PostgreSQL hospedado em Supabase (free tier) ou Neon
- **Cache:** Redis para sessões e cache de disponibilidade
- **Queue:** Bull/BullMQ para processamento de mensagens assíncronas
- **Hosting:** Vercel (frontend) + Railway ou Render (backend)
- **Monitoramento:** Sentry para erros, Uptime Robot para disponibilidade
- **CI/CD:** GitHub Actions para deploy automático

---

## Epic List

### Epic 1: Foundation & Core Setup
**Goal:** Estabelecer infraestrutura base do projeto com autenticação via WhatsApp e primeira funcionalidade de saúde do sistema.

### Epic 2: Scheduling Core
**Goal:** Implementar o core de agendamentos - cadastro de serviços, agenda do profissional e fluxo de agendamento via WhatsApp.

### Epic 3: Notifications & Reminders
**Goal:** Sistema de notificações automáticas - confirmações, lembretes e alertas de no-show.

### Epic 4: Client Management (CRM)
**Goal:** Gestão de clientes com histórico, observações e busca.

### Epic 5: Analytics & Dashboard
**Goal:** Dashboard completo com métricas, relatórios e visão do negócio.

---

## Epic Details

---

## Epic 1: Foundation & Core Setup

**Goal:** Estabelecer a base técnica do projeto incluindo setup do monorepo, configuração de CI/CD, integração inicial com WhatsApp e autenticação. Entregar uma página de status funcional e login básico via WhatsApp.

### Story 1.1: Project Setup & Infrastructure

**As a** developer,
**I want** a properly configured monorepo with frontend and backend,
**so that** I can start building features on a solid foundation.

**Acceptance Criteria:**
1. Monorepo configurado com pnpm workspaces
2. Frontend Next.js 14+ com TypeScript configurado em /apps/web
3. Backend Node.js com TypeScript configurado em /apps/api
4. ESLint e Prettier configurados com regras consistentes
5. GitHub repository com branch protection em main
6. README com instruções de setup local
7. Scripts de dev, build e test funcionando

---

### Story 1.2: CI/CD Pipeline

**As a** developer,
**I want** automated testing and deployment,
**so that** changes are validated and deployed automatically.

**Acceptance Criteria:**
1. GitHub Actions workflow para CI (lint, type-check, tests)
2. Deploy automático do frontend para Vercel em push para main
3. Deploy automático do backend para Railway/Render em push para main
4. Status checks obrigatórios antes de merge
5. Notificação de falha de build no GitHub

---

### Story 1.3: Database Setup

**As a** developer,
**I want** a PostgreSQL database configured,
**so that** I can persist application data.

**Acceptance Criteria:**
1. PostgreSQL provisionado (Supabase ou Neon free tier)
2. Prisma ORM configurado com schema inicial
3. Migrations funcionando em ambiente local e produção
4. Seed script para dados de desenvolvimento
5. Variáveis de ambiente configuradas para diferentes ambientes

---

### Story 1.4: WhatsApp Integration Setup

**As a** developer,
**I want** WhatsApp messaging capability,
**so that** the system can send and receive messages.

**Acceptance Criteria:**
1. Evolution API ou WhatsApp Cloud API configurada
2. Webhook endpoint para receber mensagens
3. Função para enviar mensagens de texto simples
4. Health check da conexão WhatsApp
5. Logs de mensagens enviadas/recebidas
6. Documentação de setup do WhatsApp

---

### Story 1.5: Authentication via WhatsApp

**As a** business owner,
**I want** to login using my WhatsApp number,
**so that** I don't need to remember another password.

**Acceptance Criteria:**
1. Fluxo de login: usuário informa número WhatsApp
2. Sistema envia código de verificação via WhatsApp
3. Usuário insere código para autenticar
4. Sessão JWT criada com validade de 7 dias
5. Refresh token para renovação automática
6. Logout funcional

---

### Story 1.6: Health Check & Status Page

**As a** developer,
**I want** a health check endpoint and status page,
**so that** I can monitor system availability.

**Acceptance Criteria:**
1. Endpoint GET /health retornando status de serviços (DB, WhatsApp)
2. Página web simples mostrando status do sistema
3. Resposta em menos de 500ms
4. Integração com Uptime Robot ou similar para monitoramento

---

## Epic 2: Scheduling Core

**Goal:** Implementar o sistema central de agendamentos, permitindo que profissionais configurem seus serviços e horários, e que clientes agendem via WhatsApp.

### Story 2.1: Business Profile Setup

**As a** business owner,
**I want** to configure my business profile,
**so that** clients can see my information.

**Acceptance Criteria:**
1. Formulário de cadastro: nome do negócio, endereço, telefone
2. Upload de foto/logo do negócio
3. Configuração de horário de funcionamento (dias e horas)
4. Definição de intervalo entre agendamentos (ex: 30min)
5. Preview de como o perfil aparece para clientes
6. Dados persistidos no banco

---

### Story 2.2: Service Catalog Management

**As a** business owner,
**I want** to manage my services catalog,
**so that** clients know what I offer.

**Acceptance Criteria:**
1. CRUD de serviços (nome, descrição, duração, preço)
2. Ordenação de serviços por drag-and-drop
3. Ativar/desativar serviço sem deletar
4. Validação: nome obrigatório, duração mínima 15min
5. Lista de serviços visível no dashboard

---

### Story 2.3: Calendar & Availability

**As a** business owner,
**I want** to see and manage my calendar,
**so that** I know my schedule and can block times.

**Acceptance Criteria:**
1. Visualização de agenda diária com slots de tempo
2. Visualização semanal tipo calendário
3. Bloquear horário (folga, almoço, compromisso)
4. Desbloquear horário bloqueado
5. Indicação visual de slots ocupados vs disponíveis vs bloqueados
6. Pull-to-refresh para atualizar

---

### Story 2.4: WhatsApp Booking Bot - Flow Design

**As a** client,
**I want** to book an appointment via WhatsApp,
**so that** I can schedule without calling.

**Acceptance Criteria:**
1. Cliente inicia conversa, bot apresenta menu (Agendar, Ver agendamentos, Falar com humano)
2. Fluxo "Agendar": mostra serviços disponíveis como opções numeradas
3. Cliente seleciona serviço, bot mostra próximos 5 horários disponíveis
4. Cliente seleciona horário, bot confirma dados
5. Cliente confirma, agendamento é criado
6. Bot envia confirmação com detalhes e opção de cancelar
7. Timeout de 5 minutos de inatividade retorna ao menu

---

### Story 2.5: Appointment Creation & Storage

**As a** system,
**I want** to persist appointments correctly,
**so that** the schedule is always accurate.

**Acceptance Criteria:**
1. Modelo Appointment: clientId, serviceId, datetime, status, notes
2. Status possíveis: scheduled, confirmed, completed, cancelled, no-show
3. Validação: não permitir agendamento em horário já ocupado
4. Validação: respeitar horário de funcionamento
5. Validação: respeitar duração do serviço (não sobrepor)
6. Notificação ao profissional via WhatsApp de novo agendamento

---

### Story 2.6: Appointment List for Professional

**As a** business owner,
**I want** to see today's appointments,
**so that** I can prepare for my clients.

**Acceptance Criteria:**
1. Lista de agendamentos do dia no dashboard
2. Card de agendamento: hora, cliente, serviço, status
3. Ações rápidas: confirmar, cancelar, marcar como no-show
4. Filtro por status
5. Ordenação cronológica
6. Indicador de próximo agendamento

---

## Epic 3: Notifications & Reminders

**Goal:** Automatizar comunicação com clientes através de confirmações, lembretes e follow-ups via WhatsApp.

### Story 3.1: Confirmation Message

**As a** client,
**I want** to receive a confirmation after booking,
**so that** I know my appointment is scheduled.

**Acceptance Criteria:**
1. Mensagem enviada imediatamente após agendamento
2. Conteúdo: serviço, data, hora, endereço
3. Inclui link/código para cancelar se necessário
4. Template configurável pelo profissional
5. Log de mensagem enviada

---

### Story 3.2: 24h Reminder

**As a** client,
**I want** to receive a reminder 24 hours before,
**so that** I don't forget my appointment.

**Acceptance Criteria:**
1. Job agendado para enviar 24h antes do horário
2. Mensagem: lembrete do agendamento com detalhes
3. Não enviar se agendamento já cancelado
4. Log de envio
5. Retry em caso de falha (até 3 tentativas)

---

### Story 3.3: 2h Confirmation Request

**As a** business owner,
**I want** to confirm attendance 2 hours before,
**so that** I can fill the slot if client cancels.

**Acceptance Criteria:**
1. Mensagem 2h antes pedindo confirmação
2. Opções: "Confirmo" ou "Preciso cancelar"
3. Se confirma: status atualizado para "confirmed"
4. Se cancela: status atualizado, slot liberado
5. Se não responde: status permanece "scheduled"
6. Profissional recebe notificação de confirmação/cancelamento

---

### Story 3.4: No-Show Detection & Notification

**As a** business owner,
**I want** to be notified of no-shows,
**so that** I can manage my time.

**Acceptance Criteria:**
1. 30 minutos após horário do agendamento, verificar se foi marcado como completado
2. Se não, notificar profissional: "Cliente X não compareceu às HH:MM?"
3. Opções: "Não veio" ou "Está aqui"
4. Se "Não veio": marcar como no-show, registrar no histórico do cliente
5. Métricas de no-show atualizadas

---

### Story 3.5: Queue System for Messages

**As a** developer,
**I want** a reliable message queue,
**so that** notifications are delivered even under load.

**Acceptance Criteria:**
1. Bull/BullMQ configurado com Redis
2. Filas separadas: confirmations, reminders, alerts
3. Processamento assíncrono de mensagens
4. Dashboard de filas (Bull Board)
5. Dead letter queue para falhas
6. Rate limiting para respeitar limites do WhatsApp

---

## Epic 4: Client Management (CRM)

**Goal:** Permitir gestão de clientes com histórico de atendimentos, observações e busca.

### Story 4.1: Client Auto-Registration

**As a** system,
**I want** to auto-register clients when they book,
**so that** I have their information for future use.

**Acceptance Criteria:**
1. Cliente criado automaticamente no primeiro agendamento
2. Dados capturados: telefone WhatsApp, nome (perguntado pelo bot)
3. Vinculação automática de agendamentos ao cliente
4. Detecção de cliente existente pelo telefone

---

### Story 4.2: Client List & Search

**As a** business owner,
**I want** to see and search my clients,
**so that** I can find their information quickly.

**Acceptance Criteria:**
1. Lista de clientes com nome e telefone
2. Busca por nome ou telefone
3. Ordenação alfabética ou por última visita
4. Paginação ou infinite scroll
5. Contador de total de clientes

---

### Story 4.3: Client Profile & History

**As a** business owner,
**I want** to see a client's history,
**so that** I can personalize the service.

**Acceptance Criteria:**
1. Perfil do cliente: nome, telefone, data de cadastro
2. Histórico de agendamentos (serviço, data, status)
3. Contadores: total de visitas, no-shows, última visita
4. Campo de observações editável (ex: "alérgica a amônia")
5. Botão para iniciar conversa no WhatsApp

---

### Story 4.4: Client Notes & Tags

**As a** business owner,
**I want** to add notes and tags to clients,
**so that** I remember important details.

**Acceptance Criteria:**
1. Campo de observações com texto livre
2. Tags pré-definidas: VIP, Problemático, Novo, Fiel
3. Tags customizáveis pelo usuário
4. Filtro de clientes por tag
5. Notas visíveis no card de agendamento

---

## Epic 5: Analytics & Dashboard

**Goal:** Fornecer visão do negócio através de métricas, relatórios e insights acionáveis.

### Story 5.1: Dashboard Overview

**As a** business owner,
**I want** to see key metrics at a glance,
**so that** I understand my business performance.

**Acceptance Criteria:**
1. Cards de métricas: agendamentos hoje, semana, mês
2. Taxa de no-show do mês
3. Clientes novos vs recorrentes do mês
4. Próximos agendamentos do dia
5. Atualização automática a cada 5 minutos

---

### Story 5.2: Appointment Statistics

**As a** business owner,
**I want** to see appointment trends,
**so that** I can optimize my schedule.

**Acceptance Criteria:**
1. Gráfico de agendamentos por dia (últimos 30 dias)
2. Breakdown por status (completados, cancelados, no-shows)
3. Horários mais populares
4. Serviços mais agendados
5. Filtro por período

---

### Story 5.3: Client Analytics

**As a** business owner,
**I want** to understand my client base,
**so that** I can improve retention.

**Acceptance Criteria:**
1. Total de clientes ativos (agendaram nos últimos 60 dias)
2. Novos clientes por mês
3. Taxa de retorno (clientes que voltaram)
4. Top 10 clientes por número de visitas
5. Clientes que não voltaram há mais de 30 dias

---

### Story 5.4: Revenue Insights (Basic)

**As a** business owner,
**I want** to estimate my revenue,
**so that** I can track my earnings.

**Acceptance Criteria:**
1. Faturamento estimado (baseado em preço dos serviços agendados)
2. Breakdown por serviço
3. Comparativo mês anterior
4. Nota: "Estimativa baseada em agendamentos completados"
5. Filtro por período

---

### Story 5.5: Export & Reports

**As a** business owner,
**I want** to export my data,
**so that** I can analyze offline or share.

**Acceptance Criteria:**
1. Exportar agendamentos do período (CSV)
2. Exportar lista de clientes (CSV)
3. Relatório mensal resumido (PDF)
4. Envio do relatório por e-mail ou WhatsApp
5. Histórico de relatórios gerados

---

## Checklist Results Report

*A ser preenchido após execução do checklist PM.*

---

## Next Steps

### UX Expert Prompt

> Revise o PRD do bela360 e crie wireframes de baixa fidelidade para as Core Screens definidas. Foque em mobile-first e fluxos de no máximo 3 toques para ações principais. Considere as limitações de usuários com baixa familiaridade tecnológica.

### Architect Prompt

> Com base neste PRD, crie a arquitetura técnica do bela360. Defina: estrutura do monorepo, schema do banco de dados, design de APIs, integração WhatsApp, e infraestrutura. Priorize free tiers e simplicidade para MVP.
