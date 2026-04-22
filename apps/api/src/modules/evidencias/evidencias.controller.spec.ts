import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import type { RequestUser } from "../../common/decorators/current-user.decorator";
import { EvidenciasController } from "./evidencias.controller";
import type { EvidenciasService } from "./evidencias.service";

function makeController() {
  const service = {
    signedUrl: vi.fn().mockResolvedValue({ signed_url: "https://x", expires_in: 3600 }),
  } as unknown as EvidenciasService;
  return { controller: new EvidenciasController(service), service };
}

const USER_COLAB: RequestUser = {
  auth_user_id: "auth-1",
  colaborador_id: "colab-A",
  perfil: "colaborador",
  email: "a@x.com",
  nome: "Alice",
  setor_id: "s1",
  unidade_id: "u1",
};
const USER_ADMIN: RequestUser = {
  auth_user_id: "auth-2",
  colaborador_id: "colab-Admin",
  perfil: "admin",
  email: "admin@x.com",
  nome: "Adm",
  setor_id: "s1",
  unidade_id: "u1",
};

describe("EvidenciasController.signedUrl (autorização)", () => {
  it("permite o dono pedir URL da própria evidência", async () => {
    const { controller, service } = makeController();
    await controller.signedUrl(USER_COLAB, { path: "colab-A/123_abc.jpg" });
    expect(service.signedUrl).toHaveBeenCalledWith("colab-A/123_abc.jpg", 3600);
  });

  it("bloqueia colaborador pedindo evidência de outro", async () => {
    const { controller } = makeController();
    await expect(
      controller.signedUrl(USER_COLAB, { path: "colab-B/123_abc.jpg" }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("permite admin ver evidência de qualquer colaborador", async () => {
    const { controller, service } = makeController();
    await controller.signedUrl(USER_ADMIN, { path: "colab-B/123_abc.jpg" });
    expect(service.signedUrl).toHaveBeenCalled();
  });

  it("rejeita path traversal (não aceita '..' no path)", async () => {
    const { controller } = makeController();
    await expect(
      controller.signedUrl(USER_COLAB, { path: "colab-A/../colab-B/file.jpg" }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejeita path com múltiplas barras (deep folder)", async () => {
    const { controller } = makeController();
    await expect(
      controller.signedUrl(USER_COLAB, { path: "colab-A/sub/file.jpg" }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejeita path vazio ou sem pasta", async () => {
    const { controller } = makeController();
    await expect(
      controller.signedUrl(USER_COLAB, { path: "arquivo.jpg" }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      controller.signedUrl(USER_COLAB, { path: "" }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("clampa seconds ao intervalo [60, 3600]", async () => {
    const { controller, service } = makeController();
    await controller.signedUrl(USER_COLAB, { path: "colab-A/f.jpg", seconds: "10" });
    expect(service.signedUrl).toHaveBeenCalledWith("colab-A/f.jpg", 60);

    vi.mocked(service.signedUrl).mockClear();
    await controller.signedUrl(USER_COLAB, { path: "colab-A/f.jpg", seconds: "99999" });
    expect(service.signedUrl).toHaveBeenCalledWith("colab-A/f.jpg", 3600);
  });
});
