import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import jwksRsa, { JwksClient } from "jwks-rsa";
import { verify, type JwtHeader } from "jsonwebtoken";

import type { Env } from "../../config/env.schema";

export interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  iss: string;
  aud?: string;
  exp: number;
}

@Injectable()
export class SupabaseJwtService {
  private readonly logger = new Logger(SupabaseJwtService.name);
  private readonly jwks: JwksClient;
  private readonly issuer: string;

  constructor(private readonly config: ConfigService<Env, true>) {
    this.jwks = jwksRsa({
      jwksUri: this.config.get("SUPABASE_JWKS_URL", { infer: true }),
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 10 * 60 * 1000,
      rateLimit: true,
    });
    this.issuer = this.config.get("SUPABASE_JWT_ISSUER", { infer: true });
  }

  verify(token: string): Promise<SupabaseJwtPayload> {
    return new Promise<SupabaseJwtPayload>((resolve, reject) => {
      verify(
        token,
        (header: JwtHeader, cb) => {
          this.jwks
            .getSigningKey(header.kid)
            .then((key) => cb(null, key.getPublicKey()))
            .catch((err: Error) => cb(err));
        },
        { algorithms: ["RS256", "ES256"], issuer: this.issuer },
        (err, decoded) => {
          if (err) return reject(err);
          resolve(decoded as SupabaseJwtPayload);
        },
      );
    });
  }
}
