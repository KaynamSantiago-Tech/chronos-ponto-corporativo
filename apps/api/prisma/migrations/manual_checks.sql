-- Migration manual: aplicar após `prisma migrate deploy` da primeira vez.
-- Prisma não emite CHECK constraints, então ficam aqui.

alter table colaboradores
  add constraint colaboradores_perfil_check
  check (perfil in ('admin', 'rh', 'gestor', 'colaborador'));

alter table marcacoes
  add constraint marcacoes_tipo_check
  check (tipo in ('entrada', 'saida', 'pausa_inicio', 'pausa_fim'));

alter table marcacoes
  add constraint marcacoes_origem_check
  check (origem in ('web', 'roleta'));
