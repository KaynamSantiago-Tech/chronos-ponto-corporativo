export interface Coordenadas {
  latitude: number;
  longitude: number;
  precisao_m: number;
}

export class GeolocationDeniedError extends Error {
  constructor(message = "Permissão de geolocalização negada") {
    super(message);
    this.name = "GeolocationDeniedError";
  }
}

export class GeolocationTimeoutError extends Error {
  constructor(message = "Tempo limite para obter localização") {
    super(message);
    this.name = "GeolocationTimeoutError";
  }
}

/**
 * Promisifica navigator.geolocation.getCurrentPosition com timeout de 10s.
 * Rejeita com erro tipado em caso de falha.
 */
export function obterCoordenadasAtuais(timeoutMs = 10_000): Promise<Coordenadas> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.reject(new GeolocationDeniedError("Navegador sem suporte a geolocalização"));
  }

  return new Promise<Coordenadas>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          precisao_m: position.coords.accuracy,
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new GeolocationDeniedError());
          return;
        }
        if (error.code === error.TIMEOUT) {
          reject(new GeolocationTimeoutError());
          return;
        }
        reject(new Error(error.message || "Falha ao obter localização"));
      },
      {
        enableHighAccuracy: true,
        timeout: timeoutMs,
        maximumAge: 0,
      },
    );
  });
}
