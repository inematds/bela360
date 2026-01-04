# Epic 5: Analytics & Dashboard

**Status:** Ready for Development
**Priority:** P1 - High
**Estimated Stories:** 5

## Epic Goal

Fornecer visão do negócio através de métricas, relatórios e insights acionáveis.

## Prerequisites

- Épicos 1-4 completados
- Dados históricos de agendamentos

## Dependencies

- Agendamentos sendo criados e atualizados
- Clientes cadastrados

---

## Story 5.1: Dashboard Overview

**Status:** Ready
**Priority:** P0
**Complexity:** Medium

### User Story

**As a** business owner,
**I want** to see key metrics at a glance,
**so that** I understand my business performance.

### Acceptance Criteria

1. Dashboard principal (`/`) reorganizado com:
   - Cards de métricas no topo
   - Lista de agendamentos do dia abaixo
2. Cards de métricas:
   - Agendamentos hoje (número)
   - Agendamentos esta semana
   - Agendamentos este mês
   - Taxa de no-show do mês (%)
3. Card "Próximo agendamento":
   - Cliente, serviço, horário
   - Countdown se < 1h
4. Card "Clientes":
   - Novos este mês
   - Recorrentes (2+ visitas)
5. Atualização automática a cada 5 minutos
6. API GET `/api/analytics/dashboard`

### Technical Notes

- Queries agregadas otimizadas
- Cache de 1 minuto para métricas
- Considerar timezone do negócio

### Definition of Done

- [ ] Cards de métricas renderizam
- [ ] Dados corretos e atualizados
- [ ] Próximo agendamento destacado
- [ ] Auto-refresh funciona

---

## Story 5.2: Appointment Statistics

**Status:** Ready
**Priority:** P1
**Complexity:** Medium

### User Story

**As a** business owner,
**I want** to see appointment trends,
**so that** I can optimize my schedule.

### Acceptance Criteria

1. Página `/relatorios/agendamentos`
2. Gráfico de barras: agendamentos por dia (últimos 30 dias)
3. Breakdown por status (stacked bars):
   - Completados (verde)
   - Cancelados (amarelo)
   - No-shows (vermelho)
4. Card: Horários mais populares
   - Top 5 horários com mais agendamentos
5. Card: Serviços mais agendados
   - Lista com contagem
6. Filtro por período:
   - Última semana
   - Último mês
   - Últimos 3 meses
   - Custom range
7. API GET `/api/analytics/appointments?period=30d`

### Technical Notes

- Usar chart library (Chart.js ou Recharts)
- Queries com GROUP BY e date functions
- Cache de 5 minutos

### Definition of Done

- [ ] Gráfico de agendamentos renderiza
- [ ] Breakdown por status correto
- [ ] Horários populares listados
- [ ] Serviços mais agendados listados
- [ ] Filtro de período funciona

---

## Story 5.3: Client Analytics

**Status:** Ready
**Priority:** P1
**Complexity:** Medium

### User Story

**As a** business owner,
**I want** to understand my client base,
**so that** I can improve retention.

### Acceptance Criteria

1. Página `/relatorios/clientes`
2. Métricas gerais:
   - Total de clientes cadastrados
   - Clientes ativos (agendaram nos últimos 60 dias)
   - Novos clientes este mês
3. Taxa de retorno:
   - % de clientes que voltaram após primeira visita
   - Gráfico de pizza: novos vs recorrentes
4. Top 10 clientes:
   - Por número de visitas
   - Com link para perfil
5. Clientes inativos:
   - Não voltaram há mais de 30 dias
   - Lista com botão "Enviar mensagem"
6. API GET `/api/analytics/clients`

### Technical Notes

- Cliente ativo: appointment completed nos últimos 60 dias
- Recorrente: 2+ appointments completed
- Query de inativos: last_visit < NOW() - 30 days

### Definition of Done

- [ ] Métricas de clientes corretas
- [ ] Gráfico novos vs recorrentes
- [ ] Top 10 clientes listados
- [ ] Lista de inativos funciona

---

## Story 5.4: Revenue Insights (Basic)

**Status:** Ready
**Priority:** P2
**Complexity:** Low

### User Story

**As a** business owner,
**I want** to estimate my revenue,
**so that** I can track my earnings.

### Acceptance Criteria

1. Seção na página de relatórios ou card no dashboard
2. Faturamento estimado:
   - Hoje
   - Esta semana
   - Este mês
   - Cálculo: soma dos preços dos serviços em agendamentos 'completed'
3. Breakdown por serviço:
   - Tabela: serviço, quantidade, total
   - Ordenado por total descending
4. Comparativo mês anterior:
   - "X% a mais/menos que mês passado"
   - Indicador visual (seta verde/vermelha)
5. Nota de disclaimer:
   - "Estimativa baseada em agendamentos completados. Valores reais podem variar."
6. API GET `/api/analytics/revenue?period=month`

### Technical Notes

- Soma simples de preços de serviços
- Não considera descontos ou pagamentos reais
- Útil como indicador, não como contabilidade

### Definition of Done

- [ ] Faturamento estimado calculado
- [ ] Breakdown por serviço funciona
- [ ] Comparativo mês anterior
- [ ] Disclaimer visível

---

## Story 5.5: Export & Reports

**Status:** Ready
**Priority:** P2
**Complexity:** Medium

### User Story

**As a** business owner,
**I want** to export my data,
**so that** I can analyze offline or share.

### Acceptance Criteria

1. Botão "Exportar" nas páginas de relatórios
2. Exportar agendamentos:
   - Filtro por período
   - Formato CSV
   - Colunas: data, cliente, telefone, serviço, status
3. Exportar lista de clientes:
   - Formato CSV
   - Colunas: nome, telefone, última visita, total visitas
4. Relatório mensal resumido:
   - Formato PDF
   - Inclui todas as métricas principais
   - Logo do negócio no header
5. Opção de enviar por WhatsApp:
   - Gera link de download
   - Envia mensagem com link
6. Histórico de relatórios gerados (opcional)
7. API POST `/api/reports/export`

### Technical Notes

- CSV gerado no backend (csv-stringify)
- PDF com biblioteca como PDFKit ou jsPDF
- Arquivos armazenados temporariamente (TTL 24h)
- Link assinado para download

### Definition of Done

- [ ] Export CSV de agendamentos funciona
- [ ] Export CSV de clientes funciona
- [ ] Relatório PDF gerado
- [ ] Envio por WhatsApp funciona

---

## Epic Completion Checklist

- [ ] Todas as 5 stories completadas
- [ ] Dashboard com métricas funcionando
- [ ] Gráficos de agendamentos renderizam
- [ ] Analytics de clientes completo
- [ ] Faturamento estimado calculado
- [ ] Exports funcionando (CSV, PDF)
