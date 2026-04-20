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

export default function Sidebar() {
  const pathname = usePathname();
  const { data: colaborador } = useColaboradorAtual();

  const perfil = colaborador?.perfil;

  const itensAdmin = MENU_ADMIN.filter(
    (item) => !item.perfis || (perfil && item.perfis.includes(perfil)),
  );

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-card/40 p-4 md:block">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Clock4 className="h-4 w-4" />
        </div>
        <div className="text-sm font-semibold">Midrah Ponto</div>
      </div>

      <nav className="flex flex-col gap-1">
        {MENU.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            active={pathname?.startsWith(item.href) ?? false}
          />
        ))}

        {itensAdmin.length > 0 ? (
          <>
            <div className="mt-6 mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Administração
            </div>
            {itensAdmin.map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                active={pathname?.startsWith(item.href) ?? false}
              />
            ))}
          </>
        ) : null}
      </nav>
    </aside>
  );
}
