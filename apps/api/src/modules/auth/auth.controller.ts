import { Controller, Get, Headers, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";

import { CurrentUser, type RequestUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { AuthService } from "./auth.service";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly service: AuthService) {}

  /**
   * Primeira chamada após login no Supabase. Valida o JWT, localiza o
   * colaborador por email e grava o vínculo `auth_user_id` se ainda não existir.
   * A partir daqui, as demais rotas autenticadas passam a funcionar.
   */
  @Public()
  @Throttle({ auth: { ttl: 60_000, limit: 10 } })
  @Post("sync")
  sync(@Headers("authorization") authorization?: string) {
    return this.service.sync(authorization);
  }

  @ApiBearerAuth()
  @Get("me")
  me(@CurrentUser() user: RequestUser) {
    return this.service.getMe(user.colaborador_id);
  }
}
