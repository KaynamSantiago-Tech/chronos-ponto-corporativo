import type { PerfilColaborador, TipoMarcacao, OrigemMarcacao } from "../enums";

export interface Colaborador {
  id: string;
  auth_user_id: string | null;
  matricula: string;
  nome: string;
  email: string;
  cpf: string;
  telefone: string | null;
  perfil: PerfilColaborador;
  cargo_id: string;
  setor_id: string;
  unidade_id: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Marcacao {
  id: string;
  colaborador_id: string;
  tipo: TipoMarcacao;
  registrada_em: string;
  latitude: number | null;
  longitude: number | null;
  precisao_m: number | null;
  evidencia_url: string | null;
  origem: OrigemMarcacao;
  observacao: string | null;
  ip?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  code?: string;
  details?: unknown;
}
