"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="w-full max-w-md rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <h1 className="text-xl font-semibold">Algo deu errado</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              A equipe foi notificada automaticamente. Você pode tentar novamente —
              se o problema persistir, avise o RH.
            </p>
            {error.digest ? (
              <p className="mt-3 font-mono text-xs text-muted-foreground">
                ID: {error.digest}
              </p>
            ) : null}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => reset()}
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Tentar de novo
              </button>
              <a
                href="/dashboard"
                className="inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
              >
                Ir para o painel
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
