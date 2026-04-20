"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";

import { PermissionGate } from "@/components/permission-gate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiFetch } from "@/lib/api";
import { formatDateTimePtBr } from "@/lib/format";

interface LogItem {
  id: string;
  ator_id: string | null;
  ator_nome?: string | null;
  acao: string;
  entidade: string | null;
  entidade_id: string | null;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
}

interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export default function LogsPage() {
  const [acao, setAcao] = useState("");
  const [ator, setAtor] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["logs", { page, acao, ator }],
    queryFn: () =>
      apiFetch<Paginated<LogItem>>("/logs", {
        query: {
          page,
          page_size: 50,
          acao: acao || undefined,
          ator_id: ator || undefined,
        },
      }),
  });

  const total = data?.total ?? 0;
  const items = data?.items ?? [];
  const pageSize = data?.page_size ?? 50;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <PermissionGate perfisPermitidos={["admin"]}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Trilha de auditoria</h1>
          <p className="text-sm text-muted-foreground">
            Histórico de ações críticas realizadas no sistema.
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
                <Label htmlFor="acao">Ação</Label>
                <Input
                  id="acao"
                  placeholder="ex: marcacao.create"
                  value={acao}
                  onChange={(e) => setAcao(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="ator">Ator ID</Label>
                <Input
                  id="ator"
                  placeholder="UUID opcional"
                  value={ator}
                  onChange={(e) => setAtor(e.target.value)}
                />
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
            <CardTitle>Eventos</CardTitle>
            <span className="text-xs text-muted-foreground">{total} registro(s)</span>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
              </div>
            ) : isError ? (
              <div className="text-sm text-destructive">
                Erro: {(error as Error).message}
              </div>
            ) : items.length === 0 ? (
              <EmptyState
                title="Nenhum evento registrado"
                description="A trilha ainda está vazia neste recorte."
              />
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quando</TableHead>
                      <TableHead>Ator</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Entidade</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-mono text-xs">
                          {formatDateTimePtBr(l.created_at)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {l.ator_nome ?? l.ator_id ?? "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{l.acao}</TableCell>
                        <TableCell className="text-xs">
                          {l.entidade ? `${l.entidade}${l.entidade_id ? `#${l.entidade_id.slice(0, 8)}` : ""}` : "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{l.ip ?? "—"}</TableCell>
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
    </PermissionGate>
  );
}
