"use client";

import { LogOut, Menu, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useColaboradorAtual } from "@/hooks/use-colaborador-atual";
import { useSupabase } from "@/hooks/use-supabase";

interface TopbarProps {
  onAbrirMenu?: () => void;
}

export default function Topbar({ onAbrirMenu }: TopbarProps = {}) {
  const supabase = useSupabase();
  const router = useRouter();
  const toast = useToast();
  const { data: colaborador } = useColaboradorAtual();

  async function handleSair() {
    try {
      await supabase.auth.signOut();
      router.replace("/login");
    } catch (error) {
      toast.error("Não foi possível sair", (error as Error).message);
    }
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card/40 px-4">
      <div className="text-sm text-muted-foreground">
        {colaborador ? `Olá, ${colaborador.nome.split(" ")[0]}` : "Carregando..."}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs">
          <UserRound className="h-3.5 w-3.5" />
          <span className="capitalize">{colaborador?.perfil ?? "—"}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleSair}>
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </header>
  );
}
