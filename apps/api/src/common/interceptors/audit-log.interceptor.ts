import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { Request } from "express";
import { Observable, tap } from "rxjs";

import { PrismaService } from "../../prisma/prisma.service";
import type { RequestUser } from "../decorators/current-user.decorator";

const WRITE_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);
const SKIP_PATHS = [/^\/health/, /^\/docs/, /^\/evidencias\/upload/];

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest<Request & { user?: RequestUser }>();
    const skip =
      !WRITE_METHODS.has(req.method) ||
      SKIP_PATHS.some((re) => re.test(req.path));

    return next.handle().pipe(
      tap(() => {
        if (skip) return;
        void this.prisma.logAuditoria
          .create({
            data: {
              ator_id: req.user?.colaborador_id ?? null,
              acao: `${req.method} ${req.route?.path ?? req.path}`,
              entidade: this.extractEntidade(req.path),
              ip: req.ip ?? null,
              user_agent: req.headers["user-agent"] ?? null,
              payload: this.safePayload(req.body) ?? Prisma.JsonNull,
            },
          })
          .catch(() => {
            /* não bloqueia a resposta se o log falhar */
          });
      }),
    );
  }

  private extractEntidade(path: string): string | null {
    const m = path.match(/^\/([a-z-]+)/i);
    return m?.[1] ?? null;
  }

  private safePayload(body: unknown, depth = 0): object | null {
    if (!body || typeof body !== "object") return null;
    if (depth > 4) return { "[redacted]": "profundidade máxima" };
    const clone: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
      if (/senha|password|token|secret|authorization|cpf/i.test(key)) {
        clone[key] = "[redacted]";
      } else if (Array.isArray(value)) {
        clone[key] = value.map((v) =>
          v && typeof v === "object" ? this.safePayload(v, depth + 1) : v,
        );
      } else if (value && typeof value === "object") {
        clone[key] = this.safePayload(value, depth + 1);
      } else {
        clone[key] = value;
      }
    }
    return clone;
  }
}
