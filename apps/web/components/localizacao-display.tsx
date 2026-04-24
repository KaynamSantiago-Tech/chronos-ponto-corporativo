"use client";

import { Loader2, MapPin } from "lucide-react";
import { useState } from "react";

import { reverseGeocode } from "@/lib/geocode";

interface Props {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  precisao_m?: number | null;
}

export function LocalizacaoDisplay({ latitude, longitude, precisao_m }: Props) {
  const [endereco, setEndereco] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (latitude == null || longitude == null) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  async function buscar() {
    if (endereco || loading) return;
    setLoading(true);
    setErro(null);
    try {
      const texto = await reverseGeocode(lat, lng);
      setEndereco(texto);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <div className="flex flex-col gap-0.5">
      {endereco ? (
        <span className="text-xs">{endereco}</span>
      ) : (
        <button
          type="button"
          onClick={buscar}
          disabled={loading}
          className="flex items-center gap-1 text-left text-xs text-muted-foreground hover:text-foreground disabled:opacity-60"
          title="Buscar endereço aproximado"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <MapPin className="h-3 w-3" />
          )}
          {erro ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`}
        </button>
      )}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-2 hover:underline"
        >
          Abrir no mapa
        </a>
        {precisao_m != null ? <span>· ~{Math.round(precisao_m)} m</span> : null}
      </div>
    </div>
  );
}
