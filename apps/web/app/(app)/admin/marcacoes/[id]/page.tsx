"use client";

import type { Marcacao, TipoMarcacao } from "@midrah/shared";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, MapPin } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { SelfiePreviewButton } from "@/components/admin/selfie-preview-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { formatarErroApi } from "@/lib/api-errors";
import { formatDateTimePtBr } from "@/lib/format";

interface MarcacaoDetalhe extends Marcacao {
  colaborador?: {
    id: string;
    nome: string;
    matricula: string;
    email: string;
    setor?: { id: string; nome: string } | null;
    unidade?: { id: string; nome: string } | null;
  };
}

const TIPO_LABEL: Record<TipoMarcacao, string> = {
  entrada: "Entrada",
  saida: "Saída",
  pausa_inicio: "Pausa iniciada",
  pausa_fim: "Pausa finalizada",
};

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm">{children}</span>
    </div>
  );
}

export default function MarcacaoDetalhePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-marcacao", id],
    queryFn: () => apiFetch<MarcacaoDetalhe>(`/marcacoes/${id}`),
    enabled: !!id,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <Link
            href="/admin/marcacoes"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> Voltar para marcações
          </Link>
          <h1 className="text-2xl font-semibold">Detalhe da marcação</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : isError ? (
            <p className="text-sm text-destructive">
              {formatarErroApi(error).descricao}
            </p>
          ) : !data ? (
            <p className="text-sm text-muted-foreground">Marcação não encontrada.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <Info label="Data/hora">{formatDateTimePtBr(data.registrada_em)}</Info>
              <Info label="Tipo">{TIPO_LABEL[data.tipo] ?? data.tipo}</Info>
              <Info label="Origem">
                <span className="capitalize">{data.origem}</span>
              </Info>
              <Info label="Colaborador">
                {data.colaborador?.nome ?? data.colaborador_id}
                {data.colaborador?.matricula ? (
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({data.colaborador.matricula})
                  </span>
                ) : null}
              </Info>
              <Info label="Setor">
                {data.colaborador?.setor?.nome ?? "—"}
              </Info>
              <Info label="Unidade">
                {data.colaborador?.unidade?.nome ?? "—"}
              </Info>
              <Info label="Coordenadas">
                {data.latitude != null && data.longitude != null ? (
                  <span className="flex items-center gap-2 font-mono text-xs">
                    <MapPin className="h-3 w-3" />
                    {Number(data.latitude).toFixed(6)}, {Number(data.longitude).toFixed(6)}
                    <a
                      href={`https://www.google.com/maps?q=${data.latitude},${data.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      Mapa <ExternalLink className="h-3 w-3" />
                    </a>
                  </span>
                ) : (
                  "—"
                )}
              </Info>
              <Info label="Precisão GPS">
                {data.precisao_m != null ? `~${Math.round(data.precisao_m)} m` : "—"}
              </Info>
              <Info label="IP">{data.ip ?? "—"}</Info>
              <Info label="User-Agent">
                <span className="break-all text-xs text-muted-foreground">
                  {data.user_agent ?? "—"}
                </span>
              </Info>
              <Info label="Observação">
                <span className="whitespace-pre-wrap">{data.observacao ?? "—"}</span>
              </Info>
              <Info label="Evidência">
                {data.evidencia_url ? (
                  <SelfiePreviewButton path={data.evidencia_url} label="Ver selfie" />
                ) : (
                  "—"
                )}
              </Info>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <Link href="/admin/marcacoes">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        </Link>
      </div>
    </div>
  );
}
