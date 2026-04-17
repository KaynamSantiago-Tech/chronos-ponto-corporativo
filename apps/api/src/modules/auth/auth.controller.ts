import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

import { CurrentUser, type RequestUser } from "../../common/decorators/current-user.decorator";
import { AuthService } from "./auth.service";

class SyncDto {
  @IsUUID()
  auth_user_id!: string;
}

@ApiBearerAuth()
@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post("sync")
  sync(@CurrentUser() user: RequestUser, @Body() _body: SyncDto) {
    // O JwtAuthGuard já validou o token e vinculou o colaborador.
    // Esse endpoint existe para o frontend chamar logo após o login Supabase
    // e receber o perfil consolidado.
    return this.service.getMe(user.colaborador_id);
  }

  @Get("me")
  me(@CurrentUser() user: RequestUser) {
    return this.service.getMe(user.colaborador_id);
  }
}
