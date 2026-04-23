"use client";

import { useQuery } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";

import { SetorFormDialog } from "@/components/admin/setor-form-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiFetch } from "@/lib/api";

interface Setor {
  id: string;
  nome: string;
  unidade_id: string;
  unidade_nome?: string | null;
  ativo: boolean;
}

export default function SetoresPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Setor | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["setores"],
    queryFn: () =>
      apiFetch<{ items: Setor[]; total: number; page: number; page_size: number }>("/setores", {
        query: { page: 1, page_size: 100 },
      }),
  });

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (s: Setor) => {
    setEditing(s);
    setDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Setores</h1>
          <p className="text-sm text-muted-foreground">Divisões dentro de cada unidade.</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" /> Novo setor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={5} columns={4} />
          ) : isError ? (
            <div className="text-sm text-destructive">Erro: {(error as Error).message}</div>
          ) : !data || data.items.length === 0 ? (
            <EmptyState title="Nenhum setor cadastrado" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.nome}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.unidade_nome ?? s.unidade_id}
                    </TableCell>
                    <TableCell>{s.ativo ? "Ativo" : "Inativo"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
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

      <SetorFormDialog open={dialogOpen} onOpenChange={setDialogOpen} setor={editing} />
    </div>
  );
}
