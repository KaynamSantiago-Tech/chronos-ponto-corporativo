import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import type { Paginated } from "../../common/dto/pagination.dto";
import { PrismaService } from "../../prisma/prisma.service";
import { AtualizarSetorDto, CriarSetorDto } from "./dto/setor.dto";

@Injectable()
export class SetoresService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(page: number, pageSize: number, unidade_id?: string): Promise<Paginated<unknown>> {
    const where = unidade_id ? { unidade_id } : {};
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.setor.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { nome: "asc" },
        include: { unidade: { select: { nome: true } } },
      }),
      this.prisma.setor.count({ where }),
    ]);
    const items = rows.map((s) => ({
      id: s.id,
      nome: s.nome,
      unidade_id: s.unidade_id,
      unidade_nome: s.unidade?.nome ?? null,
      ativo: s.ativo,
    }));
    return { items, total, page, page_size: pageSize };
  }

  async obter(id: string) {
    const s = await this.prisma.setor.findUnique({ where: { id } });
    if (!s) throw new NotFoundException({ code: "NOT_FOUND", message: "Setor não encontrado" });
    return s;
  }

  async criar(dto: CriarSetorDto) {
    try {
      return await this.prisma.setor.create({ data: dto });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ConflictException({
          code: "SETOR_DUPLICADO",
          message: "Já existe um setor com esse nome nesta unidade",
        });
      }
      throw e;
    }
  }

  async atualizar(id: string, dto: AtualizarSetorDto) {
    await this.obter(id);
    try {
      return await this.prisma.setor.update({ where: { id }, data: dto });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ConflictException({
          code: "SETOR_DUPLICADO",
          message: "Já existe um setor com esse nome nesta unidade",
        });
      }
      throw e;
    }
  }

  async remover(id: string) {
    await this.obter(id);
    return this.prisma.setor.update({ where: { id }, data: { ativo: false } });
  }
}
