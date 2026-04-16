import type { ApiError } from "@midrah/shared";

import { env } from "./env";
import { getSupabaseBrowserClient } from "./supabase";

/**
 * Erro lançado por `apiFetch` quando a resposta não é 2xx.
 * Carrega o shape ApiError definido em @midrah/shared.
 */
export class ApiRequestError extends Error implements ApiError {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(payload: ApiError) {
    super(payload.message || "Erro desconhecido");
    this.name = "ApiRequestError";
    this.statusCode = payload.statusCode;
    this.code = payload.code;
    this.details = payload.details;
  }
}

type FetchOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | Record<string, unknown> | null;
  /** Se true, não serializa o body como JSON (para FormData, Blob). */
  raw?: boolean;
  /** Query params. Valores null/undefined são omitidos. */
  query?: Record<string, string | number | boolean | null | undefined>;
};

function buildUrl(path: string, query?: FetchOptions["query"]): string {
  const base = env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${base}${normalizedPath}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === null || value === undefined) continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
  } catch {
    // sem sessão → segue sem header
  }
  return {};
}

/**
 * Fetch wrapper que injeta JWT do Supabase e normaliza erros.
 * Uso: `const data = await apiFetch<Colaborador>("/auth/me");`
 */
export async function apiFetch<T = unknown>(
  path: string,
  { body, raw, query, headers, ...init }: FetchOptions = {},
): Promise<T> {
  const url = buildUrl(path, query);
  const authHeaders = await getAuthHeader();

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...authHeaders,
    ...(headers as Record<string, string> | undefined),
  };

  let finalBody: BodyInit | null | undefined;
  if (body == null) {
    finalBody = undefined;
  } else if (raw || body instanceof FormData || body instanceof Blob) {
    finalBody = body as BodyInit;
  } else {
    finalHeaders["Content-Type"] = "application/json";
    finalBody = JSON.stringify(body);
  }

  const response = await fetch(url, {
    ...init,
    headers: finalHeaders,
    body: finalBody,
  });

  if (!response.ok) {
    let payload: ApiError = {
      statusCode: response.status,
      message: response.statusText || "Erro desconhecido",
    };
    try {
      const json = (await response.json()) as Partial<ApiError>;
      payload = {
        statusCode: json.statusCode ?? response.status,
        message: json.message ?? payload.message,
        code: json.code,
        details: json.details,
      };
    } catch {
      // body não é JSON
    }
    throw new ApiRequestError(payload);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }
  return (await response.text()) as unknown as T;
}
