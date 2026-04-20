"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AppErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Essa tela falhou ao carregar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Reportamos o erro automaticamente. Tente de novo; se o problema
            continuar, volte ao painel e acione o RH.
          </p>
          {error.digest ? (
            <p className="font-mono text-xs text-muted-foreground">
              ID: {error.digest}
            </p>
          ) : null}
          <div className="flex gap-2 pt-2">
            <Button onClick={() => reset()}>Tentar de novo</Button>
            <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>
              Ir para o painel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
