"use client";

import {
  BarChart3,
  Building2,
  Clock4,
  FileClock,
  LayoutDashboard,
  ListChecks,
  Shield,
  Timer,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useColaboradorAtual } from "@/hooks/use-colaborador-atual";
import { cn } from "@/lib/cn";

import type { PerfilColaborador } from "@midrah/shared";

interface MenuItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  perfis?: PerfilColaborador[];
}

const MENU: MenuItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Registrar ponto", href: "/ponto", icon: Timer },
  { label: "Meu histórico", href: "/historico", icon: Clock4 },
];

const MENU_ADMIN: MenuItem[] = [
  {
    label: "Visão geral",
    href: "/admin",
    icon: BarChart3,
    perfis: ["admin", "rh", "gestor"],
  },
  {
    label: "Colaboradores",
    href: "/admin/colaboradores",
    icon: Users,
    perfis: ["admin", "rh", "gestor"],
  },
  { label: "Cargos", href: "/admin/cargos", icon: Shield, perfis: ["admin", "rh"] },
  { label: "Setores", href: "/admin/setores", icon: ListChecks, perfis: ["admin", "rh"] },
  { label: "Unidades", href: "/admin/unidades", icon: Building2, perfis: ["admin", "rh"] },
  {
    label: "Marcações",
    href: "/admin/marcacoes",
    icon: FileClock,
    perfis: ["admin", "rh", "gestor"],
  },
  { label: "Logs de auditoria", href: "/admin/logs", icon: Shield, perfis: ["admin"] },
];

function ehAtivo(pathname: string | null | undefined, href: string): boolean {
  if (!pathname) return false;
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

function SidebarLink({ item, active }: { item: MenuItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-primary/15 text-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{item.label}</span>
    </Link>
  );
}

interface SidebarProps {
  aberto?: boolean;
  onFechar?: () => void;
}

export default function Sidebar({ aberto = false, onFechar }: SidebarProps) {
  const pathname = usePathname();
  const { data: colaborador } = useColaboradorAtual();

  const perfil = colaborador?.perfil;

  const itensAdmin = MENU_ADMIN.filter(
    (item) => !item.perfis || (perfil && item.perfis.includes(perfil)),
  );

  const conteudo = (
    <>
      <div className="mb-6 flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Clock4 className="h-4 w-4" />
          </div>
          <div className="text-sm font-semibold">Veltime</div>
        </div>
        <button
          type="button"
          onClick={onFechar}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
          aria-label="Fechar menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex flex-col gap-1">
        {MENU.map((item) => (
          <SidebarLink key={item.href} item={item} active={ehAtivo(pathname, item.href)} />
        ))}

        {itensAdmin.length > 0 ? (
          <>
            <div className="mt-6 mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Administração
            </div>
            {itensAdmin.map((item) => (
              <SidebarLink key={item.href} item={item} active={ehAtivo(pathname, item.href)} />
            ))}
          </>
        ) : null}
      </nav>
    </>
  );

  return (
    <>
      <aside className="hidden w-60 shrink-0 border-r border-border bg-card/40 p-4 md:block">
        {conteudo}
      </aside>
      {aberto ? (
        <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onFechar}
            aria-hidden
          />
          <aside className="relative z-10 flex w-64 flex-col overflow-y-auto border-r border-border bg-card p-4 shadow-xl">
            {conteudo}
          </aside>
        </div>
      ) : null}
    </>
  );
}
