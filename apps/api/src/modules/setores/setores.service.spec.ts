import { ConflictException, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import type { PrismaService } from "../../prisma/prisma.service";
import { SetoresService } from "./setores.service";

function build(opts: {
  findUnique?: ReturnType<typeof vi.fn>;
  findMany?: ReturnType<typeof vi.fn>;
  count?: ReturnType<typeof vi.fn>;
  create?: ReturnType<typeof vi.fn>;
  update?: ReturnType<typeof vi.fn>;
} = {}) {
  const prisma = {
    setor: {
      findUnique: opts.findUnique ?? vi.fn().mockResolvedValue(null),
      findMany: opts.findMany ?? vi.fn().mockResolvedValue([]),
      count: opts.count ?? vi.fn().mockResolvedValue(0),
      create: opts.create ?? vi.fn().mockResolvedValue({ id: "novo" }),
      update: opts.update ?? vi.fn().mockResolvedValue({}),
    },
    $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
  } as unknown as PrismaService;
  return { service: new SetoresService(prisma), prisma };
}

describe("SetoresService.listar", () => {
  it("sem unidade_id usa where vazio", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const count = vi.fn().mockResolvedValue(0);
    const { service } = build({ findMany, count });
    await service.listar(1, 10);
    expect(findMany.mock.calls[0]![0].where).toEqual({});
  });

  it("com unidade_id filtra por unidade", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const { service } = build({ findMany });
    await service.listar(1, 10, "u1");
    expect(findMany.mock.calls[0]![0].where).toEqual({ unidade_id: "u1" });
  });

  it("achata o include unidade em unidade_nome no item retornado", async () => {
    const findMany = vi.fn().mockResolvedValue([
      { id: "s1", nome: "TI", unidade_id: "u1", ativo: true, unidade: { nome: "Matriz" } },
    ]);
    const count = vi.fn().mockResolvedValue(1);
    const { service } = build({ findMany, count });
    const res = await service.listar(1, 10);
    expect(res.items[0]).toEqual({
      id: "s1",
      nome: "TI",
      unidade_id: "u1",
      unidade_nome: "Matriz",
      ativo: true,
    });
  });

  it("retorna unidade_nome=null quando include vier sem relação", async () => {
    const findMany = vi.fn().mockResolvedValue([
      { id: "s1", nome: "TI", unidade_id: "u1", ativo: true, unidade: null },
    ]);
    const { service } = build({ findMany, count: vi.fn().mockResolvedValue(1) });
    const res = await service.listar(1, 10);
    expect(res.items[0]).toMatchObject({ unidade_nome: null });
  });
});

describe("SetoresService — CRUD", () => {
  it("criar traduz P2002 em SETOR_DUPLICADO", async () => {
    const p2002 = new Prisma.PrismaClientKnownRequestError("dup", {
      code: "P2002",
      clientVersion: "0",
    });
    const create = vi.fn().mockRejectedValue(p2002);
    const { service } = build({ create });
    try {
      await service.criar({ nome: "TI", unidade_id: "u1" } as never);
      expect.fail("deveria ter lançado");
    } catch (e) {
      expect(e).toBeInstanceOf(ConflictException);
      expect((e as ConflictException).getResponse()).toMatchObject({ code: "SETOR_DUPLICADO" });
    }
  });

  it("atualizar exige existência prévia (404)", async () => {
    const { service } = build({ findUnique: vi.fn().mockResolvedValue(null) });
    await expect(service.atualizar("ghost", {} as never)).rejects.toBeInstanceOf(NotFoundException);
  });

  it("remover marca ativo=false", async () => {
    const findUnique = vi.fn().mockResolvedValue({ id: "s1" });
    const update = vi.fn().mockResolvedValue({});
    const { service } = build({ findUnique, update });
    await service.remover("s1");
    expect(update).toHaveBeenCalledWith({ where: { id: "s1" }, data: { ativo: false } });
  });
});
