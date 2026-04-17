import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(colaboradorId: string) {
    const c = await this.prisma.colaborador.findUnique({
      where: { id: colaboradorId },
      include: {
        cargo: { select: { id: true, nome: true } },
        setor: { select: { id: true, nome: true } },
        unidade: { select: { id: true, nome: true } },
      },
    });
    if (!c) throw new NotFoundException({ code: "COLABORADOR_NAO_ENCONTRADO", message: "Colaborador não encontrado" });
    return {
      id: c.id,
      matricula: c.matricula,
      nome: c.nome,
      email: c.email,
      perfil: c.perfil,
      ativo: c.ativo,
      cargo: c.cargo,
      setor: c.setor,
      unidade: c.unidade,
    };
  }
}
