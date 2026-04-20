"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Clock4, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useSupabase } from "@/hooks/use-supabase";

const schema = z.object({
  email: z.string().email("Informe um email válido"),
});

type FormData = z.infer<typeof schema>;

export default function EsqueciSenhaPage() {
  const supabase = useSupabase();
  const toast = useToast();
  const [enviado, setEnviado] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(data: FormData) {
    const redirectTo = `${window.location.origin}/nova-senha`;
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, { redirectTo });
    if (error) {
      toast.error("Não foi possível enviar o email", error.message);
      return;
    }
    setEnviado(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Clock4 className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl">Recuperar senha</CardTitle>
          <CardDescription>
            Enviaremos um link seguro para seu email cadastrado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {enviado ? (
            <div className="flex flex-col gap-4 text-center">
              <p className="text-sm text-muted-foreground">
                Se o email existir em nossa base, enviaremos um link de redefinição.
                Verifique sua caixa de entrada e a pasta de spam.
              </p>
              <Link
                href="/login"
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                Voltar ao login
              </Link>
            </div>
          ) : (
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

              <Button type="submit" disabled={isSubmitting} className="mt-2">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Enviar link de recuperação
              </Button>

              <Link
                href="/login"
                className="text-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Voltar ao login
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
