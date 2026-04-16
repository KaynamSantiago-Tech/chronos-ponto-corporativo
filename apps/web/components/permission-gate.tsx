"use client";

import type { PerfilColaborador } from "@midrah/shared";
import type { ReactNode } from "react";

import { useColaboradorAtual } from "@/hooks/use-colaborador-atual";

interface PermissionGateProps {
  perfisPermitidos: PerfilColaborador[];
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Renderiza children apenas se o perfil do usuário estiver em `perfisPermitidos`.
 * Enquanto carrega, mostra `fallback` (ou nada).
 */
export function PermissionGate({
  perfisPermitidos,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { data: colaborador, isLoading } = useColaboradorAtual();

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (!colaborador) {
    return <>{fallback}</>;
  }

  if (!perfisPermitidos.includes(colaborador.perfil)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default PermissionGate;
