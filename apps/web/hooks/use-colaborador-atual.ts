"use client";

import type { Colaborador } from "@midrah/shared";
import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";

/**
 * Busca o colaborador autenticado no NestJS via GET /auth/me.
 * Resposta esperada: objeto Colaborador direto.
 */
export function useColaboradorAtual() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => apiFetch<Colaborador>("/auth/me"),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
