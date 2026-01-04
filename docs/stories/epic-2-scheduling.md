# Epic 2: Scheduling Core

**Status:** Ready for Development
**Priority:** P0 - Critical
**Estimated Stories:** 6

## Epic Goal

Implementar o sistema central de agendamentos, permitindo que profissionais configurem seus serviços e horários, e que clientes agendem via WhatsApp.

## Prerequisites

- Epic 1 completado (Auth, WhatsApp, Database)

## Dependencies

- Evolution API funcionando
- Database com schema de agendamentos
- Sistema de autenticação

---

## Story 2.1: Business Profile Setup

**Status:** Ready
**Priority:** P0
**Complexity:** Medium

### User Story

**As a** business owner,
**I want** to configure my business profile,
**so that** clients can see my information.

### Acceptance Criteria

1. Página `/config/perfil` com formulário:
   - Nome do negócio (obrigatório)
   - Endereço (opcional)
   - Foto/logo (upload, opcional)
2. Configuração de horário de funcionamento:
   - Seleção de dias da semana
   - Hora de início e fim para cada dia
   - Intervalo de almoço (opcional)
3. Definição de intervalo entre agendamentos (15, 30, 45, 60 min)
4. API PATCH `/api/business` para atualizar
5. Dados persistidos e carregados no login

### Technical Notes

- Upload de imagem para storage (Supabase Storage ou S3)
- Working hours como JSON no banco
- Validação de horários (início < fim)

### Definition of Done

- [ ] Formulário de perfil funciona
- [ ] Upload de imagem funciona
- [ ] Horários salvam corretamente
- [ ] Dados carregam ao acessar página

---

## Story 2.2: Service Catalog Management

**Status:** Ready
**Priority:** P0
**Complexity:** Medium

### User Story

**As a** business owner,
**I want** to manage my services catalog,
**so that** clients know what I offer.

### Acceptance Criteria

1. Página `/config/servicos` com lista de serviços
2. Modal/form para adicionar serviço:
   - Nome (obrigatório)
   - Descrição (opcional)
   - Duração em minutos (obrigatório, mínimo 15)
   - Preço em R$ (obrigatório)
3. Editar serviço existente
4. Ativar/desativar serviço (toggle)
5. Reordenar serviços (drag-and-drop ou botões)
6. API CRUD `/api/services`

### Technical Notes

- Soft delete (campo active)
- Ordem salva como campo sort_order
- Preço como decimal (2 casas)

### Definition of Done

- [ ] CRUD completo de serviços
- [ ] Lista ordenável
- [ ] Toggle ativo/inativo funciona
- [ ] Validações funcionam

---

## Story 2.3: Calendar & Availability

**Status:** Ready
**Priority:** P0
**Complexity:** High

### User Story

**As a** business owner,
**I want** to see and manage my calendar,
**so that** I know my schedule and can block times.

### Acceptance Criteria

1. Página `/agenda` com visualização diária
   - Slots de tempo baseados no intervalo configurado
   - Cores diferentes: disponível, ocupado, bloqueado
2. Navegação entre dias (anterior/próximo, datepicker)
3. Visualização semanal alternativa
4. Ação de bloquear horário:
   - Selecionar slot
   - Adicionar motivo (opcional)
   - Salvar bloqueio
5. Desbloquear horário bloqueado
6. API GET `/api/availability?date=YYYY-MM-DD`
7. API POST/DELETE `/api/blocked-slots`

### Technical Notes

- Slots gerados dinamicamente baseado em working hours
- Considerar duração dos serviços para ocupação
- Timezone: sempre São Paulo (America/Sao_Paulo)

### Definition of Done

- [ ] Visualização diária funciona
- [ ] Visualização semanal funciona
- [ ] Bloqueio de horário funciona
- [ ] Desbloqueio funciona
- [ ] Navegação entre datas funciona

---

## Story 2.4: WhatsApp Booking Bot - Flow Design

**Status:** Ready
**Priority:** P0
**Complexity:** High

### User Story

**As a** client,
**I want** to book an appointment via WhatsApp,
**so that** I can schedule without calling.

### Acceptance Criteria

1. Cliente envia qualquer mensagem, bot responde com menu:
   ```
   Olá! Bem-vindo ao [Nome do Negócio]!

   O que você gostaria de fazer?
   1. Agendar um horário
   2. Ver meus agendamentos
   3. Falar com atendente

   Digite o número da opção.
   ```
2. Opção 1 - Agendar:
   - Bot lista serviços ativos numerados
   - Cliente digita número
   - Bot mostra próximos 5 horários disponíveis
   - Cliente escolhe horário
   - Bot pede nome (se cliente novo)
   - Bot confirma agendamento
3. Opção 2 - Ver agendamentos:
   - Lista próximos agendamentos do cliente
   - Opção de cancelar
4. Opção 3 - Atendente:
   - Notifica profissional no dashboard
5. Timeout de 5 min retorna ao menu

### Technical Notes

- State machine para fluxo conversacional
- Estado por sessão (phone + businessId) em Redis
- Mensagens em português coloquial
- Lidar com respostas inesperadas

### Definition of Done

- [ ] Fluxo de agendamento completo funciona
- [ ] Consulta de agendamentos funciona
- [ ] Cancelamento via bot funciona
- [ ] Timeout reseta conversa
- [ ] Mensagens de erro amigáveis

---

## Story 2.5: Appointment Creation & Storage

**Status:** Ready
**Priority:** P0
**Complexity:** Medium

### User Story

**As a** system,
**I want** to persist appointments correctly,
**so that** the schedule is always accurate.

### Acceptance Criteria

1. Modelo Appointment com campos:
   - businessId, clientId, serviceId, datetime
   - status: scheduled, confirmed, completed, cancelled, no_show
   - notes (opcional)
   - createdAt, confirmedAt
2. Validações ao criar:
   - Horário não pode estar ocupado
   - Horário dentro do expediente
   - Serviço deve estar ativo
   - Duração do serviço não pode sobrepor próximo agendamento
3. Cliente criado automaticamente se novo (phone + name)
4. Notificação WhatsApp ao profissional: "Novo agendamento!"
5. API POST `/api/appointments`

### Technical Notes

- Transação para criar appointment + client
- Lock otimista para evitar conflitos
- Trigger de notificação assíncrono

### Definition of Done

- [ ] Appointment salvo corretamente
- [ ] Validações impedem conflitos
- [ ] Cliente criado se necessário
- [ ] Profissional notificado

---

## Story 2.6: Appointment List for Professional

**Status:** Ready
**Priority:** P0
**Complexity:** Medium

### User Story

**As a** business owner,
**I want** to see today's appointments,
**so that** I can prepare for my clients.

### Acceptance Criteria

1. Dashboard principal (`/`) mostra:
   - Resumo: X agendamentos hoje, próximo às HH:MM
   - Lista de agendamentos do dia em cards
2. Card de agendamento exibe:
   - Horário
   - Nome do cliente
   - Serviço
   - Status (badge colorido)
3. Ações rápidas em cada card:
   - Confirmar (se scheduled)
   - Marcar como concluído
   - Marcar como no-show
   - Cancelar
4. Filtro por status
5. Pull-to-refresh ou atualização automática

### Technical Notes

- API GET `/api/appointments?date=today&status=all`
- Otimizar para mobile (cards empilhados)
- Atualização via polling (30s) ou WebSocket

### Definition of Done

- [ ] Dashboard mostra agendamentos do dia
- [ ] Cards com informações corretas
- [ ] Ações de status funcionam
- [ ] Filtro funciona
- [ ] Atualiza sem recarregar página

---

## Epic Completion Checklist

- [ ] Todas as 6 stories completadas
- [ ] Cliente consegue agendar via WhatsApp
- [ ] Profissional vê agenda no dashboard
- [ ] Bloqueio de horários funciona
- [ ] Notificações de novo agendamento funcionam
