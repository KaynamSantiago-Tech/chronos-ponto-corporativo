"use client";

import type { Marcacao, Paginated, TipoMarcacao } from "@midrah/shared";
import { useQuery } from "@tanstack/react-query";
import { Loader2, UserCheck, Users, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { formatTimePtBr } from "@/lib/format";
import { inicioDoDia } from "@/lib/horas";

const HORA_LIMITE_ATRASO = 9;

interface MarcacaoAdmin extends Marcacao {
  colaborador_nome?: string;
  colaborador_matricula?: string;
}

export default function AdminHomePage() {
  const inicioDia = useMemo(() => inicioDoDia().toISOString(), []);

  const marcacoesHoje = useQuery({
    queryKey: ["admin-home", "marcacoes-hoje", inicioDia],
    queryFn: () =>
      apiFetch<Paginated<MarcacaoAdmin>>("/marcacoes", {
        query: { page: 1, page_size: 500, inicio: inicioDia },
      }),
    staleTime: 1000 * 30,
  });

  const colaboradoresAtivos = useQuery({
    queryKey: ["admin-home", "colaboradores-ativos"],
    queryFn: () =>
      apiFetch<Paginated<{ id: string }>>("/colaboradores", {
        query: { page: 1, page_size: 1, ativo: true },
      }),
    staleTime: 1000 * 60 * 5,
  });

  const itens = marcacoesHoje.data?.items ?? [];

  const resumo = useMemo(() => {
    const porColaborador = new Map<
      string,
      { ultimoTipo: TipoMarcacao; ultimoEm: Date; nome: string; entradaEm?: Date }
    >();

    const ordenadas = [...itens].sort(
      (a, b) =>
        new Date(a.registrada_em).getTime() - new Date(b.registrada_em).getTime(),
    );

    for (const m of ordenadas) {
      const tipo = m.tipo as TipoMarcacao;
      const ts = new Date(m.registrada_em);
      const atual = porColaborador.get(m.colaborador_id);
      const entradaEm =
        tipo === "entrada"
          ? atual?.entradaEm ?? ts
          : atual?.entradaEm;

      porColaborador.set(m.colaborador_id, {
        ultimoTipo: tipo,
        ultimoEm: ts,
        nome: m.colaborador_nome ?? m.colaborador_id,
        entradaEm,
      });
    }

    let presentes = 0;
    let emPausa = 0;
    let atrasos = 0;
    const listaPresentes: { id: string; nome: string; desde: Date }[] = [];

    for (const [id, v] of porColaborador.entries()) {
      if (v.ultimoTipo === "entrada" || v.ultimoTipo === "pausa_fim") {
        presentes += 1;
        listaPresentes.push({ id, nome: v.nome, desde: v.ultimoEm });
      }
      if (v.ultimoTipo === "pausa_inicio") {
        emPausa += 1;
      }
      if (v.entradaEm && v.entradaEm.getHours() >= HORA_LIMITE_ATRASO) {
        atrasos += 1;
      }
    }

    listaPresentes.sort((a, b) => a.desde.getTime() - b.desde.getTime());

    return { presentes, emPausa, atrasos, totalMarcacoes: itens.length, listaPresentes };
  }, [itens]);

  const totalColaboradores = colaboradoresAtivos.data?.total ?? null;
  const carregando = marcacoesHoje.isLoading || colaboradoresAtivos.isLoading;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Visão geral</h1>
        <p className="text-sm text-muted-foreground">
          Painel operacional do dia. Números atualizam a cada 30 segundos.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Presentes agora
            </CardTitle>
            <UserCheck className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            {carregando ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-semibold">{resumo.presentes}</div>
                <CardDescription>
                  {totalColaboradores != null
                    ? `de ${totalColaboradores} ativos`
                    : "em expediente"}
                </CardDescription>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em pausa
            </CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            {carregando ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-semibold">{resumo.emPausa}</div>
                <CardDescription>Pausa não encerrada</CardDescription>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Atrasos hoje
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {carregando ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-semibold">{resumo.atrasos}</div>
                <CardDescription>
                  Entrada após {String(HORA_LIMITE_ATRASO).padStart(2, "0")}:00
                </CardDescription>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Marcações hoje
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {carregando ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-semibold">{resumo.totalMarcacoes}</div>
                <CardDescription>Registros desde 00h</CardDescription>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Colaboradores em expediente</CardTitle>
          <Link
            href="/admin/marcacoes"
            className="text-xs text-primary underline-offset-4 hover:underline"
          >
            Ver todas marcações
          </Link>
        </CardHeader>
        <CardContent>
          {carregando ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
            </div>
          ) : resumo.listaPresentes.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Ninguém em expediente no momento.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5 text-sm">
              {resumo.listaPresentes.slice(0, 20).map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                >
                  <span>{p.nome}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    desde {formatTimePtBr(p.desde)}
                  </span>
                </li>
              ))}
              {resumo.listaPresentes.length > 20 ? (
                <li className="pt-2 text-center text-xs text-muted-foreground">
                  + {resumo.listaPresentes.length - 20} colaborador(es)
                </li>
              ) : null}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { href: "/admin/colaboradores", label: "Colaboradores" },
          { href: "/admin/unidades", label: "Unidades" },
          { href: "/admin/setores", label: "Setores" },
          { href: "/admin/cargos", label: "Cargos" },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="rounded-md border border-border bg-card p-4 text-sm font-medium transition hover:border-primary hover:bg-accent/50"
          >
            {a.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

void rotuloTipo;
