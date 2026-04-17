import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiExcludeController } from "@nestjs/swagger";
import { createHmac, timingSafeEqual } from "crypto";

import { Public } from "../../common/decorators/public.decorator";
import type { Env } from "../../config/env.schema";

@ApiExcludeController()
@Controller("roleta")
export class RoletaController {
  constructor(private readonly config: ConfigService<Env, true>) {}

  /**
   * Stub — ainda não integra a roleta real. Valida HMAC e retorna 204
   * para já deixar o contrato travado. A lógica de gerar marcação virá
   * em uma fase posterior.
   */
  @Public()
  @Post("webhook")
  @HttpCode(204)
  webhook(
    @Headers("x-signature") signature: string | undefined,
    @Body() body: unknown,
  ) {
    const secret = this.config.get("ROLETA_WEBHOOK_SECRET", { infer: true });
    if (!secret) {
      throw new BadRequestException({
        code: "ROLETA_NAO_CONFIGURADA",
        message: "Secret da roleta não configurado",
      });
    }
    if (!signature) {
      throw new BadRequestException({
        code: "ASSINATURA_AUSENTE",
        message: "Header x-signature obrigatório",
      });
    }

    const digest = createHmac("sha256", secret)
      .update(JSON.stringify(body ?? {}))
      .digest("hex");

    const a = Buffer.from(digest, "hex");
    const b = Buffer.from(signature.replace(/^sha256=/, ""), "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new BadRequestException({
        code: "ASSINATURA_INVALIDA",
        message: "HMAC inválido",
      });
    }
    return;
  }
}
