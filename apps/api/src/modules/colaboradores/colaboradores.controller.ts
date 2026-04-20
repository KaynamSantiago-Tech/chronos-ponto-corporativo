import { Body, Controller, Delete, ForbiddenException, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { IsBoolean, IsIn, IsOptional, IsUUID } from "class-validator";

import { CurrentUser, type RequestUser } from "../../common/decorators/current-user.decorator";
import type { Perfil } from "../../common/decorators/roles.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { ColaboradoresService } from "./colaboradores.service";
import {
  AtualizarColaboradorDto,
  CriarColaboradorDto,
} from "./dto/colaborador.dto";

const PERFIS: Perfil[] = ["admin", "rh", "gestor", "colaborador"];

class ListarColaboradoresQueryDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  setor_id?: string;

  @IsOptional()
  @IsUUID()
  unidade_id?: string;

  @IsOptional()
  @IsIn(PERFIS)
  perfil?: Perfil;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

@ApiBearerAuth()
@ApiTags("colaboradores")
@Roles("admin", "rh", "gestor")
@Controller("colaboradores")
export class ColaboradoresController {
  constructor(private readonly service: ColaboradoresService) {}

  @Get()
  listar(@CurrentUser() user: RequestUser, @Query() q: ListarColaboradoresQueryDto) {
    // Gestor só lista colaboradores do próprio setor.
    const setorEfetivo = user.perfil === "gestor" ? user.setor_id : q.setor_id;
    return this.service.listar(q.page, q.page_size, {
      setor_id: setorEfetivo,
      unidade_id: q.unidade_id,
      perfil: q.perfil,
      ativo: q.ativo,
    });
  }

  @Get(":id")
  async obter(@CurrentUser() user: RequestUser, @Param("id", new ParseUUIDPipe()) id: string) {
    const c = await this.service.obter(id);
    if (user.perfil === "gestor" && c.setor_id !== user.setor_id) {
      throw new ForbiddenException({ code: "ACESSO_NEGADO", message: "Fora do seu setor" });
    }
    return c;
  }

  @Roles("admin", "rh")
  @Post()
  criar(@Body() dto: CriarColaboradorDto) {
    return this.service.criar(dto);
  }

  @Roles("admin", "rh")
  @Patch(":id")
  atualizar(@Param("id", new ParseUUIDPipe()) id: string, @Body() dto: AtualizarColaboradorDto) {
    return this.service.atualizar(id, dto);
  }

  @Roles("admin", "rh")
  @Delete(":id")
  remover(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.service.remover(id);
  }
}
