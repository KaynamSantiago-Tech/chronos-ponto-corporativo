import { createBrowserClient, createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type CookieToSet = { name: string; value: string; options: CookieOptions };

import { env } from "./env";

/**
 * Cliente singleton para uso no browser (anon key).
 * Consumido por `use-supabase` hook.
 */
let browserClient: SupabaseClient | undefined;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createBrowserClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }
  return browserClient;
}

/**
 * Cliente para Server Components / Route Handlers.
 * Deve receber `cookies()` do Next.js para ler/gravar cookies de sessão.
 */
export function getSupabaseServerClient(cookieStore: {
  getAll(): { name: string; value: string }[];
  set?(name: string, value: string, options: Record<string, unknown>): void;
}): SupabaseClient {
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set?.(name, value, options as Record<string, unknown>);
        });
      },
    },
  });
}

/** Fallback plain client (sem cookies). Uso em scripts. */
export function getSupabasePlainClient(): SupabaseClient {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
}
