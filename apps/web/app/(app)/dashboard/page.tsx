"use client";

import { Clock4, LogIn, Timer, TrendingUp } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// TODO: consumir GET /marcacoes/me para calcular último ponto e horas do dia.
const MOCK = {
  ultimoTipo: "entrada",
  ultimoHorario: "08:12",
  horasDia: "04:23",
  totalSemana: "28:15",
};

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Resumo da sua jornada de hoje.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Último ponto
            </CardTitle>
            <LogIn className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="font-mono text-2xl">{MOCK.ultimoHorario}</div>
            <CardDescription className="capitalize">{MOCK.ultimoTipo}</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Horas hoje
            </CardTitle>
            <Clock4 className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="font-mono text-2xl">{MOCK.horasDia}</div>
            <CardDescription>Desde a primeira entrada</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total semana
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="font-mono text-2xl">{MOCK.totalSemana}</div>
            <CardDescription>Segunda a domingo</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Próxima ação
            </CardTitle>
            <Timer className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">Iniciar pausa</div>
            <CardDescription>Sugestão baseada na jornada</CardDescription>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo</CardTitle>
          <CardDescription>
            Este dashboard ainda usa dados de exemplo. O consumo real de{" "}
            <code className="font-mono text-xs">GET /marcacoes/me</code> será ligado em breve.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
