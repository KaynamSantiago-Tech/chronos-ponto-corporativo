"use client";

import type { Colaborador, Marcacao, Paginated, TipoMarcacao } from "@midrah/shared";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2, PlusCircle } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { MarcacaoManualDialog } from "@/components/admin/marcacao-manual-dialog";
import { SelfiePreviewButton } from "@/components/admin/selfie-preview-button";
import { PermissionGate } from "@/components/permission-gate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { apiFetch, ApiRequestError } from "@/lib/api";
import { baixarCsv, gerarCsv } from "@/lib/csv";
import { formatDateTimePtBr } from "@/lib/format";

const TIPO_LABEL: Record<TipoMarcacao, string> = {
  entrada: "Entrada",
  saida: "Saída",
  pausa_inicio: "Pausa iniciada",
  pausa_fim: "Pausa finalizada",
};

interface MarcacaoAdmin extends Marcacao {
  colaborador_nome?: string;
  colaborador_matricula?: string;
}

const LIMITE_EXPORT = 5000;

interface Unidade { id: string; nome: string; }
interface Setor { id: string; nome: string; unidade_id: string; }

export default function AdminMarcacoesPage() {
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [inicio, setInicio] = useState(() => searchParams.get("inicio") ?? "");
  const [fim, setFim] = useState(() => searchParams.get("fim") ?? "");
  const [colaboradorId, setColaboradorId] = useState(
    () => searchParams.get("colaborador_id") ?? "",
  );
  const [colaboradorBusca, setColaboradorBusca] = useState(
    () => searchParams.get("colaborador_busca") ?? "",
  );
  const [colaboradorBuscaDeb, setColaboradorBuscaDeb] = useState(
    () => searchParams.get("colaborador_busca") ?? "",
  );
  const [unidadeId, setUnidadeId] = useState(() => searchParams.get("unidade_id") ?? "");
  const [setorId, setSetorId] = useState(() => searchParams.get("setor_id") ?? "");
  const [tipo, setTipo] = useState(() => searchParams.get("tipo") ?? "");
  const [page, setPage] = useState(() => {
    const p = Number.parseInt(searchParams.get("page") ?? "1", 10);
    return Number.isFinite(p) && p > 0 ? p : 1;
  });
  const [exportando, setExportando] = useState(false);
  const [manualAberto, setManualAberto] = useState(false);

  const unidadesQuery = useQuery({
    queryKey: ["unidades", "select"],
    queryFn: () =>
      apiFetch<Paginated<Unidade>>("/unidades", { query: { page: 1, page_size: 100 } }),
  });
  const setoresQuery = useQuery({
    queryKey: ["setores", "select", unidadeId],
    queryFn: () =>
      apiFetch<Paginated<Setor>>("/setores", {
        query: { page: 1, page_size: 200, unidade_id: unidadeId || undefined },
      }),
  });

  useEffect(() => {
    const id = setTimeout(() => setColaboradorBuscaDeb(colaboradorBusca.trim()), 300);
    return () => clearTimeout(id);
  }, [colaboradorBusca]);

  const colaboradoresQuery = useQuery({
    queryKey: ["colaboradores", "picker", colaboradorBuscaDeb],
    queryFn: () =>
      apiFetch<Paginated<Colaborador>>("/colaboradores", {
        query: {
          page: 1,
          page_size: 20,
          ativo: true,
          busca: colaboradorBuscaDeb || undefined,
        },
      }),
    enabled: colaboradorBuscaDeb.length >= 2,
  });

  const colaboradoresOptions = useMemo(
    () => colaboradoresQuery.data?.items ?? [],
    [colaboradoresQuery.data],
  );

  useEffect(() => {
    const params = new URLSearchParams();
    if (inicio) params.set("inicio", inicio);
    if (fim) params.set("fim", fim);
    if (colaboradorId) params.set("colaborador_id", colaboradorId);
    if (colaboradorBusca) params.set("colaborador_busca", colaboradorBusca);
    if (unidadeId) params.set("unidade_id", unidadeId);
    if (setorId) params.set("setor_id", setorId);
    if (tipo) params.set("tipo", tipo);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    const target = qs ? `${pathname}?${qs}` : pathname;
    router.replace(target, { scroll: false });
  }, [
    inicio,
    fim,
    colaboradorId,
    colaboradorBusca,
    unidadeId,
    setorId,
    tipo,
    page,
    pathname,
    router,
  ]);

  const filtrosIso = {
    inicio: inicio ? new Date(inicio).toISOString() : undefined,
    fim: fim ? new Date(fim).toISOString() : undefined,
    colaborador_id: colaboradorId || undefined,
    unidade_id: unidadeId || undefined,
    setor_id: setorId || undefined,
    tipo: tipo || undefined,
  } as const;

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-marcacoes", { page, ...filtrosIso }],
    queryFn: () =>
      apiFetch<Paginated<MarcacaoAdmin>>("/marcacoes", {
        query: { page, page_size: 50, ...filtrosIso },
      }),
  });

  async function exportarCsv() {
    setExportando(true);
    try {
      const response = await apiFetch<Paginated<MarcacaoAdmin>>("/marcacoes", {
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
        { header: "Colaborador", value: (m) => m.colaborador_nome ?? m.colaborador_id },
        { header: "Matricula", value: (m) => m.colaborador_matricula ?? "" },
        { header: "Tipo", value: (m) => TIPO_LABEL[m.tipo] ?? m.tipo },
        { header: "Origem", value: (m) => m.origem },
        { header: "Latitude", value: (m) => (m.latitude != null ? Number(m.latitude) : "") },
        { header: "Longitude", value: (m) => (m.longitude != null ? Number(m.longitude) : "") },
        { header: "Precisao (m)", value: (m) => m.precisao_m ?? "" },
        { header: "IP", value: (m) => m.ip ?? "" },
        { header: "Observacao", value: (m) => m.observacao ?? "" },
      ]);
      const hoje = new Date().toISOString().slice(0, 10);
      baixarCsv(`marcacoes_${hoje}`, csv);
      toast.success("Export concluído", `${response.items.length} registros exportados.`);
    } catch (err) {
      const msg =
        err instanceof ApiRequestError ? err.message : "Falha ao exportar marcações";
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Marcações</h1>
          <p className="text-sm text-muted-foreground">
            Registros de ponto de todos os colaboradores.
          </p>
        </div>
        <PermissionGate perfisPermitidos={["admin", "rh"]}>
          <Button onClick={() => setManualAberto(true)}>
            <PlusCircle className="h-4 w-4" />
            Registro manual
          </Button>
        </PermissionGate>
      </div>

      <MarcacaoManualDialog open={manualAberto} onOpenChange={setManualAberto} />

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
            <div className="flex flex-col gap-1">
              <Label htmlFor="unidade">Unidade</Label>
              <Select
                id="unidade"
                value={unidadeId}
                onChange={(e) => {
                  setUnidadeId(e.target.value);
                  setSetorId("");
                }}
                className="min-w-[180px]"
              >
                <option value="">Todas</option>
                {unidadesQuery.data?.items?.map((u) => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="setor">Setor</Label>
              <Select
                id="setor"
                value={setorId}
                onChange={(e) => setSetorId(e.target.value)}
                className="min-w-[180px]"
              >
                <option value="">Todos</option>
                {setoresQuery.data?.items?.map((s) => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="tipo">Tipo</Label>
              <Select
                id="tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="min-w-[160px]"
              >
                <option value="">Todos</option>
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
                <option value="pausa_inicio">Pausa iniciada</option>
                <option value="pausa_fim">Pausa finalizada</option>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="colaborador">Colaborador</Label>
              <Input
                id="colaborador"
                list="colaboradores-opcoes"
                placeholder="Busque por nome, matrícula ou email"
                value={colaboradorBusca}
                onChange={(e) => {
                  setColaboradorBusca(e.target.value);
                  const match = colaboradoresOptions.find(
                    (c) => `${c.nome} (${c.matricula})` === e.target.value,
                  );
                  setColaboradorId(match?.id ?? "");
                }}
                className="min-w-[240px]"
              />
              <datalist id="colaboradores-opcoes">
                {colaboradoresOptions.map((c) => (
                  <option key={c.id} value={`${c.nome} (${c.matricula})`} />
                ))}
              </datalist>
              {colaboradorBusca && !colaboradorId ? (
                <span className="text-xs text-muted-foreground">
                  Selecione um colaborador da lista para aplicar o filtro.
                </span>
              ) : null}
            </div>
            <Button type="submit" disabled={isFetching}>
              {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Aplicar
            </Button>
            {(unidadeId || setorId || tipo || colaboradorId || colaboradorBusca || inicio || fim) ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setUnidadeId("");
                  setSetorId("");
                  setTipo("");
                  setColaboradorId("");
                  setColaboradorBusca("");
                  setInicio("");
                  setFim("");
                  setPage(1);
                }}
              >
                Limpar
              </Button>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Registros</CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{total} registro(s)</span>
            <Button
              variant="outline"
              size="sm"
              onClick={exportarCsv}
              disabled={exportando || total === 0}
              title="Exportar para CSV"
            >
              {exportando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={8} columns={6} />
          ) : isError ? (
            <div className="text-sm text-destructive">
              Erro: {(error as Error).message}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title="Nenhuma marcação encontrada"
              description="Tente ampliar o período ou limpar os filtros."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/hora</TableHead>
                    <TableHead>Colaborador</TableHead>
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
                      <TableCell className="text-sm">
                        {m.colaborador_nome ?? m.colaborador_id}
                        {m.colaborador_matricula ? (
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({m.colaborador_matricula})
                          </span>
                        ) : null}
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
