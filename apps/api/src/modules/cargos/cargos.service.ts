import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import type { Paginated } from "../../common/dto/pagination.dto";
import { PrismaService } from "../../prisma/prisma.service";
import { AtualizarCargoDto, CriarCargoDto } from "./dto/cargo.dto";

@Injectable()
export class CargosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(page: number, pageSize: number): Promise<Paginated<unknown>> {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.cargo.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { nome: "asc" },
      }),
      this.prisma.cargo.count(),
    ]);
    return { items, total, page, page_size: pageSize };
  }

  async obter(id: string) {
    const c = await this.prisma.cargo.findUnique({ where: { id } });
    if (!c) throw new NotFoundException({ code: "NOT_FOUND", message: "Cargo não encontrado" });
    return c;
  }

  async criar(dto: CriarCargoDto) {
    try {
      return await this.prisma.cargo.create({ data: dto });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ConflictException({ code: "CARGO_DUPLICADO", message: "Nome de cargo já existe" });
      }
      throw e;
    }
  }

  async atualizar(id: string, dto: AtualizarCargoDto) {
    await this.obter(id);
    try {
      return await this.prisma.cargo.update({ where: { id }, data: dto });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ConflictException({ code: "CARGO_DUPLICADO", message: "Nome de cargo já existe" });
      }
      throw e;
    }
  }

  async remover(id: string) {
    await this.obter(id);
    return this.prisma.cargo.update({ where: { id }, data: { ativo: false } });
  }
}
