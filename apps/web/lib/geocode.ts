const cache = new Map<string, string>();
const pending = new Map<string, Promise<string>>();

/**
 * Reverse geocoding via OpenStreetMap Nominatim (grátis, sem chave).
 * Respeita o cache em memória e evita chamadas duplicadas simultâneas para
 * o mesmo par de coordenadas.
 *
 * Uso: somente sob demanda (click), para respeitar rate limit público
 * (~1 req/s). Não chame em loop.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const inflight = pending.get(key);
  if (inflight) return inflight;

  const promise = (async () => {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&accept-language=pt-BR&zoom=18`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "pt-BR" },
    });
    if (!res.ok) throw new Error(`Geocoding falhou (${res.status})`);
    const data = (await res.json()) as {
      display_name?: string;
      address?: Record<string, string>;
    };
    const addr = data.address ?? {};
    const partes = [
      addr.road,
      addr.house_number,
      addr.suburb ?? addr.neighbourhood,
      addr.city ?? addr.town ?? addr.village,
      addr.state,
    ].filter(Boolean);
    const formatado = partes.length > 0 ? partes.join(", ") : data.display_name ?? key;
    cache.set(key, formatado);
    return formatado;
  })();
  pending.set(key, promise);
  try {
    return await promise;
  } finally {
    pending.delete(key);
  }
}
