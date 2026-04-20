# Midrah Ponto

Sistema web interno de **registro de ponto e controle de acesso** da Midrah. Substitui o controle manual atual com uma solução auditável, com geolocalização e selfie obrigatórias em cada marcação, e base arquitetural preparada para até 1.000 colaboradores e futura integração com roleta física.

> ⚠️ O arquivo `chronos-ponto-system.jsx` é um protótipo visual **histórico** e não é parte do produto. Não edite.

## Stack

| Camada              | Tecnologia                                     |
| ------------------- | ---------------------------------------------- |
| Frontend            | Next.js 15 (App Router) · Tailwind · React Query |
| Backend             | NestJS 10 · Prisma · passport-jwt (JWKS)       |
| Banco / Auth / Storage | Supabase (Postgres + Auth + Storage privado) |
| Deploy              | Vercel (web) · Railway (api)                   |
| Observability       | Sentry · pino logs                             |
| Monorepo            | pnpm workspaces · Node ≥ 20.11                 |

## Estrutura

```
apps/
  web/     # Next.js — UI, Supabase Auth client, registro de ponto
  api/     # NestJS — regras de negócio, Prisma, validação JWT
packages/
  shared/  # tipos TS, enums e zod schemas compartilhados (@midrah/shared)
docs/      # ARCHITECTURE, DATA-MODEL, CONVENTIONS, QA-REPORT
.claude/   # 8 agentes especializados e settings
```

## Pré-requisitos

- Node ≥ 20.11
- pnpm 9.12+ (`corepack enable && corepack prepare pnpm@9.12.0 --activate`)
- Conta Supabase com projeto criado (Postgres, Auth e Storage habilitados)
- Bucket de Storage **privado** chamado `evidencias` (a migração cria isso via SQL, mas confira no painel)

## Bootstrap local

```bash
# 1. Instalar dependências
pnpm install

# 2. Subir pacote compartilhado (types/enums/zod)
pnpm --filter @midrah/shared build

# 3. Configurar envs
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
#   preencha com as credenciais do seu projeto Supabase

# 4. Banco — gera client + aplica schema + CHECKs + RLS + seed
pnpm --filter @midrah/api prisma generate
pnpm --filter @midrah/api prisma migrate deploy   # aplica as 3 migrations em ordem
pnpm --filter @midrah/api prisma db seed

# 5. Subir tudo em paralelo
pnpm dev
#   → web  em http://localhost:3000
#   → api  em http://localhost:3333
#   → docs em http://localhost:3333/docs (Swagger)
```

### Variáveis de ambiente

#### `apps/api/.env`

| Variável                     | Exemplo                                             |
| ---------------------------- | --------------------------------------------------- |
| `DATABASE_URL`               | `postgres://...?pgbouncer=true` (pooled)            |
| `DIRECT_URL`                 | `postgres://...` (direto, usado por migrations)     |
| `SUPABASE_URL`               | `https://<projeto>.supabase.co`                     |
| `SUPABASE_ANON_KEY`          | chave anon do projeto                               |
| `SUPABASE_SERVICE_ROLE_KEY`  | **secret** — nunca exponha ao frontend              |
| `SUPABASE_JWT_ISSUER`        | `https://<projeto>.supabase.co/auth/v1`             |
| `SUPABASE_JWKS_URL`          | `https://<projeto>.supabase.co/auth/v1/.well-known/jwks.json` |
| `CORS_ORIGIN`                | `http://localhost:3000`                             |
| `ROLETA_WEBHOOK_SECRET`      | string aleatória (HMAC do stub de roleta)           |

#### `apps/web/.env.local`

| Variável                       | Exemplo                                |
| ------------------------------ | -------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`     | `https://<projeto>.supabase.co`        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| chave anon                             |
| `NEXT_PUBLIC_API_URL`          | `http://localhost:3333`                |

## Fluxo de primeiro login

O colaborador é criado via `POST /colaboradores` (rota admin, painel `/admin/colaboradores`). Essa criação dispara convite por email no Supabase Auth. O colaborador clica no link, define a senha, e volta para `/login`.

Quando loga pela primeira vez, o frontend chama **`POST /auth/sync` (rota pública)** enviando o JWT no header. O backend:

1. Valida o JWT contra o JWKS do Supabase.
2. Busca `colaboradores` por `email` (lowercased, `deleted_at IS NULL`).
3. Se achar e ainda não houver `auth_user_id`, grava o vínculo (upsert-style).
4. Retorna o perfil (mesma resposta de `GET /auth/me`).

Depois do primeiro `/auth/sync`, todas as rotas autenticadas passam a funcionar normalmente via `JwtAuthGuard`, que exige tanto o JWT válido quanto o colaborador vinculado e ativo.

**Recuperação de senha:** a partir de `/login` o usuário acessa `/esqueci-senha` e recebe um link Supabase que abre `/nova-senha`. O middleware não intercepta essas rotas; a sessão de recovery é tratada pelo SDK e derrubada via `signOut()` após a troca.

Erros esperados em `/auth/sync`:

| Código                       | Quando acontece                                           |
| ---------------------------- | --------------------------------------------------------- |
| `NO_TOKEN`                   | header Authorization ausente ou mal formatado             |
| `SEM_EMAIL`                  | JWT sem claim `email`                                     |
| `COLABORADOR_NAO_CADASTRADO` | email do JWT não existe em `colaboradores`                |
| `VINCULO_CONFLITO`           | colaborador já vinculado a outro `auth.users.id`          |

## Perfis e permissões

| Perfil        | Pode                                                                 |
| ------------- | -------------------------------------------------------------------- |
| `admin`       | tudo, incluindo logs de auditoria, export CSV e registro manual      |
| `rh`          | CRUDs completos; ver todas marcações; registrar marcação manual      |
| `gestor`      | ver colaboradores e marcações **apenas do próprio setor**; não edita |
| `colaborador` | registrar próprio ponto; ver próprio histórico e selfies próprias    |

**Registro manual (admin/RH):** Para casos onde câmera ou GPS falham, admin/RH pode registrar marcação via `POST /marcacoes/manual` ou botão "Registro manual" em `/admin/marcacoes`. Justificativa é obrigatória (mínimo 10 caracteres) e a marcação fica com `origem = "manual"` — filtrável e auditada.

Frontend aplica `PermissionGate`; backend aplica `@Roles()` + `JwtAuthGuard` + RLS no Postgres como defesa em profundidade.

## Comandos úteis

```bash
pnpm dev                                     # web + api em paralelo
pnpm lint                                    # ESLint em todos workspaces
pnpm typecheck                               # tsc --noEmit em todos workspaces
pnpm test                                    # vitest nos workspaces que testam

pnpm --filter @midrah/api prisma studio      # GUI do banco
pnpm --filter @midrah/api prisma migrate dev # nova migration local
pnpm --filter @midrah/api test               # unit tests (marcacoes, etc.)
```

## Registro de ponto

Fluxo crítico em `/ponto`:

1. Solicita permissão de geolocalização (timeout 10s). Sem GPS → bloqueia.
2. Captura selfie com `getUserMedia` (câmera frontal), redimensiona para 640×480 JPEG 0.7.
3. `POST /evidencias/upload` → sobe para bucket privado `evidencias/{colaborador_id}/{uuid}.jpg`, devolve `evidencia_id`.
4. `POST /marcacoes` com `{ tipo, latitude, longitude, precisao_m, evidencia_id }`.
5. Backend valida a sequência lógica (não aceita `saida` sem `entrada` no dia, `pausa_fim` sem `pausa_inicio`, etc.).
6. Marcação gravada + log de auditoria + reload do histórico.

## Agentes

Oito agentes `.claude/agents/` dividem o trabalho:

- **Principais**: architecture-lead · frontend-builder · backend-builder · qa-planner
- **Especializados**: integration-specialist · security-reviewer · database-specialist · devops-deploy

Chamar os especializados apenas sob demanda (Supabase edge, auditoria de segurança, migrations complexas, deploy Vercel/Railway).

## Deploy

- **Web** → Vercel (automático no push da `master` com envs configuradas)
- **API** → Railway (Dockerfile em `apps/api/Dockerfile`, migrations rodam no boot)
- **Banco / Auth / Storage** → Supabase (mesmo projeto em staging e prod)

Detalhes completos em `docs/ARCHITECTURE.md` (devops-deploy é quem mantém).

## O que **não** está no MVP

- Biometria facial (comparação de faces). A selfie é só evidência.
- App mobile nativo. Web responsivo basta.
- Integração ativa com roleta — apenas stub HMAC em `/roleta/webhook`.
- Folha de ponto oficial / cálculo de horas extras.
- SSO corporativo (SAML/OIDC). Supabase Auth email+senha é suficiente.
