export class CameraDeniedError extends Error {
  constructor(message = "Permissão de câmera negada") {
    super(message);
    this.name = "CameraDeniedError";
  }
}

const LARGURA_ALVO = 640;
const ALTURA_ALVO = 480;
const QUALIDADE_JPEG = 0.7;

/** Abre stream de vídeo da câmera frontal. */
export async function abrirCameraFrontal(): Promise<MediaStream> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new CameraDeniedError("Navegador sem suporte a câmera");
  }

  try {
    return await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: LARGURA_ALVO },
        height: { ideal: ALTURA_ALVO },
      },
      audio: false,
    });
  } catch (error) {
    if (error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "PermissionDeniedError")) {
      throw new CameraDeniedError();
    }
    throw error;
  }
}

/** Libera tracks do stream. */
export function liberarCamera(stream: MediaStream | null): void {
  if (!stream) return;
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

/**
 * Captura frame do <video> em canvas 640x480 e devolve Blob JPEG 0.7.
 */
export async function capturarSelfieJpeg(video: HTMLVideoElement): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = LARGURA_ALVO;
  canvas.height = ALTURA_ALVO;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D indisponível");

  // Mantém proporção e corta centralizado (object-fit: cover).
  const videoAspect = video.videoWidth / video.videoHeight;
  const canvasAspect = LARGURA_ALVO / ALTURA_ALVO;
  let sx = 0;
  let sy = 0;
  let sw = video.videoWidth;
  let sh = video.videoHeight;

  if (videoAspect > canvasAspect) {
    sw = video.videoHeight * canvasAspect;
    sx = (video.videoWidth - sw) / 2;
  } else {
    sh = video.videoWidth / canvasAspect;
    sy = (video.videoHeight - sh) / 2;
  }

  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, LARGURA_ALVO, ALTURA_ALVO);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Falha ao gerar imagem"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      QUALIDADE_JPEG,
    );
  });
}
