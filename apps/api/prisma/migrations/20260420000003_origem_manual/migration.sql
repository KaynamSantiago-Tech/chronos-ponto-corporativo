-- Adiciona 'manual' como origem válida (admin pode registrar ponto em nome
-- do colaborador nos casos onde câmera/GPS falham; observação é obrigatória).

ALTER TABLE "marcacoes"
  DROP CONSTRAINT "marcacoes_origem_check";

ALTER TABLE "marcacoes"
  ADD CONSTRAINT "marcacoes_origem_check"
  CHECK (origem IN ('web', 'roleta', 'manual'));
