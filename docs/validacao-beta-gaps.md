# Validacao de Gaps com Usuarios Beta

**Data:** 07/01/2026
**Versao:** 1.0
**Objetivo:** Validar com usuarios beta quais gaps identificados na analise de expertise do setor sao mais criticos para priorizacao

---

## Contexto

Este documento serve como guia para validar com usuarios beta (donos de salao, profissionais e clientes) quais funcionalidades identificadas como gaps devem ser priorizadas no desenvolvimento.

---

## 1. Metodologia de Validacao

### 1.1 Perfil dos Participantes

| Perfil | Quantidade Minima | Criterio de Selecao |
|--------|-------------------|---------------------|
| Dono de Salao Pequeno | 10 | 1-3 profissionais, ate R$30k/mes |
| Dono de Salao Medio | 5 | 4-10 profissionais, R$30-100k/mes |
| Profissional Autonomo | 5 | Trabalha sozinho ou aluguel de cadeira |
| Profissional de Equipe | 5 | Trabalha em salao de terceiro |
| Cliente Final | 10 | Usa servicos de beleza 1x/mes+ |

### 1.2 Formato das Entrevistas

| Tipo | Duracao | Formato |
|------|---------|---------|
| Entrevista Individual | 30min | Video ou presencial |
| Grupo Focal | 60min | 4-6 participantes |
| Questionario Online | 10min | Google Forms |

### 1.3 Cronograma Sugerido

| Semana | Atividade |
|--------|-----------|
| 1 | Recrutamento de participantes |
| 2 | Entrevistas individuais (donos) |
| 3 | Entrevistas individuais (profissionais) |
| 4 | Questionario online (clientes) |
| 5 | Grupo focal misto |
| 6 | Analise e relatorio final |

---

## 2. Gaps a Validar

### 2.1 Gaps de Automacao (Prioridade Alta)

#### Gap A1: Bloqueio Automatico de Horarios Estrategicos

**Descricao:** Sistema analisa historico e sugere ou bloqueia automaticamente horarios com baixa demanda.

**Perguntas de Validacao:**
1. Com que frequencia voce tem horarios vazios na agenda?
2. Voce ja tentou fazer promocoes para preencher esses horarios?
3. Quanto tempo voce gasta por semana gerenciando horarios ociosos?
4. Se o sistema pudesse automaticamente sugerir bloqueios ou promocoes, isso seria util?
5. De 1 a 5, qual a importancia dessa funcionalidade?

**Metricas de Sucesso:**
- [ ] 70%+ consideram importante (4-5)
- [ ] 50%+ tem problema frequente de horarios vazios

---

#### Gap A2: Alertas de Custos Elevados

**Descricao:** Sistema alerta quando custos (produtos, comissoes) estao acima do normal.

**Perguntas de Validacao:**
1. Voce sabe exatamente quanto gasta com produtos por mes?
2. Ja teve surpresas negativas com custos?
3. Como voce controla os gastos hoje?
4. Se o sistema avisasse "custos 20% acima da media", isso ajudaria?
5. De 1 a 5, qual a importancia dessa funcionalidade?

**Metricas de Sucesso:**
- [ ] 60%+ nao tem controle preciso de custos
- [ ] 70%+ consideram importante (4-5)

---

#### Gap A3: Projecao de Faturamento

**Descricao:** Sistema projeta faturamento dos proximos 7-30 dias baseado em agendamentos e historico.

**Perguntas de Validacao:**
1. Voce sabe quanto vai faturar este mes?
2. Como voce planeja suas financas pessoais/do negocio?
3. Ja teve meses com faturamento muito abaixo do esperado?
4. Se o sistema mostrasse "projecao de R$X para o mes", isso seria util?
5. De 1 a 5, qual a importancia dessa funcionalidade?

**Metricas de Sucesso:**
- [ ] 80%+ nao tem previsao de faturamento
- [ ] 75%+ consideram importante (4-5)

---

### 2.2 Gaps de IA/Inteligencia (Prioridade Media)

#### Gap B1: Previsao de Demanda com IA

**Descricao:** Sistema preve quais horarios terao mais ou menos demanda na proxima semana/mes.

**Perguntas de Validacao:**
1. Voce consegue prever quais dias serao mais movimentados?
2. Ja aconteceu de ter mais clientes do que consegue atender?
3. Se o sistema previsse "quinta-feira tera 40% mais demanda", isso ajudaria?
4. O que voce faria com essa informacao?
5. De 1 a 5, qual a importancia dessa funcionalidade?

**Metricas de Sucesso:**
- [ ] 60%+ tem dificuldade em prever demanda
- [ ] 50%+ consideram importante (4-5)

---

#### Gap B2: Alertas Proativos de Risco

**Descricao:** Sistema alerta sobre quedas de faturamento, aumento de no-shows, profissionais improdutivos, etc.

**Perguntas de Validacao:**
1. Voce acompanha a taxa de faltas (no-shows)?
2. Ja percebeu queda de faturamento so depois de varios meses?
3. Se o sistema avisasse "faturamento 15% abaixo da media", isso seria util?
4. Quais tipos de alerta seriam mais importantes para voce?
5. De 1 a 5, qual a importancia dessa funcionalidade?

**Metricas de Sucesso:**
- [ ] 70%+ nao monitora metricas ativamente
- [ ] 65%+ consideram importante (4-5)

---

#### Gap B3: Recomendacao Personalizada de Servicos

**Descricao:** Sistema sugere servicos complementares para clientes (ex: hidratacao apos coloracao).

**Perguntas de Validacao:**
1. Voce costuma sugerir servicos adicionais aos clientes?
2. Quantos clientes aceitam a sugestao?
3. Se o sistema enviasse "Ola Maria, que tal uma hidratacao?", isso seria bem recebido?
4. Voce acha que isso aumentaria seu faturamento?
5. De 1 a 5, qual a importancia dessa funcionalidade?

**Metricas de Sucesso:**
- [ ] 50%+ fazem upsell manual hoje
- [ ] 60%+ acreditam que aumentaria faturamento

---

### 2.3 Gaps de Ecossistema (Prioridade Baixa)

#### Gap C1: Marketplace de Produtos

**Descricao:** Comprar produtos profissionais diretamente pela plataforma com precos especiais.

**Perguntas de Validacao:**
1. Onde voce compra seus produtos hoje?
2. Quais as maiores dificuldades na compra de produtos?
3. Se pudesse comprar pelo sistema com desconto, usaria?
4. Quanto economizaria por mes com 10% de desconto?
5. De 1 a 5, qual a importancia dessa funcionalidade?

**Metricas de Sucesso:**
- [ ] 60%+ tem dificuldade na compra de produtos
- [ ] 50%+ usariam o marketplace

---

#### Gap C2: Cursos e Treinamentos

**Descricao:** Acessar cursos online dentro da plataforma.

**Perguntas de Validacao:**
1. Voce faz cursos de atualizacao? Com que frequencia?
2. Onde voce busca cursos hoje?
3. Se houvesse cursos dentro do sistema, acessaria?
4. Que tipos de cursos mais te interessam?
5. De 1 a 5, qual a importancia dessa funcionalidade?

**Metricas de Sucesso:**
- [ ] 70%+ tem interesse em cursos
- [ ] 40%+ consideram importante (4-5)

---

#### Gap C3: White Label (App Proprio)

**Descricao:** Ter um app com a marca do seu salao para os clientes.

**Perguntas de Validacao:**
1. Seus clientes ja pediram um app do salao?
2. Voce acha que um app proprio daria mais profissionalismo?
3. Quanto pagaria a mais por essa funcionalidade?
4. O que esperaria ver nesse app?
5. De 1 a 5, qual a importancia dessa funcionalidade?

**Metricas de Sucesso:**
- [ ] 30%+ ja tiveram pedidos de app
- [ ] 50%+ pagariam a mais por white label

---

## 3. Questionario para Clientes

### Perguntas sobre Experiencia de Agendamento

1. Como voce agenda servicos de beleza hoje? (WhatsApp, telefone, app, presencial)
2. O que mais te incomoda no processo de agendamento?
3. Voce ja deixou de ir a um salao por dificuldade de agendar?
4. Se recebesse uma mensagem "hora de renovar seu corte?", acharia util ou invasivo?
5. Voce participaria de um programa de fidelidade com pontos?

### Perguntas sobre Comunicacao

1. Voce gosta de receber lembretes de agendamento?
2. Quantas horas antes o lembrete ideal?
3. Voce responderia uma pesquisa de satisfacao apos o atendimento?
4. Gostaria de ver avaliacoes de outros clientes sobre o profissional?

---

## 4. Template de Relatorio

### Resumo Executivo

| Gap | Score Medio | % Importante | Prioridade Final |
|-----|-------------|--------------|------------------|
| A1: Bloqueio Horarios | X.X | XX% | Alta/Media/Baixa |
| A2: Alertas Custos | X.X | XX% | Alta/Media/Baixa |
| A3: Projecao Faturamento | X.X | XX% | Alta/Media/Baixa |
| B1: Previsao Demanda | X.X | XX% | Alta/Media/Baixa |
| B2: Alertas Risco | X.X | XX% | Alta/Media/Baixa |
| B3: Recomendacao Servicos | X.X | XX% | Alta/Media/Baixa |
| C1: Marketplace | X.X | XX% | Alta/Media/Baixa |
| C2: Cursos | X.X | XX% | Alta/Media/Baixa |
| C3: White Label | X.X | XX% | Alta/Media/Baixa |

### Citacoes Relevantes

> "Citacao de participante sobre gap X"
> - Tipo de participante, perfil

### Insights Inesperados

1. Insight 1
2. Insight 2
3. Insight 3

### Recomendacoes Finais

1. Priorizar gaps X, Y, Z para proxima sprint
2. Desprioritizar gaps A, B, C por baixa demanda
3. Investigar mais o tema W antes de decidir

---

## 5. Proximos Passos

| Passo | Responsavel | Prazo |
|-------|-------------|-------|
| Recrutar participantes | | |
| Agendar entrevistas | | |
| Conduzir entrevistas | | |
| Analisar resultados | | |
| Apresentar relatorio | | |
| Decidir priorizacao | | |

---

## 6. Ferramentas Sugeridas

- **Recrutamento:** Formulario Google para triagem
- **Agendamento:** Calendly ou proprio Bela360
- **Video:** Google Meet ou Zoom
- **Questionario:** Google Forms ou Typeform
- **Analise:** Planilha Google ou Notion
- **Gravacao:** Com consentimento, Otter.ai para transcricao

---

*Documento criado em 07/01/2026*
*Para uso com usuarios beta do Bela360*
