# PRD — TGA Quiz (Guess the Winner)

**Status:** Aprovado para planejamento de implementação
**Data:** 2026-07-23
**Dataset base:** `data/the_game_awards.csv`

## 1. Visão Geral

### 1.1 Problema / Motivação

O dataset histórico do The Game Awards (2014–2019) existe hoje apenas como um CSV estático (805 linhas: `year`, `category`, `nominee`, `company`, `winner`, `voted`). O objetivo deste projeto é transformá-lo em uma aplicação full-stack interativa, servindo tanto como projeto de portfólio/aprendizado quanto como uma experiência divertida para fãs de games testarem sua memória sobre premiações passadas.

### 1.2 Proposta de Valor

- **Modo Exploração:** qualquer visitante navega livremente pelo histórico completo (indicados, vencedores, empresas) por ano e categoria.
- **Modo Quiz:** usuários autenticados veem os indicados de uma categoria/ano **sem saber quem venceu**, escolhem um palpite, e o sistema revela na hora se acertaram — construindo um histórico pessoal de acertos e erros.

### 1.3 Público-Alvo

- O desenvolvedor, como projeto de estudo/portfólio full-stack.
- Fãs de games interessados em relembrar/testar conhecimento sobre edições passadas do The Game Awards.

### 1.4 Contexto do Projeto

Projeto de estudo/portfólio. O nível de rigor (testes, deploy, CI/CD) é calibrado para essa finalidade — funcional e bem organizado, sem necessidade de infraestrutura de produção robusta.

### 1.5 Métricas de Sucesso

- Fluxo completo funcional: cadastro/login → responder quiz → ver histórico de acertos e taxa de acerto.
- As 6 edições (2014–2019) navegáveis, com nomes de categoria normalizados de forma consistente entre anos.
- Seed reprodutível do PostgreSQL a partir do CSV (um comando recria o banco do zero).

### 1.6 Fora de Escopo (Não-Objetivos)

- Leaderboard/ranking comparando usuários entre si.
- Login social/OAuth (apenas email/senha).
- Dados de edições do TGA além do CSV fornecido (2020 em diante).
- Recursos sociais (comentários, compartilhamento, chat).
- Multiplayer ou funcionalidades em tempo real.
- Múltiplas tentativas por pergunta de quiz (cada pergunta é respondida uma única vez por usuário).

## 2. Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js |
| Backend | Node.js + Express |
| Banco de dados | PostgreSQL |
| ORM | Prisma |
| Autenticação | Email/senha + JWT (cookie `httpOnly`), hash de senha com `bcrypt` |
| Estrutura do repositório | Monorepo (`/frontend` + `/backend`) |

**Justificativa da arquitetura (monorepo + Prisma):** um único repositório com `/frontend` e `/backend` evita overhead de coordenação (CORS, versionamento de contrato de API, múltiplas pipelines) desnecessário para um projeto solo de portfólio. O Prisma reduz boilerplate de acesso ao PostgreSQL com schema declarativo, migrations e queries tipadas, acelerando a implementação da lógica de quiz/pontuação em troca de uma camada de abstração sobre SQL puro — trade-off aceito, já que a prioridade é entregar o produto completo, não maximizar aprendizado de SQL cru.

## 3. Modelo de Dados & Ingestão

### 3.1 Regra de Elegibilidade do Quiz

Nem toda combinação (ano, categoria) do CSV pode virar uma pergunta de quiz. A análise do dataset revelou:

- **154 de 163** combinações (ano, categoria) têm exatamente 1 vencedor e 2+ indicados — essas são perguntas válidas.
- **9 combinações são inelegíveis:**
  - 2 casos com **múltiplos vencedores** na mesma categoria/ano (ex.: "Global Gaming Citizens" 2019 tem 5 indicados, todos marcados como vencedores — prêmio honorífico, não competitivo; "ESports Team of the Year" 2014 tem 2 vencedores entre 5 indicados).
  - 3 casos **sem nenhum vencedor registrado** (ex.: "Industry Icon Award" 2016, "Trending Gamer" 2014).
  - Casos com apenas 1 indicado no total (sem alternativa de escolha).

**Regra:** uma pergunta de quiz só existe para combinações (ano, categoria) com **2+ indicados E exatamente 1 vencedor**. As 9 combinações inelegíveis continuam visíveis no modo Exploração, mas nunca aparecem no modo Quiz.

### 3.2 Normalização de Categorias

O CSV contém 59 strings de categoria distintas, várias sendo apenas variações de nome da mesma categoria ao longo dos anos (ex.: "Best Esports Game" / "Best eSports Game" / "ESports Game of the Year"; "Best Action/Adventure" / "Best Action/Adventure Game"; "Best VR Game" / "Best VR/AR Game"; "Most Anticipated Game" / "Most Anticipated Game 2015"). Essas variações são mapeadas para um nome canônico único durante a ingestão, permitindo navegar a mesma categoria de forma consistente entre edições. O mapeamento exato (string bruta → nome canônico) é mantido como uma tabela de consulta dentro do script de seed e é uma tarefa editorial a ser refinada durante a implementação.

### 3.3 Schema (PostgreSQL via Prisma)

- **`categories`**: `id`, `canonical_name` (único), `slug` (único).
- **`nominations`**: `id`, `year`, `category_id` (FK → categories), `nominee`, `company` (opcional/nulo), `is_winner` (boolean), `voted_by` (`jury` | `fan`) — uma linha por indicação, fiel ao CSV, ligada à categoria canônica.
- **`quiz_questions`**: `id`, `year`, `category_id` (FK → categories), `correct_nomination_id` (FK → nominations) — pré-computada no seed a partir da regra de elegibilidade (3.1); evita recalcular agregações a cada requisição. Restrição única em (`year`, `category_id`).
- **`users`**: `id`, `email` (único), `password_hash`, `created_at`.
- **`quiz_attempts`**: `id`, `user_id` (FK → users), `quiz_question_id` (FK → quiz_questions), `chosen_nomination_id` (FK → nominations), `is_correct` (boolean), `answered_at`. Restrição única em (`user_id`, `quiz_question_id`) — cada usuário responde cada pergunta uma única vez, mantendo o placar honesto (sem repetir até acertar).

### 3.4 Processo de Ingestão (Seed)

Um script de seed (`prisma/seed.ts`):

1. Lê `data/the_game_awards.csv`.
2. Aplica o mapa de normalização de categorias (3.2).
3. Popula `categories` e `nominations`.
4. Calcula as combinações elegíveis (3.1) e popula `quiz_questions`, incluindo o `correct_nomination_id`.

O script é idempotente/reexecutável, permitindo recriar o banco do zero a qualquer momento.

## 4. Backend & API

### 4.1 Autenticação

- Cadastro/login por email e senha; hash de senha com `bcrypt`.
- Sessão via JWT (HS256) entregue em cookie `httpOnly` (mais seguro contra XSS que `localStorage`).
- O Next.js repassa esse cookie nas chamadas à API do Express.

### 4.2 Endpoints REST

**Catálogo — público, sem login:**
- `GET /api/years` — anos disponíveis (2014–2019).
- `GET /api/categories?year=` — categorias canônicas (todas, ou filtradas por ano).
- `GET /api/nominations?year=&categoryId=` — indicados de uma categoria/ano, **incluindo o vencedor** (usado no modo Exploração).

**Autenticação:**
- `POST /api/auth/register` `{email, password}`.
- `POST /api/auth/login` `{email, password}` → seta cookie com JWT.
- `GET /api/auth/me` — retorna o usuário autenticado atual.

**Quiz — requer login:**
- `GET /api/quiz/next` — retorna uma pergunta de `quiz_questions` ainda não respondida pelo usuário: ano, categoria e lista de indicados, **sem revelar o vencedor**. Retorna vazio quando não há mais perguntas.
- `POST /api/quiz/answer` `{questionId, nominationId}` — grava a tentativa e retorna se o usuário acertou e qual era o indicado vencedor.
- `GET /api/quiz/history` — histórico paginado de tentativas do usuário (ano, categoria, escolha, resultado, vencedor real).
- `GET /api/quiz/stats` — total respondidas, total de acertos, percentual de acerto, perguntas restantes.

### 4.3 Estrutura do Backend

Camadas `routes → controllers → services → Prisma`, com middleware de autenticação (valida o JWT do cookie) e um error handler central que padroniza respostas de erro no formato `{ error: { code, message } }`.

## 5. Frontend (Next.js)

### 5.1 Páginas

- **`/`** — landing: explica o app, com CTAs "Explorar indicações" e "Jogar Quiz" (esta última leva ao login se o usuário não estiver autenticado).
- **`/explore`** — pública: seletor de ano + categoria, exibindo uma tabela dos indicados com o vencedor destacado e a empresa.
- **`/login`** e **`/register`** — formulários de email/senha.
- **`/quiz`** — autenticada: mostra uma pergunta por vez (categoria + ano + lista de indicados como opções, sem revelar o vencedor). Ao confirmar um palpite, a tela revela se o usuário acertou e qual era o vencedor real, com botão "Próxima pergunta". Quando não há mais perguntas, mostra uma tela de conclusão com o resumo de desempenho.
- **`/quiz/history`** — autenticada: estatísticas agregadas no topo (total respondidas, acertos, % de acerto) seguidas da lista histórica de tentativas.

### 5.2 Navegação

Barra superior com links para Explorar / Quiz / Histórico (os dois últimos visíveis apenas logado) e estado de sessão (Login/Registro, ou email do usuário + Sair).

## 6. Tratamento de Erros & Casos de Borda

- **Resposta duplicada:** tentativa de responder a mesma pergunta duas vezes (ex.: duplo clique) é rejeitada com 409 pela restrição única no banco; o frontend trata como "já respondida".
- **Fim das perguntas:** quando não há mais perguntas não respondidas, `GET /api/quiz/next` retorna vazio e o frontend exibe uma tela de conclusão com o resumo de desempenho.
- **Sessão inválida/expirada:** chamada autenticada com JWT ausente/expirado retorna 401 e o frontend redireciona para `/login`.
- **Cadastro com email já existente:** 409 com mensagem clara.
- **Login inválido:** 401 com mensagem genérica (não revela se o email existe).
- **Filtros inválidos em `/explore`:** ano/categoria inexistente retorna lista vazia (não é erro); o frontend mostra um estado vazio amigável.

## 7. Testes, Deploy & Critérios de Aceite

### 7.1 Testes

Calibrado para projeto de portfólio: testes unitários no backend para a lógica de elegibilidade de perguntas (3.1) e de correção de respostas (Jest), e testes de integração dos fluxos críticos (registro → login → responder quiz) contra um banco de teste. Testes de frontend são opcionais para o MVP.

### 7.2 Deploy

Frontend no Vercel; backend + PostgreSQL no Railway/Render (ou Docker Compose para uso somente local). Variáveis de ambiente para a connection string do banco e o segredo do JWT. Um `README.md` com instruções de setup (variáveis de ambiente, seed, rodar em modo dev) é entregável obrigatório.

### 7.3 Critérios de Aceite

1. Usuário consegue se cadastrar e logar.
2. Modo Exploração lista corretamente indicados/vencedores para qualquer ano/categoria do CSV.
3. Quiz nunca repete uma pergunta já respondida pelo mesmo usuário, nem oferece nenhuma das 9 combinações inelegíveis (3.1).
4. Histórico e estatísticas refletem corretamente as tentativas do usuário.
5. O script de seed recria o banco do zero de forma reprodutível a partir do CSV.
