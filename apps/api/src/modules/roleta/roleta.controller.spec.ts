import { BadRequestException } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import { createHmac } from "crypto";
import { describe, expect, it, vi } from "vitest";

import type { Env } from "../../config/env.schema";
import { RoletaController } from "./roleta.controller";

const SECRET = "segredo-de-teste";

function makeController(secret: string | undefined = SECRET) {
  const config = {
    get: vi.fn().mockReturnValue(secret),
  } as unknown as ConfigService<Env, true>;
  return new RoletaController(config);
}

function assinar(body: unknown, secret = SECRET) {
  return createHmac("sha256", secret).update(JSON.stringify(body ?? {})).digest("hex");
}

describe("RoletaController.webhook", () => {
  it("aceita assinatura válida e retorna sem corpo", () => {
    const controller = makeController();
    const body = { evento: "passagem", matricula: "0001" };
    const sig = assinar(body);

    expect(() => controller.webhook(sig, body)).not.toThrow();
  });

  it("aceita prefixo sha256= na assinatura", () => {
    const controller = makeController();
    const body = { evento: "passagem" };
    const sig = `sha256=${assinar(body)}`;

    expect(() => controller.webhook(sig, body)).not.toThrow();
  });

  it("rejeita quando o secret não está configurado", () => {
    const config = {
      get: vi.fn().mockReturnValue(undefined),
    } as unknown as ConfigService<Env, true>;
    const controller = new RoletaController(config);
    expect(() => controller.webhook("qualquer", {})).toThrow(BadRequestException);
    try {
      controller.webhook("qualquer", {});
    } catch (e) {
      expect((e as BadRequestException).getResponse()).toMatchObject({
        code: "ROLETA_NAO_CONFIGURADA",
      });
    }
  });

  it("rejeita quando falta o header x-signature", () => {
    const controller = makeController();
    try {
      controller.webhook(undefined, { evento: "x" });
      expect.fail("deveria ter lançado");
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
      expect((e as BadRequestException).getResponse()).toMatchObject({
        code: "ASSINATURA_AUSENTE",
      });
    }
  });

  it("rejeita assinatura inválida", () => {
    const controller = makeController();
    const body = { evento: "passagem" };
    const sigErrada = assinar(body, "outro-secret");

    try {
      controller.webhook(sigErrada, body);
      expect.fail("deveria ter lançado");
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
      expect((e as BadRequestException).getResponse()).toMatchObject({
        code: "ASSINATURA_INVALIDA",
      });
    }
  });

  it("rejeita assinatura com comprimento diferente (evita crash no timingSafeEqual)", () => {
    const controller = makeController();
    // 'abcd' em hex = 2 bytes, enquanto o digest tem 32 bytes.
    expect(() => controller.webhook("abcd", { x: 1 })).toThrow(BadRequestException);
  });

  it("é sensível a alteração no corpo (replay com payload alterado)", () => {
    const controller = makeController();
    const body = { evento: "passagem", matricula: "0001" };
    const sig = assinar(body);

    const bodyAdulterado = { evento: "passagem", matricula: "9999" };
    expect(() => controller.webhook(sig, bodyAdulterado)).toThrow(BadRequestException);
  });
});
