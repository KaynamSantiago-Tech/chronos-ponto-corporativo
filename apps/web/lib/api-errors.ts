import { ApiRequestError } from "@/lib/api";

/**
 * Títulos e descrições amigáveis para códigos de erro retornados pela API.
 * Quando o `code` não tem mapa, usa a `message` original do backend.
 */
const MAPA_CODIGOS: Record<string, { titulo: string; descricao?: string }> = {
  NO_TOKEN: {
    titulo: "Sessão expirada",
    descricao: "Entre novamente para continuar.",
  },
  INVALID_TOKEN: {
    titulo: "Sessão inválida",
    descricao: "Entre novamente para continuar.",
  },
  SEM_EMAIL: {
    titulo: "Perfil incompleto",
    descricao: "Seu usuário não tem email. Peça ao RH para corrigir.",
  },
  COLABORADOR_NAO_CADASTRADO: {
    titulo: "Email não cadastrado",
    descricao: "Procure o RH para incluir seu acesso.",
  },
  COLABORADOR_INATIVO: {
    titulo: "Colaborador inativo",
    descricao: "Seu acesso foi desativado. Fale com o RH.",
  },
  COLABORADOR_DUPLICADO: {
    titulo: "Dados já em uso",
    descricao: "Matrícula, email ou CPF já existe em outro colaborador.",
  },
  VINCULO_CONFLITO: {
    titulo: "Conflito de vínculo",
    descricao: "Este email já está ligado a outra conta. Fale com o RH.",
  },
  AUTH_USER_EM_USO: {
    titulo: "Usuário já vinculado",
    descricao: "Este login do Supabase já pertence a outro colaborador.",
  },
  SEM_PERFIL: {
    titulo: "Perfil não encontrado",
    descricao: "Faça login novamente.",
  },
  PERFIL_INSUFICIENTE: {
    titulo: "Acesso negado",
    descricao: "Seu perfil não tem permissão para esta ação.",
  },
  ACESSO_NEGADO: {
    titulo: "Acesso negado",
    descricao: "Você não tem permissão ou este item está fora do seu escopo.",
  },
  SEQUENCIA_INVALIDA: {
    titulo: "Sequência inválida",
    descricao: "Verifique sua última marcação do dia antes de tentar novamente.",
  },
  ARQUIVO_AUSENTE: {
    titulo: "Selfie não enviada",
    descricao: "Capture a selfie e tente registrar de novo.",
  },
  ARQUIVO_GRANDE: {
    titulo: "Arquivo muito grande",
    descricao: "A selfie ultrapassou o limite. Tente capturar novamente.",
  },
  MIME_INVALIDO: {
    titulo: "Formato não suportado",
    descricao: "Envie uma imagem válida (JPG).",
  },
  UPLOAD_FALHOU: {
    titulo: "Falha no upload",
    descricao: "Não foi possível enviar a evidência. Tente de novo.",
  },
  URL_ASSINADA_FALHOU: {
    titulo: "Não foi possível abrir a evidência",
    descricao: "Atualize a página e tente novamente.",
  },
  PATH_INVALIDO: {
    titulo: "Caminho inválido",
    descricao: "A evidência referenciada tem formato inválido.",
  },
  CARGO_DUPLICADO: {
    titulo: "Cargo duplicado",
    descricao: "Já existe um cargo com esse nome.",
  },
  SETOR_DUPLICADO: {
    titulo: "Setor duplicado",
    descricao: "Já existe um setor com esse nome nesta unidade.",
  },
  UNIDADE_DUPLICADA: {
    titulo: "Unidade duplicada",
    descricao: "Já existe uma unidade com esse nome.",
  },
  NOT_FOUND: {
    titulo: "Não encontrado",
    descricao: "O item pode ter sido removido ou alterado.",
  },
  ROLETA_NAO_CONFIGURADA: {
    titulo: "Roleta não configurada",
    descricao: "A integração com roleta não está ativa neste ambiente.",
  },
  ASSINATURA_AUSENTE: {
    titulo: "Requisição sem assinatura",
  },
  ASSINATURA_INVALIDA: {
    titulo: "Assinatura inválida",
  },
  INTERNAL_ERROR: {
    titulo: "Erro interno",
    descricao: "Tente novamente em instantes. Se persistir, fale com o suporte.",
  },
  DEBUG_DESABILITADO: {
    titulo: "Debug desabilitado",
    descricao: "Habilite EXPOSE_DEBUG no ambiente correto.",
  },
};

export interface ErroAmigavel {
  titulo: string;
  descricao: string;
}

export function formatarErroApi(
  erro: unknown,
  fallbackTitulo = "Algo deu errado",
): ErroAmigavel {
  if (erro instanceof ApiRequestError) {
    if (erro.statusCode === 429) {
      return {
        titulo: "Muitas tentativas",
        descricao: "Aguarde alguns segundos antes de tentar novamente.",
      };
    }
    const map = erro.code ? MAPA_CODIGOS[erro.code] : undefined;
    if (map) {
      return { titulo: map.titulo, descricao: map.descricao ?? erro.message };
    }
    return { titulo: fallbackTitulo, descricao: erro.message };
  }
  if (erro instanceof Error) {
    return { titulo: fallbackTitulo, descricao: erro.message };
  }
  return { titulo: fallbackTitulo, descricao: "Erro desconhecido" };
}
