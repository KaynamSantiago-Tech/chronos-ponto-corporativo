import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import jwksRsa, { JwksClient } from "jwks-rsa";
import { verify, type JwtHeader } from "jsonwebtoken";

import type { Env } from "../../config/env.schema";
import { PrismaService } from "../../prisma/prisma.service";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import type { RequestUser } from "../decorators/current-user.decorator";

interface JwtPayload {
  sub: string;
  email?: string;
  iss: string;
  aud?: string;
  exp: number;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private readonly jwks: JwksClient;

  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService<Env, true>,
    private readonly prisma: PrismaService,
  ) {
    this.jwks = jwksRsa({
      jwksUri: this.config.get("SUPABASE_JWKS_URL", { infer: true }),
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 10 * 60 * 1000,
      rateLimit: true,
    });
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<Request & { user?: RequestUser }>();
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException({
        code: "NO_TOKEN",
        message: "Bearer token ausente",
      });
    }
    const token = header.slice("Bearer ".length);

    const payload = await this.verifyToken(token).catch((err: Error) => {
      this.logger.warn(`jwt inválido: ${err.message}`);
      throw new UnauthorizedException({
        code: "INVALID_TOKEN",
        message: "Token inválido",
      });
    });

    const colaborador = await this.prisma.colaborador.findUnique({
      where: { auth_user_id: payload.sub },
      select: {
        id: true,
        perfil: true,
        email: true,
        nome: true,
        ativo: true,
        deleted_at: true,
      },
    });

    if (!colaborador || !colaborador.ativo || colaborador.deleted_at) {
      throw new UnauthorizedException({
        code: "COLABORADOR_INATIVO",
        message: "Colaborador não vinculado ou inativo",
      });
    }

    req.user = {
      auth_user_id: payload.sub,
      colaborador_id: colaborador.id,
      perfil: colaborador.perfil as RequestUser["perfil"],
      email: colaborador.email,
      nome: colaborador.nome,
    };
    return true;
  }

  private verifyToken(token: string): Promise<JwtPayload> {
    const issuer = this.config.get("SUPABASE_JWT_ISSUER", { infer: true });
    return new Promise<JwtPayload>((resolve, reject) => {
      verify(
        token,
        (header: JwtHeader, cb) => {
          this.jwks
            .getSigningKey(header.kid)
            .then((key) => cb(null, key.getPublicKey()))
            .catch((err: Error) => cb(err));
        },
        { algorithms: ["RS256", "ES256"], issuer },
        (err, decoded) => {
          if (err) return reject(err);
          resolve(decoded as JwtPayload);
        },
      );
    });
  }
}
