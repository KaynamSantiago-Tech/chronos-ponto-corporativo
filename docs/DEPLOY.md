# Deploy — Midrah Ponto

Guia operacional para colocar o sistema no ar. Um ambiente de **staging** (piloto com ~10 colaboradores) e um de **produção** (~180 cadastros iniciais).

## Visão geral

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   Vercel     │──────▶│   Railway    │──────▶│   Supabase   │
│  @midrah/web │  JWT  │  @midrah/api │  PG   │  Postgres +  │
│   Next.js 15 │       │   NestJS 10  │       │  Auth + Stg  │
└──────────────┘       └──────────────┘       └──────────────┘
      │                       │                      │
      └───── Sentry ──────────┴──────── Sentry ──────┘
```

- **Vercel** hospeda `apps/web` (Next.js). Região sugerida: `gru1` (São Paulo).
- **Railway** hospeda `apps/api` (NestJS). Região sugerida: `us-east4` ou `us-west`.
- **Supabase** fornece Postgres + Auth + Storage (`sa-east-1`).
- **Sentry** recebe erros e performance de ambos.

## Pré-requisitos (uma vez)

1. Criar projeto no Supabase (plano Pro recomendado p/ produção pelo SLA e backups diários).
2. Copiar as chaves do painel em `Project Settings → API`:
   - `URL`
   - `anon public` → usado no web e no api (leitura com RLS)
   - `service_role` → usado **apenas** no api (bypass de RLS; nunca expor no web)
   - `JWT → JWKS URL`
3. Criar bucket `evidencias` em `Storage` com **Private** (as políticas de RLS são aplicadas pelas migrations em `20260420000002_rls_policies`).
4. Criar projeto Sentry separado para web e api (DSN diferentes).

## Variáveis de ambiente

### `apps/api` (Railway)

| Variável | Obrigatória | Valor |
|---|---|---|
| `DATABASE_URL` | ✅ | Pooled (`pgbouncer=true&connection_limit=1`) |
| `DIRECT_URL` | ✅ | Direct connection (usado em migrations) |
| `SUPABASE_URL` | ✅ | `https://xxxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | ✅ | chave anon |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | **privada** — nunca copiar em logs |
| `SUPABASE_JWT_ISSUER` | ✅ | `https://xxxxx.supabase.co/auth/v1` |
| `SUPABASE_JWKS_URL` | ✅ | URL do JWKS exibida no painel |
| `SUPABASE_STORAGE_BUCKET` | ✅ | `evidencias` |
| `CORS_ORIGIN` | ✅ | URL pública do web (ex: `https://ponto.midrah.com.br`) |
| `SENTRY_DSN` | recomendado | DSN do projeto Sentry api |
| `ROLETA_WEBHOOK_SECRET` | ✅ | string aleatória ≥ 32 chars |
| `PORT` | opcional | Railway injeta automaticamente; default 3333 |
| `NODE_ENV` | ✅ | `production` |
| `EXPOSE_SWAGGER` | opcional | `true` reabre `/docs` em produção (default: bloqueado) |

### `apps/web` (Vercel)

| Variável | Obrigatória | Valor |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | mesma do api |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | anon (nunca service_role) |
| `NEXT_PUBLIC_API_URL` | ✅ | URL pública do api Railway (ex: `https://api-midrah.up.railway.app`) |
| `NEXT_PUBLIC_SENTRY_DSN` | recomendado | DSN do projeto Sentry web |

## Primeiro deploy (passo a passo)

### 1. Railway — `apps/api`

```bash
# No painel Railway: New Project → Deploy from GitHub repo
# Branch: master
# Root directory: /
# O arquivo apps/api/railway.toml é detectado automaticamente.
```

Passos no painel:
1. Settings → Environment → colar todas as variáveis `apps/api`.
2. Settings → Networking → gerar domínio público (ou apontar CNAME próprio).
3. Deploy. A primeira build roda `prisma migrate deploy` no `startCommand`, aplicando as 3 migrations iniciais.

Verificação:
```bash
curl https://<dominio-railway>/health    # { "status": "ok" }
curl https://<dominio-railway>/docs       # Swagger UI — apenas fora de prod ou com EXPOSE_SWAGGER=true
```

### 2. Vercel — `apps/web`

```bash
# No painel Vercel: Add New → Project → importar do GitHub
# Root directory: apps/web
# Framework: Next.js (detectado)
```

Passos:
1. Configurar variáveis em Project Settings → Environment Variables.
2. Vercel lê `apps/web/vercel.json` e usa o buildCommand que faz `pnpm install` na raiz do monorepo.
3. Deploy.

Verificação:
- Abrir a URL pública → `/login`.
- Logar com usuário seed (ver `apps/api/prisma/seed.ts`).
- Chamar `POST /auth/sync` deve retornar 200 com o perfil.

### 3. Domínio customizado (opcional)

- Vercel: adicionar `ponto.midrah.com.br` em Project → Domains e apontar CNAME.
- Railway: adicionar `api.midrah.com.br` em Networking → Custom Domain.
- Atualizar `CORS_ORIGIN` no api e `NEXT_PUBLIC_API_URL` no web com os domínios finais.

## Migrations

Aplicação automática no deploy do api (`railway.toml` → `prisma migrate deploy`).

Manual (ex: troubleshooting):
```bash
pnpm --filter @midrah/api prisma migrate deploy
```

**Nunca** rodar `prisma migrate dev` contra banco de staging/prod — gera diff e reseta.

Rollback de migration: criar **nova** migration reversa em `apps/api/prisma/migrations/`. Nunca editar uma migration já aplicada.

## Backups

Supabase Pro inclui backups diários automáticos com retenção de 7 dias no plano inicial. Política recomendada:

- Diário: automático pela Supabase.
- Semanal: baixar dump via `pg_dump` com `DIRECT_URL` para armazenamento frio (S3, Drive corporativo).
- Evidências (selfies): o bucket é auditável pelo painel; considerar lifecycle após 90 dias para classe "cold" ou bucket arquivo.

Script sugerido (cron semanal em máquina interna):
```bash
pg_dump "$DIRECT_URL" --no-owner --no-acl --format=custom -f "midrah-$(date +%Y%m%d).dump"
```

## Observabilidade

- **Sentry web**: inclui Replay (`maskAllText=true`, `blockAllMedia=true` — LGPD-friendly).
- **Sentry api**: erros 5xx capturados pelo `HttpExceptionFilter`.
- **Logs Railway**: `nestjs-pino` em JSON. Para filtrar nível em produção: `LOG_LEVEL=warn`.
- **Logs Vercel**: stdout do Next.js aparece em Deployments → Runtime Logs.

Dashboards de acompanhamento:
- Sentry web/api → Issues.
- Supabase → Database → Query Performance.
- Vercel/Railway → Metrics.

## Checklist antes do piloto (staging)

- [ ] Supabase com bucket `evidencias` criado (Private).
- [ ] Railway api sobe `/health` em 200.
- [ ] Vercel web carrega `/login` sem erros no console.
- [ ] Login de admin seed funciona e redireciona para `/dashboard`.
- [ ] `/ponto` pede GPS + câmera e registra uma entrada de ponta a ponta.
- [ ] Selfie aparece em `/admin/marcacoes` via botão "Selfie".
- [ ] Export CSV em `/admin/marcacoes` baixa o arquivo.
- [ ] Sentry recebe erro forçado (`throw new Error('teste')` em rota debug temporária).

## Troubleshooting

| Sintoma | Causa provável | Ação |
|---|---|---|
| `401 UNAUTHORIZED` em `/auth/sync` | JWT expirou ou JWKS errada | Conferir `SUPABASE_JWT_ISSUER` e `SUPABASE_JWKS_URL` |
| `COLABORADOR_NAO_CADASTRADO` no login | E-mail do login não existe em `colaboradores` | RH deve cadastrar antes do convite |
| Upload de selfie retorna `403` | Bucket não é Private ou policy faltando | Reaplicar migration `20260420000002_rls_policies` |
| Build Vercel falha em `@midrah/shared` | Ordem de build incorreta | Garantir que `buildCommand` roda `pnpm --filter @midrah/shared build` primeiro |
| `prisma migrate deploy` falha no start | `DIRECT_URL` não configurada | Adicionar `DIRECT_URL` nas env vars do Railway |
