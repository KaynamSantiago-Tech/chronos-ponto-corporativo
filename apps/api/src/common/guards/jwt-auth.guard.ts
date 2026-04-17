import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";

import { PrismaService } from "../../prisma/prisma.service";
import { SupabaseJwtService } from "../supabase/supabase-jwt.service";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import type { RequestUser } from "../decorators/current-user.decorator";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: SupabaseJwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<Request & { user?: RequestUser }>();
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException({
        code: "NO_TOKEN",
        message: "Bearer token ausente",
      });
    }
    const token = header.slice("Bearer ".length);

    const payload = await this.jwt.verify(token).catch((err: Error) => {
      this.logger.warn(`jwt inválido: ${err.message}`);
      throw new UnauthorizedException({
        code: "INVALID_TOKEN",
        message: "Token inválido",
      });
    });

    const colaborador = await this.prisma.colaborador.findUnique({
      where: { auth_user_id: payload.sub },
      select: {
        id: true,
        perfil: true,
        email: true,
        nome: true,
        ativo: true,
        deleted_at: true,
      },
    });

    if (!colaborador || !colaborador.ativo || colaborador.deleted_at) {
      throw new UnauthorizedException({
        code: "COLABORADOR_INATIVO",
        message: "Colaborador não vinculado ou inativo. Chame /auth/sync.",
      });
    }

    req.user = {
      auth_user_id: payload.sub,
      colaborador_id: colaborador.id,
      perfil: colaborador.perfil as RequestUser["perfil"],
      email: colaborador.email,
      nome: colaborador.nome,
    };
    return true;
  }
}
