import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { Roles } from "../../common/decorators/roles.decorator";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { CargosService } from "./cargos.service";
import { AtualizarCargoDto, CriarCargoDto } from "./dto/cargo.dto";

@ApiBearerAuth()
@ApiTags("cargos")
@Controller("cargos")
export class CargosController {
  constructor(private readonly service: CargosService) {}

  @Get()
  listar(@Query() q: PaginationDto) {
    return this.service.listar(q.page, q.page_size);
  }

  @Get(":id")
  obter(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.service.obter(id);
  }

  @Roles("admin", "rh")
  @Post()
  criar(@Body() dto: CriarCargoDto) {
    return this.service.criar(dto);
  }

  @Roles("admin", "rh")
  @Patch(":id")
  atualizar(@Param("id", new ParseUUIDPipe()) id: string, @Body() dto: AtualizarCargoDto) {
    return this.service.atualizar(id, dto);
  }

  @Roles("admin", "rh")
  @Delete(":id")
  remover(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.service.remover(id);
  }
}
