import { ForbiddenException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import { describe, expect, it, vi } from "vitest";

import type { Perfil } from "../decorators/roles.decorator";
import { RolesGuard } from "./roles.guard";

function makeCtx(perfil?: Perfil): ExecutionContext {
  const req = perfil ? { user: { perfil } } : { user: undefined };
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

function makeReflector(required?: Perfil[]): Reflector {
  return {
    getAllAndOverride: vi.fn().mockReturnValue(required),
  } as unknown as Reflector;
}

describe("RolesGuard", () => {
  it("libera quando a rota não declara @Roles()", () => {
    const guard = new RolesGuard(makeReflector(undefined));
    expect(guard.canActivate(makeCtx("colaborador"))).toBe(true);
  });

  it("libera quando @Roles() é vazio", () => {
    const guard = new RolesGuard(makeReflector([]));
    expect(guard.canActivate(makeCtx("colaborador"))).toBe(true);
  });

  it("bloqueia quando o request não carrega perfil (JwtAuthGuard não passou)", () => {
    const guard = new RolesGuard(makeReflector(["admin"]));
    try {
      guard.canActivate(makeCtx(undefined));
      expect.fail("deveria ter lançado");
    } catch (e) {
      expect(e).toBeInstanceOf(ForbiddenException);
      expect((e as ForbiddenException).getResponse()).toMatchObject({ code: "SEM_PERFIL" });
    }
  });

  it("bloqueia perfil fora da lista com código PERFIL_INSUFICIENTE", () => {
    const guard = new RolesGuard(makeReflector(["admin", "rh"]));
    try {
      guard.canActivate(makeCtx("colaborador"));
      expect.fail("deveria ter lançado");
    } catch (e) {
      expect(e).toBeInstanceOf(ForbiddenException);
      expect((e as ForbiddenException).getResponse()).toMatchObject({
        code: "PERFIL_INSUFICIENTE",
      });
    }
  });

  it("libera perfil presente na lista", () => {
    const guard = new RolesGuard(makeReflector(["admin", "rh"]));
    expect(guard.canActivate(makeCtx("rh"))).toBe(true);
  });

  it("libera admin quando apenas admin é aceito", () => {
    const guard = new RolesGuard(makeReflector(["admin"]));
    expect(guard.canActivate(makeCtx("admin"))).toBe(true);
  });

  it("bloqueia gestor em rota restrita a admin", () => {
    const guard = new RolesGuard(makeReflector(["admin"]));
    expect(() => guard.canActivate(makeCtx("gestor"))).toThrow(ForbiddenException);
  });
});
