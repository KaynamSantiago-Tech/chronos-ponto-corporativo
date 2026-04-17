import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import type { Paginated } from "../../common/dto/pagination.dto";
import { SupabaseAdminService } from "../../common/supabase/supabase-admin.service";
import { PrismaService } from "../../prisma/prisma.service";
import {
  AtualizarColaboradorDto,
  CriarColaboradorDto,
  ListarColaboradoresDto,
} from "./dto/colaborador.dto";

@Injectable()
export class ColaboradoresService {
  private readonly logger = new Logger(ColaboradoresService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseAdminService,
  ) {}

  async listar(
    page: number,
    pageSize: number,
    filtros: ListarColaboradoresDto,
  ): Promise<Paginated<unknown>> {
    const where: Prisma.ColaboradorWhereInput = {
      deleted_at: null,
      setor_id: filtros.setor_id,
      unidade_id: filtros.unidade_id,
      perfil: filtros.perfil,
      ativo: filtros.ativo,
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.colaborador.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { nome: "asc" },
      }),
      this.prisma.colaborador.count({ where }),
    ]);
    return { items, total, page, page_size: pageSize };
  }

  async obter(id: string) {
    const c = await this.prisma.colaborador.findFirst({
      where: { id, deleted_at: null },
      include: {
        cargo: { select: { id: true, nome: true } },
        setor: { select: { id: true, nome: true } },
        unidade: { select: { id: true, nome: true } },
      },
    });
    if (!c) throw new NotFoundException({ code: "NOT_FOUND", message: "Colaborador não encontrado" });
    return c;
  }

  async criar(dto: CriarColaboradorDto) {
    try {
      const colaborador = await this.prisma.colaborador.create({ data: dto });

      const invite = await this.supabase.inviteByEmail(dto.email, {
        colaborador_id: colaborador.id,
        matricula: colaborador.matricula,
      });
      if (invite.error) {
        this.logger.warn(`Falha no convite Supabase: ${invite.error.message}`);
      } else if (invite.data.user?.id) {
        await this.prisma.colaborador.update({
          where: { id: colaborador.id },
          data: { auth_user_id: invite.data.user.id },
        });
      }

      return this.obter(colaborador.id);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ConflictException({
          code: "COLABORADOR_DUPLICADO",
          message: "Já existe colaborador com essa matrícula, email ou CPF",
        });
      }
      throw e;
    }
  }

  async atualizar(id: string, dto: AtualizarColaboradorDto) {
    await this.obter(id);
    try {
      return await this.prisma.colaborador.update({ where: { id }, data: dto });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ConflictException({
          code: "COLABORADOR_DUPLICADO",
          message: "Matrícula, email ou CPF já em uso",
        });
      }
      throw e;
    }
  }

  async remover(id: string) {
    await this.obter(id);
    return this.prisma.colaborador.update({
      where: { id },
      data: { ativo: false, deleted_at: new Date() },
    });
  }
}
