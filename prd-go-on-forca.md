# PRD - Go On Força Manager

## 1. Context & Background

### Por que estamos construindo isso?

A Go On Outdoor cresceu de 40 para 400+ atletas, e a gestão dos treinos de força está sendo feita via planilha compartilhada. Com ~300 atletas de força distribuídos entre 4 treinadores, o controle manual está gerando:

- **Falta de visibilidade:** Difícil saber rapidamente quem está atrasado, quem precisa de ajuste, quem está sem treinador.
- **Handoff problemático:** Quando Wesley (ou outro treinador) passa atletas para outro montar, falta contexto estruturado sobre o atleta.
- **Sem garantia de atendimento:** Não há rastreamento se os treinadores estão conversando com os atletas semanalmente.
- **Provas alvo invisíveis:** A data da prova do atleta e o tempo restante não estão visíveis de forma clara na operação diária.

### Cenário atual

Os treinadores usam uma planilha Google Sheets com campos como: nome, dias até vencer, data limite, bloco do Mfit, professor responsável, plano, ambiente e frequência. A planilha funciona, mas não escala bem para 300+ atletas e múltiplos treinadores precisando de visão consolidada.

---

## 2. Objectives & Success Metrics

### Objetivo principal

Garantir que **100% dos atletas tenham treino montado no prazo**, com visibilidade total para todos os treinadores e contexto completo para montagem.

### Métricas de sucesso

| Métrica | Meta | Como medir |
|---------|------|------------|
| Taxa de treinos no prazo | 100% | Atletas com status "treino montado" antes da data limite |
| Taxa de conversa semanal | 100% | Check de conversa marcado para todos os atletas ativos |
| Atletas sem treinador | 0 | Contagem de atletas com campo "professor" vazio |
| Atletas atrasados | 0 | Contagem de atletas com dias negativos |
| Tempo médio de handoff | < 5 min | Tempo para um treinador pegar contexto de atleta novo |

---

## 3. Users & Access

### Perfil dos usuários

- **Treinadores de força:** ~4 pessoas (modular para crescimento)
- **Uso:** Desktop-first (sem necessidade de mobile)
- **Frequência:** Diária, múltiplas vezes ao dia

### Modelo de acesso

- **Autenticação:** Clerk com Google OAuth (simples, gratuito até 10k MAU)
- **Permissões:** Todos os treinadores veem e editam todos os atletas
- **Sem hierarquia:** Não há admin vs usuário comum (por enquanto)

---

## 4. Use Cases

### UC1: Verificar demanda da semana
> Como treinador, quero abrir o app e ver imediatamente quantos atletas preciso montar essa semana, quantos estão atrasados e quantos fecham na próxima semana, para priorizar meu trabalho.

**Fluxo:**
1. Treinador abre o app
2. Dashboard mostra cards com: "12 para montar essa semana", "3 atrasados", "18 fecham próxima semana", "2 sem treinador"
3. Treinador clica em "atrasados" e vai direto para lista filtrada

### UC2: Montar treino de atleta de outro treinador
> Como treinador, quero pegar um atleta do Wesley para montar, ler a ficha completa dele (lesões, objetivos, histórico de notas) e entender o contexto antes de criar o treino.

**Fluxo:**
1. Treinador filtra por "Professor: Wesley"
2. Clica no atleta para abrir ficha completa
3. Lê: lesões ativas, limitações, equipamentos, nível, objetivos
4. Lê handoff notes com histórico de evolução
5. Monta o treino com contexto completo
6. Atualiza status para "treino montado" e adiciona nota se necessário

### UC3: Registrar conversa com atleta
> Como treinador, preciso marcar que conversei com o atleta essa semana (via app ou WhatsApp) para cumprir a meta de contato semanal.

**Fluxo:**
1. Treinador abre ficha do atleta
2. Clica em "Registrar conversa"
3. Sistema salva data/hora e nome do treinador no log
4. Check da semana fica verde
5. Histórico mostra todas as conversas anteriores

### UC4: Visualizar provas alvo e tempo restante
> Como treinador, quero ver rapidamente quais atletas têm prova chegando e em quanto tempo, para periodizar o treino corretamente.

**Fluxo:**
1. Na lista geral, coluna "Prova Alvo" mostra nome da prova
2. Coluna "Data Prova" mostra a data
3. Coluna "Tempo até Prova" mostra "8 semanas e 3 dias" ou "Sem prova definida"
4. Treinador pode ordenar por tempo até prova para ver urgências

### UC5: Atualizar dados do atleta após montagem
> Como treinador, após montar o treino, quero atualizar o status, o bloco usado e adicionar uma nota de handoff para o próximo ciclo.

**Fluxo:**
1. Treinador abre atleta
2. Muda status de "aguardando treino" para "treino montado"
3. Seleciona o bloco Mfit usado
4. Adiciona handoff note: "Foco em posterior, adaptei por dor no joelho direito"
5. Sistema atualiza "Pronto até" para a nova data

---

## 5. Functional Requirements

### 5.1 Dashboard (Tela inicial)

O dashboard deve exibir cards de resumo com contagens em tempo real:

- **Para montar essa semana:** Atletas com "dias" entre 0 e 7 e status ≠ "treino montado"
- **Já com treino:** Atletas com status = "treino montado" e dias ≥ 0
- **Fecham próxima semana:** Atletas com "dias" entre 8 e 14
- **Sem treinador:** Atletas com campo "Professor" vazio
- **Atrasados:** Atletas com "dias" < 0
- **Precisam de ajuste:** Atletas com status = "precisa de ajuste"
- **Sem conversa essa semana:** Atletas sem check de conversa nos últimos 7 dias

Cada card é clicável e leva para a lista filtrada correspondente.

### 5.2 Lista de Atletas (Visão geral)

Tabela com todos os atletas contendo as colunas:

| Coluna | Tipo | Editável | Descrição |
|--------|------|----------|-----------|
| Nome | Texto | Não | Nome completo do atleta |
| Dias | Número | Não | Calculado: diferença entre "Pronto até" e hoje |
| Pronto até | Data | Sim | Data limite para o treino estar pronto |
| Bloco Mfit | Select | Sim | Nome do bloco usado como base |
| Status | Select | Sim | aguardando treino / treino montado / atrasado / precisa de ajuste |
| Professor | Select | Sim | Treinador responsável pelo atleta |
| Plano | Select | Sim | CORTESIA / PRO / PRO+ / PRO TEAM / GOLD |
| Ambiente | Select | Sim | Academia / Home Gym / No Equip / Corrida |
| Dias que treina | Select | Sim | 2 dias / 3 dias / 4 dias |
| Prova Alvo | Texto | Sim | Nome da prova (ex: "UTMB 2025") |
| Data Prova | Data | Sim | Data da prova |
| Tempo até Prova | Texto | Não | Calculado: "X semanas e Y dias" ou "Sem prova definida" |
| Observação | Texto | Sim | Notas rápidas visíveis na lista |
| Conversa semana | Ícone | Não | ✓ verde se conversou, ✗ vermelho se não |

**Funcionalidades da lista:**
- Ordenação por qualquer coluna
- Filtros por: Professor, Status, Plano, Ambiente, Dias que treina
- Busca por nome
- Edição inline dos campos editáveis
- Clique no nome abre ficha completa

### 5.3 Ficha do Atleta (Visão detalhada)

Modal ou página dedicada com todas as informações do atleta:

**Seção: Dados básicos**
- Nome
- Professor responsável
- Plano
- Ambiente de treino
- Dias que treina por semana

**Seção: Treino atual**
- Status atual
- Bloco Mfit em uso
- Data "Pronto até"
- Dias restantes

**Seção: Prova alvo**
- Nome da prova
- Data da prova
- Tempo até a prova (semanas e dias)
- Se vazio: "Sem prova alvo definida"

**Seção: Perfil do atleta**
- Lesões ativas (texto livre)
- Limitações (texto livre)
- Perfil de comportamento (texto livre)
- Objetivos (texto livre)
- Nível de experiência (select: iniciante / intermediário / avançado)
- Equipamentos disponíveis (texto livre ou multi-select)

**Seção: Notas do treinador**
- Campo de texto para notas gerais
- Botão "Salvar nota"

**Seção: Handoff Notes (Histórico)**
- Lista cronológica de notas de passagem
- Cada entrada mostra: data, treinador que escreveu, conteúdo
- Campo para adicionar nova nota de handoff
- Não editável após salvo (apenas leitura do histórico)

**Seção: Log de conversas**
- Botão "Registrar conversa" 
- Histórico mostrando: data/hora, nome do treinador
- Indicador visual se conversou essa semana

### 5.4 Gestão de Treinadores

Lista simples de treinadores cadastrados:
- Nome
- Email (usado no login Google)
- Botão para adicionar novo treinador
- Botão para remover (apenas remove da lista, não apaga dados)

Essa lista alimenta o select de "Professor" nos atletas.

---

## 6. Non-Functional Requirements

### Performance
- Carregamento inicial < 3 segundos
- Atualização de dados < 1 segundo
- Suportar 300+ atletas sem degradação

### Usabilidade
- Desktop-first (mínimo 1280px de largura)
- Design limpo, sem excesso de cores ou efeitos
- Paleta harmônica, evitar tons pastéis "de IA"
- Feedback visual claro em ações (salvou, erro, carregando)

### Confiabilidade
- Google Sheets como fonte de verdade
- Retry automático em falhas de conexão
- Mensagens de erro claras para o usuário

---

## 7. Technical Architecture (High-level)

### Stack proposto

| Camada | Tecnologia | Justificativa |
|--------|------------|---------------|
| Frontend | Next.js 14 (App Router) | SSR, deploy fácil na Vercel, React moderno |
| UI Components | shadcn/ui + Tailwind | Clean, customizável, sem dependências pesadas |
| Autenticação | Clerk | Google OAuth simples, tier gratuito generoso |
| Banco de dados | Google Sheets + Apps Script | Requisito do projeto, familiar para a equipe |
| API | Google Apps Script Web App | Endpoints REST para CRUD |
| Deploy | Vercel | Integração nativa com Next.js |

### Estrutura do Google Sheets

**Aba: Atletas**
| Coluna | Tipo |
|--------|------|
| id | UUID |
| nome | String |
| professor_id | UUID (ref Treinadores) |
| plano | String |
| ambiente | String |
| dias_treina | Number |
| bloco_mfit | String |
| pronto_ate | Date |
| status | String |
| prova_alvo | String |
| data_prova | Date |
| lesoes_ativas | String |
| limitacoes | String |
| perfil_comportamento | String |
| objetivos | String |
| nivel_experiencia | String |
| equipamentos | String |
| notas_treinador | String |
| observacao | String |
| created_at | Timestamp |
| updated_at | Timestamp |

**Aba: Treinadores**
| Coluna | Tipo |
|--------|------|
| id | UUID |
| nome | String |
| email | String |
| created_at | Timestamp |

**Aba: HandoffNotes**
| Coluna | Tipo |
|--------|------|
| id | UUID |
| atleta_id | UUID (ref Atletas) |
| treinador_id | UUID (ref Treinadores) |
| conteudo | String |
| created_at | Timestamp |

**Aba: LogConversas**
| Coluna | Tipo |
|--------|------|
| id | UUID |
| atleta_id | UUID (ref Atletas) |
| treinador_id | UUID (ref Treinadores) |
| created_at | Timestamp |

---

## 8. Out of Scope (v1)

Para manter o escopo controlado na primeira versão, **não** incluiremos:

- App mobile
- Notificações push ou email
- Integração direta com Mfit
- Relatórios avançados ou gráficos
- Histórico de alterações em todos os campos
- Multi-tenancy (outras empresas usando)
- Importação em massa de atletas
- API pública

---

## 9. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Google Sheets lento com 300+ linhas | Média | Alto | Implementar cache local, paginação na API |
| Conflito de edição simultânea | Média | Médio | Timestamps de atualização, feedback de conflito |
| Limite de requisições Apps Script | Baixa | Alto | Rate limiting no frontend, batch updates |
| Treinadores esquecem de registrar conversa | Alta | Médio | Alerta visual no dashboard, destaque em vermelho |

---

## 10. Roadmap sugerido

### Fase 1 - MVP (2-3 semanas)
- Setup do projeto (Next.js, Clerk, Sheets)
- Dashboard com contadores
- Lista de atletas com filtros e ordenação
- Edição inline dos campos principais
- Ficha básica do atleta

### Fase 2 - Contexto completo (1-2 semanas)
- Handoff notes com histórico
- Log de conversas
- Campos de perfil do atleta
- Prova alvo com cálculo de tempo

### Fase 3 - Polish (1 semana)
- Refinamento visual
- Performance tuning
- Testes com treinadores reais
- Ajustes baseados em feedback

---

## 11. Open Questions

1. **Blocos Mfit:** Existe uma lista fixa de blocos ou é texto livre? Se fixa, preciso da lista.
2. **Planos:** Os planos (PRO, PRO+, etc.) são fixos ou podem mudar? 
3. **Migração:** Vamos importar os dados da planilha atual ou começa do zero?
4. **Domínio:** Vai usar um subdomínio tipo forca.gooutdoor.com.br ou algo genérico?
5. **Backup:** Precisa de backup automático da planilha ou o histórico do Sheets é suficiente?

---

## 12. Aprovação

| Papel | Nome | Status |
|-------|------|--------|
| Product Owner | Wesley | Pendente |
| Tech Lead | Wesley/Claude | Pendente |
| Stakeholder | Bonatto | N/A (se aplicável) |

---

*Documento criado em: Dezembro 2024*
*Última atualização: v1.0*
