import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Env } from "../../config/env.schema";

@Injectable()
export class SupabaseAdminService {
  private readonly client: SupabaseClient;

  constructor(private readonly config: ConfigService<Env, true>) {
    this.client = createClient(
      this.config.get("SUPABASE_URL", { infer: true }),
      this.config.get("SUPABASE_SERVICE_ROLE_KEY", { infer: true }),
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  }

  get raw(): SupabaseClient {
    return this.client;
  }

  async inviteByEmail(email: string, metadata?: Record<string, unknown>) {
    return this.client.auth.admin.inviteUserByEmail(email, {
      data: metadata,
    });
  }

  async deleteUser(authUserId: string) {
    return this.client.auth.admin.deleteUser(authUserId);
  }

  storage(bucket: string) {
    return this.client.storage.from(bucket);
  }
}
