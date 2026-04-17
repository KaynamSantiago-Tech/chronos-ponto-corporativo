import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { IsOptional, IsUUID } from "class-validator";

import { Roles } from "../../common/decorators/roles.decorator";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { AtualizarSetorDto, CriarSetorDto } from "./dto/setor.dto";
import { SetoresService } from "./setores.service";

class ListarSetoresDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  unidade_id?: string;
}

@ApiBearerAuth()
@ApiTags("setores")
@Controller("setores")
export class SetoresController {
  constructor(private readonly service: SetoresService) {}

  @Get()
  listar(@Query() q: ListarSetoresDto) {
    return this.service.listar(q.page, q.page_size, q.unidade_id);
  }

  @Get(":id")
  obter(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.service.obter(id);
  }

  @Roles("admin", "rh")
  @Post()
  criar(@Body() dto: CriarSetorDto) {
    return this.service.criar(dto);
  }

  @Roles("admin", "rh")
  @Patch(":id")
  atualizar(@Param("id", new ParseUUIDPipe()) id: string, @Body() dto: AtualizarSetorDto) {
    return this.service.atualizar(id, dto);
  }

  @Roles("admin", "rh")
  @Delete(":id")
  remover(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.service.remover(id);
  }
}
