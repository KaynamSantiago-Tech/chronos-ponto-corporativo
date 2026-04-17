import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { Public } from "../../common/decorators/public.decorator";
import { PrismaService } from "../../prisma/prisma.service";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async check() {
    let db: "ok" | "fail" = "ok";
    try {
      await this.prisma.$queryRaw`select 1`;
    } catch {
      db = "fail";
    }
    return { status: db === "ok" ? "ok" : "degraded", db, ts: new Date().toISOString() };
  }
}
