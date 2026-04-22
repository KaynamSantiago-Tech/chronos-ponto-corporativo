"use client";

import { TipoMarcacao, type Marcacao } from "@midrah/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Loader2,
  LogIn,
  LogOut,
  MapPin,
  PauseCircle,
  PlayCircle,
  RefreshCw,
} from "lucide-react";
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
  GeolocationUnavailableError,
  obterCoordenadasAtuais,
  type Coordenadas,
} from "@/lib/geolocation";
import { apiFetch } from "@/lib/api";
import { formatarErroApi } from "@/lib/api-errors";

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
  const [cameraErro, setCameraErro] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"desconhecido" | "verificando" | "ok" | "erro">(
    "desconhecido",
  );
  const [gpsErro, setGpsErro] = useState<string | null>(null);
  const [gpsPrecisao, setGpsPrecisao] = useState<number | null>(null);
  const [acaoEmAndamento, setAcaoEmAndamento] = useState<TipoMarcacao | null>(null);

  const hojeQuery = useMarcacoesMe({ inicio: inicioDoDiaIso(), page_size: 20 });

  const ultimaHoje = hojeQuery.data?.items?.[0];
  const ultimoTipo = (ultimaHoje?.tipo as TipoMarcacao | undefined) ?? "none";
  const proximasPermitidas = useMemo(
    () => new Set(PROXIMAS[ultimoTipo]),
    [ultimoTipo],
  );

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
    setCameraErro(null);
    try {
      const stream = await abrirCameraFrontal();
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setCameraPronta(true);
    } catch (error) {
      const mensagem =
        error instanceof CameraDeniedError
          ? "Autorize o acesso à câmera nas configurações do navegador."
          : (error as Error).message || "Não foi possível abrir a câmera.";
      setCameraErro(mensagem);
      toast.error("Câmera indisponível", mensagem);
    } finally {
      setIniciandoCamera(false);
    }
  }

  async function verificarGps() {
    setGpsStatus("verificando");
    setGpsErro(null);
    try {
      const coords = await obterCoordenadasAtuais();
      setGpsStatus("ok");
      setGpsPrecisao(coords.precisao_m);
    } catch (error) {
      setGpsStatus("erro");
      if (error instanceof GeolocationDeniedError) {
        setGpsErro("Autorize o acesso à localização nas configurações do navegador.");
      } else if (error instanceof GeolocationTimeoutError) {
        setGpsErro("Tempo limite ao obter localização. Tente novamente próximo a uma janela.");
      } else if (error instanceof GeolocationUnavailableError) {
        setGpsErro(error.message);
      } else {
        setGpsErro((error as Error).message || "Falha ao obter localização.");
      }
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
        setGpsStatus("ok");
        setGpsPrecisao(coords.precisao_m);
        setGpsErro(null);
      } catch (error) {
        setGpsStatus("erro");
        if (error instanceof GeolocationDeniedError) {
          const msg = "Autorize o acesso à localização nas configurações do navegador.";
          setGpsErro(msg);
          throw new Error(msg);
        }
        if (error instanceof GeolocationTimeoutError) {
          const msg = "Tempo limite ao obter localização. Tente novamente próximo a uma janela.";
          setGpsErro(msg);
          throw new Error(msg);
        }
        if (error instanceof GeolocationUnavailableError) {
          setGpsErro(error.message);
          throw error;
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
      const label = ROTULO_TIPO[marcacao.tipo as TipoMarcacao] ?? marcacao.tipo;
      toast.success("Ponto registrado", `${label} às ${formatHora(marcacao.registrada_em)}`);
      queryClient.invalidateQueries({ queryKey: ["marcacoes", "me"] });
      pararCamera();
    },
    onError: (error: unknown) => {
      const amigavel = formatarErroApi(error, "Não foi possível registrar");
      toast.error(amigavel.titulo, amigavel.descricao);
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
        <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          {hojeQuery.isLoading ? (
            <span>Carregando status do dia…</span>
          ) : ultimaHoje ? (
            <span>
              Último registro hoje:{" "}
              <strong className="text-foreground">
                {ROTULO_TIPO[ultimaHoje.tipo as TipoMarcacao] ?? ultimaHoje.tipo}
              </strong>{" "}
              às <strong className="text-foreground">{formatHora(ultimaHoje.registrada_em)}</strong>.
            </span>
          ) : (
            <span>Nenhum registro hoje — comece pela <strong className="text-foreground">Entrada</strong>.</span>
          )}
        </div>

        <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/20 p-3 text-xs">
          <div className="flex items-start gap-2">
            {cameraPronta ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            ) : cameraErro ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            ) : (
              <Camera className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <div className="flex-1">
              <p className="font-medium text-foreground">Câmera</p>
              <p className="text-muted-foreground">
                {cameraPronta
                  ? "Pronta."
                  : cameraErro
                    ? cameraErro
                    : "Ative a câmera para capturar a selfie de evidência."}
              </p>
            </div>
            {!cameraPronta && cameraErro ? (
              <Button
                size="sm"
                variant="outline"
                onClick={iniciarCamera}
                disabled={iniciandoCamera}
              >
                <RefreshCw className="h-3.5 w-3.5" /> Tentar
              </Button>
            ) : null}
          </div>
          <div className="flex items-start gap-2">
            {gpsStatus === "ok" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            ) : gpsStatus === "erro" ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            ) : gpsStatus === "verificando" ? (
              <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
            ) : (
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <div className="flex-1">
              <p className="font-medium text-foreground">Localização</p>
              <p className="text-muted-foreground">
                {gpsStatus === "ok" && gpsPrecisao !== null
                  ? `Capturada (precisão ~${Math.round(gpsPrecisao)} m).`
                  : gpsStatus === "erro"
                    ? gpsErro
                    : gpsStatus === "verificando"
                      ? "Obtendo coordenadas…"
                      : "Será solicitada no primeiro registro."}
              </p>
            </div>
            {gpsStatus !== "verificando" ? (
              <Button size="sm" variant="outline" onClick={verificarGps}>
                <RefreshCw className="h-3.5 w-3.5" /> Testar
              </Button>
            ) : null}
          </div>
        </div>

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
            const permitida = proximasPermitidas.has(acao.tipo);
            return (
              <Button
                key={acao.tipo}
                variant={acao.variant}
                disabled={mutation.isPending || !permitida}
                onClick={() => registrar(acao.tipo)}
                className={cn("h-14 justify-center", !permitida && "opacity-40")}
                title={
                  permitida
                    ? undefined
                    : `Indisponível após ${ROTULO_TIPO[ultimoTipo as TipoMarcacao] ?? "último registro"}`
                }
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
