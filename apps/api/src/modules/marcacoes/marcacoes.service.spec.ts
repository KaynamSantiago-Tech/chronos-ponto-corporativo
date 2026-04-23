import { ConflictException, NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { MarcacoesService } from "./marcacoes.service";

type PrismaMock = {
  marcacao: {
    findFirst: ReturnType<typeof vi.fn>;
    findUnique?: ReturnType<typeof vi.fn>;
    create?: ReturnType<typeof vi.fn>;
    findMany?: ReturnType<typeof vi.fn>;
    count?: ReturnType<typeof vi.fn>;
  };
  colaborador?: {
    findFirst: ReturnType<typeof vi.fn>;
  };
  $transaction?: ReturnType<typeof vi.fn>;
};

function makeService(ultimoTipo: string | null, extra: Partial<PrismaMock> = {}) {
  const prisma: PrismaMock = {
    marcacao: {
      findFirst: vi.fn().mockResolvedValue(ultimoTipo ? { tipo: ultimoTipo } : null),
      ...(extra.marcacao ?? {}),
    },
    ...extra,
  };
  // @ts-expect-error — injeção manual do mock
  return { service: new MarcacoesService(prisma), prisma };
}

describe("MarcacoesService.validarSequencia", () => {
  it("permite entrada quando não há marcação hoje", async () => {
    const { service } = makeService(null);
    await expect(service.validarSequencia("c1", "entrada")).resolves.toBeUndefined();
  });

  it("bloqueia saida sem entrada no dia", async () => {
    const { service } = makeService(null);
    await expect(service.validarSequencia("c1", "saida")).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it("bloqueia nova entrada após entrada", async () => {
    const { service } = makeService("entrada");
    await expect(service.validarSequencia("c1", "entrada")).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it("permite pausa_inicio após entrada", async () => {
    const { service } = makeService("entrada");
    await expect(service.validarSequencia("c1", "pausa_inicio")).resolves.toBeUndefined();
  });

  it("exige pausa_fim depois de pausa_inicio", async () => {
    const { service } = makeService("pausa_inicio");
    await expect(service.validarSequencia("c1", "saida")).rejects.toBeInstanceOf(
      ConflictException,
    );
    await expect(service.validarSequencia("c1", "pausa_fim")).resolves.toBeUndefined();
  });

  it("permite saida após pausa_fim", async () => {
    const { service } = makeService("pausa_fim");
    await expect(service.validarSequencia("c1", "saida")).resolves.toBeUndefined();
  });

  it("bloqueia qualquer coisa após saida", async () => {
    const { service } = makeService("saida");
    await expect(service.validarSequencia("c1", "entrada")).rejects.toBeInstanceOf(
      ConflictException,
    );
    await expect(service.validarSequencia("c1", "pausa_inicio")).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});

describe("MarcacoesService.registrarManual", () => {
  it("cria marcação com origem='manual' e observação prefixada com o ator", async () => {
    const create = vi.fn().mockResolvedValue({ id: "m1" });
    const findColab = vi.fn().mockResolvedValue({ id: "c1", ativo: true });
    const { service } = makeService(null, {
      marcacao: { findFirst: vi.fn(), create },
      colaborador: { findFirst: findColab },
    });

    await service.registrarManual(
      "ator-1",
      {
        colaborador_id: "c1",
        tipo: "entrada",
        observacao: "Câmera quebrada no posto",
      },
      { ip: "10.0.0.1", user_agent: "test" },
    );

    expect(create).toHaveBeenCalledOnce();
    const args = create.mock.calls[0]![0].data;
    expect(args.origem).toBe("manual");
    expect(args.colaborador_id).toBe("c1");
    expect(args.observacao).toContain("[manual por ator-1]");
    expect(args.observacao).toContain("Câmera quebrada");
  });

  it("respeita registrada_em quando informado (backfill)", async () => {
    const create = vi.fn().mockResolvedValue({ id: "m1" });
    const { service } = makeService(null, {
      marcacao: { findFirst: vi.fn(), create },
      colaborador: { findFirst: vi.fn().mockResolvedValue({ id: "c1", ativo: true }) },
    });

    const iso = "2026-01-15T08:30:00Z";
    await service.registrarManual(
      "ator-1",
      { colaborador_id: "c1", tipo: "entrada", observacao: "Registro retroativo", registrada_em: iso },
      {},
    );

    const data = create.mock.calls[0]![0].data;
    expect(data.registrada_em.toISOString()).toBe(new Date(iso).toISOString());
  });

  it("falha com NotFoundException se colaborador não existe", async () => {
    const create = vi.fn();
    const { service } = makeService(null, {
      marcacao: { findFirst: vi.fn(), create },
      colaborador: { findFirst: vi.fn().mockResolvedValue(null) },
    });

    await expect(
      service.registrarManual(
        "ator-1",
        { colaborador_id: "c1", tipo: "entrada", observacao: "Qualquer justificativa válida" },
        {},
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(create).not.toHaveBeenCalled();
  });

  it("não valida sequência (permite registrar em estado inválido)", async () => {
    const create = vi.fn().mockResolvedValue({ id: "m1" });
    const { service } = makeService("entrada", {
      marcacao: { findFirst: vi.fn().mockResolvedValue({ tipo: "entrada" }), create },
      colaborador: { findFirst: vi.fn().mockResolvedValue({ id: "c1", ativo: true }) },
    });

    // registrar outra "entrada" em sequência seria bloqueado no fluxo normal,
    // mas o manual deve prosseguir (cenário: corrigir esquecimento de saída).
    await expect(
      service.registrarManual(
        "ator-1",
        { colaborador_id: "c1", tipo: "entrada", observacao: "Correção de ponto duplicado" },
        {},
      ),
    ).resolves.toEqual({ id: "m1" });
  });
});

describe("MarcacoesService.registrar (happy path)", () => {
  it("valida sequência, mapeia campos e grava com origem='web'", async () => {
    const create = vi.fn().mockResolvedValue({ id: "m1" });
    const { service } = makeService(null, {
      marcacao: { findFirst: vi.fn().mockResolvedValue(null), create },
    });

    await service.registrar(
      "colab-1",
      {
        tipo: "entrada",
        latitude: -23.5505,
        longitude: -46.6333,
        precisao_m: 12.4,
        evidencia_url: "colab-1/123_abc.jpg",
      },
      { ip: "10.0.0.1", user_agent: "Mozilla/5.0" },
    );

    expect(create).toHaveBeenCalledOnce();
    const data = create.mock.calls[0]![0].data;
    expect(data.colaborador_id).toBe("colab-1");
    expect(data.tipo).toBe("entrada");
    expect(data.origem).toBe("web");
    expect(data.ip).toBe("10.0.0.1");
    expect(data.user_agent).toBe("Mozilla/5.0");
    expect(data.evidencia_url).toBe("colab-1/123_abc.jpg");
    // Prisma.Decimal — verificar que lat/long foram empacotados, sem NaN.
    expect(data.latitude?.toString()).toBe("-23.5505");
    expect(data.longitude?.toString()).toBe("-46.6333");
    expect(data.precisao_m).toBe(12.4);
  });

  it("permite lat/long ausentes (casos sem GPS, origem ainda 'web')", async () => {
    const create = vi.fn().mockResolvedValue({ id: "m2" });
    const { service } = makeService(null, {
      marcacao: { findFirst: vi.fn().mockResolvedValue(null), create },
    });

    await service.registrar("colab-1", { tipo: "entrada" }, {});
    const data = create.mock.calls[0]![0].data;
    expect(data.latitude).toBeNull();
    expect(data.longitude).toBeNull();
    expect(data.precisao_m).toBeNull();
    expect(data.ip).toBeNull();
    expect(data.user_agent).toBeNull();
  });
});

describe("MarcacoesService.listar (escopo)", () => {
  function makeListar() {
    const findMany = vi.fn().mockResolvedValue([]);
    const count = vi.fn().mockResolvedValue(0);
    const $transaction = vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops));
    const { service } = makeService(null, {
      marcacao: { findFirst: vi.fn(), findMany, count },
      $transaction,
    });
    return { service, findMany };
  }

  it("gestor força filtro por setor_id próprio, ignorando filtro externo", async () => {
    const { service, findMany } = makeListar();
    await service.listar(
      1,
      50,
      { setor_id: "outro-setor" },
      { perfil: "gestor", setor_id: "setor-dele" },
    );
    const where = findMany.mock.calls[0]![0].where;
    expect(where.colaborador.setor_id).toBe("setor-dele");
  });

  it("admin respeita filtro de setor_id da query", async () => {
    const { service, findMany } = makeListar();
    await service.listar(
      1,
      50,
      { setor_id: "setor-query" },
      { perfil: "admin", setor_id: "setor-admin" },
    );
    const where = findMany.mock.calls[0]![0].where;
    expect(where.colaborador.setor_id).toBe("setor-query");
  });

  it("admin sem filtro de setor não adiciona filtro de colaborador", async () => {
    const { service, findMany } = makeListar();
    await service.listar(1, 50, {}, { perfil: "admin", setor_id: "x" });
    const where = findMany.mock.calls[0]![0].where;
    expect(where.colaborador).toBeUndefined();
  });
});
