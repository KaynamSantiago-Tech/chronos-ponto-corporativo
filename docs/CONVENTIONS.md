# Convenções — Midrah Ponto

Regras de código e processo. Tudo que vier deve seguir este doc. Alterações exigem PR.

## Linguagem

- **UI, mensagens, nomes de tabelas, colunas, endpoints e DTOs: português.**
- **Código (tipos TS, variáveis, funções, comentários): inglês.**
- Datas e horários: `America/Sao_Paulo` na UI (via `date-fns-tz`); armazenados e transportados em UTC ISO 8601.

## Estrutura de pastas

| Caminho | Regra |
|---------|-------|
| `apps/web/app/` | App Router. Agrupar por domínio: `(auth)`, `(app)`, `api`. |
| `apps/web/components/ui/` | Componentes shadcn copiados. Não editar nome de arquivo. |
| `apps/web/components/` | Componentes do domínio (nome em kebab-case, export default). |
| `apps/web/lib/` | Helpers puros (sem JSX). |
| `apps/web/hooks/` | Hooks customizados, um por arquivo, prefixo `use`. |
| `apps/api/src/modules/<dominio>/` | 1 módulo Nest por recurso. Estrutura padrão: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`. |
| `apps/api/src/common/` | Guards, filters, interceptors, decorators. |
| `apps/api/prisma/migrations/` | Geradas pela CLI. Não editar após aplicadas. |
| `packages/shared/src/` | Apenas código isomórfico (funciona em Node e browser). Zero I/O. |

Arquivo: **kebab-case** (`marcacoes.service.ts`). Pasta: kebab-case. Classe: **PascalCase** (`MarcacoesService`). Variável/função: **camelCase**.

## Rotas HTTP

Todos endpoints REST plural, minúsculo, kebab-case quando composto:

| Método | Padrão |
|--------|--------|
| Listar | `GET /colaboradores` |
| Detalhar | `GET /colaboradores/:id` |
| Criar | `POST /colaboradores` |
| Atualizar (parcial) | `PATCH /colaboradores/:id` |
| Remover (soft quando aplicável) | `DELETE /colaboradores/:id` |
| Ações específicas | `POST /colaboradores/:id/reativar` |
| Rotas do usuário autenticado | `/...me` (ex.: `GET /marcacoes/me`) |

Versionamento: **sem prefixo `/v1`** no MVP. Se quebrar contrato depois, criar `/v2/<rota>`.

## Shape de resposta

**Sucesso de listagem paginada:**
```json
{
  "items": [ ... ],
  "total": 123,
  "page": 1,
  "page_size": 50
}
```

**Sucesso de item:** objeto direto, sem wrapper.

**Erro:**
```json
{
  "statusCode": 409,
  "message": "entrada já registrada hoje",
  "code": "MARCACAO_SEQUENCIA_INVALIDA",
  "details": { "ultima_marcacao": "entrada", "registrada_em": "2026-04-16T12:00:00Z" }
}
```

`code` é enum de erros de domínio (em `packages/shared/src/enums/error-codes.ts` a criar). `details` é opcional, para debug. Nunca expor stack trace.

## Paginação e filtros

Query params obrigatórios em listagens: `page` (default 1), `page_size` (default 50, max 200). Filtros sempre opcionais, em snake_case: `?setor_id=...&inicio=...&fim=...`.

Ordenação default: `created_at DESC`. Exceção: `marcacoes` ordena por `registrada_em DESC`.

## Validação

- **API:** `class-validator` + `class-transformer` em DTOs. Pipe global com `whitelist: true, forbidNonWhitelisted: true, transform: true`.
- **Web:** `react-hook-form` + `zod` em formulários. Schemas vêm de `@midrah/shared/schemas` quando existem (fonte única de verdade).
- Ao discordar entre web e api: ganha o `packages/shared`.

## Datas

- **Na API:** sempre `DateTime` do Postgres (`timestamptz`). Serializar via ISO 8601 UTC (`2026-04-16T12:00:00.000Z`).
- **Na UI:** formatar só no momento de exibir, com `format(new Date(iso), "dd/MM/yyyy HH:mm", { locale: ptBR })`.
- Nunca manipular timezone manualmente. Usar `date-fns-tz` quando precisar converter para `America/Sao_Paulo`.

## Logs

### API (pino)
```ts
this.logger.info({ colaborador_id, tipo }, "marcacao.criada");
```
- Sempre **objeto como primeiro arg**, mensagem curta em snake_case.
- Nível `info` para fluxos normais, `warn` para tentativas inválidas esperadas, `error` só para exceções inesperadas.
- Nunca logar PII sensível (CPF completo, senha, JWT). Mascarar quando necessário.

### Web
- `console.error` apenas para erros não tratados (Sentry captura).
- Sem `console.log` em código commitado — usar devtools durante debug.

## Auditoria

`AuditLogInterceptor` registra automaticamente em `logs_auditoria` todas mutations (`POST`, `PATCH`, `DELETE`) em módulos administrativos. Handler pode customizar via `@Audit({ acao: 'colaborador.desativar' })`. Eventos especiais (login) registrados manualmente no `AuthService`.

## Erros de domínio

Usar `HttpException` com `code` específico. Exemplos:

| Código HTTP | `code` | Quando |
|-------------|--------|--------|
| 400 | `VALIDACAO_FALHOU` | DTO inválido (pipe global). |
| 401 | `NAO_AUTENTICADO` | JWT ausente/inválido. |
| 403 | `SEM_PERMISSAO` | RBAC bloqueou. |
| 404 | `NAO_ENCONTRADO` | Recurso não existe. |
| 409 | `MARCACAO_SEQUENCIA_INVALIDA` | Tentou `saida` sem `entrada`. |
| 409 | `COLABORADOR_JA_EXISTE` | Email/CPF/matrícula duplicados. |
| 422 | `GEOLOCALIZACAO_AUSENTE` | Registro sem lat/long (regra de negócio). |
| 429 | `LIMITE_EXCEDIDO` | ThrottlerGuard. |
| 500 | `ERRO_INTERNO` | Fallback. |

## Env vars

- **Nome:** SCREAMING_SNAKE_CASE.
- **Público no web:** prefixo `NEXT_PUBLIC_`.
- **Nunca** commitar valores reais. `.env.example` obrigatório na raiz + em cada app.
- Validar no boot com `zod` (em `apps/api/src/config/env.schema.ts` e `apps/web/lib/env.ts`). Se inválido, processo aborta.

## Estilo de código

- **ESLint** com `@typescript-eslint` + regras do Next.js + `eslint-plugin-sonarjs` (api).
- **Prettier** com: `printWidth: 100`, `trailingComma: "all"`, `singleQuote: false`, `arrowParens: "always"`.
- **Import order** (auto via `simple-import-sort`):
  1. Node builtins
  2. Externos
  3. `@midrah/*`
  4. Relativos
- **Sem default exports em `apps/api`.** Always named exports. Em `apps/web/app/` e componentes React, default export é permitido.

## Git

- **Branches:** `feat/<descricao>`, `fix/<descricao>`, `chore/<descricao>`, `docs/<descricao>`.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org). Formato: `tipo(escopo): descrição`.
  - `feat(marcacoes): validar sequência antes de gravar`
  - `fix(auth): refresh token não renovava em rota pública`
  - `chore(ci): adicionar typecheck no PR`
- **PR:** título segue mesma regra; descrição obrigatória com "O que" e "Por quê".
- **Merge:** squash, sem rebase obrigatório.
- **Protected branch:** `master` (por ora). Ideal passar para `main` quando for possível no repo.

Obs.: este repo tem hook `PostToolUse` que auto-commita e dá push a cada `Write`/`Edit`. É conveniente durante bootstrap, mas **desabilitar antes de entrar em fluxo de time** (PRs revisados) — remover do `.claude/settings.local.json`.

## Testes

- **API:** Jest (já vem com NestJS). Unitários em `*.spec.ts` ao lado do arquivo. E2E em `apps/api/test/`.
- **Web:** Vitest + Testing Library. Cobertura em telas críticas (`/ponto`, `/login`).
- **Regra mínima antes de merge:** `pnpm typecheck && pnpm lint && pnpm test` verde.
- **Checkpoint MVP:** cobertura mínima de 60% em `MarcacoesService`, `AuthService`, `ColaboradoresService`.

## CI (GitHub Actions)

Workflows em `.github/workflows/`:

- `web-ci.yml` → on push to `master` + PRs alterando `apps/web/` ou `packages/shared/`: install, typecheck, lint, build.
- `api-ci.yml` → mesma coisa para `apps/api/`. Adicionar step `prisma migrate deploy` contra DB efêmero (service container postgres 16).

Concorrência: `cancel-in-progress: true` para evitar filas longas.

## Pontos Deliberadamente em Aberto

1. **Commitlint/Husky.** Depois do MVP, adicionar `@commitlint/config-conventional` + `simple-git-hooks`.
2. **Renovate/Dependabot.** Configurar em `.github/` após estabilizar dependências.
3. **Storybook para componentes.** Fase 4+ se a quantidade de componentes crescer.
4. **API de feature flags.** Se começar a ter muito `if (env.HABILITAR_X)`, adotar GrowthBook ou Unleash.
