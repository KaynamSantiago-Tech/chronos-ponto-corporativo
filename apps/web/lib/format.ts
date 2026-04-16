import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { ptBR } from "date-fns/locale";

export const FUSO_BRASIL = "America/Sao_Paulo";

/**
 * Formata ISO 8601 UTC como "dd/MM/yyyy HH:mm" no horário de São Paulo.
 */
export function formatDateTimePtBr(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const date = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(date.getTime())) return "—";
  const zoned = toZonedTime(date, FUSO_BRASIL);
  return format(zoned, "dd/MM/yyyy HH:mm", { locale: ptBR });
}

export function formatDatePtBr(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const date = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(date.getTime())) return "—";
  const zoned = toZonedTime(date, FUSO_BRASIL);
  return format(zoned, "dd/MM/yyyy", { locale: ptBR });
}

export function formatTimePtBr(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const date = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(date.getTime())) return "—";
  const zoned = toZonedTime(date, FUSO_BRASIL);
  return format(zoned, "HH:mm", { locale: ptBR });
}
