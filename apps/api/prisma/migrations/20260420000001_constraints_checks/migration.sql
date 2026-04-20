-- CHECK constraints (Prisma não emite; mantidos como migration dedicada).

ALTER TABLE "colaboradores"
  ADD CONSTRAINT "colaboradores_perfil_check"
  CHECK (perfil IN ('admin', 'rh', 'gestor', 'colaborador'));

ALTER TABLE "marcacoes"
  ADD CONSTRAINT "marcacoes_tipo_check"
  CHECK (tipo IN ('entrada', 'saida', 'pausa_inicio', 'pausa_fim'));

ALTER TABLE "marcacoes"
  ADD CONSTRAINT "marcacoes_origem_check"
  CHECK (origem IN ('web', 'roleta'));
