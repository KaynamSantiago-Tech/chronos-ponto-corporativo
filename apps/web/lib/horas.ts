import type { Marcacao, TipoMarcacao } from "@midrah/shared";

/**
 * Soma segundos trabalhados a partir de uma lista de marcações ordenadas
 * cronologicamente (asc). Considera pares `entrada`→`pausa_inicio|saida` e
 * `pausa_fim`→`pausa_inicio|saida`. Se o último estado é "ativo" (entrada ou
 * pausa_fim) e não há encerramento, soma até o `agora`.
 */
export function calcularSegundosTrabalhados(
  marcacoes: Pick<Marcacao, "tipo" | "registrada_em">[],
  agora: Date = new Date(),
): number {
  let total = 0;
  let abertura: Date | null = null;

  for (const m of marcacoes) {
    const tipo = m.tipo as TipoMarcacao;
    const ts = new Date(m.registrada_em);

    if (tipo === "entrada" || tipo === "pausa_fim") {
      if (!abertura) abertura = ts;
      continue;
    }
    if (tipo === "pausa_inicio" || tipo === "saida") {
      if (abertura) {
        total += Math.max(0, (ts.getTime() - abertura.getTime()) / 1000);
        abertura = null;
      }
    }
  }

  if (abertura) {
    total += Math.max(0, (agora.getTime() - abertura.getTime()) / 1000);
  }
  return Math.floor(total);
}

export function formatSegundosHHMM(segundos: number): string {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function inicioSemanaSegunda(ref: Date = new Date()): Date {
  const d = new Date(ref);
  d.setHours(0, 0, 0, 0);
  const dia = d.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  d.setDate(d.getDate() + diff);
  return d;
}

export function inicioDoDia(ref: Date = new Date()): Date {
  const d = new Date(ref);
  d.setHours(0, 0, 0, 0);
  return d;
}

const ROTULO: Record<TipoMarcacao, string> = {
  entrada: "Entrada",
  saida: "Saída",
  pausa_inicio: "Início de pausa",
  pausa_fim: "Retorno da pausa",
};

export function rotuloTipo(tipo: TipoMarcacao): string {
  return ROTULO[tipo] ?? tipo;
}

const PROXIMAS: Record<TipoMarcacao | "none", TipoMarcacao | null> = {
  none: "entrada",
  entrada: "pausa_inicio",
  pausa_inicio: "pausa_fim",
  pausa_fim: "saida",
  saida: null,
};

export function proximaAcaoSugerida(
  ultimoTipo: TipoMarcacao | "none",
): { tipo: TipoMarcacao; label: string } | null {
  const next = PROXIMAS[ultimoTipo];
  if (!next) return null;
  return { tipo: next, label: ROTULO[next] };
}
