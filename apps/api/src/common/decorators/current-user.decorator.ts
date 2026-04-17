import { createParamDecorator, ExecutionContext } from "@nestjs/common";

import type { PerfilColaborador } from "@midrah/shared";

export interface AuthUser {
  sub: string;
  email?: string;
  colaborador_id?: string;
  perfil?: PerfilColaborador;
}

export const CurrentUser = createParamDecorator<unknown, ExecutionContext>(
  (_data, ctx) => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
    return request.user;
  },
);
