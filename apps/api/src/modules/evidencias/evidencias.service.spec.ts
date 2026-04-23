import { BadRequestException } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import { describe, expect, it, vi } from "vitest";

import type { SupabaseAdminService } from "../../common/supabase/supabase-admin.service";
import type { Env } from "../../config/env.schema";
import { EvidenciasService } from "./evidencias.service";

type StorageMock = {
  upload: ReturnType<typeof vi.fn>;
  createSignedUrl: ReturnType<typeof vi.fn>;
};

function build(opts: Partial<StorageMock> = {}) {
  const storage: StorageMock = {
    upload: opts.upload ?? vi.fn().mockResolvedValue({ error: null }),
    createSignedUrl:
      opts.createSignedUrl ??
      vi.fn().mockResolvedValue({ data: { signedUrl: "https://signed/ok" }, error: null }),
  };

  const supabase = {
    storage: vi.fn().mockReturnValue(storage),
  } as unknown as SupabaseAdminService;

  const config = {
    get: vi.fn().mockReturnValue("evidencias"),
  } as unknown as ConfigService<Env, true>;

  return {
    service: new EvidenciasService(supabase, config),
    storage,
    supabase,
  };
}

function makeFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  return {
    fieldname: "file",
    originalname: "selfie.jpg",
    encoding: "7bit",
    mimetype: "image/jpeg",
    size: 100_000,
    buffer: Buffer.from("fake-jpeg-bytes"),
    destination: "",
    filename: "",
    path: "",
    stream: undefined as unknown as NodeJS.ReadableStream,
    ...overrides,
  } as Express.Multer.File;
}

describe("EvidenciasService.upload — validações de entrada", () => {
  it("falha com ARQUIVO_AUSENTE quando não há arquivo", async () => {
    const { service } = build();
    try {
      await service.upload("colab-1", undefined);
      expect.fail("deveria ter lançado");
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
      expect((e as BadRequestException).getResponse()).toMatchObject({ code: "ARQUIVO_AUSENTE" });
    }
  });

  it("falha com ARQUIVO_GRANDE quando excede 2 MB", async () => {
    const { service } = build();
    const file = makeFile({ size: 2 * 1024 * 1024 + 1 });
    try {
      await service.upload("colab-1", file);
      expect.fail("deveria ter lançado");
    } catch (e) {
      expect((e as BadRequestException).getResponse()).toMatchObject({ code: "ARQUIVO_GRANDE" });
    }
  });

  it("falha com MIME_INVALIDO para MIME fora da whitelist", async () => {
    const { service } = build();
    const file = makeFile({ mimetype: "application/pdf" });
    try {
      await service.upload("colab-1", file);
      expect.fail("deveria ter lançado");
    } catch (e) {
      expect((e as BadRequestException).getResponse()).toMatchObject({ code: "MIME_INVALIDO" });
    }
  });

  it("aceita JPEG, PNG e WebP (3 MIMEs permitidos)", async () => {
    for (const mime of ["image/jpeg", "image/png", "image/webp"] as const) {
      const { service, storage } = build();
      const file = makeFile({ mimetype: mime });
      await expect(service.upload("colab-1", file)).resolves.toBeDefined();
      const [path] = storage.upload.mock.calls[0]!;
      const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[mime];
      expect(path).toMatch(new RegExp(`\\.${ext}$`));
    }
  });
});

describe("EvidenciasService.upload — construção do path", () => {
  it("prefixa com colaborador_id e gera nome único (timestamp_uuid)", async () => {
    const { service, storage } = build();
    const file = makeFile();

    await service.upload("colab-123", file);

    const [path] = storage.upload.mock.calls[0]!;
    // colab-123/<timestamp>_<uuid-v4>.jpg
    expect(path).toMatch(
      /^colab-123\/\d+_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/,
    );
  });

  it("usa upsert:false e contentType do arquivo", async () => {
    const { service, storage } = build();
    const file = makeFile({ mimetype: "image/png" });

    await service.upload("colab-1", file);

    const [, buffer, options] = storage.upload.mock.calls[0]!;
    expect(buffer).toBe(file.buffer);
    expect(options).toEqual({ contentType: "image/png", upsert: false });
  });

  it("dois uploads seguidos produzem paths distintos", async () => {
    const { service, storage } = build();
    const file = makeFile();

    await service.upload("colab-1", file);
    await service.upload("colab-1", file);

    const [pathA] = storage.upload.mock.calls[0]!;
    const [pathB] = storage.upload.mock.calls[1]!;
    expect(pathA).not.toBe(pathB);
  });
});

describe("EvidenciasService.upload — erros do Supabase", () => {
  it("falha com UPLOAD_FALHOU quando Storage retorna erro", async () => {
    const upload = vi.fn().mockResolvedValue({ error: { message: "bucket full" } });
    const { service } = build({ upload });
    try {
      await service.upload("colab-1", makeFile());
      expect.fail("deveria ter lançado");
    } catch (e) {
      expect((e as BadRequestException).getResponse()).toMatchObject({ code: "UPLOAD_FALHOU" });
    }
  });

  it("falha com URL_ASSINADA_FALHOU quando createSignedUrl retorna erro", async () => {
    const createSignedUrl = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: "sign failed" } });
    const { service } = build({ createSignedUrl });
    try {
      await service.upload("colab-1", makeFile());
      expect.fail("deveria ter lançado");
    } catch (e) {
      expect((e as BadRequestException).getResponse()).toMatchObject({
        code: "URL_ASSINADA_FALHOU",
      });
    }
  });

  it("retorna path, signed_url e expires_in=3600 no happy path", async () => {
    const { service } = build();
    const resultado = await service.upload("colab-1", makeFile());
    expect(resultado).toMatchObject({
      signed_url: "https://signed/ok",
      expires_in: 3600,
    });
    expect(resultado.path).toMatch(/^colab-1\//);
  });
});

describe("EvidenciasService.signedUrl", () => {
  it("retorna URL assinada com seconds padrão 3600", async () => {
    const { service, storage } = build();
    const resultado = await service.signedUrl("colab-1/file.jpg");
    expect(storage.createSignedUrl).toHaveBeenCalledWith("colab-1/file.jpg", 3600);
    expect(resultado).toEqual({ signed_url: "https://signed/ok", expires_in: 3600 });
  });

  it("respeita seconds custom", async () => {
    const { service, storage } = build();
    await service.signedUrl("colab-1/file.jpg", 600);
    expect(storage.createSignedUrl).toHaveBeenCalledWith("colab-1/file.jpg", 600);
  });

  it("propaga URL_ASSINADA_FALHOU em erro do Supabase", async () => {
    const createSignedUrl = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: "not found" } });
    const { service } = build({ createSignedUrl });
    try {
      await service.signedUrl("colab-1/file.jpg");
      expect.fail("deveria ter lançado");
    } catch (e) {
      expect((e as BadRequestException).getResponse()).toMatchObject({
        code: "URL_ASSINADA_FALHOU",
      });
    }
  });
});
