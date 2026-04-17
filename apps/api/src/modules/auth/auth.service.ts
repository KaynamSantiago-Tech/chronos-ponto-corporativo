import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { SupabaseJwtService } from "../../common/supabase/supabase-jwt.service";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: SupabaseJwtService,
  ) {}

  async sync(bearer: string | undefined) {
    if (!bearer?.startsWith("Bearer ")) {
      throw new UnauthorizedException({ code: "NO_TOKEN", message: "Bearer token ausente" });
    }
    const token = bearer.slice("Bearer ".length);

    const payload = await this.jwt.verify(token).catch((err: Error) => {
      this.logger.warn(`jwt sync inválido: ${err.message}`);
      throw new UnauthorizedException({ code: "INVALID_TOKEN", message: "Token inválido" });
    });

    if (!payload.email) {
      throw new UnauthorizedException({
        code: "SEM_EMAIL",
        message: "Token sem claim de email",
      });
    }

    const colaborador = await this.prisma.colaborador.findFirst({
      where: { email: payload.email.toLowerCase(), deleted_at: null },
    });
    if (!colaborador) {
      throw new NotFoundException({
        code: "COLABORADOR_NAO_CADASTRADO",
        message: "Este email não está cadastrado. Peça ao RH.",
      });
    }
    if (!colaborador.ativo) {
      throw new UnauthorizedException({
        code: "COLABORADOR_INATIVO",
        message: "Colaborador inativo",
      });
    }

    if (colaborador.auth_user_id && colaborador.auth_user_id !== payload.sub) {
      throw new ConflictException({
        code: "VINCULO_CONFLITO",
        message: "Este email já está vinculado a outro usuário Supabase",
      });
    }

    if (!colaborador.auth_user_id) {
      try {
        await this.prisma.colaborador.update({
          where: { id: colaborador.id },
          data: { auth_user_id: payload.sub },
        });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          throw new ConflictException({
            code: "AUTH_USER_EM_USO",
            message: "Este usuário Supabase já está vinculado a outro colaborador",
          });
        }
        throw e;
      }
    }

    return this.getMe(colaborador.id);
  }

  async getMe(colaboradorId: string) {
    const c = await this.prisma.colaborador.findUnique({
      where: { id: colaboradorId },
      include: {
        cargo: { select: { id: true, nome: true } },
        setor: { select: { id: true, nome: true } },
        unidade: { select: { id: true, nome: true } },
      },
    });
    if (!c) {
      throw new NotFoundException({
        code: "COLABORADOR_NAO_ENCONTRADO",
        message: "Colaborador não encontrado",
      });
    }
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
