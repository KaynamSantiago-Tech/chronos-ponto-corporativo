"use client";

import type { Colaborador, Paginated } from "@midrah/shared";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Search, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";

import { ColaboradorFormDialog } from "@/components/admin/colaborador-form-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiFetch } from "@/lib/api";

export default function ColaboradoresPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Colaborador | null>(null);
  const [busca, setBusca] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const id = setTimeout(() => {
      setBuscaDebounced(busca.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [busca]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["colaboradores", { page, busca: buscaDebounced }],
    queryFn: () =>
      apiFetch<Paginated<Colaborador>>("/colaboradores", {
        query: {
          page,
          page_size: 50,
          busca: buscaDebounced || undefined,
        },
      }),
  });

  const total = data?.total ?? 0;
  const pageSize = data?.page_size ?? 50;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (c: Colaborador) => {
    setEditing(c);
    setDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Colaboradores</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie a base de colaboradores e envie convites.
          </p>
        </div>
        <Button onClick={openNew}>
          <UserPlus className="h-4 w-4" /> Novo colaborador
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, matrícula ou email"
              className="pl-9"
            />
          </div>
          {isLoading ? (
            <TableSkeleton rows={6} columns={5} />
          ) : isError ? (
            <div className="text-sm text-destructive">
              Erro: {(error as Error).message}
            </div>
          ) : !data || data.items.length === 0 ? (
            <EmptyState
              title="Nenhum colaborador cadastrado"
              description="Clique em Novo colaborador para enviar o primeiro convite."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.matricula}</TableCell>
                    <TableCell>{c.nome}</TableCell>
                    <TableCell className="text-xs">{c.email}</TableCell>
                    <TableCell className="capitalize">{c.perfil}</TableCell>
                    <TableCell>{c.ativo ? "Ativo" : "Inativo"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ColaboradorFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        colaborador={editing}
      />
    </div>
  );
}
