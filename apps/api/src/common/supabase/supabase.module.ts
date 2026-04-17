import { Global, Module } from "@nestjs/common";

import { SupabaseAdminService } from "./supabase-admin.service";
import { SupabaseJwtService } from "./supabase-jwt.service";

@Global()
@Module({
  providers: [SupabaseAdminService, SupabaseJwtService],
  exports: [SupabaseAdminService, SupabaseJwtService],
})
export class SupabaseModule {}
