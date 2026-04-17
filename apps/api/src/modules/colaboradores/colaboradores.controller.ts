import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { Roles } from "../../common/decorators/roles.decorator";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { ColaboradoresService } from "./colaboradores.service";
import {
  AtualizarColaboradorDto,
  CriarColaboradorDto,
  ListarColaboradoresDto,
} from "./dto/colaborador.dto";

class ListarDto extends PaginationDto {}

@ApiBearerAuth()
@ApiTags("colaboradores")
@Roles("admin", "rh", "gestor")
@Controller("colaboradores")
export class ColaboradoresController {
  constructor(private readonly service: ColaboradoresService) {}

  @Get()
  listar(@Query() page: ListarDto, @Query() filtros: ListarColaboradoresDto) {
    return this.service.listar(page.page, page.page_size, filtros);
  }

  @Get(":id")
  obter(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.service.obter(id);
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
