"use client";

import type { Marcacao, Paginated } from "@midrah/shared";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";

export interface ListarMarcacoesMeParams {
  page?: number;
  page_size?: number;
  inicio?: string;
  fim?: string;
}

/**
 * Busca marcações do colaborador autenticado via GET /marcacoes/me.
 */
export function useMarcacoesMe(params: ListarMarcacoesMeParams = {}) {
  return useQuery({
    queryKey: ["marcacoes", "me", params],
    queryFn: () =>
      apiFetch<Paginated<Marcacao>>("/marcacoes/me", {
        query: {
          page: params.page ?? 1,
          page_size: params.page_size ?? 50,
          inicio: params.inicio,
          fim: params.fim,
        },
      }),
    staleTime: 1000 * 30,
  });
}
