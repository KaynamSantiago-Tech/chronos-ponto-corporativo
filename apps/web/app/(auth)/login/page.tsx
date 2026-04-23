"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Clock4, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useSupabase } from "@/hooks/use-supabase";
import { apiFetch } from "@/lib/api";
import { formatarErroApi } from "@/lib/api-errors";

const loginSchema = z.object({
  email: z.string().email("Informe um email válido"),
  senha: z.string().min(6, "Senha com no mínimo 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const supabase = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", senha: "" },
  });

  useEffect(() => {
    if (searchParams.get("sessao") === "expirada") {
      toast.info(
        "Sessão encerrada",
        "Sua sessão expirou ou foi revogada. Entre novamente.",
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(data: LoginFormData) {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.senha,
    });

    if (error) {
      toast.error("Não foi possível entrar", error.message);
      return;
    }

    try {
      await apiFetch("/auth/sync", { method: "POST" });
    } catch (err) {
      await supabase.auth.signOut();
      const amigavel = formatarErroApi(err, "Não foi possível concluir o login");
      toast.error(amigavel.titulo, amigavel.descricao);
      return;
    }

    const redirecionar = searchParams.get("redirecionar");
    const destino = redirecionar && redirecionar !== "/" ? redirecionar : "/dashboard";
    toast.success("Bem-vindo(a)!", "Sessão iniciada com sucesso.");
    router.replace(destino);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Clock4 className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl">Midrah Ponto</CardTitle>
          <CardDescription>Entre com seu email corporativo.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="seu.nome@midrah.com.br"
                {...register("email")}
              />
              {errors.email ? (
                <span className="text-xs text-destructive">{errors.email.message}</span>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...register("senha")}
              />
              {errors.senha ? (
                <span className="text-xs text-destructive">{errors.senha.message}</span>
              ) : null}
            </div>

            <Button type="submit" disabled={isSubmitting} className="mt-2">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Entrar
            </Button>

            <Link
              href="/esqueci-senha"
              className="text-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Esqueci minha senha
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
