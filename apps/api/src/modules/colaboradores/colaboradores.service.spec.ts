import { ConflictException, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import type { Perfil } from "../../common/decorators/roles.decorator";
import type { SupabaseAdminService } from "../../common/supabase/supabase-admin.service";
import type { PrismaService } from "../../prisma/prisma.service";
import { ColaboradoresService } from "./colaboradores.service";

interface BuildOpts {
  findFirst?: ReturnType<typeof vi.fn>;
  findMany?: ReturnType<typeof vi.fn>;
  count?: ReturnType<typeof vi.fn>;
  create?: ReturnType<typeof vi.fn>;
  update?: ReturnType<typeof vi.fn>;
  inviteByEmail?: ReturnType<typeof vi.fn>;
}

function build(opts: BuildOpts = {}) {
  const prisma = {
    colaborador: {
      findFirst: opts.findFirst ?? vi.fn().mockResolvedValue(null),
      findMany: opts.findMany ?? vi.fn().mockResolvedValue([]),
      count: opts.count ?? vi.fn().mockResolvedValue(0),
      create: opts.create ?? vi.fn().mockResolvedValue({ id: "novo" }),
      update: opts.update ?? vi.fn().mockResolvedValue({}),
    },
    $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
  } as unknown as PrismaService;

  const supabase = {
    inviteByEmail:
      opts.inviteByEmail ??
      vi.fn().mockResolvedValue({ data: { user: { id: "auth-new" } }, error: null }),
  } as unknown as SupabaseAdminService;

  return {
    service: new ColaboradoresService(prisma, supabase),
    prisma,
    supabase,
  };
}

const DTO_BASE = {
  matricula: "0002",
  nome: "Bob",
  email: "bob@midrah.com.br",
  cpf: "111.111.111-11",
  perfil: "colaborador" as Perfil,
  cargo_id: "c1",
  setor_id: "s1",
  unidade_id: "u1",
};

describe("ColaboradoresService.listar (busca)", () => {
  it("sem termo de busca não adiciona OR", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const { service } = build({ findMany });
    await service.listar(1, 50, {});
    const where = findMany.mock.calls[0]![0].where;
    expect(where.OR).toBeUndefined();
    expect(where.deleted_at).toBeNull();
  });

  it("com termo adiciona OR case-insensitive em nome/matricula/email", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const { service } = build({ findMany });
    await service.listar(1, 50, { busca: "ALI" });
    const where = findMany.mock.calls[0]![0].where;
    expect(where.OR).toEqual([
      { nome: { contains: "ALI", mode: "insensitive" } },
      { matricula: { contains: "ALI", mode: "insensitive" } },
      { email: { contains: "ALI", mode: "insensitive" } },
    ]);
  });

  it("termo em branco (apenas espaços) é ignorado", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const { service } = build({ findMany });
    await service.listar(1, 50, { busca: "   " });
    const where = findMany.mock.calls[0]![0].where;
    expect(where.OR).toBeUndefined();
  });
});

describe("ColaboradoresService.criar", () => {
  it("cria colaborador, envia convite e grava auth_user_id retornado", async () => {
    const create = vi.fn().mockResolvedValue({ id: "novo-1", matricula: "0002" });
    const update = vi.fn().mockResolvedValue({});
    const findFirst = vi.fn().mockResolvedValue({ id: "novo-1" }); // usado por obter()
    const invite = vi
      .fn()
      .mockResolvedValue({ data: { user: { id: "auth-1" } }, error: null });

    const { service, prisma } = build({ create, update, findFirst, inviteByEmail: invite });
    // `obter()` usa findFirst, já mockado acima.
    (prisma.colaborador as unknown as { findFirst: unknown }).findFirst = findFirst;

    await service.criar(DTO_BASE);

    expect(create).toHaveBeenCalledWith({ data: DTO_BASE });
    expect(invite).toHaveBeenCalledWith("bob@midrah.com.br", {
      colaborador_id: "novo-1",
      matricula: "0002",
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: "novo-1" },
      data: { auth_user_id: "auth-1" },
    });
  });

  it("não trava criação quando convite Supabase falha (apenas loga)", async () => {
    const create = vi.fn().mockResolvedValue({ id: "novo-2", matricula: "0003" });
    const update = vi.fn();
    const findFirst = vi.fn().mockResolvedValue({ id: "novo-2" });
    const invite = vi.fn().mockResolvedValue({
      data: { user: null },
      error: { message: "SMTP indisponível" },
    });

    const { service } = build({ create, update, findFirst, inviteByEmail: invite });

    await expect(service.criar(DTO_BASE)).resolves.toBeDefined();
    expect(update).not.toHaveBeenCalled(); // sem auth_user_id para vincular
  });

  it("traduz P2002 do Prisma em COLABORADOR_DUPLICADO (409)", async () => {
    const p2002 = new Prisma.PrismaClientKnownRequestError("dup", {
      code: "P2002",
      clientVersion: "0",
    });
    const create = vi.fn().mockRejectedValue(p2002);
    const { service } = build({ create });

    try {
      await service.criar(DTO_BASE);
      expect.fail("deveria ter lançado");
    } catch (e) {
      expect(e).toBeInstanceOf(ConflictException);
      expect((e as ConflictException).getResponse()).toMatchObject({
        code: "COLABORADOR_DUPLICADO",
      });
    }
  });
});

describe("ColaboradoresService.atualizar", () => {
  it("falha com 404 quando colaborador não existe", async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    const { service } = build({ findFirst });

    await expect(service.atualizar("nao-existe", { nome: "X" })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("traduz P2002 em COLABORADOR_DUPLICADO ao tentar trocar para email já em uso", async () => {
    const findFirst = vi.fn().mockResolvedValue({
      id: "c1",
      cargo: null,
      setor: null,
      unidade: null,
    });
    const p2002 = new Prisma.PrismaClientKnownRequestError("dup", {
      code: "P2002",
      clientVersion: "0",
    });
    const update = vi.fn().mockRejectedValue(p2002);
    const { service } = build({ findFirst, update });

    try {
      await service.atualizar("c1", { email: "outro@x.com" });
      expect.fail("deveria ter lançado");
    } catch (e) {
      expect(e).toBeInstanceOf(ConflictException);
      expect((e as ConflictException).getResponse()).toMatchObject({
        code: "COLABORADOR_DUPLICADO",
      });
    }
  });
});

describe("ColaboradoresService.remover (soft delete)", () => {
  it("marca deleted_at e ativo=false; não apaga fisicamente", async () => {
    const findFirst = vi.fn().mockResolvedValue({
      id: "c1",
      cargo: null,
      setor: null,
      unidade: null,
    });
    const update = vi.fn().mockResolvedValue({});
    const { service } = build({ findFirst, update });

    await service.remover("c1");

    expect(update).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: expect.objectContaining({
        ativo: false,
        deleted_at: expect.any(Date),
      }),
    });
  });

  it("não tenta remover colaborador inexistente", async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    const update = vi.fn();
    const { service } = build({ findFirst, update });

    await expect(service.remover("ghost")).rejects.toBeInstanceOf(NotFoundException);
    expect(update).not.toHaveBeenCalled();
  });
});
