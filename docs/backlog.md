# bela360 - Product Backlog

**Última atualização:** 2025-01-04
**Total de Épicos:** 5
**Total de Stories:** 26

---

## Resumo Executivo

| Épico | Nome | Stories | Prioridade | Status |
|-------|------|---------|------------|--------|
| 1 | Foundation & Core Setup | 6 | P0 | Ready |
| 2 | Scheduling Core | 6 | P0 | Ready |
| 3 | Notifications & Reminders | 5 | P0 | Ready |
| 4 | Client Management (CRM) | 4 | P1 | Ready |
| 5 | Analytics & Dashboard | 5 | P1 | Ready |

---

## Ordem de Implementação Recomendada

### Sprint 1: Foundation (Semana 1-2)
- [x] Story 1.1: Project Setup & Infrastructure
- [ ] Story 1.2: CI/CD Pipeline
- [ ] Story 1.3: Database Setup
- [ ] Story 1.4: WhatsApp Integration Setup
- [ ] Story 1.5: Authentication via WhatsApp
- [ ] Story 1.6: Health Check & Status Page

### Sprint 2: Core Scheduling (Semana 3-4)
- [ ] Story 2.1: Business Profile Setup
- [ ] Story 2.2: Service Catalog Management
- [ ] Story 2.3: Calendar & Availability
- [ ] Story 2.4: WhatsApp Booking Bot - Flow Design
- [ ] Story 2.5: Appointment Creation & Storage
- [ ] Story 2.6: Appointment List for Professional

### Sprint 3: Notifications (Semana 5)
- [ ] Story 3.1: Confirmation Message
- [ ] Story 3.2: 24h Reminder
- [ ] Story 3.3: 2h Confirmation Request
- [ ] Story 3.4: No-Show Detection & Notification
- [ ] Story 3.5: Queue System for Messages

### Sprint 4: CRM & Analytics (Semana 6)
- [ ] Story 4.1: Client Auto-Registration
- [ ] Story 4.2: Client List & Search
- [ ] Story 4.3: Client Profile & History
- [ ] Story 4.4: Client Notes & Tags
- [ ] Story 5.1: Dashboard Overview
- [ ] Story 5.2: Appointment Statistics

### Sprint 5: Polish & Launch (Semana 7)
- [ ] Story 5.3: Client Analytics
- [ ] Story 5.4: Revenue Insights
- [ ] Story 5.5: Export & Reports
- [ ] Bug fixes e polish
- [ ] Testes end-to-end
- [ ] Deploy final

---

## Stories por Prioridade

### P0 - Critical (MVP Blocker)
| ID | Story | Épico |
|----|-------|-------|
| 1.1 | Project Setup & Infrastructure | Foundation |
| 1.2 | CI/CD Pipeline | Foundation |
| 1.3 | Database Setup | Foundation |
| 1.4 | WhatsApp Integration Setup | Foundation |
| 1.5 | Authentication via WhatsApp | Foundation |
| 2.1 | Business Profile Setup | Scheduling |
| 2.2 | Service Catalog Management | Scheduling |
| 2.3 | Calendar & Availability | Scheduling |
| 2.4 | WhatsApp Booking Bot | Scheduling |
| 2.5 | Appointment Creation & Storage | Scheduling |
| 2.6 | Appointment List for Professional | Scheduling |
| 3.1 | Confirmation Message | Notifications |
| 3.2 | 24h Reminder | Notifications |
| 3.3 | 2h Confirmation Request | Notifications |
| 3.5 | Queue System for Messages | Notifications |
| 4.1 | Client Auto-Registration | CRM |
| 5.1 | Dashboard Overview | Analytics |

### P1 - High (MVP Important)
| ID | Story | Épico |
|----|-------|-------|
| 1.6 | Health Check & Status Page | Foundation |
| 3.4 | No-Show Detection | Notifications |
| 4.2 | Client List & Search | CRM |
| 4.3 | Client Profile & History | CRM |
| 5.2 | Appointment Statistics | Analytics |
| 5.3 | Client Analytics | Analytics |

### P2 - Medium (Post-MVP)
| ID | Story | Épico |
|----|-------|-------|
| 4.4 | Client Notes & Tags | CRM |
| 5.4 | Revenue Insights | Analytics |
| 5.5 | Export & Reports | Analytics |

---

## Métricas de Sucesso

### MVP (Épicos 1-3)
- [ ] Cliente consegue agendar via WhatsApp em < 2 min
- [ ] Profissional vê agenda do dia no dashboard
- [ ] Lembretes automáticos funcionando
- [ ] Taxa de no-show reduzida em 50%

### Full Product (Épicos 4-5)
- [ ] CRM com histórico completo de clientes
- [ ] Dashboard com métricas acionáveis
- [ ] Relatórios exportáveis

---

## Dependências Técnicas

```
Epic 1 (Foundation)
    │
    ├── Epic 2 (Scheduling) ─────┬── Epic 3 (Notifications)
    │                            │
    └── Epic 4 (CRM) ────────────┴── Epic 5 (Analytics)
```

---

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| WhatsApp API instável | Média | Alto | Usar Evolution API self-hosted, ter fallback |
| Complexidade do bot | Alta | Médio | Começar com fluxo simples, iterar |
| Performance com muitos agendamentos | Baixa | Médio | Indexação adequada, paginação |
| Adoção baixa pelos usuários | Média | Alto | Onboarding super simples, suporte ativo |

---

## Links Úteis

- [Project Brief](./brief.md)
- [PRD](./prd.md)
- [Architecture](./architecture.md)
- [Epic 1: Foundation](./stories/epic-1-foundation.md)
- [Epic 2: Scheduling](./stories/epic-2-scheduling.md)
- [Epic 3: Notifications](./stories/epic-3-notifications.md)
- [Epic 4: CRM](./stories/epic-4-crm.md)
- [Epic 5: Analytics](./stories/epic-5-analytics.md)
