"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useMemo } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase";

/**
 * Hook que devolve o client Supabase do browser (singleton).
 */
export function useSupabase(): SupabaseClient {
  return useMemo(() => getSupabaseBrowserClient(), []);
}
