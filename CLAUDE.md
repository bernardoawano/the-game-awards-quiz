# Visão Geral

**TGA Quiz (Guess the Winner)** — app full-stack sobre o dataset do The Game Awards 2014–2019 (`data/the_game_awards.csv`, 805 linhas), com dois modos:

- **Exploração** (público): navegar indicados/vencedores por ano e categoria.
- **Quiz** (autenticado): adivinhar o vencedor sem ver a resposta, com histórico e taxa de acerto.

`PRD.md` é a fonte de verdade do **produto**; este arquivo define o **como**; `ROADMAP.md` define o **em que ordem** (14 fases do tamanho de um commit, com critério de saída verificável em cada uma) e registra as decisões e suposições tomadas no planejamento. Em conflito: PRD manda em escopo/regra de negócio, CLAUDE.md manda em convenção técnica — resolva atualizando um dos dois.

**Natureza:** projeto de estudo/portfólio solo. Código limpo e funcional, sem infraestrutura pesada. Nada de microserviços, filas, cache distribuído, observabilidade avançada ou feature flags.

**Conceitos-chave:**
- **Categoria canônica** — 59 strings brutas do CSV normalizadas em nomes únicos, para navegar a mesma categoria entre edições.
- **Pergunta elegível** — combinação (ano, categoria) com **2+ indicados E exatamente 1 vencedor**. As 9 combinações inelegíveis (múltiplos vencedores, nenhum vencedor, indicado único) aparecem no Exploração e **nunca** no Quiz.
- **Tentativa** — cada usuário responde cada pergunta **uma única vez**, sem repetição.

**Fora de escopo — pare e pergunte antes de implementar:** leaderboard, OAuth/login social, dados fora do CSV (2020+), recursos sociais, tempo real/multiplayer, múltiplas tentativas na mesma pergunta.

---

# Stack

| Camada | Tecnologia |
|---|---|
| Linguagem | TypeScript strict nos dois workspaces (sem `.js` de aplicação) |
| Frontend | Next.js 16 (App Router) + React + Tailwind CSS v4 |
| Backend | Node.js 20+ + Express 5 |
| Banco / ORM | PostgreSQL 16 (Docker Compose) + Prisma 7 |
| Auth | Email/senha, `bcrypt` + JWT HS256 em cookie `httpOnly` |
| Validação / Testes | `zod` · Jest + `ts-jest` + `supertest` |
| Repo | Monorepo com npm workspaces (`backend/`, `frontend/`) — use `npm` (Windows) |

**Atenção de versão (não regrida para APIs antigas):**
- **Next.js 16:** `cookies()`, `headers()`, `params` e `searchParams` são assíncronos — sempre `await`.
- **Prisma 7:** generator `provider = "prisma-client"` (não `prisma-client-js`) com `output` explícito; `PrismaClient` instanciado com driver adapter (`new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`); config de CLI/seed em `prisma.config.ts`, não no `package.json`.
- Na dúvida sobre API de biblioteca, consulte a documentação atual (Context7) em vez de assumir.

**Decisões tomadas além do PRD** (troque aqui se preferir outra coisa): TypeScript nos dois lados · Tailwind · zod · npm workspaces · portas `3000`/`4000` · `POST /api/auth/logout` (para o botão "Sair" da navbar) · paginação `{ items, page, pageSize, total }` · cookie `tga_token` · UI em pt-BR, código em inglês.

---

# Arquitetura do Projeto

```
Browser ──> Next.js :3000 (RSC + Client Components) ──> Express :4000 ──> Prisma ──> PostgreSQL
```

- **Só o backend fala com o banco.** O frontend nunca importa Prisma.
- **Camadas com dependência unidirecional:** `routes → controllers → services → prisma`
  - `routes`: caminho + middlewares (auth/validação). Sem lógica.
  - `controllers`: HTTP ↔ domínio. **Sem regra de negócio, sem Prisma.**
  - `services`: toda regra de negócio e todo acesso ao Prisma. Não conhece `req`/`res`.
  - Erros de negócio são `AppError`, formatados pelo error handler central (último middleware).

**Estrutura de pastas** (nada fora dessa árvore sem justificar; pasta nova vira linha aqui no mesmo commit):

```
TGA/ ── PRD.md · CLAUDE.md · ROADMAP.md · README.md · docker-compose.yml · package.json (workspaces) · data/the_game_awards.csv
├── backend/
│   ├── prisma/           schema.prisma · migrations/ · seed.ts · category-map.ts · eligibility.ts   (+ prisma.config.ts na raiz do workspace backend/)
│   ├── src/              server.ts · app.ts (exportado p/ testes) · config/env.ts · lib/prisma.ts · errors/AppError.ts · generated/prisma/ (gitignored, gerado pelo Prisma) · types/ (express.d.ts)
│   │                     middlewares/ (requireAuth, validate, notFound, errorHandler) · schemas/ · routes/ · controllers/ · services/
│   └── tests/            unit/ (elegibilidade, normalização, correção) · integration/ (fluxo completo) · helpers/
└── frontend/src/
    ├── app/              layout.tsx · page.tsx · explore/ · login/ · register/ · quiz/ · quiz/history/
    ├── components/       ui/ (primitivos burros) · layout/ (Navbar) · <feature>/ (NominationsTable, QuizCard, StatsSummary…)
    └── lib/api.ts (serverFetch) · lib/api.client.ts (clientFetch) · lib/api-error.ts (ApiError/parse) — ÚNICO ponto de acesso à API   (+ lib/session.ts · types/api.ts · styles/globals.css)
```

**Modelo de dados** (PRD 3.3 — não altere sem atualizar o PRD):

- `categories` — `id`, `canonicalName` (único), `slug` (único)
- `nominations` — `id`, `year`, `categoryId`, `nominee`, `company` (nullable), `isWinner`, `votedBy` (enum `jury|fan`)
- `quiz_questions` — `id`, `year`, `categoryId`, `correctNominationId` · **unique (`year`, `categoryId`)** · pré-computada no seed
- `users` — `id`, `email` (único), `passwordHash`, `createdAt`
- `quiz_attempts` — `id`, `userId`, `quizQuestionId`, `chosenNominationId`, `isCorrect`, `answeredAt` · **unique (`userId`, `quizQuestionId`)**
- Índices: `nominations(year, categoryId)`, `nominations(categoryId)`, `quizAttempts(userId)`

**Endpoints** (lista fechada — PRD 4.2):

| Público | Auth | Quiz (requer login) |
|---|---|---|
| `GET /api/years` | `POST /api/auth/register` | `GET /api/quiz/next` |
| `GET /api/categories?year=` | `POST /api/auth/login` | `POST /api/quiz/answer` |
| `GET /api/nominations?year=&categoryId=` | `GET /api/auth/me` · `POST /api/auth/logout` | `GET /api/quiz/history?page=&pageSize=` · `GET /api/quiz/stats` |

**Contrato de erro — obrigatório em 100% dos erros:** `{ "error": { "code": "EMAIL_ALREADY_EXISTS", "message": "Este email já está cadastrado." } }`. `code` em `SCREAMING_SNAKE_CASE` estável; `message` em pt-BR, seguro para exibir.

| 400 `VALIDATION_ERROR` | 401 `UNAUTHENTICATED` / `INVALID_CREDENTIALS` | 404 `NOT_FOUND` | 409 `EMAIL_ALREADY_EXISTS` / `QUESTION_ALREADY_ANSWERED` | 429 `TOO_MANY_REQUESTS` | 500 `INTERNAL_ERROR` |
|---|---|---|---|---|---|

**Regras de resposta:** `201` no register, `200` no resto, `204` no logout · listas paginadas em `{ items, page, pageSize, total }` · `/quiz/next` sem perguntas → `200 { question: null }` (não 404) · filtro sem resultado → `200` com lista vazia (não é erro) · nunca retorne `passwordHash`.

**Regra de ouro do Quiz:** o vencedor só chega ao cliente no catálogo/Exploração, na resposta do `POST /api/quiz/answer` e no `/quiz/history`. Em todo o resto use `select` explícito no Prisma para que a resposta não possa vazar por acidente.

---

# Convenções de Código

**Idioma:** código, identificadores, arquivos, commits e contratos de API em **inglês**; UI e documentação em **pt-BR**. Nunca misture (`buscarIndicados()` ou botão "Submit" estão errados).

| Item | Padrão | Exemplo |
|---|---|---|
| Arquivos TS backend | `kebab-case` + sufixo de camada | `quiz.service.ts`, `require-auth.ts` |
| Componentes React | `PascalCase.tsx` | `QuizCard.tsx` |
| Variáveis/funções · Tipos | `camelCase` · `PascalCase` sem prefixo `I` | `getNextQuestion` · `QuizQuestionDto` |
| Constantes globais | `SCREAMING_SNAKE_CASE` | `BCRYPT_ROUNDS` |
| Prisma | model `PascalCase` singular, campo `camelCase` + `@map`, tabela `snake_case` via `@@map` | `isWinner Boolean @map("is_winner")` |
| JSON da API · Rotas | `camelCase` · plural kebab-case | `{ "categoryId": 3 }` · `/api/quiz/history` |
| Migrations · Branches | `snake_case` descritivo · `tipo/descricao` | `add_quiz_attempts_unique_index` · `feat/quiz-endpoints` |

**TypeScript:** `strict: true`; **`any` proibido** (use `unknown` + narrowing); sem `@ts-ignore`; tipe o retorno de funções exportadas; prefira tipos derivados (gerados do Prisma, `ReturnType`) a redigitar shapes; imports ordenados externo → `@/` → relativo, sem imports não usados.

**Estilo:** funções pequenas (service acima de ~60 linhas provavelmente são duas); early return em vez de `else` aninhado, máximo 3 níveis; comentários explicam **por quê**, não o quê; sem código morto, `console.log` ou arquivo "backup" versionado; sem números mágicos; Prettier + ESLint antes de commitar.

---

# Padrões de UI/UX

- **Server Component é o padrão.** `'use client'` só com estado/efeito/evento, e sempre no componente mais folha possível.
- Páginas orquestram e buscam dados; componentes renderizam. `components/ui/` são primitivos burros (sem regra de negócio, sem fetch); `components/<feature>/` conhece o domínio.
- **Todo acesso à API passa por `lib/api.ts` / `lib/api.client.ts` / `lib/api-error.ts`** — `serverFetch` (em `lib/api.ts`, Server Components, encaminha o cookie via `(await cookies()).toString()`) e `clientFetch` (em `lib/api.client.ts`, browser, `credentials: 'include'`) ficam em arquivos separados porque um Client Component que importa qualquer coisa de um módulo que também importa `next/headers` quebra em runtime, mesmo sem usar a função que precisa dele. `lib/api-error.ts` concentra o que os dois compartilham (`ApiError`, `getApiUrl`, `parseResponse`). Ambos leem `NEXT_PUBLIC_API_URL`, parseiam o envelope de erro e lançam `ApiError` tipado. Nunca URL hardcoded fora desses módulos.
- Todo estado assíncrono trata os **quatro estados**: `loading`, `empty`, `error`, `success`. Vazio é amigável ("Nenhum indicado para este filtro"), não erro.
- **Navbar:** Explorar / Quiz / Histórico (os dois últimos só logado) + estado de sessão (Login/Registro ou email + Sair).
- **`/explore`:** ano e categoria vivem na query string (`?year=2018&categoryId=3`) para ser compartilhável; vencedor destacado com badge, nunca só por cor.
- **`/quiz`:** uma pergunta por vez → confirmar revela acerto/erro + vencedor real + "Próxima pergunta". Botão desabilitado enquanto pendente (evita duplo clique). Sem perguntas restantes → tela de conclusão com resumo.
- **`/quiz/history`:** estatísticas agregadas no topo, lista paginada abaixo.
- **Visual:** Tailwind utilitário, tokens do tema (nada de hex solto); mobile-first; tabela do Exploração em `overflow-x-auto` (a página nunca rola na horizontal); formulários com erro por campo + `Alert` geral + botão com loading.
- **Acessibilidade mínima:** HTML semântico (nada de `div` clicável), `label` em todo input, foco visível, contraste AA, feedback com texto + ícone (não só cor), `aria-live` na revelação da resposta.
- **Erros na UI (PRD 6):** 401 → redireciona para `/login` · 409 de resposta duplicada → trata como "já respondida" e avança · login inválido → mensagem genérica · fim das perguntas → tela de conclusão.

---

# Regras de Desenvolvimento

**Banco e ingestão**
- Toda mudança de schema passa por migration versionada (`prisma migrate dev --name ...`). Nunca `db push` fora de experimento descartável, nunca editar migration commitada, nunca SQL manual no banco.
- A **constraint única de `quiz_attempts` é a defesa contra resposta duplicada** — capture o `P2002` do Prisma e converta em 409; não confie só em checagem prévia.
- `PrismaClient` é singleton em `lib/prisma.ts` — nunca `new PrismaClient()` em service/controller.
- **O CSV é imutável.** Correções vão para `category-map.ts` ou para o seed, nunca para o arquivo.
- **Seed** (`prisma/seed.ts`): CSV → normalização → `categories` → `nominations` → elegibilidade → `quiz_questions`. Idempotente (rodar duas vezes dá o mesmo estado, e `users`/`quiz_attempts` não são apagados sem flag). Elegibilidade é **função pura em módulo próprio, com teste unitário** — nunca duplicada em service. String de categoria fora do mapa → **falhe alto** listando as desconhecidas, nunca crie categoria em silêncio. Use `createMany`; logue no fim o resumo (esperado: 9 combinações descartadas).

**Segurança**
- `bcrypt` com `BCRYPT_ROUNDS = 12`; senha mínima de 8 caracteres validada por zod.
- JWT HS256, payload `{ sub: userId }`, 7 dias, `JWT_SECRET` de 32+ chars. Cookie `tga_token` `httpOnly`, `sameSite: 'lax'` em dev / `'none' + secure` em produção cross-domain. **Nunca `localStorage`.**
- CORS com origem explícita (`FRONTEND_URL`) + `credentials: true`; nunca `origin: '*'` com credenciais. `helmet()`, `express.json({ limit: '100kb' })` e rate limit em `/api/auth/*`.
- **`userId` vem sempre de `req.user`** (populado por `requireAuth`), nunca de body/query. Todo acesso a `quiz_attempts` é filtrado por ele.
- Toda entrada externa passa por zod antes do controller. Env vars validadas em `config/env.ts` — sem `DATABASE_URL`/`JWT_SECRET` o processo falha na subida.
- Nunca commite `.env` (mantenha `.env.example` atualizado); nunca logue senha, hash, token ou cookie; em 500 logue o stack e devolva mensagem genérica.

**Performance**
- Sem N+1: use `include`/`select` numa query só; `select` explícito sempre nos endpoints de quiz.
- `/quiz/next` filtra no banco (`where: { attempts: { none: { userId } } }`), nunca em memória. `quiz_questions` é pré-computada justamente para não agregar por requisição.
- Histórico sempre paginado (`pageSize` padrão 20, máx. 100). Catálogo é imutável e pode ser cacheado; **rota autenticada nunca é cacheada** (`no-store`).
- Não otimize sem medir — nada de memoização especulativa ou índice "por precaução".

**Testes** (cobertura seletiva, PRD 7.1)
- Unitários obrigatórios: elegibilidade (com os 3 casos inelegíveis), normalização de categorias, correção da resposta e estatísticas.
- Integração obrigatória: `register → login → /quiz/next → /quiz/answer → /quiz/stats` com supertest sobre o `app` exportado, incluindo resposta duplicada → 409.
- Banco de teste separado — **nunca aponte teste para o banco de dev**. Testes independentes de ordem e que limpam o que criaram. Frontend é opcional no MVP.

**Ambiente e scripts:** `npm install` → `docker compose up -d` → copiar `backend/.env.example` para `backend/.env` e `frontend/.env.example` para `frontend/.env.local` (o Next só lê env de dentro de `frontend/`) → `npm run db:migrate -w backend` → `npm run db:seed -w backend` → `npm run dev`. Scripts: `dev`, `db:migrate`, `db:seed`, `db:reset` (recria do zero), `test`, `lint`, `format`, `typecheck`.

**Git:** Conventional Commits em inglês (`feat(quiz): add next question endpoint`); um commit = uma mudança coerente (não misture migration + refactor + feature); branches `feat/…`, `fix/…`, `chore/…`. Nunca commite `.env`, `node_modules/`, build output ou cliente Prisma gerado.

---

# Fluxo de Trabalho do Claude

**Antes de escrever:** leia este arquivo + a seção relevante do PRD · procure o que já existe (helper, service, componente `ui/`, tipo) antes de criar outro — duplicação é o principal risco aqui · confirme APIs de biblioteca na documentação atual (Context7), não na memória · **pare e pergunte** se a tarefa cair em "fora de escopo", exigir mudança de arquitetura, ou tiver duas leituras que levariam a trabalhos materialmente diferentes.

**Durante:** siga o padrão vizinho (um endpoint novo deve ser indistinguível dos anteriores) · respeite as camadas, sem atalho chamando Prisma do controller · escopo é o pedido: não refatore o que não foi pedido nem crie abstração para um caso único · não troque ORM/arquitetura nem adicione dependência sem justificar · não invente dados (linha ambígua vira caso de borda documentado) · em ambiguidade menor, escolha o mais simples e **declare a suposição** na resposta.

**Ordem de implementação do projeto:** scaffold + Docker + env → schema + migration → `category-map.ts` + seed + testes de elegibilidade (**valide o dataset antes de qualquer UI**) → catálogo → auth + `requireAuth` → endpoints de quiz → frontend (layout → `/explore` → auth → `/quiz` → `/quiz/history`) → integração, README, deploy.

**Ao terminar:** rode typecheck/lint/testes de verdade antes de dizer que está pronto · atualize `.env.example`, `README.md` e este `CLAUDE.md` no mesmo commit se algo estrutural mudou · relate honestamente teste que falhou, passo pulado ou parte incompleta.

---

# Checklist Antes de Finalizar

- [ ] `npm run typecheck` e `npm run lint` limpos; `npm test` passando (ou falha relatada com a saída real)
- [ ] Sem `any`, `@ts-ignore`, `console.log` ou código morto; nomes e idioma conforme as convenções
- [ ] Camadas respeitadas; entrada validada por zod; erros no envelope `{ error: { code, message } }` com o status correto
- [ ] Nenhum endpoint de quiz expõe o vencedor antes da resposta; `userId` sempre do token; `select` explícito, sem N+1
- [ ] Mudança de schema tem migration versionada; `npm run db:reset` roda do zero; seed segue idempotente; CSV intacto
- [ ] Frontend: Server Component por padrão, API só via `lib/api.ts`, quatro estados tratados, acessibilidade e responsividade ok
- [ ] Nenhum segredo commitado, nada sensível em log, rotas autenticadas atrás de `requireAuth`
- [ ] Teste novo/atualizado se mexeu em regra de negócio; docs afetadas atualizadas; commit coeso em Conventional Commits
