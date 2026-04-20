import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { LoggerModule } from "nestjs-pino";

import { validateEnv } from "./config/env.schema";
import { AuditLogInterceptor } from "./common/interceptors/audit-log.interceptor";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { AuthModule } from "./modules/auth/auth.module";
import { CargosModule } from "./modules/cargos/cargos.module";
import { ColaboradoresModule } from "./modules/colaboradores/colaboradores.module";
import { DebugModule } from "./modules/debug/debug.module";
import { EvidenciasModule } from "./modules/evidencias/evidencias.module";
import { HealthModule } from "./modules/health/health.module";
import { LogsModule } from "./modules/logs/logs.module";
import { MarcacoesModule } from "./modules/marcacoes/marcacoes.module";
import { PrismaModule } from "./prisma/prisma.module";
import { SupabaseModule } from "./common/supabase/supabase.module";
import { RoletaModule } from "./modules/roleta/roleta.module";
import { SetoresModule } from "./modules/setores/setores.module";
import { UnidadesModule } from "./modules/unidades/unidades.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === "production" ? "info" : "debug",
        transport:
          process.env.NODE_ENV === "production"
            ? undefined
            : { target: "pino-pretty", options: { singleLine: true } },
        redact: ["req.headers.authorization", "req.headers.cookie"],
      },
    }),
    ThrottlerModule.forRoot([
      { name: "default", ttl: 60_000, limit: 100 },
      { name: "marcacao", ttl: 10_000, limit: 1 },
      { name: "auth", ttl: 60_000, limit: 10 },
    ]),
    PrismaModule,
    SupabaseModule,
    AuthModule,
    HealthModule,
    ColaboradoresModule,
    CargosModule,
    SetoresModule,
    UnidadesModule,
    MarcacoesModule,
    EvidenciasModule,
    LogsModule,
    RoletaModule,
    DebugModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
  ],
})
export class AppModule {}
