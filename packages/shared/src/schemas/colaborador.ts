import { z } from "zod";
import { PerfilColaborador } from "../enums";

const cpfRegex = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;

export const criarColaboradorSchema = z.object({
  matricula: z.string().min(1).max(20),
  nome: z.string().min(3).max(120),
  email: z.string().email(),
  cpf: z.string().regex(cpfRegex, "CPF inválido"),
  telefone: z.string().max(20).optional(),
  perfil: z.enum([
    PerfilColaborador.ADMIN,
    PerfilColaborador.RH,
    PerfilColaborador.GESTOR,
    PerfilColaborador.COLABORADOR,
  ]),
  cargo_id: z.string().uuid(),
  setor_id: z.string().uuid(),
  unidade_id: z.string().uuid(),
});

export type CriarColaboradorInput = z.infer<typeof criarColaboradorSchema>;

export const atualizarColaboradorSchema = criarColaboradorSchema
  .partial()
  .extend({
    ativo: z.boolean().optional(),
  });

export type AtualizarColaboradorInput = z.infer<
  typeof atualizarColaboradorSchema
>;
