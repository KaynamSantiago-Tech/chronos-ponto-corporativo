import {
  Body,
  Controller,
  Get,
  Ip,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";

import { CurrentUser, type RequestUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { PaginationDto } from "../../common/dto/pagination.dto";
import {
  ListarMarcacoesDto,
  RegistrarManualDto,
  RegistrarMarcacaoDto,
} from "./dto/marcacao.dto";
import { MarcacoesService } from "./marcacoes.service";

@ApiBearerAuth()
@ApiTags("marcacoes")
@Controller("marcacoes")
export class MarcacoesController {
  constructor(private readonly service: MarcacoesService) {}

  @Throttle({ marcacao: { ttl: 10_000, limit: 1 } })
  @Post()
  registrar(
    @CurrentUser() user: RequestUser,
    @Body() dto: RegistrarMarcacaoDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    return this.service.registrar(user.colaborador_id, dto, {
      ip,
      user_agent: req.headers["user-agent"],
    });
  }

  @Get("me")
  meuHistorico(
    @CurrentUser() user: RequestUser,
    @Query() page: PaginationDto,
    @Query("inicio") inicio?: string,
    @Query("fim") fim?: string,
  ) {
    return this.service.meuHistorico(user.colaborador_id, page.page, page.page_size, inicio, fim);
  }

  @Roles("admin", "rh", "gestor")
  @Get()
  listar(
    @CurrentUser() user: RequestUser,
    @Query() page: PaginationDto,
    @Query() filtros: ListarMarcacoesDto,
  ) {
    return this.service.listar(page.page, page.page_size, filtros, {
      perfil: user.perfil,
      setor_id: user.setor_id,
    });
  }

  @Roles("admin", "rh", "gestor")
  @Get(":id")
  obter(@CurrentUser() user: RequestUser, @Param("id", new ParseUUIDPipe()) id: string) {
    return this.service.obter(id, { perfil: user.perfil, setor_id: user.setor_id });
  }
}
