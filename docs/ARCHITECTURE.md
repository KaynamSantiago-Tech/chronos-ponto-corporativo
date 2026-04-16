# Arquitetura — Midrah Ponto

Documento canônico. Serve como contrato entre frontend, backend e banco. Para contexto de produto e fases, ver `C:\Users\Usuario\.claude\plans\quero-desenvolver-um-sistema-groovy-knuth.md`.

## Camadas

```
┌───────────────────────┐        HTTPS (JWT Bearer)         ┌───────────────────────┐
│  Next.js 15 (web)     │ ─────────────────────────────────▶│  NestJS 10 (api)      │
│  Vercel               │                                   │  Railway              │
│  - App Router         │ ◀─────────── JSON ────────────────│  - JwtAuthGuard       │
│  - Supabase SDK       │                                   │  - RolesGuard (RBAC)  │
│  - React Query        │                                   │  - Prisma             │
│  - shadcn/ui          │                                   │  - pino logs          │
└──────────┬────────────┘                                   └──────────┬────────────┘
           │                                                           │
           │ login / reset / leitura RLS                               │ Admin API / SQL
           ▼                                                           ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│  Supabase                                                                         │
│  ├─ Auth (usuários, JWT, JWKS, convites por email)                                │
│  ├─ Postgres (tabelas + RLS habilitada)                                           │
│  └─ Storage (bucket `evidencias/{colaborador_id}/{uuid}.jpg`)                     │
└───────────────────────────────────────────────────────────────────────────────────┘

Sentry captura erros e tracing em web (SDK `@sentry/nextjs`) e api (SDK `@sentry/node`).
```

## Fluxo de Autenticação

1. Usuário acessa `/login` no web. Formulário chama `supabase.auth.signInWithPassword({ email, password })`.
2. Supabase retorna `access_token` (JWT curto, ~1h) + `refresh_token`. SDK persiste em cookie httpOnly via `@supabase/ssr`.
3. Middleware do Next.js (`apps/web/middleware.ts`) valida sessão e redireciona não autenticado para `/login`.
4. Web chama `GET /auth/me` no NestJS com `Authorization: Bearer <access_token>`.
5. NestJS `JwtAuthGuard` (global) faz:
   - Busca JWKS de `SUPABASE_JWT_JWKS_URL` (com cache TTL 1h via `jose` ou `jwks-rsa`).
   - Verifica assinatura + `aud` + `iss` + `exp`.
   - Extrai `sub` (= `auth.users.id`).
   - Injeta `req.user = { auth_user_id, email }`.
6. Para endpoints protegidos, o guard chama `ColaboradorLookupService.findByAuthUserId(sub)` e anexa o objeto `Colaborador` (com `perfil`, `id`, `setor_id`, `unidade_id`) ao request.
7. `RolesGuard` lê `@Roles('admin','rh')` do handler e compara com `req.user.colaborador.perfil`.
8. `POST /auth/sync` é chamado na primeira vez que o usuário loga: vincula `auth_user_id` ao registro pré-existente em `colaboradores` (criado antes pelo admin).

### Por que RLS se já temos JwtAuthGuard?

RLS é defesa em profundidade. NestJS usa `SUPABASE_SERVICE_ROLE_KEY` (bypass RLS) para escrever e para leituras admin. Mas o **frontend** também fala direto com Supabase (via `anon key`) para leituras simples — ex.: histórico próprio do colaborador. Nessas leituras, RLS garante que um JWT do colaborador A não veja marcações do colaborador B mesmo se o frontend for comprometido. Sem RLS, um bug no client-side exporia tudo.

### Quando NÃO passar pelo NestJS

| Caso | Vai direto pro Supabase? | Motivo |
|------|--------------------------|--------|
| Login, reset de senha, set-password | Sim (SDK) | Fluxo nativo do Auth. |
| Listar histórico próprio do usuário | Sim (SDK, RLS filtra) | Query trivial, economiza hop. |
| Download de evidência (URL assinada) | Sim (Storage gera) | Sem lógica de negócio. |
| Listar colaboradores (admin) | **Não** | Precisa RBAC refinado + joins. |
| Registrar marcação | **Não** | Valida sequência, escreve log, dispara integrações. |
| CRUD admin (cargos, setores, unidades, colaboradores) | **Não** | Auditoria obrigatória. |

Regra de bolso: **escrita de estado ou qualquer lógica que envolva mais de uma tabela → NestJS**. Leitura idempotente e auto-contida → Supabase direto.

## Fluxo de Registro de Ponto

```
Web (/ponto)                          NestJS                      Supabase
    │                                   │                             │
    │ 1. pede Geolocation API           │                             │
    │ 2. pede getUserMedia(video)       │                             │
    │ 3. captura canvas → JPEG 640x480  │                             │
    │ 4. POST /evidencias/upload ──────▶│                             │
    │                                   │ 5. valida JWT               │
    │                                   │ 6. supabase.storage.upload ▶│
    │                                   │ 7. retorna evidencia_url    │
    │◀─── { evidencia_id, url } ────────│                             │
    │                                   │                             │
    │ 8. POST /marcacoes ──────────────▶│                             │
    │    { tipo, lat, long, precisao,   │ 9. validarSequencia(user)   │
    │      evidencia_id }               │    (consulta últimas marcas)│
    │                                   │10. prisma.marcacao.create ─▶│
    │                                   │11. audit log                │
    │◀─── 201 { marcacao } ─────────────│                             │
```

**Validação de sequência** (`MarcacoesService.validarSequencia`):
- Próxima marcação permitida depende da última do dia:
  - nenhuma → só `entrada`.
  - `entrada` → `saida` ou `pausa_inicio`.
  - `pausa_inicio` → `pausa_fim`.
  - `pausa_fim` → `saida` ou nova `pausa_inicio`.
  - `saida` → nada mais no dia (409 Conflict).

## Decisões-Chave e Trade-offs

| Decisão | Adotada | Alternativa descartada | Motivo |
|---------|---------|------------------------|--------|
| Monorepo pnpm | ✅ | Turborepo | Turbo agrega complexidade de cache que não precisamos agora. Pnpm sozinho resolve workspaces. |
| Prisma | ✅ | Drizzle / SQL puro | Migrations automáticas e type-safety já integrados; ecossistema Nest maduro. |
| NestJS | ✅ | Next.js Route Handlers full-stack | Separação clara facilita integração futura com roleta e testes isolados. Custo: dois deploys. |
| Supabase Auth | ✅ | Auth próprio (bcrypt + JWT) | Zero setup de email, reset, convites. Evita reinventar criptografia. |
| RLS ativa | ✅ | Só RBAC no NestJS | Defesa em profundidade barata. |
| shadcn/ui | ✅ | MUI / Chakra | Componentes copiados no repo → controle total, zero runtime dep lock-in. |
| React Query | ✅ | SWR / RTK Query | Suporte de mutations e optimistic updates mais ergonômico. |
| Pino (logs) | ✅ | Winston | Mais rápido e JSON-first. |
| pnpm ≥ 9 | ✅ | npm/yarn | Instalação 3x mais rápida, store compartilhado. |

## Observabilidade

- **Sentry** em ambos apps com `tracesSampleRate: 0.1` em staging, `0.05` em prod.
- Web: `onRequestError` do Next.js + `ErrorBoundary` nos layouts.
- API: `SentryInterceptor` global; `pino-http` para acesso; correlation id via header `x-request-id`.
- Supabase fornece logs de Auth e SQL no dashboard.

## Segurança (resumo)

- CORS em NestJS limitado a `WEB_ORIGIN`.
- `helmet()` + `ThrottlerGuard` globais.
- `SUPABASE_SERVICE_ROLE_KEY` **somente** em `apps/api/.env` (nunca em `apps/web`).
- CSP no Next.js via `middleware.ts` (restrita a `'self'` + Supabase + Sentry).
- Todos DTOs com `class-validator`; whitelist + `forbidNonWhitelisted: true`.
- Uploads limitados a 2 MB; validação MIME (`image/jpeg` only).

## Pontos Deliberadamente em Aberto

1. **Biometria facial real (comparação 1:1).** Só armazena selfie como evidência agora. Futuro: módulo `biometria/` chamando Supabase Edge Function ou AWS Rekognition.
2. **Folha de ponto e cálculo de horas.** Fora do MVP; construir view materializada ou serviço externo depois.
3. **Notificações de ausência.** Planejar após piloto, provavelmente via Supabase Realtime + email.
4. **Controle de férias/banco de horas.** Domínio separado; modelagem futura.
5. **Multi-tenant.** Hoje Midrah é tenant único; se precisar de múltiplas empresas, adicionar `empresa_id` em todas as tabelas e RLS por empresa.
