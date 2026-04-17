"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiFetch } from "@/lib/api";

interface Unidade {
  id: string;
  nome: string;
  endereco: string | null;
  ativo: boolean;
}

export default function UnidadesPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["unidades"],
    queryFn: () =>
      apiFetch<{ items: Unidade[]; total: number; page: number; page_size: number }>("/unidades", {
        query: { page: 1, page_size: 100 },
      }),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Unidades</h1>
          <p className="text-sm text-muted-foreground">Filiais e localizações da empresa.</p>
        </div>
        <Button disabled>
          <Plus className="h-4 w-4" /> Nova unidade (em breve)
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
              Nenhuma unidade cadastrada.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Status</TableHead>
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
