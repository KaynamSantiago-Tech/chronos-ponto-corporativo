import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";

import type { Env } from "../../config/env.schema";
import { SupabaseAdminService } from "../../common/supabase/supabase-admin.service";

const MAX_BYTES = 2 * 1024 * 1024;
const MIME_PERMITIDOS = new Set(["image/jpeg", "image/png", "image/webp"]);
const EXT_POR_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

@Injectable()
export class EvidenciasService {
  private readonly logger = new Logger(EvidenciasService.name);
  private readonly bucket: string;

  constructor(
    private readonly supabase: SupabaseAdminService,
    private readonly config: ConfigService<Env, true>,
  ) {
    this.bucket = this.config.get("SUPABASE_STORAGE_BUCKET", { infer: true });
  }

  async upload(colaboradorId: string, file: Express.Multer.File | undefined) {
    if (!file) {
      throw new BadRequestException({ code: "ARQUIVO_AUSENTE", message: "Arquivo obrigatório" });
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException({
        code: "ARQUIVO_GRANDE",
        message: "Arquivo excede 2 MB",
      });
    }
    if (!MIME_PERMITIDOS.has(file.mimetype)) {
      throw new BadRequestException({
        code: "MIME_INVALIDO",
        message: "Formato aceito: JPEG, PNG ou WebP",
      });
    }

    const ext = EXT_POR_MIME[file.mimetype];
    const path = `${colaboradorId}/${Date.now()}_${randomUUID()}.${ext}`;
    const storage = this.supabase.storage(this.bucket);

    const { error } = await storage.upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });
    if (error) {
      this.logger.error(`upload Supabase falhou: ${error.message}`);
      throw new BadRequestException({
        code: "UPLOAD_FALHOU",
        message: "Falha ao enviar evidência",
      });
    }

    const { data: signed, error: signedError } = await storage.createSignedUrl(path, 3600);
    if (signedError || !signed?.signedUrl) {
      throw new BadRequestException({
        code: "URL_ASSINADA_FALHOU",
        message: "Não foi possível gerar URL assinada",
      });
    }

    return {
      path,
      evidencia_url: signed.signedUrl,
      expires_in: 3600,
    };
  }
}
