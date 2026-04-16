import { z } from "zod";
import { TipoMarcacao } from "../enums";

export const registrarMarcacaoSchema = z.object({
  tipo: z.enum([
    TipoMarcacao.ENTRADA,
    TipoMarcacao.SAIDA,
    TipoMarcacao.PAUSA_INICIO,
    TipoMarcacao.PAUSA_FIM,
  ]),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  precisao_m: z.number().positive().optional(),
  evidencia_id: z.string().uuid().optional(),
  observacao: z.string().max(500).optional(),
});

export type RegistrarMarcacaoInput = z.infer<typeof registrarMarcacaoSchema>;

export const listarMarcacoesSchema = z.object({
  inicio: z.string().datetime().optional(),
  fim: z.string().datetime().optional(),
  colaborador_id: z.string().uuid().optional(),
  setor_id: z.string().uuid().optional(),
  unidade_id: z.string().uuid().optional(),
  page: z.number().int().positive().default(1),
  page_size: z.number().int().positive().max(200).default(50),
});

export type ListarMarcacoesInput = z.infer<typeof listarMarcacoesSchema>;
