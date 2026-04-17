"use client";

import type { Colaborador, Paginated } from "@midrah/shared";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Pencil, UserPlus } from "lucide-react";
import { useState } from "react";

import { ColaboradorFormDialog } from "@/components/admin/colaborador-form-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiFetch } from "@/lib/api";

export default function ColaboradoresPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Colaborador | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["colaboradores", { page: 1 }],
    queryFn: () =>
      apiFetch<Paginated<Colaborador>>("/colaboradores", {
        query: { page: 1, page_size: 50 },
      }),
  });

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
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
            </div>
          ) : isError ? (
            <div className="text-sm text-destructive">
              Erro: {(error as Error).message}
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nenhum colaborador cadastrado ainda.
            </div>
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
