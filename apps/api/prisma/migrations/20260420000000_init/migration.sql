-- CreateTable
CREATE TABLE "unidades" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "endereco" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "setores" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "unidade_id" UUID NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "setores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cargos" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cargos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colaboradores" (
    "id" UUID NOT NULL,
    "auth_user_id" UUID,
    "matricula" VARCHAR(20) NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "email" VARCHAR(160) NOT NULL,
    "cpf" VARCHAR(14) NOT NULL,
    "telefone" VARCHAR(20),
    "perfil" VARCHAR(20) NOT NULL,
    "cargo_id" UUID NOT NULL,
    "setor_id" UUID NOT NULL,
    "unidade_id" UUID NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "colaboradores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marcacoes" (
    "id" UUID NOT NULL,
    "colaborador_id" UUID NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "registrada_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "precisao_m" DOUBLE PRECISION,
    "evidencia_url" TEXT,
    "ip" VARCHAR(45),
    "user_agent" TEXT,
    "origem" VARCHAR(20) NOT NULL DEFAULT 'web',
    "observacao" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marcacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_auditoria" (
    "id" UUID NOT NULL,
    "ator_id" UUID,
    "acao" VARCHAR(60) NOT NULL,
    "entidade" VARCHAR(60),
    "entidade_id" UUID,
    "payload" JSONB,
    "ip" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "setores_unidade_id_nome_key" ON "setores"("unidade_id", "nome");

-- CreateIndex
CREATE INDEX "setores_unidade_id_idx" ON "setores"("unidade_id");

-- CreateIndex
CREATE UNIQUE INDEX "cargos_nome_key" ON "cargos"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "colaboradores_auth_user_id_key" ON "colaboradores"("auth_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "colaboradores_matricula_key" ON "colaboradores"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "colaboradores_email_key" ON "colaboradores"("email");

-- CreateIndex
CREATE UNIQUE INDEX "colaboradores_cpf_key" ON "colaboradores"("cpf");

-- CreateIndex
CREATE INDEX "colaboradores_perfil_idx" ON "colaboradores"("perfil");

-- CreateIndex
CREATE INDEX "colaboradores_setor_id_idx" ON "colaboradores"("setor_id");

-- CreateIndex
CREATE INDEX "colaboradores_unidade_id_idx" ON "colaboradores"("unidade_id");

-- CreateIndex
CREATE INDEX "colaboradores_ativo_deleted_at_idx" ON "colaboradores"("ativo", "deleted_at");

-- CreateIndex
CREATE INDEX "marcacoes_colaborador_id_registrada_em_idx" ON "marcacoes"("colaborador_id", "registrada_em" DESC);

-- CreateIndex
CREATE INDEX "marcacoes_registrada_em_idx" ON "marcacoes"("registrada_em" DESC);

-- CreateIndex
CREATE INDEX "marcacoes_origem_idx" ON "marcacoes"("origem");

-- CreateIndex
CREATE INDEX "logs_auditoria_ator_id_created_at_idx" ON "logs_auditoria"("ator_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "logs_auditoria_acao_idx" ON "logs_auditoria"("acao");

-- CreateIndex
CREATE INDEX "logs_auditoria_entidade_entidade_id_idx" ON "logs_auditoria"("entidade", "entidade_id");

-- AddForeignKey
ALTER TABLE "setores" ADD CONSTRAINT "setores_unidade_id_fkey" FOREIGN KEY ("unidade_id") REFERENCES "unidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colaboradores" ADD CONSTRAINT "colaboradores_cargo_id_fkey" FOREIGN KEY ("cargo_id") REFERENCES "cargos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colaboradores" ADD CONSTRAINT "colaboradores_setor_id_fkey" FOREIGN KEY ("setor_id") REFERENCES "setores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colaboradores" ADD CONSTRAINT "colaboradores_unidade_id_fkey" FOREIGN KEY ("unidade_id") REFERENCES "unidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marcacoes" ADD CONSTRAINT "marcacoes_colaborador_id_fkey" FOREIGN KEY ("colaborador_id") REFERENCES "colaboradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
