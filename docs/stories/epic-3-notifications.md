# Epic 3: Notifications & Reminders

**Status:** Ready for Development
**Priority:** P0 - Critical
**Estimated Stories:** 5

## Epic Goal

Sistema de notificações automáticas - confirmações, lembretes e alertas de no-show via WhatsApp.

## Prerequisites

- Epic 2 completado (Scheduling Core)
- BullMQ/Redis configurado
- WhatsApp integration funcionando

## Dependencies

- Sistema de filas operacional
- Cron jobs ou scheduled tasks

---

## Story 3.1: Confirmation Message

**Status:** Ready
**Priority:** P0
**Complexity:** Low

### User Story

**As a** client,
**I want** to receive a confirmation after booking,
**so that** I know my appointment is scheduled.

### Acceptance Criteria

1. Imediatamente após criar agendamento, envia mensagem:
   ```
   Agendamento confirmado!

   Serviço: [Nome do Serviço]
   Data: [DD/MM/YYYY]
   Horário: [HH:MM]
   Local: [Endereço do negócio]

   Para cancelar, responda CANCELAR.

   Até lá!
   ```
2. Mensagem usa dados reais do agendamento
3. Log de notificação criado (type: confirmation, status: sent)
4. Se falhar envio, registra como failed e tenta novamente

### Technical Notes

- Envio síncrono (não precisa de queue para confirmação)
- Retry via exponential backoff (3 tentativas)
- Template pode ser customizável no futuro

### Definition of Done

- [ ] Mensagem enviada após agendamento
- [ ] Dados corretos na mensagem
- [ ] Log de notificação criado
- [ ] Falhas são registradas

---

## Story 3.2: 24h Reminder

**Status:** Ready
**Priority:** P0
**Complexity:** Medium

### User Story

**As a** client,
**I want** to receive a reminder 24 hours before,
**so that** I don't forget my appointment.

### Acceptance Criteria

1. Job scheduler roda a cada hora
2. Busca agendamentos com datetime entre 23h e 25h no futuro
3. Envia lembrete:
   ```
   Lembrete: você tem um agendamento amanhã!

   Serviço: [Nome do Serviço]
   Horário: [HH:MM]

   Não esqueça!
   ```
4. Não envia se agendamento já cancelado
5. Não envia se lembrete 24h já foi enviado (idempotência)
6. Log de notificação criado

### Technical Notes

- BullMQ repeatable job (cron: '0 * * * *')
- Query: datetime BETWEEN NOW()+23h AND NOW()+25h
- Check notification já existe para esse appointment + type

### Definition of Done

- [ ] Job scheduler configurado
- [ ] Lembretes enviados 24h antes
- [ ] Não duplica mensagens
- [ ] Skip agendamentos cancelados

---

## Story 3.3: 2h Confirmation Request

**Status:** Ready
**Priority:** P0
**Complexity:** High

### User Story

**As a** business owner,
**I want** to confirm attendance 2 hours before,
**so that** I can fill the slot if client cancels.

### Acceptance Criteria

1. Job roda a cada 15 minutos
2. Busca agendamentos com datetime entre 1h45min e 2h15min no futuro
3. Envia pedido de confirmação:
   ```
   Seu horário é em 2 horas!

   Serviço: [Serviço] às [HH:MM]

   Você confirma presença?
   1. Sim, vou comparecer
   2. Preciso cancelar

   Responda com o número.
   ```
4. Se cliente responde "1" ou variações (sim, vou, confirmo):
   - Status atualizado para 'confirmed'
   - Mensagem: "Confirmado! Até logo."
   - Profissional notificado
5. Se cliente responde "2" ou variações (não, cancelar):
   - Status atualizado para 'cancelled'
   - Slot liberado
   - Mensagem: "Cancelado. Esperamos você em outra oportunidade!"
   - Profissional notificado
6. Timeout 30 min sem resposta: status permanece 'scheduled'

### Technical Notes

- State machine para aguardar resposta
- Timeout via delayed job
- Respostas flexíveis (1, sim, vou, confirmo, etc)

### Definition of Done

- [ ] Mensagem de confirmação enviada 2h antes
- [ ] Resposta "sim" confirma agendamento
- [ ] Resposta "cancelar" cancela e libera slot
- [ ] Profissional notificado das mudanças
- [ ] Timeout funciona corretamente

---

## Story 3.4: No-Show Detection & Notification

**Status:** Ready
**Priority:** P1
**Complexity:** Medium

### User Story

**As a** business owner,
**I want** to be notified of no-shows,
**so that** I can manage my time.

### Acceptance Criteria

1. Job roda a cada 15 minutos
2. Busca agendamentos:
   - Status: 'scheduled' ou 'confirmed'
   - datetime entre 30min e 45min no passado
3. Envia notificação ao profissional via WhatsApp:
   ```
   O cliente [Nome] não compareceu ao agendamento das [HH:MM].

   1. Confirmar no-show
   2. Cliente está aqui

   Responda com o número.
   ```
4. Se profissional responde "1":
   - Status atualizado para 'no_show'
   - Incrementa contador de no-show do cliente
5. Se responde "2":
   - Status atualizado para 'completed'

### Technical Notes

- Profissional recebe mensagem no mesmo WhatsApp
- Resposta via bot flow (contexto: noshow_check)
- Histórico de no-shows no cliente para analytics

### Definition of Done

- [ ] Detecção de possíveis no-shows funciona
- [ ] Profissional recebe notificação
- [ ] Respostas atualizam status corretamente
- [ ] Contador de no-show atualizado

---

## Story 3.5: Queue System for Messages

**Status:** Ready
**Priority:** P0
**Complexity:** High

### User Story

**As a** developer,
**I want** a reliable message queue,
**so that** notifications are delivered even under load.

### Acceptance Criteria

1. BullMQ configurado com Redis (Upstash)
2. Filas separadas:
   - `notifications:confirmation`
   - `notifications:reminder`
   - `notifications:alert`
3. Workers processam jobs assincronamente
4. Dashboard Bull Board em `/admin/queues` (protegido)
5. Dead letter queue para falhas após 3 tentativas
6. Rate limiting: máximo 60 mensagens/minuto
7. Logs de processamento

### Technical Notes

- BullMQ 5.x
- Redis connection via Upstash
- Bull Board para visualização
- Backoff exponencial para retries

### Definition of Done

- [ ] Filas criadas e funcionando
- [ ] Workers processam jobs
- [ ] Bull Board acessível
- [ ] DLQ captura falhas
- [ ] Rate limit funciona

---

## Epic Completion Checklist

- [ ] Todas as 5 stories completadas
- [ ] Confirmações enviadas imediatamente
- [ ] Lembretes 24h funcionando
- [ ] Confirmação 2h com resposta funciona
- [ ] No-shows detectados e notificados
- [ ] Sistema de filas robusto
