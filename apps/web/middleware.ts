import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Protege rotas do grupo (app) redirecionando para /login quando não há sessão.
 * Rotas (auth) e /api/health permanecem abertas.
 */
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Se variáveis não estão configuradas, deixa passar (dev sem env).
  // O env.ts abortará em runtime quando realmente necessário.
  if (!supabaseUrl || !supabaseAnonKey) {
    return res;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set({ name, value, ...options });
        });
      },
    },
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  const isLogin = pathname.startsWith("/login");
  const isRecoveryFlow =
    pathname.startsWith("/esqueci-senha") || pathname.startsWith("/nova-senha");
  const isPublicApi = pathname.startsWith("/api/health");
  const isStatic =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/images");

  // Recovery flow nunca é bloqueado: o link do email chega com token em hash e
  // Supabase emite sessão temporária (PASSWORD_RECOVERY) que não deve redirecionar.
  if (isRecoveryFlow || isPublicApi || isStatic) {
    return res;
  }

  if (isLogin) {
    if (session) {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return res;
  }

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirecionar", pathname);
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Aplica em tudo exceto:
     * - arquivos estáticos (_next, imagens, favicon)
     * - API internas que queremos liberar (tratado dentro do handler)
     */
    "/((?!_next/static|_next/image|favicon.ico|icons|images).*)",
  ],
};
