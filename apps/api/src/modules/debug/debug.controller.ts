import { Controller, Get, NotFoundException } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { Roles } from "../../common/decorators/roles.decorator";

@ApiTags("debug")
@Controller("debug")
export class DebugController {
  @Roles("admin")
  @Get("sentry")
  async explodir() {
    const habilitado =
      process.env.NODE_ENV !== "production" || process.env.EXPOSE_DEBUG === "true";
    if (!habilitado) {
      throw new NotFoundException({ code: "DEBUG_DESABILITADO" });
    }
    throw new Error(
      "debug: erro proposital para validar Sentry — acione apenas em staging",
    );
  }
}
