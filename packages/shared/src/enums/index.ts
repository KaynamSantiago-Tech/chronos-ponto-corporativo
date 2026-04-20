export const PerfilColaborador = {
  ADMIN: "admin",
  RH: "rh",
  GESTOR: "gestor",
  COLABORADOR: "colaborador",
} as const;

export type PerfilColaborador =
  (typeof PerfilColaborador)[keyof typeof PerfilColaborador];

export const TipoMarcacao = {
  ENTRADA: "entrada",
  SAIDA: "saida",
  PAUSA_INICIO: "pausa_inicio",
  PAUSA_FIM: "pausa_fim",
} as const;

export type TipoMarcacao = (typeof TipoMarcacao)[keyof typeof TipoMarcacao];

export const OrigemMarcacao = {
  WEB: "web",
  ROLETA: "roleta",
  MANUAL: "manual",
} as const;

export type OrigemMarcacao = (typeof OrigemMarcacao)[keyof typeof OrigemMarcacao];
