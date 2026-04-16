# Data Model — Midrah Ponto

Schema autoritativo do Postgres gerenciado pelo Supabase. Migrations via Prisma. RLS ativa em todas tabelas de domínio.

## Pré-requisitos no banco

Antes da primeira migration, habilitar extensões no projeto Supabase:

```sql
create extension if not exists pgcrypto;   -- gen_random_uuid
create extension if not exists citext;     -- não usado hoje, mas útil p/ email
```

No Supabase Cloud o `pgcrypto` já vem habilitado; `CREATE EXTENSION IF NOT EXISTS` é idempotente.

## Schema Prisma

Arquivo final em `apps/api/prisma/schema.prisma`:

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "debian-openssl-3.0.x"]
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model Unidade {
  id            String        @id @default(uuid()) @db.Uuid
  nome          String        @db.VarChar(120)
  endereco      String?
  ativo         Boolean       @default(true)
  created_at    DateTime      @default(now())
  updated_at    DateTime      @updatedAt
  setores       Setor[]
  colaboradores Colaborador[]

  @@map("unidades")
}

model Setor {
  id            String        @id @default(uuid()) @db.Uuid
  nome          String        @db.VarChar(120)
  unidade_id    String        @db.Uuid
  ativo         Boolean       @default(true)
  created_at    DateTime      @default(now())
  updated_at    DateTime      @updatedAt
  unidade       Unidade       @relation(fields: [unidade_id], references: [id], onDelete: Restrict)
  colaboradores Colaborador[]

  @@unique([unidade_id, nome])
  @@index([unidade_id])
  @@map("setores")
}

model Cargo {
  id            String        @id @default(uuid()) @db.Uuid
  nome          String        @unique @db.VarChar(120)
  descricao     String?
  ativo         Boolean       @default(true)
  created_at    DateTime      @default(now())
  updated_at    DateTime      @updatedAt
  colaboradores Colaborador[]

  @@map("cargos")
}

model Colaborador {
  id            String     @id @default(uuid()) @db.Uuid
  auth_user_id  String?    @unique @db.Uuid
  matricula     String     @unique @db.VarChar(20)
  nome          String     @db.VarChar(150)
  email         String     @unique @db.VarChar(160)
  cpf           String     @unique @db.VarChar(14)
  telefone      String?    @db.VarChar(20)
  perfil        String     @db.VarChar(20)
  cargo_id      String     @db.Uuid
  setor_id      String     @db.Uuid
  unidade_id    String     @db.Uuid
  ativo         Boolean    @default(true)
  deleted_at    DateTime?
  created_at    DateTime   @default(now())
  updated_at    DateTime   @updatedAt
  cargo         Cargo      @relation(fields: [cargo_id], references: [id], onDelete: Restrict)
  setor         Setor      @relation(fields: [setor_id], references: [id], onDelete: Restrict)
  unidade       Unidade    @relation(fields: [unidade_id], references: [id], onDelete: Restrict)
  marcacoes     Marcacao[]

  @@index([perfil])
  @@index([setor_id])
  @@index([unidade_id])
  @@index([ativo, deleted_at])
  @@map("colaboradores")
}

model Marcacao {
  id             String      @id @default(uuid()) @db.Uuid
  colaborador_id String      @db.Uuid
  tipo           String      @db.VarChar(20)
  registrada_em  DateTime    @default(now()) @db.Timestamptz(3)
  latitude       Decimal?    @db.Decimal(10, 7)
  longitude      Decimal?    @db.Decimal(10, 7)
  precisao_m     Float?
  evidencia_url  String?
  ip             String?     @db.VarChar(45)
  user_agent     String?
  origem         String      @default("web") @db.VarChar(20)
  observacao     String?
  created_at     DateTime    @default(now()) @db.Timestamptz(3)
  colaborador    Colaborador @relation(fields: [colaborador_id], references: [id], onDelete: Restrict)

  @@index([colaborador_id, registrada_em(sort: Desc)])
  @@index([registrada_em(sort: Desc)])
  @@index([origem])
  @@map("marcacoes")
}

model LogAuditoria {
  id          String   @id @default(uuid()) @db.Uuid
  ator_id     String?  @db.Uuid
  acao        String   @db.VarChar(60)
  entidade    String?  @db.VarChar(60)
  entidade_id String?  @db.Uuid
  payload     Json?
  ip          String?  @db.VarChar(45)
  user_agent  String?
  created_at  DateTime @default(now()) @db.Timestamptz(3)

  @@index([ator_id, created_at(sort: Desc)])
  @@index([acao])
  @@index([entidade, entidade_id])
  @@map("logs_auditoria")
}
```

### Justificativa dos índices

| Índice | Motivo |
|--------|--------|
| `marcacoes(colaborador_id, registrada_em DESC)` | Query dominante: histórico próprio ordenado do mais novo pro mais velho. |
| `marcacoes(registrada_em DESC)` | Painel global admin/gestor. |
| `marcacoes(origem)` | Filtrar marcações de roleta depois da integração. |
| `colaboradores(perfil)` | Dashboard e guards filtram por perfil. |
| `colaboradores(setor_id)` / `(unidade_id)` | Listagens filtradas por gestor. |
| `colaboradores(ativo, deleted_at)` | Lista padrão oculta inativos/excluídos. |
| `setores(unidade_id, nome)` unique | Impede duplicatas dentro da mesma unidade. |
| `logs_auditoria(ator_id, created_at DESC)` | Trilha por usuário. |
| `logs_auditoria(entidade, entidade_id)` | Ver histórico de 1 entidade. |

### CHECK constraints (adicionadas via migration SQL)

Prisma não suporta CHECK nativo. Adicionar migration SQL manual em `apps/api/prisma/migrations/<timestamp>_checks/migration.sql`:

```sql
alter table colaboradores
  add constraint colaboradores_perfil_check
  check (perfil in ('admin', 'rh', 'gestor', 'colaborador'));

alter table marcacoes
  add constraint marcacoes_tipo_check
  check (tipo in ('entrada', 'saida', 'pausa_inicio', 'pausa_fim'));

alter table marcacoes
  add constraint marcacoes_origem_check
  check (origem in ('web', 'roleta'));
```

## RLS

Habilitar e aplicar políticas via migration SQL dedicada `apps/api/prisma/migrations/<timestamp>_rls/migration.sql`:

```sql
-- Habilitar RLS
alter table colaboradores enable row level security;
alter table marcacoes     enable row level security;
alter table cargos        enable row level security;
alter table setores       enable row level security;
alter table unidades      enable row level security;
alter table logs_auditoria enable row level security;

-- Helper: retorna o colaborador.id do JWT atual
create or replace function public.current_colaborador_id()
  returns uuid
  language sql
  stable
  security definer
  set search_path = public
as $$
  select id from colaboradores where auth_user_id = auth.uid()
$$;

-- Helper: retorna o perfil do colaborador atual
create or replace function public.current_perfil()
  returns text
  language sql
  stable
  security definer
  set search_path = public
as $$
  select perfil from colaboradores where auth_user_id = auth.uid()
$$;

-- ========== colaboradores ==========
-- leitura: sempre o próprio, e admin/rh leem todos
create policy colaboradores_select_self_or_admin on colaboradores
  for select
  using (
    auth_user_id = auth.uid()
    or public.current_perfil() in ('admin', 'rh')
  );

-- escrita: apenas via service role (NestJS). Nenhuma policy = nada passa.

-- ========== marcacoes ==========
create policy marcacoes_select_self_or_staff on marcacoes
  for select
  using (
    colaborador_id = public.current_colaborador_id()
    or public.current_perfil() in ('admin', 'rh', 'gestor')
  );
-- escrita bloqueada para anon/authenticated (NestJS escreve com service role).

-- ========== cargos / setores / unidades ==========
-- leitura liberada para qualquer autenticado (dropdowns).
create policy cargos_select_auth   on cargos   for select using (auth.role() = 'authenticated');
create policy setores_select_auth  on setores  for select using (auth.role() = 'authenticated');
create policy unidades_select_auth on unidades for select using (auth.role() = 'authenticated');

-- ========== logs_auditoria ==========
create policy logs_select_admin on logs_auditoria
  for select
  using (public.current_perfil() = 'admin');
```

### Como o service role escapa RLS

`SUPABASE_SERVICE_ROLE_KEY` carrega claim `role = service_role`. Supabase bypassa RLS nesse caso. Por isso o NestJS instancia o client com service role (`createClient(url, serviceRoleKey)`) e nunca expõe essa key pro browser. O client do frontend usa `anon key` + JWT do usuário logado.

## Storage

Bucket `evidencias` (privado), criado via dashboard ou migration:

```sql
insert into storage.buckets (id, name, public)
values ('evidencias', 'evidencias', false)
on conflict (id) do nothing;

-- Leitura: dono da selfie + staff
create policy "evidencias_read_self_or_staff"
  on storage.objects
  for select
  using (
    bucket_id = 'evidencias'
    and (
      (storage.foldername(name))[1] = public.current_colaborador_id()::text
      or public.current_perfil() in ('admin', 'rh', 'gestor')
    )
  );

-- Escrita: apenas service role (via NestJS). Sem policy = negado.
```

URLs de leitura geradas via `supabase.storage.from('evidencias').createSignedUrl(path, 3600)` sob demanda.

## Seeds

`apps/api/prisma/seed.ts` (executado em dev por `pnpm --filter @midrah/api prisma db seed`):

```ts
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main() {
  const unidade = await prisma.unidade.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      nome: "Midrah — Sede",
      endereco: "Belo Horizonte / MG",
    },
  });

  const setor = await prisma.setor.upsert({
    where: { unidade_id_nome: { unidade_id: unidade.id, nome: "Administrativo" } },
    update: {},
    create: { nome: "Administrativo", unidade_id: unidade.id },
  });

  const cargo = await prisma.cargo.upsert({
    where: { nome: "Administrador" },
    update: {},
    create: { nome: "Administrador", descricao: "Acesso total" },
  });

  // Cria usuário Auth + colaborador admin
  const email = "admin@midrah.com.br";
  const senha = process.env.SEED_ADMIN_PASSWORD ?? "Midrah@2025";

  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });
  if (authErr && !authErr.message.includes("already")) throw authErr;
  const authUserId = authData?.user?.id ?? (
    await supabase.auth.admin.listUsers()
  ).data.users.find((u) => u.email === email)?.id;

  await prisma.colaborador.upsert({
    where: { email },
    update: { auth_user_id: authUserId! },
    create: {
      auth_user_id: authUserId!,
      matricula: "ADM001",
      nome: "Administrador Midrah",
      email,
      cpf: "000.000.000-00",
      perfil: "admin",
      cargo_id: cargo.id,
      setor_id: setor.id,
      unidade_id: unidade.id,
    },
  });

  console.log(`Seed OK. Login: ${email} / ${senha}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
```

Registrar em `apps/api/package.json`:
```json
"prisma": { "seed": "tsx prisma/seed.ts" }
```

## Convenções de Migration

- **Sempre** revisar o SQL gerado por `prisma migrate dev --create-only` antes de aplicar.
- Mudanças destrutivas (DROP COLUMN, RENAME) exigem migration manual com backfill.
- RLS e CHECK constraints moram em migrations próprias (nomeadas), não no `schema.prisma`.
- Após `prisma migrate deploy` em prod, rodar checklist: `select count(*) from pg_policies where schemaname = 'public'` para confirmar que todas policies foram aplicadas.

## Pontos Deliberadamente em Aberto

1. **Particionamento de `marcacoes` por mês.** Só faz sentido acima de ~5 M linhas/ano. Com 1000 colaboradores × 4 marcações × 22 dias = 88k/mês → ~1M/ano. Não precisa agora. Reavaliar em 2 anos.
2. **Retenção de `logs_auditoria`.** Definir janela (ex.: 2 anos) e job de archiving. Pós-MVP.
3. **Campos de horário contratado (jornada).** Só vira necessário quando o sistema calcular atrasos. Fase futura.
