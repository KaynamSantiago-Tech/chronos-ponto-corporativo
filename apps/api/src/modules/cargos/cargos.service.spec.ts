import { ConflictException, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import type { PrismaService } from "../../prisma/prisma.service";
import { CargosService } from "./cargos.service";

function build(opts: {
  findUnique?: ReturnType<typeof vi.fn>;
  findMany?: ReturnType<typeof vi.fn>;
  count?: ReturnType<typeof vi.fn>;
  create?: ReturnType<typeof vi.fn>;
  update?: ReturnType<typeof vi.fn>;
} = {}) {
  const prisma = {
    cargo: {
      findUnique: opts.findUnique ?? vi.fn().mockResolvedValue(null),
      findMany: opts.findMany ?? vi.fn().mockResolvedValue([]),
      count: opts.count ?? vi.fn().mockResolvedValue(0),
      create: opts.create ?? vi.fn().mockResolvedValue({ id: "novo" }),
      update: opts.update ?? vi.fn().mockResolvedValue({}),
    },
    $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
  } as unknown as PrismaService;
  return { service: new CargosService(prisma), prisma };
}

describe("CargosService", () => {
  it("listar pagina com orderBy nome asc", async () => {
    const findMany = vi.fn().mockResolvedValue([{ id: "c1", nome: "Dev" }]);
    const count = vi.fn().mockResolvedValue(1);
    const { service } = build({ findMany, count });
    const res = await service.listar(2, 10);
    expect(findMany.mock.calls[0][0]).toMatchObject({
      skip: 10,
      take: 10,
      orderBy: { nome: "asc" },
    });
    expect(res.total).toBe(1);
  });

  it("obter lança NotFoundException com code NOT_FOUND", async () => {
    const { service } = build({ findUnique: vi.fn().mockResolvedValue(null) });
    try {
      await service.obter("x");
      expect.fail("deveria ter lançado");
    } catch (e) {
      expect(e).toBeInstanceOf(NotFoundException);
      expect((e as NotFoundException).getResponse()).toMatchObject({ code: "NOT_FOUND" });
    }
  });

  it("criar traduz P2002 em CARGO_DUPLICADO", async () => {
    const p2002 = new Prisma.PrismaClientKnownRequestError("dup", {
      code: "P2002",
      clientVersion: "0",
    });
    const create = vi.fn().mockRejectedValue(p2002);
    const { service } = build({ create });
    try {
      await service.criar({ nome: "Dev" } as never);
      expect.fail("deveria ter lançado");
    } catch (e) {
      expect(e).toBeInstanceOf(ConflictException);
      expect((e as ConflictException).getResponse()).toMatchObject({ code: "CARGO_DUPLICADO" });
    }
  });

  it("atualizar verifica existência antes de atualizar (404 se não existe)", async () => {
    const { service } = build({ findUnique: vi.fn().mockResolvedValue(null) });
    await expect(service.atualizar("ghost", { nome: "X" } as never)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("remover marca ativo=false (soft delete sem deleted_at neste model)", async () => {
    const findUnique = vi.fn().mockResolvedValue({ id: "c1", nome: "Dev" });
    const update = vi.fn().mockResolvedValue({ id: "c1", ativo: false });
    const { service } = build({ findUnique, update });

    await service.remover("c1");

    expect(update).toHaveBeenCalledWith({ where: { id: "c1" }, data: { ativo: false } });
  });
});
