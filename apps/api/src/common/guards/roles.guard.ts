import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";

import type { RequestUser } from "../decorators/current-user.decorator";
import { ROLES_KEY, type Perfil } from "../decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Perfil[] | undefined>(
      ROLES_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (!required || required.length === 0) return true;

    const req = ctx.switchToHttp().getRequest<Request & { user?: RequestUser }>();
    if (!req.user?.perfil) {
      throw new ForbiddenException({
        code: "SEM_PERFIL",
        message: "Usuário sem perfil associado",
      });
    }
    if (!required.includes(req.user.perfil)) {
      throw new ForbiddenException({
        code: "PERFIL_INSUFICIENTE",
        message: "Perfil não autorizado para esta operação",
      });
    }
    return true;
  }
}
