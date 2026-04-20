"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, Pencil, Plus } from "lucide-react";
import { useState } from "react";

import { UnidadeFormDialog } from "@/components/admin/unidade-form-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiFetch } from "@/lib/api";

interface Unidade {
  id: string;
  nome: string;
  endereco: string | null;
  ativo: boolean;
}

export default function UnidadesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Unidade | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["unidades"],
    queryFn: () =>
      apiFetch<{ items: Unidade[]; total: number; page: number; page_size: number }>("/unidades", {
        query: { page: 1, page_size: 100 },
      }),
  });

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (u: Unidade) => {
    setEditing(u);
    setDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Unidades</h1>
          <p className="text-sm text-muted-foreground">Filiais e localizações da empresa.</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" /> Nova unidade
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={5} columns={3} />
          ) : isError ? (
            <div className="text-sm text-destructive">Erro: {(error as Error).message}</div>
          ) : !data || data.items.length === 0 ? (
            <EmptyState title="Nenhuma unidade cadastrada" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.nome}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.endereco ?? "—"}
                    </TableCell>
                    <TableCell>{u.ativo ? "Ativa" : "Inativa"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(u)}>
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

      <UnidadeFormDialog open={dialogOpen} onOpenChange={setDialogOpen} unidade={editing} />
    </div>
  );
}
