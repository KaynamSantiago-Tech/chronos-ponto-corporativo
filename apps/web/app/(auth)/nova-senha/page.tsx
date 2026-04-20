"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Clock4, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useSupabase } from "@/hooks/use-supabase";

const schema = z
  .object({
    senha: z.string().min(8, "Mínimo 8 caracteres"),
    confirmacao: z.string().min(8, "Mínimo 8 caracteres"),
  })
  .refine((v) => v.senha === v.confirmacao, {
    message: "As senhas não conferem",
    path: ["confirmacao"],
  });

type FormData = z.infer<typeof schema>;

export default function NovaSenhaPage() {
  const supabase = useSupabase();
  const router = useRouter();
  const toast = useToast();
  const [sessaoValida, setSessaoValida] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { senha: "", confirmacao: "" },
  });

  useEffect(() => {
    let ativo = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return;
      setSessaoValida(Boolean(data.session));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setSessaoValida(true);
      }
    });
    return () => {
      ativo = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  async function onSubmit(data: FormData) {
    const { error } = await supabase.auth.updateUser({ password: data.senha });
    if (error) {
      toast.error("Não foi possível atualizar a senha", error.message);
      return;
    }
    toast.success("Senha atualizada", "Entre novamente para continuar.");
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Clock4 className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl">Definir nova senha</CardTitle>
          <CardDescription>
            Escolha uma senha forte com pelo menos 8 caracteres.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessaoValida === null ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Validando link…
            </div>
          ) : sessaoValida ? (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="senha">Nova senha</Label>
                <Input
                  id="senha"
                  type="password"
                  autoComplete="new-password"
                  autoFocus
                  {...register("senha")}
                />
                {errors.senha ? (
                  <span className="text-xs text-destructive">{errors.senha.message}</span>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirmacao">Confirmar senha</Label>
                <Input
                  id="confirmacao"
                  type="password"
                  autoComplete="new-password"
                  {...register("confirmacao")}
                />
                {errors.confirmacao ? (
                  <span className="text-xs text-destructive">{errors.confirmacao.message}</span>
                ) : null}
              </div>

              <Button type="submit" disabled={isSubmitting} className="mt-2">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Atualizar senha
              </Button>
            </form>
          ) : (
            <div className="flex flex-col gap-3 text-center">
              <p className="text-sm text-destructive">
                Link inválido ou expirado. Solicite um novo.
              </p>
              <Link
                href="/esqueci-senha"
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                Pedir novo link
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
