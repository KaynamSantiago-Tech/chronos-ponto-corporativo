# QA-REPORT — Midrah Ponto

Status: **MVP fechado**, pronto para piloto após `pnpm install` + migrations + deploy inicial.

Última atualização: 2026-04-20.

---

## Cobertura do checklist do plano

| Requisito | Status | Onde |
|---|---|---|
| Monorepo pnpm (`apps/web`, `apps/api`, `packages/shared`) | ✅ | raiz |
| Login Supabase Auth (email+senha, reset) | ✅ | `(auth)/login`, `(auth)/esqueci-senha`, `(auth)/nova-senha` |
| CRUD cargos/setores/unidades/colaboradores | ✅ | `admin/*` + módulos NestJS |
| Convite por email ao criar colaborador | ✅ | `ColaboradoresService.criar` → `inviteByEmail` |
| Registro de ponto com validação de sequência | ✅ | `MarcacoesService.validarSequencia` (7 testes) |
| Geolocalização obrigatória | ✅ | `ponto-registrar.tsx` bloqueia sem `navigator.geolocation` |
| Selfie obrigatória + Storage privado | ✅ | `evidencias.service.ts` + bucket `evidencias` + RLS |
| Histórico próprio com filtro de período | ✅ | `/historico` + `GET /marcacoes/me` |
| Painel admin com filtros | ✅ | `/admin/marcacoes` + export CSV |
| Trilha de auditoria (logins, create, update) | ✅ | `AuditLogInterceptor` em POST/PATCH/DELETE |
| 4 perfis com permissões respeitadas | ✅ | `@Roles` + `PermissionGate` + escopo de gestor (testado) |
| RLS ativa em tabelas sensíveis | ✅ | migration `20260420000002_rls_policies` |
| Stub `/roleta/webhook` com HMAC | ✅ | módulo `roleta` |
| Sentry web + api | ✅ | `sentry.*.config.ts` + `instrument.ts` + filter |
| Deploy Vercel + Railway + migrations automáticas | ✅ | `vercel.json` + `railway.toml` + `DEPLOY.md` |
| README com bootstrap | ✅ | `README.md` |

## Extras entregues além do plano

- **Registro manual** por admin/RH com justificativa obrigatória (origem=`manual`) — mitigação documentada no plano ("câmera/GPS negados").
- **Export CSV** com escape RFC 4180 e BOM para Excel; limite 5000 linhas por operação.
- **Dashboard operacional** em `/admin` (presentes, em pausa, atrasos após 09:00, marcações do dia, lista de colaboradores em expediente).
- **Escopo de gestor** (limita marcações e colaboradores ao próprio setor) com testes unitários.
- **Preview de selfie** com URL assinada por 10 min, acessível tanto em `/admin/marcacoes` quanto em `/historico` (restrito ao próprio dono ou admin/rh/gestor).
- **Gates de produção** para superfícies sensíveis: Swagger `/docs` e `/debug/sentry` ficam fechados em prod (abre com `EXPOSE_SWAGGER=true` / `EXPOSE_DEBUG=true`).
- **ErrorBoundary web** (`app/global-error.tsx` + `app/(app)/error.tsx`) captura crashes de UI e reporta ao Sentry sem derrubar o app.
- **Auto signOut em 401** no `apiFetch` — sessão revogada (colaborador inativo/deletado) redireciona para `/login?sessao=expirada` com toast informativo.
- **Throttle específico em `/auth/sync`** (10 req/min) além do global 100/min — reduz enumeração de emails.
- **Pagination compartilhado** (`components/ui/pagination.tsx`) usado em 3 telas.
- **Export CSV no histórico próprio** — colaborador baixa o próprio ponto sem depender do RH.
- **EmptyState padronizado** em 7 listagens (histórico + 6 admin), tom consistente e call-to-action quando faz sentido.

## Testes automatizados

`apps/api/src/modules/marcacoes/marcacoes.service.spec.ts` — 14 casos:
- 7 para `validarSequencia` (transições entrada/pausa/saída).
- 4 para `registrarManual` (origem, backfill, colaborador inexistente, bypass de sequência).
- 3 para `listar` com escopo de perfil.

Falta: testes de integração end-to-end (sugeridos apenas após decisão sobre banco de teste — SQLite in-memory ou container PG descartável).

## Riscos e mitigações atualizadas

| Risco | Status | Mitigação implementada |
|---|---|---|
| Câmera/GPS negados no navegador | ✅ mitigado | UI explicativa + fallback via registro manual (admin/RH) |
| JWT Supabase expira em uso longo | ⚠️ parcial | `onAuthStateChange` na SDK + react-query retry; falta teste longo |
| Upload de selfie em 3G fraca | ✅ | redimensiona client-side para 640×480 JPEG 0.7 (`ponto-registrar.tsx`) |
| RLS bloqueando queries admin | ✅ | NestJS usa `SUPABASE_SERVICE_ROLE_KEY`; key isolada em api |
| Contrato da roleta muda no futuro | ✅ | `marcacoes.origem` + endpoint isolado `/roleta/webhook` com HMAC |
| Custos de Storage com 1000 usuários | 📋 pendente | Documentado em `DEPLOY.md` (lifecycle de 90 dias a planejar) |
| Admin perde credenciais | ✅ | Fluxo de reset de senha via `/esqueci-senha` |

## Gaps conscientes (NÃO são bugs — decisão do plano)

- **Biometria facial real** (comparação de faces) — selfie é apenas evidência.
- **App mobile nativo** — web responsivo atende o MVP.
- **Integração ativa com roleta** — só stub; acionar `integration-specialist` quando o fornecedor definir contrato.
- **Cálculo de horas extras / folha oficial** — apenas histórico bruto e soma simples no dashboard.
- **SSO corporativo (SAML/OIDC)** — Supabase Auth email+senha basta para o piloto.
- **Notificações push/email de ausência** — fase futura.

## Próximos passos recomendados (em ordem)

1. **Ambiente local funcional**: `pnpm install` + `pnpm --filter @midrah/api prisma migrate dev` + `pnpm --filter @midrah/api prisma db seed` + `pnpm dev`. Validar `/login` com admin seed e percorrer golden path.
2. **Deploy de staging**: seguir `docs/DEPLOY.md` com projeto Supabase dedicado. Piloto com 5–10 colaboradores.
3. **Executar checklist pré-piloto** listado em `docs/DEPLOY.md`.
4. **Ativar Sentry** (DSN em ambas env vars) e validar com erro forçado.
5. **Revisão de segurança pontual** via `security-reviewer` antes de liberar fora do piloto (foco: políticas RLS do bucket, retention de evidências, LGPD).
6. **Lifecycle de evidências** (>90 dias) — esboço em `docs/EVIDENCIAS-LIFECYCLE.md`; `integration-specialist` ou `devops-deploy` implementar o job.
7. **Testes de integração** com container Postgres descartável (Testcontainers) — cobrir `/auth/sync`, `POST /marcacoes`, `POST /marcacoes/manual`.

## Decisões não óbvias (contexto para quem assume o código)

- **`evidencia_url` armazena o *path* do Storage, não URL final.** URLs são geradas sob demanda via `/evidencias/signed-url` para manter privacidade.
- **Validação de sequência usa dia local São Paulo** — virou dia = reinicia estado (permite "entrada" de novo).
- **`registrarManual` ignora `validarSequencia`** de propósito (correção de erros precisa poder gravar em estado inválido). Justificativa é prefixada com o ator para trilha de auditoria.
- **Gestor é escopo forte no backend**: mesmo que a UI passe um `setor_id` na query, o service sobrescreve com o `setor_id` do próprio gestor.
- **Middleware do Next não bloqueia `/nova-senha`** porque Supabase cria sessão temporária PASSWORD_RECOVERY que seria redirecionada para `/dashboard` incorretamente.
