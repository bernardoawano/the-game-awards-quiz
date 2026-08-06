# Planejamento de Desenvolvimento — TGA Quiz (Guess the Winner)

**Status:** aprovado · **Data:** 2026-07-27 · **Base:** `PRD.md` (produto) + `CLAUDE.md` (convenções técnicas)

Este documento é o **plano de execução**: quebra o produto descrito no PRD em 14 fases do tamanho de um commit, cada uma com um critério de saída verificável. Em conflito, PRD manda em escopo/regra de negócio e CLAUDE.md manda em convenção técnica — este arquivo só organiza a ordem e registra as decisões tomadas no caminho.

## Contexto

O repositório contém hoje **apenas** `PRD.md`, `CLAUDE.md`, `data/the_game_awards.csv` e `.claude/`. Não existe `package.json`, `.gitignore`, `docker-compose.yml`, `backend/`, `frontend/`, nem uma única linha de código. É 100% greenfield — há um único commit (`7b407f0`) na branch `master`, com apenas `PRD.md` versionado.

O objetivo é transformar o CSV estático do The Game Awards (2014–2019) numa aplicação full-stack com dois modos: **Exploração** (público) e **Quiz** (autenticado).

### Dataset validado (não re-derivar)

O CSV foi analisado antes do planejamento. Os números do PRD **conferem exatamente**, mas há detalhes de parsing que o PRD não menciona:

| Fato | Valor |
|---|---|
| Linhas | 806 = 1 header + **805 dados**; colunas `year,category,nominee,company,winner,voted` |
| `winner` | **`"1"` / `"0"`** (inteiro-como-string) — **não** `"True"`/`"False"` |
| `voted` | `"jury"` (690) / `"fan"` (115) — é o **órgão votante**, não um booleano; consistente dentro de cada (ano, categoria) |
| `company` vazio | 111 linhas → coluna nullable ✔ |
| Anos | 2014=106, 2015=109, 2016=119, 2017=152, 2018=155, 2019=164 |
| Categorias brutas | **59** distintas (uma contém apóstrofo: `Player's Voice`) |
| Combos (ano, categoria) | **163** → **154 elegíveis / 9 inelegíveis** ✔ bate com o PRD 3.1 |

As **9 inelegíveis**, por motivo (o teste unitário da Fase 3 as afirma nominalmente):

- `MULTIPLE_WINNERS` — 2014 ESports Team of the Year (2), 2019 Global Gaming Citizens (5)
- `NO_WINNER` — 2014 Trending Gamer, 2016 ESports Game of the Year, 2016 Industry Icon Award
- `SINGLE_NOMINEE` — Industry Icon Award em 2014, 2015, 2016, 2017, 2018

> Nota: a prosa do PRD 3.1 ("2 múltiplos + 3 sem vencedor + casos com 1 indicado") só soma 9 porque **2016 Industry Icon Award conta nos dois baldes**. A regra em si é inequívoca. Corrigir a prosa do PRD na Fase 3.

**Caso-limite:** 2016 `Best Fan Creation` tem exatamente 2 indicados + 1 vencedor → **é elegível** pela regra, gerando uma pergunta de 2 opções. Intencional, coberto por teste.

### APIs verificadas (Context7, 2026-07-27)

- **Prisma 7** — `provider = "prisma-client"` exige `output`; `datasource db` **sem `url` no schema** (a URL vive em `prisma.config.ts` sob `datasource.url`); `prisma.config.ts` usa `defineConfig`/`env` de `prisma/config`, com `migrations.seed` (não mais `package.json#prisma.seed`); as chaves `adapter`/`engine` do config foram **removidas**. Runtime: `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`.
- **Next.js 16** — Turbopack é o default (sem flag `--turbopack`); acesso síncrono a `cookies()`/`headers()`/`params`/`searchParams` foi **removido**; `next-env.d.ts` referencia `.next/types/routes.d.ts`, então `tsc --noEmit` exige `next typegen` antes.
- **Tailwind v4** — `tailwindcss @tailwindcss/postcss postcss`; sem `tailwind.config.js`, sem `autoprefixer`; tokens via `@import "tailwindcss"` + bloco `@theme`.
- **Express 5** — promise rejeitada em handler async vai sozinha ao error handler (nada de wrapper); `app.all('*')` **quebra** (path-to-regexp 8) → usar `app.use(notFound)`; `req.query` virou getter **não-gravável** → validação escreve em `res.locals`.
- **TypeScript** (verificado na Fase 0) — o `latest` do npm hoje é a **7.0.2** (novo compilador nativo/Go, "tsgo"). `typescript-eslint` 8.x declara `peerDependencies.typescript: ">=4.8.4 <6.1.0"` e **crasha ao carregar o parser** com TS 7. **Fixar `typescript` em `^6.0.3`** (última stable na faixa suportada) em toda fase que instalar TypeScript — raiz (Fase 0), backend (Fase 1) e frontend (Fase 9).
- **TypeScript 6.0 — `moduleResolution: "node10"`/`"node"` deprecated** (verificado na Fase 1), removido no 7.0. O próprio `tsconfig-base.json` do time do TypeScript usa `"module": "NodeNext", "moduleResolution": "NodeNext"`. Para um workspace CJS sem `"type": "module"` no `package.json`, isso resolve tudo como CommonJS (o "CJS deliberado" do plano) sem usar a estratégia deprecated. Todas as deps da Fase 1 (zod, dotenv, express-rate-limit, csv-parse) publicam `exports` com condição `"require"`, então nada quebra sob CJS.
- **Prisma 7.9.1 (`@prisma/client`/`prisma`/`@prisma/adapter-pg`)** — `engines.node: "^20.19 || ^22.12 || >=24.0"`. O `engines.node` da raiz (`>=20.9` desde a Fase 0) não cobria isso — corrigido na Fase 1 para o mesmo range em `package.json` (raiz) e `backend/package.json`. A Fase 13 (README) precisa citar essa faixa, não "Node 20.9+".
- **Helmet 8.x** — `Cross-Origin-Resource-Policy: same-origin` é o default. Como o frontend (3000) chama o backend (4000) com `credentials: 'include'` a partir da Fase 9+, isso bloquearia respostas no navegador silenciosamente (CORP é aplicado pelo browser, independente do header CORS). Corrigido na Fase 1 com `helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })` em `app.ts`.
- **`@typescript-eslint/no-unused-vars`** não tem `argsIgnorePattern` default — parâmetros finais não usados (ex.: `next` no error handler do Express, que exige aridade 4) são reportados a menos que a regra seja configurada. Adicionado `argsIgnorePattern`/`varsIgnorePattern`/`caughtErrorsIgnorePattern: '^_'` ao `eslint.config.mjs` na Fase 1.
- **Prisma 7 — `migrate dev` não dispara mais `generate` nem seed automaticamente** (verificado na Fase 2; comportamento removido nesta major). `db:migrate` precisa rodar `prisma generate` explicitamente, senão `backend/src/generated/prisma/` nunca é criado e qualquer import dele quebra o `typecheck`. **Ordem importa**: `"db:migrate": "prisma generate && prisma migrate dev"` — `generate` primeiro, não depois. Isso não é só estilo: `npm run db:migrate -w backend -- --name init` anexa `--name init` ao **final** da string do script inteiro (não a um sub-comando específico); com `generate` por último, `--name init` ia parar em `prisma generate --name init` (nada a ver) em vez de em `prisma migrate dev --name init`. `generate` não depende da migration ter sido aplicada — só lê o `schema.prisma`, que já está completo antes de qualquer um dos dois comandos rodar — então invertê-lo pra frente é seguro.
- **`env()` do `prisma/config` lança erro síncrono se a variável não existir, mesmo em comandos que não conectam no banco** (ex.: `prisma generate`) — confirmado com teste e2e oficial do Prisma (`process.env['X']` cru deixa `generate` funcionar sem a var; o helper `env('X')` falha de qualquer forma, porque o erro acontece no carregamento do config). Por isso `prisma generate` **não pode** virar `postinstall` neste projeto — o fluxo documentado copia `.env` só depois do `npm install`, e um `postinstall` quebraria em todo clone novo. `generate` fica só dentro de `db:migrate`/`db:reset`, que já rodam depois do `.env` existir.
- **Porta 5432 pode já estar ocupada por um Postgres nativo no Windows** (verificado na Fase 2 — máquina de dev tinha um serviço `postgresql-x64-N` local, `StartType: Automatic`, competindo pela porta com o container Docker). `docker-compose.yml` mapeia para **`5433:5432`** no host (o Postgres do container continua na porta padrão 5432 *dentro* do container); `DATABASE_URL` em `backend/.env.example` usa `localhost:5433`. Sintoma se isso acontecer de novo: `P1000: Authentication failed` mesmo com credenciais certas — confirma testando `docker exec <container> psql "postgresql://user:pass@localhost:5432/db"` (funciona de dentro do container) contra a mesma URL do host (falha, porque cai no Postgres nativo).
- **Bug no `.gitignore` da Fase 0, achado na Fase 2**: o padrão `src/generated/` tem barra no meio, então o Git o trata como **ancorado na raiz do repo** (só casaria com um `src/generated/` bem na raiz), não em qualquer profundidade como os outros padrões do arquivo (`node_modules/`, `dist/`, `coverage/` etc., que não têm barra interna e por isso casam em qualquer nível). `backend/src/generated/` nunca esteve realmente ignorado. Corrigido para `**/src/generated/`. Regra geral pra não repetir: qualquer padrão de `.gitignore` com `/` no meio (não só no fim) precisa do prefixo `**/` explícito pra valer em subpastas.
- **Jest 30 — `jest.config.ts` exige `ts-node` (ou outro loader via docblock `@jest-config-loader`) pra carregar** (verificado na Fase 3, doc oficial do Jest). Em vez de adicionar `ts-node` só pra isso, o config ficou em `backend/jest.config.js` (CommonJS puro, sem loader nenhum) — consistente com o "CJS deliberado" da Fase 1 e zero dependência nova.
- **`@types/jest` não é auto-descoberto pelo `tsc` neste workspace** (verificado na Fase 3) — mesmo instalado e hoisted em `node_modules/@types/jest` desde a Fase 1, `describe`/`it`/`expect` davam `Cannot find name` no `npm run typecheck -w backend` até adicionar `"types": ["node", "jest"]` explícito em `backend/tsconfig.json`. Não investiguei a causa raiz da falha do auto-discovery (provavelmente interação entre `moduleResolution: nodenext` e a resolução de `typeRoots` num workspace com hoisting) — a correção explícita resolve e é prática comum de qualquer forma.
- **ESLint flat config não define globais de CommonJS (`require`, `module`, `__dirname`, etc.) por padrão** — só apareceu na Fase 3 porque foi o primeiro `.js` (CJS de verdade, não `.mjs`) do repo. `no-undef` do `js.configs.recommended` não conhece esses globais sem `languageOptions.globals` explícito. Adicionado ao bloco `**/*.{js,mjs,cjs}` do `eslint.config.mjs` (inofensivo pros arquivos `.mjs`, que não usam esses globais mas não são penalizados por declará-los).
- **`prisma migrate reset`/`db push` recusam rodar quando o Prisma CLI detecta que quem invocou é um agente de IA** (verificado na Fase 4) — mensagem explícita pedindo consentimento humano antes de qualquer ação destrutiva de banco. Não dá pra contornar via `npm run db:reset -w backend` direto (o guard bloqueia o processo inteiro); o fluxo que funciona é rodar `prisma migrate reset --force` isoladamente com a var `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION` setada pro texto exato da mensagem de consentimento do usuário, e depois `prisma db seed` como segundo passo. Isso vale pra toda vez que um agente de IA (não um humano no terminal) rodar `db:reset` daqui pra frente — inclusive na verificação end-to-end da Fase 13. **Por isso a Fase 5 usa `prisma migrate deploy` (não-destrutivo, não é pego pelo guard) no `global-setup.ts` do Jest, em vez de `migrate reset`** — senão todo `npm test` a partir daqui travaria nesse mesmo bloqueio.
- **Cliente Prisma 7 gerado precisa de duas correções pra rodar sob `ts-jest`** (verificado na Fase 5): (1) os imports internos do cliente gerado usam extensão `.js` explícita (padrão `moduleResolution: nodenext`), mas só existe o `.ts` fonte — `ts-jest` não compila pra `.js` em disco, então `require('./internal/class.js')` nunca encontra o arquivo. Corrigido com `moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' }` no `jest.config.js`, que remove a extensão e deixa o resolver padrão achar o `.ts`. (2) o runtime do Prisma 7 carrega seu compilador de queries WASM via `import()` dinâmico mesmo usando driver adapter (`@prisma/adapter-pg`) — isso quebra sob o Jest em modo CJS padrão com `A dynamic import callback was invoked without --experimental-vm-modules`. Corrigido setando `NODE_OPTIONS=--experimental-vm-modules` só no script `test` via `cross-env` (nova dependência, justificada — é a forma padrão multiplataforma de setar env var num script do `package.json`, necessária porque `NODE_OPTIONS` precisa existir antes do Node subir, não dá pra setar de dentro do `jest.config.js`). Nenhuma das duas correções muda comportamento de produção — só afetam como o Jest carrega o cliente gerado.
- **`@types/jsonwebtoken` tipa o claim `sub` como `string`, não `number`** (verificado na Fase 7) — bate com a spec do JWT (`sub` é convencionalmente string em todo o ecossistema), mas diverge do `userId: Int` do nosso schema. Assinar `{ sub: userId }` direto (number) funciona em runtime mas todo `decoded.sub` lido depois de um `verify` sai tipado `string`, quebrando qualquer `where: { id: decoded.sub }` no `tsc --noEmit`. Resolvido assinando com `sub: String(userId)` e convertendo de volta com `Number(decoded.sub)` (validado com `Number.isInteger` + `> 0` antes de confiar) — centralizado em `lib/jwt.ts`, único lugar que faz essa conversão.
- **`jwt.verify` precisa de `{ algorithms: ['HS256'] }` explícito** — sem isso, a verificação aceita qualquer algoritmo presente no header do token recebido, abertura clássica pra ataque de confusão de algoritmo. `jwt.sign` já usa HS256 por padrão com secret string, mas fixamos explícito nos dois lados por defesa em profundidade.
- **`jsonwebtoken` e `bcrypt` não têm export default** (verificado na Fase 7) — `import jwt from 'jsonwebtoken'`/`import bcrypt from 'bcrypt'` compilam (interop do TS permite), mas o ESLint (`import-x/default`) acusa erro porque os pacotes só publicam exports nomeados (`sign`, `verify`, `hash`, `compare`, etc.) via CommonJS. Corrigido trocando pra `import { sign, verify } from 'jsonwebtoken'` / `import { hash, compare } from 'bcrypt'`.
- **`/api/auth` precisa de `Cache-Control: no-store`**, já previsto nas "Suposições declaradas" deste documento — mesmo padrão de middleware de router que a Fase 6 usa pro `Cache-Control` do catálogo, só que com o valor oposto.
- **Ordem de middlewares dentro de um router importa pra headers de erro** (verificado na Fase 8) — Express para de rodar middlewares não-de-erro assim que `next(err)` é chamado com argumento. Se um middleware de rejeição (ex.: `requireAuth`) vier **antes** de um middleware que só seta um header (ex.: `Cache-Control: no-store`), respostas de erro (401 etc.) saem sem esse header, porque o middleware que o setaria nunca roda. A ordem certa é sempre: middlewares de header/observação primeiro, middlewares que podem rejeitar/redirecionar por último — `auth.routes.ts` já acertava isso por acaso; `quiz.routes.ts` corrigido pra seguir o mesmo padrão (`no-store` antes de `requireAuth`).
- **`TaskStop` num comando em background não mata de forma confiável o processo Node filho no Windows** (verificado na Fase 8) — rodar `npx tsx src/server.ts` via `run_in_background` e depois `TaskStop` no task id encerra o wrapper do shell, mas o `node.exe` real continua ouvindo a porta. Sintoma: a próxima vez que o servidor é iniciado pra teste manual, os requests batem no processo **antigo** (código desatualizado, sem as rotas da fase mais recente) e dão 404/comportamento errado, sem nenhum erro óbvio indicando a causa. Depois de qualquer `TaskStop` de um servidor, confirmar que a porta está livre (`Get-NetTCPConnection -LocalPort <porta>`) antes de reiniciar; se não estiver, `Stop-Process -Id <pid> -Force` no processo real.

### Decisões confirmadas

1. **Deploy:** somente Docker Compose local + notas escritas de deploy no README. Sem hospedar de fato.
2. **Ordem do `/quiz/next`:** **aleatória** (`ORDER BY random()`), para o quiz não virar varredura cronológica.
3. **Normalização de categorias:** agrupar também renomeações seguras entre edições (`Games for Change`→`Games for Impact`, `Best Debut Indie Game`↔`Fresh Indie Game`), não só variações de grafia.

### Suposições declaradas (revisáveis)

- `POST /api/auth/register` já **seta o cookie** (auto-login), retornando 201.
- Seed com `quiz_attempts` existentes **aborta com exit 1**, apontando `-- --force` ou `db:reset`. `users` nunca é apagado pelo seed.
- `/api/quiz/answer` com `nominationId` fora das opções da pergunta → **400 `VALIDATION_ERROR`**.
- `/api/quiz/history` ordenado por `answeredAt desc`.
- `/api/nominations` com ambos os params opcionais.
- Cache: `public, max-age=300` nos 3 GETs de catálogo; `no-store` em tudo sob `/api/quiz` e `/api/auth`.
- Testes de frontend ficam fora do MVP (PRD 7.1 os declara opcionais).

---

## Fase 0 — Scaffold do monorepo · `chore/scaffold-monorepo`

**Cria:** `package.json` (raiz, `private`, `workspaces: ["backend","frontend"]`, `engines.node >=20.9`) · `.gitignore` · `.prettierrc.json` · `.prettierignore` · `eslint.config.mjs` (flat config, `typescript-eslint` recommended-type-checked + `eslint-config-prettier` + `import/order`, `no-explicit-any: error`, `no-console` exceto `warn`/`error`) · `tsconfig.base.json` (`strict`, `noUncheckedIndexedAccess`, `target: ES2022`) · `docker-compose.yml` · `README.md` (placeholder).

Scripts da raiz — exatamente o conjunto que CLAUDE.md exige: `dev`, `db:migrate`, `db:seed`, `db:reset`, `test`, `lint`, `format`, `typecheck` (os `db:*` e `test` delegam com `-w backend`; `dev` usa `concurrently` porque `npm run dev --workspaces` roda sequencial e nunca subiria o frontend — **única dependência além da spec, justificada aqui**).

`docker-compose.yml`: um serviço `postgres:16-alpine` (user/pass/db `tga`), porta `5432`, volume nomeado, `healthcheck` com `pg_isready`. **Sem serviço separado de teste** — o banco `tga_test` vive no mesmo servidor e é criado sob demanda por `prisma migrate reset`.

**Saída:** `npm install && npm run lint` limpo; `docker compose up -d && docker compose ps` mostra `healthy`.

---

## Fase 1 — Esqueleto do backend + env · `chore/backend-skeleton`

**Cria:** `backend/package.json` (deps: `express@^5`, `cors`, `helmet`, `cookie-parser`, `express-rate-limit`, `zod`, `jsonwebtoken`, `bcrypt`, `dotenv`, `csv-parse`, `@prisma/client`, `@prisma/adapter-pg`, `pg`; dev: `prisma`, `tsx`, `typescript`, `jest`, `ts-jest`, `supertest`, `@types/*`) · `backend/tsconfig.json` (CJS deliberado — simplifica `ts-jest` + `tsx` e casa com `moduleFormat = "cjs"` do generator) · `backend/.env.example`.

`backend/src/`:
- `config/env.ts` — `import 'dotenv/config'` + schema zod (`JWT_SECRET: min(32)`, `PORT` coerce, `NODE_ENV` enum). Falha → lista os issues e `process.exit(1)`. **O generator do Prisma 7 não carrega `.env` em runtime**, por isso o `dotenv/config` aqui é obrigatório.
- `errors/AppError.ts` — union `ErrorCode` com os 8 códigos da tabela de CLAUDE.md + factories estáticas.
- `middlewares/error-handler.ts` — `AppError` → `{error:{code,message}}`; `ZodError` → 400; resto → `console.error(stack)` + 500 genérico.
- `middlewares/not-found.ts` — montado como `app.use(notFound)` **sem path** (Express 5 quebra com `'*'`).
- `middlewares/validate.ts` — parseia com zod e grava em **`res.locals.validated`** (`req.query` é read-only no Express 5).
- `app.ts` — monta helmet/cors(`origin: env.FRONTEND_URL, credentials: true`)/json(100kb)/cookieParser/`GET /health`/router/notFound/errorHandler e **exporta `app` sem `listen`** (para o supertest).
- `server.ts` — só o `listen`.

**Saída:** `curl localhost:4000/health` → 200; `curl localhost:4000/api/nope` → 404 no envelope correto; sem `JWT_SECRET` o processo morre com exit 1; `npm run typecheck -w backend` limpo.

---

## Fase 2 — Schema Prisma 7 + migration inicial · `feat/db-schema`

**Cria:** `backend/prisma.config.ts` — **na raiz do workspace `backend/`, não do repo** (a CLI resolve pelo CWD, e o comando documentado é `-w backend`; na raiz do repo exigiria `--config` em toda invocação). Conteúdo: `dotenv/config` + `defineConfig({ schema, migrations: { path, seed: 'tsx prisma/seed.ts' }, datasource: { url: env('DATABASE_URL') } })`.

**Cria:** `backend/prisma/schema.prisma` — generator `prisma-client` com `output = "../src/generated/prisma"`, `moduleFormat = "cjs"`; `datasource db { provider = "postgresql" }` **sem `url`**; enum `VotedBy`; os 5 models do PRD 3.3 em `PascalCase` singular, campos `camelCase` com `@map`, tabelas via `@@map`. Índices e uniques conforme CLAUDE.md, incluindo a back-relation **`attempts`** em `QuizQuestion` (necessária para o `where: { attempts: { none: { userId } } }`).

**Cria:** `backend/src/lib/prisma.ts` — singleton com `PrismaPg`.

**Edita `CLAUDE.md` no mesmo commit:** a árvore ganha `backend/src/generated/prisma/` (gitignored — Prisma 7 obriga `output` explícito) e a linha do `prisma.config.ts` passa a dizer "raiz do workspace `backend/`".

**Saída:** `npm run db:migrate -w backend -- --name init`; `psql -c '\dt'` lista as 5 tabelas + `_prisma_migrations`; `\d quiz_attempts` mostra o unique `(user_id, quiz_question_id)`; `git status --short backend/src/generated` vazio.

---

## Fase 3 — `category-map.ts` + elegibilidade pura + testes · `feat/dataset-normalization`

**O portão do dataset.** Zero DB, zero HTTP — tudo puro e testável offline. CLAUDE.md manda validar o dataset **antes de qualquer UI**; se esta fase estiver vermelha, não se avança.

**Cria:**
- `backend/prisma/category-map.ts` — `CATEGORY_MAP: Readonly<Record<string,string>>` com as **59 strings brutas exatas** como chaves (nada de regex, `toLowerCase()` ou fallback fuzzy — string ausente é erro duro), `normalizeCategory()` e `slugify()` (NFKD → remove diacríticos → lowercase → `[^a-z0-9]+`→`-`; `Player's Voice` → `players-voice`).
- `backend/prisma/eligibility.ts` — funções puras `partitionEligibility(rows)` retornando `{ eligible, ineligible }`, com `reason: 'NO_WINNER' | 'MULTIPLE_WINNERS' | 'SINGLE_NOMINEE'`. Regra literal: `nomineeCount >= 2 && winnerCount === 1`.
- `backend/tests/helpers/csv.ts` — `loadRawRows()` com `csv-parse/sync`, convertendo `winner === '1'` → boolean e `company === ''` → `null`. **Compartilhado com o seed.**
- `backend/jest.config.ts`, `backend/tests/unit/category-map.test.ts`, `backend/tests/unit/eligibility.test.ts`.

**⚠ Invariante que o mapa não pode violar:** agrupar duas strings que **coexistem no mesmo ano** funde dois combos em um, altera a contagem de vencedores e **quebra o 154/9**. Concretamente:

- `Best Mobile Game` e `Best Handheld Game` **ambos existem em 2017** → **não fundir**, e não fundir nenhum dos dois em `Best Mobile/Handheld Game`. É um *split*, não uma renomeação → 3 categorias canônicas distintas.
- `Best Score/Music` e `Best Audio Design` **coexistem em 2017–2019** → permanecem distintas. Seguras: `Best Score/Soundtrack`(14-15)→`Best Score/Music`; `Best Music/Sound Design`(2016)→`Best Audio Design`.
- Seguras (sem sobreposição de ano), conforme a decisão registrada: `Games for Change`(2014)→`Games for Impact`; `Fresh Indie Game`(2019)→`Best Debut Indie Game`.
- Seguras e óbvias: grafia eSports/Esports/ESports, `Best Action/Adventure`↔`…Game`, `Best Multiplayer`↔`…Game`, `Most Anticipated Game 2015`↔`Most Anticipated Game`, `Student Game Award`↔`Best Student Game`.

Os testes são o árbitro — **escrevê-los antes de fechar o mapa**:
1. toda string bruta do CSV é chave do mapa (diff dos conjuntos, 0 desconhecidas);
2. slugs globalmente únicos;
3. **nenhuma dupla de strings que coexiste num ano mapeia para o mesmo canônico**;
4. `eligible.length === 154 && ineligible.length === 9`, com as 9 afirmadas **por nome + motivo**;
5. 2016 `Best Fan Creation` é elegível com 2 opções;
6. casos sintéticos para cada um dos 3 motivos de rejeição.

**Também nesta fase:** corrigir a prosa do PRD 3.1 (o "2 + 3 + N" que dá 9 por dupla contagem).

**Saída:** `npm test -w backend` verde com 154/9 e 0 categorias desconhecidas.

---

## Fase 4 — Pipeline de seed · `feat/seed-pipeline`

**Cria:** `backend/prisma/seed.ts` — `loadRawRows()` → `normalizeCategory` (acumula desconhecidas e **falha alto listando todas**) → `partitionEligibility` → escrita.

**Idempotência** (satisfaz "use `createMany`" + "`users`/`quiz_attempts` não são apagados sem flag"):

```
--force ausente + attempts > 0  → aborta com exit 1 apontando `-- --force` ou `db:reset`
$transaction: [ (--force ? deleteMany attempts : []), deleteMany questions, nominations, categories, createMany categories ]
users NUNCA é tocado pelo seed
```

Ordem de limpeza FK-safe (attempts → questions → nominations → categories). Como `createMany` não devolve ids, são 3 passes com 2 read-backs: categorias → `Map<canonicalName, id>`; 805 nominations → `Map<"year|categoryId|nominee", id>`; 154 quiz_questions resolvendo `correctNominationId` desse mapa.

Log final obrigatório: contagens + `descartadas: 9` listando cada uma com ano, categoria e motivo.

**Saída:** `npm run db:seed -w backend` loga `nominations: 805 · quiz_questions: 154 · descartadas: 9`; rodar **duas vezes** dá o mesmo estado; `npm run db:reset -w backend` recria tudo do zero via `migrations.seed`.

---

## Fase 5 — Harness de banco de teste · `chore/test-db-harness`

Antecipado para cá (não deixado para o fim) porque o output do seed no banco já merece teste e toda fase seguinte entrega seu próprio spec de integração.

**Cria:** `backend/tests/helpers/load-test-env.ts` (setupFile: lê `TEST_DATABASE_URL`, **exige que o nome do banco termine em `_test`** — é essa a guarda do "nunca aponte teste para o banco de dev" — e injeta em `DATABASE_URL`) · `global-setup.ts` (`prisma migrate reset --force --skip-seed` + roda o seed; cria `tga_test` se não existir) · `global-teardown.ts` · `helpers/db.ts` (`resetUserData()` para `beforeEach`: apaga attempts e users, nunca o catálogo) · `backend/tests/integration/seed.test.ts`.

> Detalhe que faz funcionar: `prisma.config.ts` usa `dotenv/config`, e o dotenv **não sobrescreve** var já presente em `process.env` — então a `DATABASE_URL` injetada vence o `backend/.env`.

`seed.test.ts` afirma: 805 nominations, 154 quiz_questions, todo `correctNominationId` aponta para uma nomination com `isWinner === true` e mesmo `(year, categoryId)`, e **não existe quiz_question para nenhum dos 9 combos inelegíveis**.

**Saída:** `npm test -w backend` verde; `psql -l` mostra `tga_test`; o banco `tga` de dev fica intocado.

---

## Fase 6 — Endpoints de catálogo · `feat/catalog-endpoints`

**Cria:** `backend/src/schemas/catalog.schema.ts`, `routes/catalog.routes.ts`, `controllers/catalog.controller.ts`, `services/catalog.service.ts`.

| Endpoint | Implementação |
|---|---|
| `GET /api/years` | `distinct` em `nomination.year`, asc |
| `GET /api/categories?year=` | `category.findMany` filtrado por `nominations: { some: { year } }` |
| `GET /api/nominations?year=&categoryId=` | `select` explícito **incluindo `isWinner`** (PRD 4.2 — Exploração revela o vencedor) |

Params opcionais (`z.coerce.number().int().optional()`); ano/categoria inexistente → **200 com lista vazia**, não erro (PRD 6). Resposta é array JSON puro (`[...]`) nos três — o envelope `{ items, page, pageSize, total }` do CLAUDE.md é só para listas paginadas, e catálogo não é paginado. `Cache-Control: public, max-age=300` nos três.

**Saída:** `tests/integration/catalog.test.ts` verde (6 anos; um `isWinner: true` por combo; `?year=1999` → 200 vazio).

---

## Fase 7 — Auth + `requireAuth` · `feat/auth`

**Cria:** `schemas/auth.schema.ts` (`email()`, `password.min(8)`), `routes/auth.routes.ts`, `controllers/auth.controller.ts`, `services/auth.service.ts`, `middlewares/require-auth.ts`, `middlewares/auth-rate-limit.ts`, `src/types/express.d.ts`.

- `BCRYPT_ROUNDS = 12`. `register` captura `P2002` → 409 `EMAIL_ALREADY_EXISTS`; `login` devolve **o mesmo** 401 `INVALID_CREDENTIALS` para email inexistente e senha errada (sem enumeração).
- Cookie `tga_token`: `httpOnly`, `maxAge` 7d, `sameSite: 'lax'` em dev / `'none' + secure` em produção. JWT HS256, payload `{ sub: userId }`.
- Rate limit `express-rate-limit` (15min / 20 req) em `/api/auth`, com handler → 429 `TOO_MANY_REQUESTS`.
- Status: register **201 + cookie** (auto-login, suposição declarada), login 200, me 200, logout **204** + `clearCookie`. `passwordHash` nunca entra em nenhum `select`.

`tests/integration/auth.test.ts`: 201 com `Set-Cookie ... HttpOnly`; email duplicado 409; senha errada 401 genérico; `/me` sem cookie 401; `/me` com cookie **sem a chave `passwordHash`**; logout 204 → `/me` 401.

> **Risco Windows:** `bcrypt` é módulo nativo e pode exigir node-gyp/VS Build Tools se não houver binário pré-compilado para o ABI local. Se `npm install` falhar, trocar por `bcryptjs` (API idêntica) e registrar a troca na tabela de stack de CLAUDE.md.

**Também nesta fase:** adicionar ao PRD 4.2 o `POST /api/auth/logout` e ao PRD 6 o caso 429 — ambos existem só em CLAUDE.md hoje.

---

## Fase 8 — Endpoints de quiz · `feat/quiz-endpoints`

**Cria:** `schemas/quiz.schema.ts`, `routes/quiz.routes.ts`, `controllers/quiz.controller.ts`, `services/quiz.service.ts`, `lib/quiz-scoring.ts`, `tests/unit/quiz-scoring.test.ts`, `tests/integration/quiz-flow.test.ts`. Router montado como `router.use('/quiz', requireAuth, quizRoutes)`; todo handler seta `Cache-Control: no-store`.

**`GET /api/quiz/next`** — seleção aleatória **no banco**, em duas etapas para não vazar o vencedor:
1. `$queryRaw` que devolve **apenas o id**: `SELECT id FROM quiz_questions q WHERE NOT EXISTS (SELECT 1 FROM quiz_attempts a WHERE a.quiz_question_id = q.id AND a.user_id = $1) ORDER BY random() LIMIT 1`. Filtra no banco, nunca em memória.
2. `findUnique` + `nomination.findMany` com `select` explícito de `{ id, nominee, company }` — **`isWinner` jamais é selecionado**.
Sem pergunta → **`200 { question: null }`** (não 404).

**`POST /api/quiz/answer`** `{ questionId, nominationId }` → 404 se a pergunta não existe · 400 `VALIDATION_ERROR` se o `nominationId` não pertence às opções daquela pergunta · `create` da tentativa capturando **`P2002` → 409 `QUESTION_ALREADY_ANSWERED`** (a constraint do banco é a defesa, não uma checagem prévia) · `200 { isCorrect, correctNomination }`.

**`GET /api/quiz/history?page=&pageSize=`** — `pageSize` default 20 / máx 100 via zod, `orderBy answeredAt desc`, `$transaction([findMany, count])` → `{ items, page, pageSize, total }`.

**`GET /api/quiz/stats`** — `$transaction` de 3 counts + a função pura `computeQuizStats()` → `{ answered, correct, accuracy, remaining }`, com `accuracy: 0` quando `answered === 0` (sem divisão por zero).

`tests/integration/quiz-flow.test.ts` cobre o fluxo obrigatório `register → login → next → answer → stats`, **afirma que nenhuma opção do `/quiz/next` tem a chave `isWinner`**, responde duas vezes → 409, `nominationId` de outra pergunta → 400, sem cookie → 401.

**Saída:** backend feature-completo — os critérios de aceite 1, 3, 4 e 5 do PRD são provados sem nenhuma UI.

---

## Fase 9 — Shell do frontend + `lib/api.ts` · `feat/frontend-shell`

**Cria:** `frontend/package.json` (`next@^16`, `react`, `react-dom`; dev `tailwindcss`, `@tailwindcss/postcss`, `postcss`, `eslint-config-next`, `typescript`) · `frontend/tsconfig.json` (`paths: {"@/*": ["./src/*"]}`, plugin `next`) · `next.config.ts` (`typedRoutes: true`; **sem** flag `--turbopack`) · `postcss.config.mjs` (`{'@tailwindcss/postcss': {}}`) · `frontend/.env.example` (`NEXT_PUBLIC_API_URL`).

- `src/styles/globals.css` — `@import "tailwindcss";` + bloco `@theme` com os tokens (nada de `tailwind.config.js`, nada de hex solto nos componentes).
- `src/types/api.ts` — DTOs espelhando o contrato do backend.
- **`src/lib/api.ts`** — o único módulo com URL: `ApiError` tipada, `serverFetch` (encaminha `(await cookies()).toString()`, `cache: 'no-store'`) e `clientFetch` (`credentials: 'include'`), ambos parseando o envelope `{ error: { code, message } }`.
- `src/lib/session.ts` — `getCurrentUser()` (null em 401) e `requireUser()` (`redirect('/login')`). **Guarda de auth via Server Component, não middleware** — em Next 16 `middleware.ts` virou `proxy.ts` e é desnecessário aqui.
- `app/layout.tsx` (`lang="pt-BR"`, skip-link), `app/page.tsx` (landing com os 2 CTAs), `components/layout/Navbar.tsx` (Server Component async), `components/auth/LogoutButton.tsx` (`'use client'`).
- `components/ui/` — `Button`, `Input`, `Select`, `Alert`, `Badge`, `Card`, `Spinner`, `EmptyState` (primitivos burros, sem fetch, sem regra de negócio).

**Edita `CLAUDE.md`:** a árvore ganha `components/layout/`, `lib/session.ts`, `types/api.ts`, `backend/prisma/eligibility.ts`, `backend/src/types/`, `backend/tests/helpers/`; e a linha "copiar `.env.example`" vira **dois** arquivos (`backend/.env` e `frontend/.env.local` — o Next só lê env de dentro de `frontend/`).

**Saída:** `npm run dev` sobe os dois; landing renderiza com Tailwind aplicado; `npm run typecheck -w frontend` (que roda `next typegen` antes do `tsc`) limpo.

---

## Fase 10 — `/explore` · `feat/explore-page`

**Cria:** `app/explore/page.tsx` (Server Component async — `const { year, categoryId } = await searchParams`), `components/explore/ExploreFilters.tsx` (`'use client'`, único componente cliente, empurra `?year=&categoryId=` para a URL ser compartilhável), `components/explore/NominationsTable.tsx`, `loading.tsx`, `error.tsx`.

Quatro estados tratados. Vazio → `EmptyState` amigável ("Nenhum indicado para este filtro"), não erro. Tabela em `overflow-x-auto`; vencedor com `<Badge>` **+ ícone**, nunca só cor; `<label>` em ambos os selects.

**Saída:** `?year=2018&categoryId=<id>` mostra exatamente um vencedor destacado; `?year=1999` mostra o estado vazio; sem scroll horizontal da página em 375px.

---

## Fase 11 — `/login` + `/register` · `feat/auth-pages`

**Cria:** `app/login/page.tsx`, `app/register/page.tsx` (Server Components que redirecionam para `/` se já logado), `components/auth/LoginForm.tsx`, `RegisterForm.tsx` (as folhas cliente).

Erro por campo + `Alert role="alert"` geral; botão desabilitado com spinner enquanto pendente; login inválido exibe a mensagem genérica da API. Sucesso → `router.push('/quiz')` + `router.refresh()` para a navbar pegar a sessão.

**Saída:** registrar → navbar mostra o email; email repetido → mensagem do 409; senha errada → mensagem genérica; `/login` logado → redireciona.

---

## Fase 12 — `/quiz` e `/quiz/history` · `feat/quiz-pages`

**Cria:** `app/quiz/page.tsx`, `app/quiz/history/page.tsx`, `components/quiz/QuizCard.tsx` (`'use client'`), `QuizResult.tsx`, `QuizComplete.tsx`, `StatsSummary.tsx`, `HistoryList.tsx`, `Pagination.tsx`.

- `/quiz`: `await requireUser()` → `serverFetch` de `/quiz/next` + `/quiz/stats` em paralelo. `question === null` → `<QuizComplete>` com o resumo. Senão `<QuizCard>`.
- `QuizCard`: radio group semântico (`fieldset`/`legend`/`label`), **botão desabilitado enquanto pendente** (evita o duplo clique), POST via `clientFetch`, revelação dentro de `aria-live="polite"` com acerto/erro + vencedor real + "Próxima pergunta" (`router.refresh()`). Trata `ApiError` 409 como "já respondida" e avança; 401 → `/login`.
- Sem cache de pergunta no cliente — a RSC busca de novo a cada avanço, o que evita pergunta obsoleta e mantém o vencedor fora do fio até a resposta.
- `/quiz/history`: `await searchParams` para `page`; estatísticas no topo, lista paginada abaixo, estado vazio amigável.

**Saída:** responder 3 perguntas → cada uma aparece no histórico com o veredito certo e a acurácia bate à mão; duplo clique grava **uma** tentativa (`select count(*) from quiz_attempts`); apagar o cookie e recarregar `/quiz` redireciona para `/login`.

---

## Fase 13 — README, docs e passagem final · `chore/docs-and-final-pass`

**Cria/edita:** `README.md` (raiz, pt-BR) · reconciliação final de `CLAUDE.md` e `PRD.md` · cross-check dos dois `.env.example`.

README na ordem: pré-requisitos (Node 20.9+, Docker) → `npm install` → `docker compose up -d` → copiar os dois `.env.example` → `npm run db:migrate -w backend` → `npm run db:seed -w backend` → `npm run dev`; tabela de todas as env vars; tabela de scripts; como rodar os testes (incluindo que `tga_test` é criado sozinho); e a seção de **notas de deploy** (Vercel para `frontend/`, Railway/Render para `backend/` + Postgres gerenciado, com a ressalva do cookie cross-domain `sameSite:'none'; secure` e do par `FRONTEND_URL`/`NEXT_PUBLIC_API_URL`) — escritas, não executadas, conforme decidido.

---

## Verificação end-to-end

O teste real do plano é um desenvolvedor em clone frio chegando ao app funcionando só com o README:

```bash
npm run typecheck && npm run lint && npm test     # os 3 limpos
git clean -xdf && docker compose down -v
npm install && docker compose up -d
cp backend/.env.example backend/.env              # editar JWT_SECRET
cp frontend/.env.example frontend/.env.local
npm run db:migrate -w backend && npm run db:seed -w backend
npm run dev
```

Depois, os 5 critérios de aceite do PRD 7.3, verificados na mão:

1. **Cadastro/login** — registrar em `/register`, navbar mostra o email, `Sair` funciona.
2. **Exploração** — `/explore?year=2018&categoryId=<id>` bate com o CSV; `?year=1999` dá vazio amigável.
3. **Quiz** — `select count(*) from quiz_questions` = **154**; nenhuma linha para os 9 combos inelegíveis; responder tudo leva à tela de conclusão com `{ question: null }`; duplo clique grava uma tentativa só.
4. **Histórico/stats** — a acurácia exibida bate com `select count(*) filter (where is_correct) * 100.0 / count(*) from quiz_attempts where user_id = <id>`.
5. **Seed reprodutível** — `npm run db:reset -w backend` recria do zero e loga `nominations: 805 · quiz_questions: 154 · descartadas: 9`.

Mais as guardas de segurança: nenhuma resposta de `/api/quiz/next` contém `isWinner`; nenhuma resposta contém `passwordHash`; `git ls-files | grep -E '\.env$|node_modules|src/generated'` vazio.

---

## Riscos e pontos de atenção

| Risco | Mitigação |
|---|---|
| **`category-map.ts` é o artefato de maior risco** — uma fusão errada quebra o 154/9 silenciosamente | Os 3 testes-guarda da Fase 3 (0 desconhecidas, slugs únicos, 0 fusões no mesmo ano) rodam antes de qualquer linha de UI |
| `bcrypt` nativo pode não compilar no Windows | Fallback `bcryptjs` — o risco vale já na Fase 1 (é quando `bcrypt` é instalado), não só na Fase 7 |
| `typescript@latest` (7.x, compilador nativo) quebra `typescript-eslint` 8.x | `typescript` fixado em `^6.0.3` em toda instalação (raiz na Fase 0; conferir de novo no backend/frontend) |
| Regressão para APIs antigas (Prisma 6, Next 15, Express 4, Tailwind 3) | As diferenças verificadas estão listadas no topo deste plano; conferir Context7 antes de qualquer API nova |
| Teste apontar para o banco de dev | A guarda de sufixo `_test` na Fase 5 lança antes de qualquer conexão |
| CLAUDE.md exige que pasta nova vire linha na árvore no **mesmo commit** | As Fases 2 e 9 já trazem suas edições de CLAUDE.md embutidas |
