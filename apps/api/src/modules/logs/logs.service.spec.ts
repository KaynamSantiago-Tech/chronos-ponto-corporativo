import { describe, expect, it, vi } from "vitest";

import type { PrismaService } from "../../prisma/prisma.service";
import { LogsService } from "./logs.service";

function build(findMany = vi.fn().mockResolvedValue([]), count = vi.fn().mockResolvedValue(0)) {
  const prisma = {
    logAuditoria: { findMany, count },
    $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
  } as unknown as PrismaService;
  return { service: new LogsService(prisma), findMany, count };
}

describe("LogsService.listar", () => {
  it("paginação: skip = (page-1)*pageSize, take = pageSize, orderBy desc", async () => {
    const { service, findMany } = build();
    await service.listar(3, 25, {});
    const args = findMany.mock.calls[0]![0];
    expect(args.skip).toBe(50);
    expect(args.take).toBe(25);
    expect(args.orderBy).toEqual({ created_at: "desc" });
  });

  it("filtro ator_id é igualdade direta", async () => {
    const { service, findMany } = build();
    await service.listar(1, 10, { ator_id: "ator-123" });
    expect(findMany.mock.calls[0]![0].where.ator_id).toBe("ator-123");
  });

  it("filtro acao usa contains (substring match)", async () => {
    const { service, findMany } = build();
    await service.listar(1, 10, { acao: "marcacao" });
    expect(findMany.mock.calls[0]![0].where.acao).toEqual({ contains: "marcacao" });
  });

  it("filtros de data convertem ISO strings em Date", async () => {
    const { service, findMany } = build();
    await service.listar(1, 10, { inicio: "2026-04-01T00:00:00Z", fim: "2026-04-30T23:59:59Z" });
    const { gte, lte } = findMany.mock.calls[0]![0].where.created_at;
    expect(gte).toBeInstanceOf(Date);
    expect(lte).toBeInstanceOf(Date);
    expect((gte as Date).toISOString()).toBe("2026-04-01T00:00:00.000Z");
  });

  it("retorna envelope paginado consistente", async () => {
    const { service } = build(vi.fn().mockResolvedValue([{ id: "l1" }]), vi.fn().mockResolvedValue(1));
    const resultado = await service.listar(1, 50, {});
    expect(resultado).toEqual({ items: [{ id: "l1" }], total: 1, page: 1, page_size: 50 });
  });
});
