"use client";

import { Image as ImageIcon, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api";
import { formatarErroApi } from "@/lib/api-errors";

interface SelfiePreviewButtonProps {
  path: string;
  label?: string;
}

interface SignedUrlResponse {
  signed_url: string;
  expires_in: number;
}

export function SelfiePreviewButton({ path, label }: SelfiePreviewButtonProps) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  async function abrir() {
    setOpen(true);
    if (url) return;
    setLoading(true);
    try {
      const res = await apiFetch<SignedUrlResponse>("/evidencias/signed-url", {
        query: { path, seconds: 600 },
      });
      setUrl(res.signed_url);
    } catch (err) {
      const amigavel = formatarErroApi(err, "Não foi possível carregar evidência");
      toast.error(amigavel.titulo, amigavel.descricao);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={abrir} title="Ver selfie">
        <ImageIcon className="h-4 w-4" />
        {label ?? "Selfie"}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setUrl(null);
        }}
        title="Evidência da marcação"
        description="URL assinada temporariamente (válida por 10 minutos)."
        size="md"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Carregando selfie…
          </div>
        ) : url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt="Selfie da marcação"
            className="mx-auto max-h-[60vh] rounded-md border border-border object-contain"
          />
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Sem evidência disponível.
          </p>
        )}
      </Dialog>
    </>
  );
}
