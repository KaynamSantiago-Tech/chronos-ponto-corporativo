import { SetMetadata } from "@nestjs/common";

export type Perfil = "admin" | "rh" | "gestor" | "colaborador";

export const ROLES_KEY = "roles";
export const Roles = (...perfis: Perfil[]) => SetMetadata(ROLES_KEY, perfis);
