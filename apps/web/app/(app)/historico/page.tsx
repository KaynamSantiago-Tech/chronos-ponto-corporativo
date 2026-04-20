"use client";

import type { Marcacao, Paginated, TipoMarcacao } from "@midrah/shared";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

import { SelfiePreviewButton } from "@/components/admin/selfie-preview-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { useMarcacoesMe } from "@/hooks/use-marcacoes-me";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { baixarCsv, gerarCsv } from "@/lib/csv";
import { formatDateTimePtBr } from "@/lib/format";

const TIPO_LABEL: Record<TipoMarcacao, string> = {
  entrada: "Entrada",
  saida: "Saída",
  pausa_inicio: "Pausa iniciada",
  pausa_fim: "Pausa finalizada",
};

const LIMITE_EXPORT = 5000;

export default function HistoricoPage() {
  const toast = useToast();
  const [inicio, setInicio] = useState<string>("");
  const [fim, setFim] = useState<string>("");
  const [page, setPage] = useState(1);
  const [exportando, setExportando] = useState(false);

  const filtrosIso = {
    inicio: inicio ? new Date(inicio).toISOString() : undefined,
    fim: fim ? new Date(fim).toISOString() : undefined,
  } as const;

  const { data, isLoading, isError, error, refetch, isFetching } = useMarcacoesMe({
    page,
    page_size: 50,
    ...filtrosIso,
  });

  async function exportarCsv() {
    setExportando(true);
    try {
      const response = await apiFetch<Paginated<Marcacao>>("/marcacoes/me", {
        query: { page: 1, page_size: LIMITE_EXPORT, ...filtrosIso },
      });
      if (response.items.length === 0) {
        toast.info("Nada para exportar", "Ajuste os filtros e tente novamente.");
        return;
      }
      if (response.total > LIMITE_EXPORT) {
        toast.info(
          "Export truncado",
          `Mostrando primeiros ${LIMITE_EXPORT} de ${response.total} registros. Refine o filtro.`,
        );
      }
      const csv = gerarCsv(response.items, [
        { header: "Data/hora", value: (m) => formatDateTimePtBr(m.registrada_em) },
        { header: "Tipo", value: (m) => TIPO_LABEL[m.tipo] ?? m.tipo },
        { header: "Origem", value: (m) => m.origem },
        { header: "Latitude", value: (m) => (m.latitude != null ? Number(m.latitude) : "") },
        { header: "Longitude", value: (m) => (m.longitude != null ? Number(m.longitude) : "") },
        { header: "Precisao (m)", value: (m) => m.precisao_m ?? "" },
        { header: "Observacao", value: (m) => m.observacao ?? "" },
      ]);
      const hoje = new Date().toISOString().slice(0, 10);
      baixarCsv(`meu_historico_${hoje}`, csv);
      toast.success("Export concluído", `${response.items.length} registros exportados.`);
    } catch (err) {
      const msg =
        err instanceof ApiRequestError ? err.message : "Falha ao exportar histórico";
      toast.error("Erro no export", msg);
    } finally {
      setExportando(false);
    }
  }

  const total = data?.total ?? 0;
  const items = data?.items ?? [];
  const pageSize = data?.page_size ?? 50;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Meu histórico</h1>
        <p className="text-sm text-muted-foreground">
          Marcações recentes com localização e evidência.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              void refetch();
            }}
          >
            <div className="flex flex-col gap-1">
              <Label htmlFor="inicio">Início</Label>
              <Input
                id="inicio"
                type="date"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="fim">Fim</Label>
              <Input id="fim" type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
            </div>
            <Button type="submit" disabled={isFetching}>
              {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Aplicar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Marcações</CardTitle>
          <span className="text-xs text-muted-foreground">{total} registro(s)</span>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
            </div>
          ) : isError ? (
            <div className="text-sm text-destructive">
              Erro ao carregar: {(error as Error).message}
            </div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma marcação no período.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/hora</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead className="w-24 text-right">Evidência</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono text-xs">
                        {formatDateTimePtBr(m.registrada_em)}
                      </TableCell>
                      <TableCell>{TIPO_LABEL[m.tipo] ?? m.tipo}</TableCell>
                      <TableCell className="capitalize">{m.origem}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {m.latitude != null && m.longitude != null
                          ? `${Number(m.latitude).toFixed(5)}, ${Number(m.longitude).toFixed(5)}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {m.evidencia_url ? (
                          <SelfiePreviewButton path={m.evidencia_url} />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
