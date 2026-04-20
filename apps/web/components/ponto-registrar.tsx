"use client";

import { TipoMarcacao, type Marcacao } from "@midrah/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2, LogIn, LogOut, PauseCircle, PlayCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useMarcacoesMe } from "@/hooks/use-marcacoes-me";
import {
  abrirCameraFrontal,
  capturarSelfieJpeg,
  CameraDeniedError,
  liberarCamera,
} from "@/lib/camera";
import { cn } from "@/lib/cn";
import {
  GeolocationDeniedError,
  GeolocationTimeoutError,
  obterCoordenadasAtuais,
  type Coordenadas,
} from "@/lib/geolocation";
import { apiFetch, ApiRequestError } from "@/lib/api";

type AcaoPonto = {
  tipo: TipoMarcacao;
  label: string;
  icon: typeof LogIn;
  variant: "default" | "destructive" | "warning" | "success";
};

const ACOES: AcaoPonto[] = [
  { tipo: TipoMarcacao.ENTRADA, label: "Entrada", icon: LogIn, variant: "success" },
  { tipo: TipoMarcacao.PAUSA_INICIO, label: "Iniciar pausa", icon: PauseCircle, variant: "warning" },
  { tipo: TipoMarcacao.PAUSA_FIM, label: "Retornar da pausa", icon: PlayCircle, variant: "default" },
  { tipo: TipoMarcacao.SAIDA, label: "Saída", icon: LogOut, variant: "destructive" },
];

const PROXIMAS: Record<TipoMarcacao | "none", TipoMarcacao[]> = {
  none: [TipoMarcacao.ENTRADA],
  entrada: [TipoMarcacao.SAIDA, TipoMarcacao.PAUSA_INICIO],
  pausa_inicio: [TipoMarcacao.PAUSA_FIM],
  pausa_fim: [TipoMarcacao.SAIDA, TipoMarcacao.PAUSA_INICIO],
  saida: [],
};

function inicioDoDiaIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function formatHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ROTULO_TIPO: Record<TipoMarcacao, string> = {
  entrada: "entrada",
  saida: "saída",
  pausa_inicio: "início de pausa",
  pausa_fim: "retorno da pausa",
};

interface UploadResponse {
  path: string;
  signed_url: string;
  expires_in: number;
}

export default function PontoRegistrar() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraPronta, setCameraPronta] = useState(false);
  const [iniciandoCamera, setIniciandoCamera] = useState(false);
  const [acaoEmAndamento, setAcaoEmAndamento] = useState<TipoMarcacao | null>(null);

  const pararCamera = useCallback(() => {
    liberarCamera(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraPronta(false);
  }, []);

  useEffect(() => {
    return () => {
      // Libera tracks ao desmontar.
      pararCamera();
    };
  }, [pararCamera]);

  async function iniciarCamera() {
    if (cameraPronta || iniciandoCamera) return;
    setIniciandoCamera(true);
    try {
      const stream = await abrirCameraFrontal();
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setCameraPronta(true);
    } catch (error) {
      if (error instanceof CameraDeniedError) {
        toast.error("Câmera indisponível", "Autorize o acesso à câmera para registrar ponto.");
      } else {
        toast.error("Falha na câmera", (error as Error).message);
      }
    } finally {
      setIniciandoCamera(false);
    }
  }

  const mutation = useMutation({
    mutationFn: async (tipo: TipoMarcacao): Promise<Marcacao> => {
      if (!videoRef.current || !cameraPronta) {
        throw new Error("Câmera não está pronta");
      }

      // 1. coordenadas
      let coords: Coordenadas;
      try {
        coords = await obterCoordenadasAtuais();
      } catch (error) {
        if (error instanceof GeolocationDeniedError) {
          throw new Error("Autorize o acesso à localização para registrar ponto.");
        }
        if (error instanceof GeolocationTimeoutError) {
          throw new Error("Tempo limite ao obter localização. Tente novamente.");
        }
        throw error;
      }

      // 2. selfie
      const blob = await capturarSelfieJpeg(videoRef.current);

      // 3. upload evidência
      const formData = new FormData();
      formData.append("arquivo", blob, `selfie-${Date.now()}.jpg`);
      const upload = await apiFetch<UploadResponse>("/evidencias/upload", {
        method: "POST",
        body: formData,
        raw: true,
      });

      // 4. registrar marcação (evidencia_url guarda o path relativo do Storage)
      return apiFetch<Marcacao>("/marcacoes", {
        method: "POST",
        body: {
          tipo,
          latitude: coords.latitude,
          longitude: coords.longitude,
          precisao_m: coords.precisao_m,
          evidencia_url: upload.path,
        },
      });
    },
    onSuccess: (marcacao) => {
      toast.success("Ponto registrado", `Tipo: ${marcacao.tipo}`);
      queryClient.invalidateQueries({ queryKey: ["marcacoes", "me"] });
      pararCamera();
    },
    onError: (error: unknown) => {
      const mensagem =
        error instanceof ApiRequestError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Erro desconhecido";
      toast.error("Não foi possível registrar", mensagem);
    },
    onSettled: () => {
      setAcaoEmAndamento(null);
    },
  });

  async function registrar(tipo: TipoMarcacao) {
    if (!cameraPronta) {
      await iniciarCamera();
      if (!streamRef.current) return;
    }
    setAcaoEmAndamento(tipo);
    mutation.mutate(tipo);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar ponto</CardTitle>
        <CardDescription>
          Autorize câmera e localização. Sua selfie será usada como evidência.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="relative overflow-hidden rounded-lg border border-border bg-black/30 aspect-[4/3]">
          <video
            ref={videoRef}
            playsInline
            muted
            className={cn(
              "h-full w-full object-cover transition-opacity",
              cameraPronta ? "opacity-100" : "opacity-0",
            )}
          />
          {!cameraPronta ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Button onClick={iniciarCamera} disabled={iniciandoCamera}>
                {iniciandoCamera ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                {iniciandoCamera ? "Abrindo câmera..." : "Ativar câmera"}
              </Button>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ACOES.map((acao) => {
            const Icon = acao.icon;
            const loading = acaoEmAndamento === acao.tipo && mutation.isPending;
            return (
              <Button
                key={acao.tipo}
                variant={acao.variant}
                disabled={mutation.isPending}
                onClick={() => registrar(acao.tipo)}
                className="h-14 justify-center"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
                {acao.label}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
