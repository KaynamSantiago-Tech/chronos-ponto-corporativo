import { z } from "zod";

/**
 * Schema das variáveis de ambiente públicas do web.
 * Valida no boot; se inválido, aborta o processo.
 */
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL inválida"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(20, "NEXT_PUBLIC_SUPABASE_ANON_KEY ausente"),
  NEXT_PUBLIC_API_URL: z.string().url("NEXT_PUBLIC_API_URL inválida"),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional().or(z.literal("").transform(() => undefined)),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
});

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error(
    "[env] variáveis inválidas:",
    parsed.error.flatten().fieldErrors,
  );
  throw new Error("Variáveis de ambiente inválidas. Veja apps/web/.env.example");
}

export const env = parsed.data;
export type Env = typeof env;
