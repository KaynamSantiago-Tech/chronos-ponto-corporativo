import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export interface RequestUser {
  auth_user_id: string;
  colaborador_id: string;
  perfil: "admin" | "rh" | "gestor" | "colaborador";
  email: string;
  nome: string;
}

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): RequestUser => {
    const req = ctx.switchToHttp().getRequest<{ user: RequestUser }>();
    return req.user;
  },
);
