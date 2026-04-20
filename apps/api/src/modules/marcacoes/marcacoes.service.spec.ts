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
    const s = makeService(null);
    await expect(s.validarSequencia("c1", "entrada")).resolves.toBeUndefined();
  });

  it("bloqueia saida sem entrada no dia", async () => {
    const s = makeService(null);
    await expect(s.validarSequencia("c1", "saida")).rejects.toBeInstanceOf(ConflictException);
  });

  it("bloqueia nova entrada após entrada", async () => {
    const s = makeService("entrada");
    await expect(s.validarSequencia("c1", "entrada")).rejects.toBeInstanceOf(ConflictException);
  });

  it("permite pausa_inicio após entrada", async () => {
    const s = makeService("entrada");
    await expect(s.validarSequencia("c1", "pausa_inicio")).resolves.toBeUndefined();
  });

  it("exige pausa_fim depois de pausa_inicio", async () => {
    const s = makeService("pausa_inicio");
    await expect(s.validarSequencia("c1", "saida")).rejects.toBeInstanceOf(ConflictException);
    await expect(s.validarSequencia("c1", "pausa_fim")).resolves.toBeUndefined();
  });

  it("permite saida após pausa_fim", async () => {
    const s = makeService("pausa_fim");
    await expect(s.validarSequencia("c1", "saida")).resolves.toBeUndefined();
  });

  it("bloqueia qualquer coisa após saida", async () => {
    const s = makeService("saida");
    await expect(s.validarSequencia("c1", "entrada")).rejects.toBeInstanceOf(ConflictException);
    await expect(s.validarSequencia("c1", "pausa_inicio")).rejects.toBeInstanceOf(ConflictException);
  });
});
