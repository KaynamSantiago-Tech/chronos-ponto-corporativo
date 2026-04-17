-- Row-Level Security + helpers.
-- Aplicar após o primeiro `prisma migrate deploy`.

alter table colaboradores  enable row level security;
alter table marcacoes      enable row level security;
alter table cargos         enable row level security;
alter table setores        enable row level security;
alter table unidades       enable row level security;
alter table logs_auditoria enable row level security;

create or replace function public.current_colaborador_id()
  returns uuid language sql stable security definer set search_path = public as $$
  select id from colaboradores where auth_user_id = auth.uid()
$$;

create or replace function public.current_perfil()
  returns text language sql stable security definer set search_path = public as $$
  select perfil from colaboradores where auth_user_id = auth.uid()
$$;

create policy colaboradores_select_self_or_admin on colaboradores
  for select using (
    auth_user_id = auth.uid()
    or public.current_perfil() in ('admin', 'rh')
  );

create policy marcacoes_select_self_or_staff on marcacoes
  for select using (
    colaborador_id = public.current_colaborador_id()
    or public.current_perfil() in ('admin', 'rh', 'gestor')
  );

create policy cargos_select_auth   on cargos   for select using (auth.role() = 'authenticated');
create policy setores_select_auth  on setores  for select using (auth.role() = 'authenticated');
create policy unidades_select_auth on unidades for select using (auth.role() = 'authenticated');

create policy logs_select_admin on logs_auditoria
  for select using (public.current_perfil() = 'admin');

-- Storage bucket `evidencias`
insert into storage.buckets (id, name, public)
values ('evidencias', 'evidencias', false)
on conflict (id) do nothing;

create policy "evidencias_read_self_or_staff"
  on storage.objects for select
  using (
    bucket_id = 'evidencias'
    and (
      (storage.foldername(name))[1] = public.current_colaborador_id()::text
      or public.current_perfil() in ('admin', 'rh', 'gestor')
    )
  );
