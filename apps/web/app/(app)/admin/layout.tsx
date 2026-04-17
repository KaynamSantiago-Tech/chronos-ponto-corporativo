"use client";

import type { ReactNode } from "react";

import { PermissionGate } from "@/components/permission-gate";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <PermissionGate
      perfisPermitidos={["admin", "rh", "gestor"]}
      fallback={
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Você não tem permissão para acessar esta área.
          </CardContent>
        </Card>
      }
    >
      {children}
    </PermissionGate>
  );
}
