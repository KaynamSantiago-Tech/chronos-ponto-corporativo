import { NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import type { PrismaService } from "../../prisma/prisma.service";
import { UnidadesService } from "./unidades.service";

function build(opts: {
  findUnique?: ReturnType<typeof vi.fn>;
  findMany?: ReturnType<typeof vi.fn>;
  count?: ReturnType<typeof vi.fn>;
  create?: ReturnType<typeof vi.fn>;
  update?: ReturnType<typeof vi.fn>;
} = {}) {
  const prisma = {
    unidade: {
      findUnique: opts.findUnique ?? vi.fn().mockResolvedValue(null),
      findMany: opts.findMany ?? vi.fn().mockResolvedValue([]),
      count: opts.count ?? vi.fn().mockResolvedValue(0),
      create: opts.create ?? vi.fn().mockResolvedValue({ id: "novo" }),
      update: opts.update ?? vi.fn().mockResolvedValue({}),
    },
    $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
  } as unknown as PrismaService;
  return { service: new UnidadesService(prisma), prisma };
}

describe("UnidadesService", () => {
  it("listar pagina com orderBy nome asc", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const { service } = build({ findMany });
    await service.listar(1, 25);
    expect(findMany.mock.calls[0][0]).toMatchObject({
      skip: 0,
      take: 25,
      orderBy: { nome: "asc" },
    });
  });

  it("obter lança NotFoundException com code NOT_FOUND", async () => {
    const { service } = build({ findUnique: vi.fn().mockResolvedValue(null) });
    await expect(service.obter("x")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("criar delega ao prisma sem tratar P2002 (nome não é unique em Unidade)", async () => {
    const create = vi.fn().mockResolvedValue({ id: "u1", nome: "Matriz" });
    const { service } = build({ create });
    const res = await service.criar({ nome: "Matriz", endereco: "Rua X" } as never);
    expect(create).toHaveBeenCalledWith({ data: { nome: "Matriz", endereco: "Rua X" } });
    expect(res).toMatchObject({ id: "u1" });
  });

  it("atualizar exige existência prévia (404)", async () => {
    const { service } = build({ findUnique: vi.fn().mockResolvedValue(null) });
    await expect(service.atualizar("ghost", {} as never)).rejects.toBeInstanceOf(NotFoundException);
  });

  it("remover marca ativo=false (sem DELETE físico)", async () => {
    const findUnique = vi.fn().mockResolvedValue({ id: "u1" });
    const update = vi.fn().mockResolvedValue({});
    const { service } = build({ findUnique, update });
    await service.remover("u1");
    expect(update).toHaveBeenCalledWith({ where: { id: "u1" }, data: { ativo: false } });
  });
});
