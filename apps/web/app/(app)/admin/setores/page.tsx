"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["setores"],
    queryFn: () =>
      apiFetch<{ items: Setor[]; total: number; page: number; page_size: number }>("/setores", {
        query: { page: 1, page_size: 100 },
      }),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Setores</h1>
          <p className="text-sm text-muted-foreground">Divisões dentro de cada unidade.</p>
        </div>
        <Button disabled>
          <Plus className="h-4 w-4" /> Novo setor (em breve)
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
            <div className="text-sm text-destructive">Erro: {(error as Error).message}</div>
          ) : !data || data.items.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nenhum setor cadastrado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Status</TableHead>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
