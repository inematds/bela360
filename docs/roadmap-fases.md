# Bela360 - Roadmap de Desenvolvimento

## Visao Geral das Fases

```
FASE 1 (Atual)          FASE 2                   FASE 3
Core & MVP              Interface & UX           Escala & Expansao
-----------------       -----------------        -----------------
[===========    ]       [               ]        [               ]
     70%                      0%                       0%
```

---

## FASE 1: Core & MVP (Atual)

### Objetivo
Entregar um MVP funcional com as funcionalidades essenciais para validar o produto no mercado.

### Status: 70% Concluido

### Epics e Status

| Epic | Nome | Status | Progresso |
|------|------|--------|-----------|
| 1 | Foundation & Core Setup | ✅ Concluido | 100% |
| 2 | Scheduling Core | ✅ Concluido | 100% |
| 3 | Notifications & Reminders | ✅ Concluido | 100% |
| 4 | Client Management (CRM) | ✅ Concluido | 100% |
| 5 | Analytics & Dashboard | ⚠️ Parcial | 80% |
| 6 | Automacao de Relacionamento | 🔄 Em Desenvolvimento | 40% |
| 7 | Lista de Espera | 📋 Planejado | 0% |
| 8 | Multi-Profissional | 🔄 Em Desenvolvimento | 60% |

### Funcionalidades Entregues (Fase 1)

#### ✅ Implementado e Funcionando

| Funcionalidade | Descricao | Rota |
|----------------|-----------|------|
| Autenticacao | Login via WhatsApp OTP | /login |
| Dashboard | KPIs, agenda do dia, alertas | /dashboard |
| Agenda | Visualizacao dia/semana/mes | /agenda |
| Clientes | CRUD, historico, segmentacao | /clientes |
| Servicos | CRUD com duracao e preco | /servicos |
| Agendamentos | Criar, editar, cancelar | /agenda |
| WhatsApp | Conexao via Evolution API | /configuracoes |
| Lembretes | 24h e 2h antes | Automatico |
| Confirmacao | Via WhatsApp | Automatico |
| Relatorios | Basicos de agendamento | /relatorios |

#### ⚠️ Implementado Parcialmente

| Funcionalidade | O que falta |
|----------------|-------------|
| Dashboard Avancado | Graficos de tendencia, comparativos |
| Automacoes | Aniversario, reativacao |
| Multi-profissional | Interface de gestao de equipe |
| Bot WhatsApp | Fluxo completo de agendamento |

#### 📋 Nao Iniciado (mas no schema)

| Funcionalidade | Epic |
|----------------|------|
| Lista de Espera | 7 |
| Controle Financeiro | 9 |
| Marketing/Campanhas | 10 |
| Programa Fidelidade | 11 |
| Controle de Estoque | 12 |
| Gamificacao | 13 |

### Criterios de Conclusao da Fase 1

- [ ] 100% dos Epics 1-5 concluidos
- [ ] Bot WhatsApp funcional para agendamento
- [ ] 50 usuarios beta ativos
- [ ] Taxa de no-show < 10%
- [ ] NPS > 30

---

## FASE 2: Interface & UX

### Objetivo
Melhorar significativamente a experiencia do usuario com interface mais moderna, intuitiva e completa.

### Status: Nao Iniciado

### Entregas Planejadas

#### 2.1 Redesign Visual

| Item | Descricao | Prioridade |
|------|-----------|------------|
| Design System | Componentes padronizados, tokens | Alta |
| Tema Dark Mode | Opcao de tema escuro | Media |
| Animacoes | Micro-interacoes, transicoes | Media |
| Responsividade | Ajustes tablet, desktop | Alta |
| Acessibilidade | WCAG AA compliance | Alta |

#### 2.2 Novas Telas e Fluxos

| Tela | Descricao | Prioridade |
|------|-----------|------------|
| Onboarding Guiado | Tutorial interativo primeiro uso | Alta |
| Wizard de Configuracao | Setup passo-a-passo | Alta |
| Central de Notificacoes | Inbox de alertas | Media |
| Perfil do Profissional | Pagina publica | Media |
| App de Agenda (PWA) | Acesso rapido mobile | Alta |

#### 2.3 Melhorias de UX

| Melhoria | Descricao | Prioridade |
|----------|-----------|------------|
| Drag & Drop Agenda | Reagendar arrastando | Alta |
| Atalhos de Teclado | Navegacao rapida | Baixa |
| Busca Global | Encontrar qualquer coisa | Media |
| Undo/Redo | Desfazer acoes | Media |
| Offline Mode | Funcionar sem internet | Baixa |

#### 2.4 Dashboard Avancado

| Item | Descricao | Prioridade |
|------|-----------|------------|
| Graficos Interativos | Charts com drill-down | Alta |
| Comparativos | Periodo atual vs anterior | Alta |
| Metas Visuais | Progresso de objetivos | Media |
| Exportacao | PDF, Excel | Media |
| Widgets Customizaveis | Montar seu dashboard | Baixa |

### Epics da Fase 2

| # | Nome | Estimativa |
|---|------|------------|
| 14 | Design System & Componentes | 3 semanas |
| 15 | Onboarding & Tutorials | 2 semanas |
| 16 | Dashboard 2.0 | 3 semanas |
| 17 | PWA & Mobile Experience | 2 semanas |
| 18 | Acessibilidade & i18n | 2 semanas |

### Criterios de Conclusao da Fase 2

- [ ] Design System documentado
- [ ] Score Lighthouse > 90
- [ ] Time to Interactive < 3s
- [ ] NPS > 50
- [ ] Taxa de ativacao > 70%

---

## FASE 3: Escala & Expansao

### Objetivo
Preparar a plataforma para escala, adicionar funcionalidades avancadas e garantir compliance fiscal.

### Status: Nao Iniciado

### 3.1 Escalabilidade Tecnica

#### Infraestrutura

| Item | Descricao | Prioridade |
|------|-----------|------------|
| Kubernetes | Orquestracao de containers | Alta |
| HPA | Auto-scaling horizontal | Alta |
| CDN | Cache de assets global | Media |
| Multi-Region | Deploy em multiplas regioes | Media |
| Database Replicas | Read replicas PostgreSQL | Alta |

#### Arquitetura

| Item | Descricao | Prioridade |
|------|-----------|------------|
| Microservices | Separar servicos criticos | Media |
| Event Sourcing | Auditoria completa | Baixa |
| CQRS | Separar leitura/escrita | Baixa |
| API Gateway | Rate limiting, auth centralizado | Alta |
| Service Mesh | Comunicacao entre servicos | Baixa |

#### Monitoramento

| Item | Descricao | Prioridade |
|------|-----------|------------|
| APM | Application Performance Monitoring | Alta |
| Distributed Tracing | Rastreamento de requests | Media |
| Alertas Inteligentes | PagerDuty, OpsGenie | Alta |
| Dashboards Infra | Grafana, Datadog | Alta |
| Chaos Engineering | Testes de resiliencia | Baixa |

### 3.2 Modulo Fiscal

#### Requisitos Fiscais

| Item | Descricao | Prioridade |
|------|-----------|------------|
| NFS-e | Emissao de nota de servico | Alta |
| Integracao Prefeituras | APIs municipais | Alta |
| Calculo ISS | Por municipio | Alta |
| Relatorios Fiscais | Livro de servicos | Alta |
| Certificado Digital | A1/A3 support | Alta |

#### Contabilidade

| Item | Descricao | Prioridade |
|------|-----------|------------|
| Plano de Contas | Estrutura contabil | Media |
| DRE | Demonstrativo de resultados | Media |
| Fluxo de Caixa | Entradas e saidas | Alta |
| Integracao Contabil | Export para sistemas | Media |
| Regime Tributario | Simples, Lucro Presumido | Alta |

#### Compliance

| Item | Descricao | Prioridade |
|------|-----------|------------|
| LGPD Avancado | Consentimento, exclusao | Alta |
| Auditoria | Logs de todas acoes | Alta |
| Backup Geografico | Multi-region backup | Media |
| Retencao de Dados | Politicas automaticas | Media |

### 3.3 Funcionalidades Avancadas

#### Financeiro Completo

| Item | Descricao | Prioridade |
|------|-----------|------------|
| Split de Pagamento | Divisao automatica | Alta |
| Antecipacao | Receber antes | Media |
| Cobranca Recorrente | Assinaturas | Media |
| Conciliacao | Automatica com banco | Alta |
| Multi-moeda | BRL, USD, EUR | Baixa |

#### Multi-Tenancy Avancado

| Item | Descricao | Prioridade |
|------|-----------|------------|
| Multi-Unidade | Redes de saloes | Alta |
| Franquias | Gestao centralizada | Media |
| White Label | Marca propria | Media |
| API Publica | Integrações terceiros | Alta |

### Epics da Fase 3

| # | Nome | Estimativa |
|---|------|------------|
| 14 | Ecossistema e Marketplace | 6 semanas |
| 19 | Kubernetes & Auto-scaling | 4 semanas |
| 20 | Modulo Fiscal NFS-e | 6 semanas |
| 21 | Compliance & Auditoria | 3 semanas |
| 22 | Financeiro Avancado | 4 semanas |
| 23 | Multi-Unidade & Franquias | 4 semanas |
| 24 | API Publica & Webhooks | 3 semanas |

#### Epic 14: Ecossistema e Marketplace (Detalhes)

| Story | Nome | Prioridade |
|-------|------|------------|
| 14.1 | Marketplace de Produtos | Alta |
| 14.2 | Cursos e Treinamentos | Media |
| 14.3 | Comunidade de Profissionais | Media |
| 14.4 | Parcerias com Marcas | Alta |
| 14.5 | White Label Premium | Alta |

### Criterios de Conclusao da Fase 3

- [ ] Suportar 10.000 usuarios simultaneos
- [ ] Tempo de resposta P99 < 500ms
- [ ] NFS-e emitindo em 5+ cidades
- [ ] Uptime 99.9%
- [ ] SOC 2 Type 1

---

## Cronograma Geral

```
2026
      Q1              Q2              Q3              Q4
|---------------|---------------|---------------|---------------|
   FASE 1           FASE 2          FASE 2          FASE 3
   Conclusao        Inicio          Conclusao       Inicio

2027
      Q1              Q2              Q3              Q4
|---------------|---------------|---------------|---------------|
   FASE 3           FASE 3          FASE 3          EXPANSAO
   Escala           Fiscal          Conclusao       Novas Verticais
```

### Marcos (Milestones)

| Data | Marco | Entregavel |
|------|-------|------------|
| Mar/2026 | MVP Completo | Fase 1 100% |
| Jun/2026 | UX 2.0 Beta | Design System pronto |
| Set/2026 | UX 2.0 GA | Fase 2 100% |
| Dez/2026 | Kubernetes | Infra escalavel |
| Mar/2027 | NFS-e | Modulo fiscal |
| Mai/2027 | Ecossistema Beta | Epic 14 lancamento |
| Jun/2027 | Enterprise Ready | Fase 3 100% |

---

## Dependencias Entre Fases

```
FASE 1                  FASE 2                  FASE 3
--------                --------                --------
Core APIs       --->    Design System   --->    Kubernetes
     |                       |                       |
     v                       v                       v
Database        --->    Dashboard 2.0   --->    Read Replicas
     |                       |                       |
     v                       v                       v
Auth            --->    Onboarding      --->    Multi-tenant
     |                       |                       |
     v                       v                       v
WhatsApp        --->    PWA             --->    API Publica
```

---

## Recursos Necessarios

### Fase 1 (Atual)
- 1-2 desenvolvedores full-stack
- Infra: VPS basica (R$ 200/mes)
- Total: ~R$ 15.000/mes

### Fase 2
- 2 desenvolvedores full-stack
- 1 designer UI/UX
- Infra: VPS + CDN (R$ 500/mes)
- Total: ~R$ 35.000/mes

### Fase 3
- 3-4 desenvolvedores
- 1 DevOps/SRE
- 1 especialista fiscal
- Infra: Kubernetes (R$ 3.000/mes)
- Total: ~R$ 80.000/mes

---

## Riscos por Fase

### Fase 1
| Risco | Mitigacao |
|-------|-----------|
| Atraso MVP | Priorizar features criticas |
| Bug em producao | Testes automatizados |

### Fase 2
| Risco | Mitigacao |
|-------|-----------|
| Redesign demorado | Design tokens primeiro |
| Quebrar funcionalidades | Feature flags |

### Fase 3
| Risco | Mitigacao |
|-------|-----------|
| Complexidade fiscal | Consultor especializado |
| Migracao Kubernetes | Blue-green deployment |
| Custo infraestrutura | Reservas, spot instances |

---

*Documento atualizado em Janeiro/2026*
*Versao 1.0*
