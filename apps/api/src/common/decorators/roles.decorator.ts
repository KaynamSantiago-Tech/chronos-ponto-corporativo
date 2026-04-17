import { SetMetadata } from "@nestjs/common";

import type { PerfilColaborador } from "@midrah/shared";

export const ROLES_KEY = "perfisPermitidos";
export const Roles = (
  ...perfis: PerfilColaborador[]
): MethodDecorator & ClassDecorator => SetMetadata(ROLES_KEY, perfis);
