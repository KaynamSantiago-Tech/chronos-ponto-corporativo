# CLAUDE.md

Guidance for Claude Code working in this repository.

## Project Overview

**Midrah Ponto** — Sistema web interno de ponto e controle de acesso da Midrah. Substitui o protótipo visual anterior (`chronos-ponto-system.jsx`, mantido no repo apenas como referência histórica e não deve ser editado).

Metas: ~180 usuários no curto prazo, arquitetura preparada para até 1.000. Inclui registro de ponto com geolocalização + selfie e ganchos para futura integração com roleta por API.

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 15 (App Router) + Tailwind + shadcn/ui |
| Backend | NestJS 10 + Prisma + passport-jwt |
| Banco/Auth/Storage | Supabase (Postgres + Auth + Storage) |
| Deploy | Vercel (web) + Railway (api) |
| Observability | Sentry |
| Package manager | pnpm workspaces (Node ≥ 20.11) |

## Monorepo

```
apps/
  web/           # Next.js — UI e Supabase Auth client
  api/           # NestJS — regras de negócio, validação JWT, Prisma
packages/
  shared/        # tipos, enums e zod schemas compartilhados (@midrah/shared)
docs/
  ARCHITECTURE.md
  DATA-MODEL.md
  CONVENTIONS.md
  QA-REPORT.md
.claude/agents/  # definições dos 4 subagents (architecture-lead, frontend-builder, backend-builder, qa-planner)
```

## Autenticação

Supabase Auth emite JWT (email+senha, reset, convites). NestJS valida a assinatura via JWKS e sincroniza o `auth.users.id` com `colaboradores.auth_user_id`. RLS no Postgres é a segunda linha de defesa para leituras diretas do frontend via `@supabase/supabase-js`.

**Perfis:** `admin`, `rh`, `gestor`, `colaborador`.

## Convenções

- UI e mensagens em **português brasileiro** (`pt-BR`).
- Nomes de entidades e colunas em português (`colaboradores`, `marcacoes`, `setores`, `unidades`, `cargos`).
- Tipos TS em inglês; payloads/rotas em português.
- Datas e horários sempre em `America/Sao_Paulo`, formatados via `date-fns` com locale `pt-BR`.
- IDs: `uuid` (`gen_random_uuid()`).
- Soft delete (`deleted_at`) apenas em `colaboradores` e `marcacoes`.

## Comandos úteis

```bash
pnpm install
pnpm dev                                  # sobe web:3000 e api:3333 em paralelo
pnpm --filter @midrah/api prisma migrate dev
pnpm --filter @midrah/api prisma db seed
pnpm typecheck
pnpm lint
```

## Agents

Os 4 subagents em `.claude/agents/` dividem o trabalho:

- **architecture-lead** (opus) — arquitetura, modelagem de banco, convenções.
- **frontend-builder** (sonnet) — Next.js, telas, componentes.
- **backend-builder** (sonnet) — NestJS, módulos, endpoints, Prisma.
- **qa-planner** (opus) — auditoria de coerência, riscos, lacunas.

Plano completo: `C:\Users\Usuario\.claude\plans\quero-desenvolver-um-sistema-groovy-knuth.md`.

Após reinício do CLI, a env var `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` (em `~/.claude/settings.json`) habilita Agent Teams nativo — as mesmas definições são reutilizadas como teammates.

## GitHub

**Repo:** https://github.com/KaynamSantiago-Tech/chronos-ponto-corporativo
**Branch:** master

Hook `PostToolUse` em `.claude/settings.local.json` faz auto-commit + push após cada `Edit`/`Write`.

Push manual:
```bash
cd "c:/Users/Usuario/Desktop/Projetos Claude Code"
git add -A && git commit -m "mensagem" && git push origin master
```
