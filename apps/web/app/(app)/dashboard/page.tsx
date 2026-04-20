"use client";

import type { TipoMarcacao } from "@midrah/shared";
import { Clock4, Loader2, LogIn, Timer, TrendingUp } from "lucide-react";
import { useMemo } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMarcacoesMe } from "@/hooks/use-marcacoes-me";
import { formatTimePtBr } from "@/lib/format";
import {
  calcularSegundosTrabalhados,
  formatSegundosHHMM,
  inicioDoDia,
  inicioSemanaSegunda,
  proximaAcaoSugerida,
  rotuloTipo,
} from "@/lib/horas";

export default function DashboardPage() {
  const inicioDia = useMemo(() => inicioDoDia().toISOString(), []);
  const inicioSemana = useMemo(() => inicioSemanaSegunda().toISOString(), []);

  const hojeQuery = useMarcacoesMe({ inicio: inicioDia, page_size: 100 });
  const semanaQuery = useMarcacoesMe({ inicio: inicioSemana, page_size: 500 });

  const hojeOrdenadas = useMemo(() => {
    const items = hojeQuery.data?.items ?? [];
    return [...items].sort(
      (a, b) =>
        new Date(a.registrada_em).getTime() - new Date(b.registrada_em).getTime(),
    );
  }, [hojeQuery.data]);

  const semanaOrdenadas = useMemo(() => {
    const items = semanaQuery.data?.items ?? [];
    return [...items].sort(
      (a, b) =>
        new Date(a.registrada_em).getTime() - new Date(b.registrada_em).getTime(),
    );
  }, [semanaQuery.data]);

  const ultimoHoje = hojeOrdenadas[hojeOrdenadas.length - 1];
  const ultimoTipo: TipoMarcacao | "none" = (ultimoHoje?.tipo as TipoMarcacao) ?? "none";

  const segundosHoje = useMemo(
    () => calcularSegundosTrabalhados(hojeOrdenadas),
    [hojeOrdenadas],
  );
  const segundosSemana = useMemo(
    () => calcularSegundosTrabalhados(semanaOrdenadas),
    [semanaOrdenadas],
  );

  const proxima = proximaAcaoSugerida(ultimoTipo);
  const carregando = hojeQuery.isLoading || semanaQuery.isLoading;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Resumo da sua jornada de hoje.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Último ponto
            </CardTitle>
            <LogIn className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {carregando ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : ultimoHoje ? (
              <>
                <div className="font-mono text-2xl">
                  {formatTimePtBr(ultimoHoje.registrada_em)}
                </div>
                <CardDescription>{rotuloTipo(ultimoHoje.tipo as TipoMarcacao)}</CardDescription>
              </>
            ) : (
              <>
                <div className="font-mono text-2xl text-muted-foreground">—</div>
                <CardDescription>Sem registros hoje</CardDescription>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Horas hoje
            </CardTitle>
            <Clock4 className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            {carregando ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="font-mono text-2xl">{formatSegundosHHMM(segundosHoje)}</div>
                <CardDescription>Desde a primeira entrada</CardDescription>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total semana
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            {carregando ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="font-mono text-2xl">{formatSegundosHHMM(segundosSemana)}</div>
                <CardDescription>Segunda até agora</CardDescription>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Próxima ação
            </CardTitle>
            <Timer className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            {carregando ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-semibold">
                  {proxima?.label ?? "Jornada encerrada"}
                </div>
                <CardDescription>Sugestão baseada na jornada</CardDescription>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registros de hoje</CardTitle>
          <CardDescription>
            {hojeOrdenadas.length === 0
              ? "Nenhuma marcação registrada hoje."
              : `${hojeOrdenadas.length} marcação(ões) hoje.`}
          </CardDescription>
        </CardHeader>
        {hojeOrdenadas.length > 0 ? (
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm">
              {hojeOrdenadas.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatTimePtBr(m.registrada_em)}
                  </span>
                  <span>{rotuloTipo(m.tipo as TipoMarcacao)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        ) : null}
      </Card>
    </div>
  );
}
