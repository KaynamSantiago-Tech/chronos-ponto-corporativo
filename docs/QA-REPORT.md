# QA-REPORT — Midrah Ponto

Status: **MVP fechado**, pronto para piloto após `pnpm install` + migrations + deploy inicial.

Última atualização: 2026-04-22.

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

### Ciclo de polimento (2026-04-22)

- **Busca server-side + paginação em `/admin/colaboradores`** — input debounced (300 ms) casa com `contains insensitive` em `nome`, `matricula` e `email`; elimina limite de 50 resultados.
- **Filtros avançados em `/admin/marcacoes`** — selects de unidade/setor (cascading), tipo e picker de colaborador com datalist; botão "Limpar" reseta tudo.
- **Persistência de filtros via URL** em `/admin/marcacoes` — estado sincronizado com `useSearchParams` + `router.replace`, permitindo compartilhar links filtrados.
- **Tela de detalhe** `/admin/marcacoes/[id]` — mostra colaborador/setor/unidade, coordenadas com link para Google Maps, precisão GPS, IP, user-agent, observação e preview de selfie.
- **Responsividade mobile** — `components/app-shell.tsx` novo, sidebar vira drawer (`md:hidden` fixed inset-0 com overlay) acionado por hambúrguer na topbar; badge de perfil e label "Sair" colapsam em telas pequenas.
- **Helper `formatarErroApi`** (`lib/api-errors.ts`) mapeia 20+ códigos do backend (NO_TOKEN, SEQUENCIA_INVALIDA, ARQUIVO_GRANDE, PERFIL_INSUFICIENTE, 429 etc.) para `{ titulo, descricao }` acionáveis; aplicado em 10 call-sites (login, /ponto, /historico, dialogs CRUD, preview selfie, /admin/marcacoes).
- **UX de `/ponto` melhorada** — status inline persistente de câmera e GPS com botões de retry explícitos; nova `GeolocationUnavailableError` trata caso "indoor" separadamente de timeout/permissão.
- **Seed com orientação** — log ao final instrui criar o usuário correspondente no Supabase Auth com mesmo email para vincular via `/auth/sync`.
- **Defesa contra CSV injection (OWASP)** em `lib/csv.ts` — valores começando com `=`, `+`, `-`, `@`, `\t` ou `\r` são prefixados com `'` para impedir execução como fórmula em Excel/Google Sheets. Vetor provável: campo observacao.
- **Hardening de autorização em `/evidencias/signed-url`** — `startsWith(colaborador_id + "/")` substituído por regex estrita `^[A-Za-z0-9_-]+/[A-Za-z0-9._-]+$` + split em `/`. Evita que um colaborador A peça URL assinada da evidência de B via path traversal (`A/../B/...`) ou prefixo colidindo (`A-longo/...` onde A é prefixo de A-longo).
- **Redação recursiva no audit log** — `safePayload` agora percorre objetos aninhados e arrays; adiciona `authorization` e `cpf` à lista de chaves sensíveis (LGPD); limita profundidade a 4 níveis para evitar abuso. Antes, um body com `{ user: { senha: "x" } }` gravava a senha em claro em `logs_auditoria.payload`.
- **CORS_ORIGIN com trim** — multi-origin separado por vírgula agora tolera espaços: `"a, b, c"` é tratado como três origins válidas.

## Testes automatizados

`apps/api/src/modules/marcacoes/marcacoes.service.spec.ts` — 16 casos:
- 7 para `validarSequencia` (transições entrada/pausa/saída).
- 4 para `registrarManual` (origem, backfill, colaborador inexistente, bypass de sequência).
- 2 para `registrar` (mapeamento de campos com `Prisma.Decimal` em lat/long, fallback para nulls quando GPS ausente).
- 3 para `listar` com escopo de perfil.

`apps/api/src/modules/roleta/roleta.controller.spec.ts` — 7 casos:
- Aceita assinatura válida (com e sem prefixo `sha256=`).
- Rejeita `ROLETA_NAO_CONFIGURADA`, `ASSINATURA_AUSENTE`, `ASSINATURA_INVALIDA`.
- Rejeita assinaturas de comprimento diferente sem crash (guarda contra `timingSafeEqual`).
- Detecta adulteração de payload (replay com corpo alterado).

`apps/api/src/common/guards/roles.guard.spec.ts` — 7 casos:
- Libera rotas sem `@Roles()` ou com lista vazia.
- Bloqueia request sem perfil (`SEM_PERFIL`) e perfil fora da lista (`PERFIL_INSUFICIENTE`).
- Libera combinações admin/rh e bloqueia gestor em rota restrita a admin.

`apps/api/src/modules/evidencias/evidencias.controller.spec.ts` — 7 casos:
- Dono acessa própria evidência; colaborador é bloqueado acessando de outro.
- Admin vê qualquer evidência.
- Rejeita path traversal (`A/../B/...`), path profundo, path sem pasta e path vazio.
- Clampa `seconds` ao intervalo [60, 3600].

`apps/api/src/modules/auth/auth.service.spec.ts` — 10 casos:
- Cobre todos os 8 códigos de erro (`NO_TOKEN`, `INVALID_TOKEN`, `SEM_EMAIL`, `COLABORADOR_NAO_CADASTRADO`, `COLABORADOR_INATIVO`, `VINCULO_CONFLITO`, `AUTH_USER_EM_USO` via P2002) e 2 happy paths (primeiro login vincula `auth_user_id`, recorrente pula update).
- Normaliza email do token para lowercase antes da busca — impede impersonação via variação de caixa.

`apps/api/src/common/interceptors/audit-log.interceptor.spec.ts` — 7 casos:
- Redige chaves sensíveis (senha, password, token, secret, authorization, cpf).
- Redige recursivamente em objetos aninhados e arrays de objetos.
- Retorna `null` para não-objetos.
- Limita profundidade a 4 níveis (proteção contra loops/estruturas adversariais).
- Não muta o body original.

`apps/api/src/modules/colaboradores/colaboradores.service.spec.ts` — 10 casos:
- `listar` busca: sem termo não adiciona `OR`; com termo usa `contains insensitive` em `nome`/`matricula`/`email`; termo em branco (apenas espaços) é ignorado.
- `criar`: happy path cria colaborador, envia convite Supabase e grava `auth_user_id` retornado; convite com falha (ex.: SMTP) não trava criação; `P2002` do Prisma é traduzido em `COLABORADOR_DUPLICADO` (409).
- `atualizar`: 404 quando colaborador não existe; `P2002` vira `COLABORADOR_DUPLICADO` ao tentar trocar email para um já em uso.
- `remover` (soft delete): marca `deleted_at` + `ativo=false` sem `DELETE` físico; 404 em colaborador inexistente sem chamar `update`.

`apps/api/src/modules/evidencias/evidencias.service.spec.ts` — 13 casos:
- Validação de entrada: `ARQUIVO_AUSENTE`, `ARQUIVO_GRANDE` (>2 MB), `MIME_INVALIDO` (fora da whitelist JPEG/PNG/WebP); aceitação explícita dos 3 MIMEs com extensão correta (`jpg`/`png`/`webp`).
- Construção do path: prefixado com `colaborador_id/`, nome `timestamp_uuid-v4.<ext>`, uploads consecutivos geram paths distintos; `upsert:false` e `contentType` preservado.
- Erros do Supabase: `UPLOAD_FALHOU` quando Storage retorna erro; `URL_ASSINADA_FALHOU` quando `createSignedUrl` falha; happy path retorna `{ path, signed_url, expires_in: 3600 }`.
- `signedUrl`: default 3600 s, respeita `seconds` custom, propaga `URL_ASSINADA_FALHOU`.

Total: 77 casos em 8 specs cobrindo auth, marcações (sequência + listagem escopada + happy path), colaboradores (CRUD + busca), evidências (upload + URL assinada), guards (RBAC), interceptor (LGPD), controller de evidências (autorização) e roleta (HMAC).

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
