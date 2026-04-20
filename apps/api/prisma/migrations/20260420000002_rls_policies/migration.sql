-- Row-Level Security + helpers + políticas de storage.

ALTER TABLE "colaboradores"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "marcacoes"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cargos"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "setores"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "unidades"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "logs_auditoria" ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_colaborador_id()
  RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM colaboradores WHERE auth_user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.current_perfil()
  RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT perfil FROM colaboradores WHERE auth_user_id = auth.uid()
$$;

CREATE POLICY colaboradores_select_self_or_admin ON colaboradores
  FOR SELECT USING (
    auth_user_id = auth.uid()
    OR public.current_perfil() IN ('admin', 'rh')
  );

CREATE POLICY marcacoes_select_self_or_staff ON marcacoes
  FOR SELECT USING (
    colaborador_id = public.current_colaborador_id()
    OR public.current_perfil() IN ('admin', 'rh', 'gestor')
  );

CREATE POLICY cargos_select_auth   ON cargos   FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY setores_select_auth  ON setores  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY unidades_select_auth ON unidades FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY logs_select_admin ON logs_auditoria
  FOR SELECT USING (public.current_perfil() = 'admin');

-- Storage bucket privado `evidencias`
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidencias', 'evidencias', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "evidencias_read_self_or_staff"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'evidencias'
    AND (
      (storage.foldername(name))[1] = public.current_colaborador_id()::text
      OR public.current_perfil() IN ('admin', 'rh', 'gestor')
    )
  );
