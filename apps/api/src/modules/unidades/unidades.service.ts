import { Injectable, NotFoundException } from "@nestjs/common";

import type { Paginated } from "../../common/dto/pagination.dto";
import { PrismaService } from "../../prisma/prisma.service";
import { AtualizarUnidadeDto, CriarUnidadeDto } from "./dto/unidade.dto";

@Injectable()
export class UnidadesService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(page: number, pageSize: number): Promise<Paginated<unknown>> {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.unidade.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { nome: "asc" },
      }),
      this.prisma.unidade.count(),
    ]);
    return { items, total, page, page_size: pageSize };
  }

  async obter(id: string) {
    const u = await this.prisma.unidade.findUnique({ where: { id } });
    if (!u) throw new NotFoundException({ code: "NOT_FOUND", message: "Unidade não encontrada" });
    return u;
  }

  criar(dto: CriarUnidadeDto) {
    return this.prisma.unidade.create({ data: dto });
  }

  async atualizar(id: string, dto: AtualizarUnidadeDto) {
    await this.obter(id);
    return this.prisma.unidade.update({ where: { id }, data: dto });
  }

  async remover(id: string) {
    await this.obter(id);
    return this.prisma.unidade.update({ where: { id }, data: { ativo: false } });
  }
}
