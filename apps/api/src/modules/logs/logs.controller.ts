import { Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { IsISO8601, IsOptional, IsString, IsUUID } from "class-validator";

import { Roles } from "../../common/decorators/roles.decorator";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { LogsService } from "./logs.service";

class ListarLogsDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  ator_id?: string;

  @IsOptional()
  @IsString()
  acao?: string;

  @IsOptional()
  @IsString()
  entidade?: string;

  @IsOptional()
  @IsISO8601()
  inicio?: string;

  @IsOptional()
  @IsISO8601()
  fim?: string;
}

@ApiBearerAuth()
@ApiTags("logs")
@Roles("admin")
@Controller("logs")
export class LogsController {
  constructor(private readonly service: LogsService) {}

  @Get()
  listar(@Query() q: ListarLogsDto) {
    return this.service.listar(q.page, q.page_size, {
      ator_id: q.ator_id,
      acao: q.acao,
      entidade: q.entidade,
      inicio: q.inicio,
      fim: q.fim,
    });
  }
}
