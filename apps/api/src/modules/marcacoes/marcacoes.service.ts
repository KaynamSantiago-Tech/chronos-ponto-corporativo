import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import type { TipoMarcacao } from "@midrah/shared";

import type { Paginated } from "../../common/dto/pagination.dto";
import { PrismaService } from "../../prisma/prisma.service";
import { ListarMarcacoesDto, RegistrarMarcacaoDto } from "./dto/marcacao.dto";

/**
 * Transições permitidas por tipo. Considera o dia local (America/Sao_Paulo).
 *   entrada        → saida | pausa_inicio
 *   pausa_inicio   → pausa_fim
 *   pausa_fim      → saida | pausa_inicio
 *   saida          → (nada até virar o dia)
 *
 * Se não houver marcação hoje, só `entrada` é aceita.
 */
const PROXIMAS: Record<TipoMarcacao | "none", TipoMarcacao[]> = {
  none: ["entrada"],
  entrada: ["saida", "pausa_inicio"],
  pausa_inicio: ["pausa_fim"],
  pausa_fim: ["saida", "pausa_inicio"],
  saida: [],
};

export interface RegistrarContexto {
  ip?: string;
  user_agent?: string;
}

@Injectable()
export class MarcacoesService {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(
    colaboradorId: string,
    dto: RegistrarMarcacaoDto,
    ctx: RegistrarContexto,
  ) {
    await this.validarSequencia(colaboradorId, dto.tipo);

    return this.prisma.marcacao.create({
      data: {
        colaborador_id: colaboradorId,
        tipo: dto.tipo,
        latitude: dto.latitude != null ? new Prisma.Decimal(dto.latitude) : null,
        longitude: dto.longitude != null ? new Prisma.Decimal(dto.longitude) : null,
        precisao_m: dto.precisao_m ?? null,
        evidencia_url: dto.evidencia_url ?? null,
        observacao: dto.observacao ?? null,
        ip: ctx.ip ?? null,
        user_agent: ctx.user_agent ?? null,
        origem: "web",
      },
    });
  }

  async validarSequencia(colaboradorId: string, novoTipo: TipoMarcacao) {
    const ultimaHoje = await this.ultimaMarcacaoHoje(colaboradorId);
    const ultimoTipo = (ultimaHoje?.tipo as TipoMarcacao | undefined) ?? "none";
    const proximas = PROXIMAS[ultimoTipo];

    if (!proximas.includes(novoTipo)) {
      throw new ConflictException({
        code: "SEQUENCIA_INVALIDA",
        message: `Marcação ${novoTipo} não é permitida após ${ultimoTipo}`,
        details: { ultimo: ultimoTipo, proximas },
      });
    }
  }

  private async ultimaMarcacaoHoje(colaboradorId: string) {
    const inicioDia = new Date();
    inicioDia.setHours(0, 0, 0, 0);

    return this.prisma.marcacao.findFirst({
      where: { colaborador_id: colaboradorId, registrada_em: { gte: inicioDia } },
      orderBy: { registrada_em: "desc" },
    });
  }

  async meuHistorico(
    colaboradorId: string,
    page: number,
    pageSize: number,
    inicio?: string,
    fim?: string,
  ): Promise<Paginated<unknown>> {
    const where: Prisma.MarcacaoWhereInput = {
      colaborador_id: colaboradorId,
      registrada_em: {
        gte: inicio ? new Date(inicio) : undefined,
        lte: fim ? new Date(fim) : undefined,
      },
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.marcacao.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { registrada_em: "desc" },
      }),
      this.prisma.marcacao.count({ where }),
    ]);
    return { items, total, page, page_size: pageSize };
  }

  async listar(
    page: number,
    pageSize: number,
    filtros: ListarMarcacoesDto,
  ): Promise<Paginated<unknown>> {
    const where: Prisma.MarcacaoWhereInput = {
      colaborador_id: filtros.colaborador_id,
      tipo: filtros.tipo,
      registrada_em: {
        gte: filtros.inicio ? new Date(filtros.inicio) : undefined,
        lte: filtros.fim ? new Date(filtros.fim) : undefined,
      },
      colaborador:
        filtros.setor_id || filtros.unidade_id
          ? {
              setor_id: filtros.setor_id,
              unidade_id: filtros.unidade_id,
            }
          : undefined,
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.marcacao.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { registrada_em: "desc" },
        include: {
          colaborador: {
            select: { id: true, nome: true, matricula: true },
          },
        },
      }),
      this.prisma.marcacao.count({ where }),
    ]);
    const items = rows.map((m) => ({
      ...m,
      colaborador_nome: m.colaborador?.nome,
      colaborador_matricula: m.colaborador?.matricula,
    }));
    return { items, total, page, page_size: pageSize };
  }

  async obter(id: string) {
    const m = await this.prisma.marcacao.findUnique({
      where: { id },
      include: { colaborador: { select: { id: true, nome: true, matricula: true } } },
    });
    if (!m) throw new NotFoundException({ code: "NOT_FOUND", message: "Marcação não encontrada" });
    return m;
  }
}
