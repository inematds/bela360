# Epic 4: Client Management (CRM)

**Status:** Ready for Development
**Priority:** P1 - High
**Estimated Stories:** 4

## Epic Goal

Permitir gestão de clientes com histórico de atendimentos, observações e busca.

## Prerequisites

- Epic 2 completado (clientes já sendo criados via agendamento)

## Dependencies

- Sistema de agendamentos funcionando
- Clientes sendo criados automaticamente

---

## Story 4.1: Client Auto-Registration

**Status:** Ready
**Priority:** P0
**Complexity:** Low

### User Story

**As a** system,
**I want** to auto-register clients when they book,
**so that** I have their information for future use.

### Acceptance Criteria

1. Ao criar agendamento, verificar se cliente existe (por phone + businessId)
2. Se não existe:
   - Bot pergunta: "Qual seu nome?"
   - Cliente responde
   - Criar registro com phone e name
3. Se já existe:
   - Usar cliente existente
   - Atualizar lastVisit
4. Vincular agendamento ao cliente
5. Dados mínimos: phone, name, createdAt

### Technical Notes

- Phone normalizado (apenas números, com código país)
- Unique constraint: (businessId, phone)
- Nome pode ser atualizado depois

### Definition of Done

- [ ] Cliente criado automaticamente se novo
- [ ] Bot pergunta nome corretamente
- [ ] Cliente existente é reutilizado
- [ ] lastVisit atualizado

---

## Story 4.2: Client List & Search

**Status:** Ready
**Priority:** P1
**Complexity:** Medium

### User Story

**As a** business owner,
**I want** to see and search my clients,
**so that** I can find their information quickly.

### Acceptance Criteria

1. Página `/clientes` com lista de clientes
2. Cada item mostra:
   - Nome
   - Telefone (formatado)
   - Última visita (há X dias)
   - Tags (badges)
3. Campo de busca no topo:
   - Busca por nome (parcial, case insensitive)
   - Busca por telefone (parcial)
4. Ordenação:
   - Alfabética (A-Z)
   - Por última visita (mais recente primeiro)
5. Paginação ou infinite scroll
6. Contador total de clientes
7. API GET `/api/clients?search=&sort=&page=`

### Technical Notes

- Busca com ILIKE no PostgreSQL
- Debounce no input de busca (300ms)
- Limite 20 por página
- Lazy loading para listas grandes

### Definition of Done

- [ ] Lista de clientes renderiza
- [ ] Busca funciona em tempo real
- [ ] Ordenação funciona
- [ ] Paginação/scroll infinito funciona

---

## Story 4.3: Client Profile & History

**Status:** Ready
**Priority:** P1
**Complexity:** Medium

### User Story

**As a** business owner,
**I want** to see a client's history,
**so that** I can personalize the service.

### Acceptance Criteria

1. Página `/clientes/[id]` com perfil completo
2. Seção de informações:
   - Nome (editável)
   - Telefone (apenas visualização)
   - Data de cadastro
   - Membro há X dias/meses
3. Seção de estatísticas:
   - Total de visitas
   - Total de no-shows
   - Última visita
   - Serviço mais frequente
4. Seção de histórico:
   - Lista de agendamentos passados
   - Cada item: data, serviço, status
   - Ordenado do mais recente
5. Botão para iniciar conversa no WhatsApp
6. API GET `/api/clients/:id`
7. API GET `/api/clients/:id/appointments`

### Technical Notes

- Deep link para WhatsApp: `https://wa.me/55...`
- Estatísticas calculadas em tempo real ou cacheadas
- Histórico paginado

### Definition of Done

- [ ] Perfil do cliente renderiza
- [ ] Estatísticas calculadas corretamente
- [ ] Histórico mostra agendamentos
- [ ] Botão WhatsApp funciona

---

## Story 4.4: Client Notes & Tags

**Status:** Ready
**Priority:** P2
**Complexity:** Low

### User Story

**As a** business owner,
**I want** to add notes and tags to clients,
**so that** I remember important details.

### Acceptance Criteria

1. Campo de observações no perfil do cliente:
   - Textarea com auto-save
   - Placeholder: "Ex: Alérgica a amônia, prefere café..."
2. Sistema de tags:
   - Tags pré-definidas: VIP, Novo, Fiel, Problemático
   - Adicionar/remover com clique
   - Visual de badges coloridos
3. Tags customizáveis:
   - Botão "Nova tag"
   - Input para nome
   - Tags salvas por business
4. Filtro de clientes por tag na lista
5. Notas visíveis no card de agendamento do dashboard
6. API PATCH `/api/clients/:id` para notes e tags

### Technical Notes

- Tags como array de strings no campo tags
- Tags customizadas em tabela separada ou config do business
- Auto-save com debounce (1s)

### Definition of Done

- [ ] Observações salvam automaticamente
- [ ] Tags pré-definidas funcionam
- [ ] Tags customizáveis funcionam
- [ ] Filtro por tag funciona
- [ ] Notas aparecem no dashboard

---

## Epic Completion Checklist

- [ ] Todas as 4 stories completadas
- [ ] Clientes criados automaticamente
- [ ] Lista com busca e filtros funciona
- [ ] Perfil com histórico completo
- [ ] Sistema de notas e tags funcional
