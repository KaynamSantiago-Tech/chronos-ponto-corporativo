import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import type { Paginated } from "../../common/dto/pagination.dto";
import { PrismaService } from "../../prisma/prisma.service";

export interface ListarLogsFiltros {
  ator_id?: string;
  acao?: string;
  entidade?: string;
  inicio?: string;
  fim?: string;
}

@Injectable()
export class LogsService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(
    page: number,
    pageSize: number,
    filtros: ListarLogsFiltros,
  ): Promise<Paginated<unknown>> {
    const where: Prisma.LogAuditoriaWhereInput = {
      ator_id: filtros.ator_id,
      acao: filtros.acao ? { contains: filtros.acao } : undefined,
      entidade: filtros.entidade,
      created_at: {
        gte: filtros.inicio ? new Date(filtros.inicio) : undefined,
        lte: filtros.fim ? new Date(filtros.fim) : undefined,
      },
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.logAuditoria.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { created_at: "desc" },
      }),
      this.prisma.logAuditoria.count({ where }),
    ]);
    return { items, total, page, page_size: pageSize };
  }
}
