import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import type { SupabaseJwtService } from "../../common/supabase/supabase-jwt.service";
import type { PrismaService } from "../../prisma/prisma.service";
import { AuthService } from "./auth.service";

interface BuildOpts {
  payload?: { sub?: string; email?: string } | null;
  jwtError?: Error;
  colaborador?: {
    id: string;
    auth_user_id: string | null;
    email: string;
    ativo: boolean;
    deleted_at?: Date | null;
  } | null;
  updateError?: unknown;
}

function build(opts: BuildOpts = {}) {
  const jwt = {
    verify: vi.fn().mockImplementation(async () => {
      if (opts.jwtError) throw opts.jwtError;
      return opts.payload ?? { sub: "sub-1", email: "alice@x.com" };
    }),
  } as unknown as SupabaseJwtService;

  const colaboradorInclude = {
    id: "colab-1",
    matricula: "0001",
    nome: "Alice",
    email: "alice@x.com",
    perfil: "colaborador",
    ativo: true,
    cargo: { id: "c1", nome: "Dev" },
    setor: { id: "s1", nome: "TI" },
    unidade: { id: "u1", nome: "Matriz" },
  };

  const prisma = {
    colaborador: {
      findFirst: vi.fn().mockResolvedValue(
        opts.colaborador === null
          ? null
          : opts.colaborador ?? {
              id: "colab-1",
              auth_user_id: null,
              email: "alice@x.com",
              ativo: true,
              deleted_at: null,
            },
      ),
      findUnique: vi.fn().mockResolvedValue(colaboradorInclude),
      update: vi.fn().mockImplementation(async () => {
        if (opts.updateError) throw opts.updateError;
        return {};
      }),
    },
  } as unknown as PrismaService;

  // @ts-expect-error — injeção manual do mock
  return { service: new AuthService(prisma, jwt), prisma, jwt };
}

describe("AuthService.sync", () => {
  it("rejeita request sem Bearer (NO_TOKEN)", async () => {
    const { service } = build();
    await expect(service.sync(undefined)).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(service.sync("Basic abc")).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejeita token inválido (INVALID_TOKEN)", async () => {
    const { service } = build({ jwtError: new Error("bad signature") });
    await expect(service.sync("Bearer abc")).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejeita token sem claim email (SEM_EMAIL)", async () => {
    const { service } = build({ payload: { sub: "sub-1" } });
    try {
      await service.sync("Bearer ok");
      expect.fail("deveria ter lançado");
    } catch (e) {
      expect(e).toBeInstanceOf(UnauthorizedException);
      expect((e as UnauthorizedException).getResponse()).toMatchObject({ code: "SEM_EMAIL" });
    }
  });

  it("rejeita email não cadastrado (COLABORADOR_NAO_CADASTRADO)", async () => {
    const { service } = build({ colaborador: null });
    try {
      await service.sync("Bearer ok");
      expect.fail("deveria ter lançado");
    } catch (e) {
      expect(e).toBeInstanceOf(NotFoundException);
      expect((e as NotFoundException).getResponse()).toMatchObject({
        code: "COLABORADOR_NAO_CADASTRADO",
      });
    }
  });

  it("rejeita colaborador inativo (COLABORADOR_INATIVO)", async () => {
    const { service } = build({
      colaborador: {
        id: "c1",
        auth_user_id: "sub-1",
        email: "alice@x.com",
        ativo: false,
      },
    });
    try {
      await service.sync("Bearer ok");
      expect.fail("deveria ter lançado");
    } catch (e) {
      expect(e).toBeInstanceOf(UnauthorizedException);
      expect((e as UnauthorizedException).getResponse()).toMatchObject({
        code: "COLABORADOR_INATIVO",
      });
    }
  });

  it("rejeita colisão de vínculo (VINCULO_CONFLITO)", async () => {
    const { service } = build({
      colaborador: {
        id: "c1",
        auth_user_id: "sub-OUTRO",
        email: "alice@x.com",
        ativo: true,
      },
    });
    try {
      await service.sync("Bearer ok");
      expect.fail("deveria ter lançado");
    } catch (e) {
      expect(e).toBeInstanceOf(ConflictException);
      expect((e as ConflictException).getResponse()).toMatchObject({
        code: "VINCULO_CONFLITO",
      });
    }
  });

  it("primeiro login vincula auth_user_id e retorna perfil", async () => {
    const { service, prisma } = build();
    const me = await service.sync("Bearer ok");
    expect(prisma.colaborador.update).toHaveBeenCalledWith({
      where: { id: "colab-1" },
      data: { auth_user_id: "sub-1" },
    });
    expect(me).toMatchObject({ id: "colab-1", email: "alice@x.com", perfil: "colaborador" });
  });

  it("login recorrente pula update quando já vinculado", async () => {
    const { service, prisma } = build({
      colaborador: {
        id: "c1",
        auth_user_id: "sub-1",
        email: "alice@x.com",
        ativo: true,
      },
    });
    await service.sync("Bearer ok");
    expect(prisma.colaborador.update).not.toHaveBeenCalled();
  });

  it("traduz P2002 em AUTH_USER_EM_USO", async () => {
    const p2002 = new Prisma.PrismaClientKnownRequestError("dup", {
      code: "P2002",
      clientVersion: "0",
    });
    const { service } = build({ updateError: p2002 });
    try {
      await service.sync("Bearer ok");
      expect.fail("deveria ter lançado");
    } catch (e) {
      expect(e).toBeInstanceOf(ConflictException);
      expect((e as ConflictException).getResponse()).toMatchObject({
        code: "AUTH_USER_EM_USO",
      });
    }
  });

  it("normaliza email do token para lowercase antes da busca", async () => {
    const { service, prisma } = build({ payload: { sub: "sub-1", email: "ALICE@X.COM" } });
    await service.sync("Bearer ok");
    expect(prisma.colaborador.findFirst).toHaveBeenCalledWith({
      where: { email: "alice@x.com", deleted_at: null },
    });
  });
});
