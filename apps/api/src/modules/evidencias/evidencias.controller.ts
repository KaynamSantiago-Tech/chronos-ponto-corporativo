import { Controller, ForbiddenException, Get, Post, Query, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

import { CurrentUser, type RequestUser } from "../../common/decorators/current-user.decorator";
import { EvidenciasService } from "./evidencias.service";

const PERFIS_COM_ACESSO_TOTAL = new Set(["admin", "rh", "gestor"]);

class SignedUrlQueryDto {
  @IsString()
  @MaxLength(300)
  path!: string;

  @IsOptional()
  @IsString()
  seconds?: string;
}

@ApiBearerAuth()
@ApiTags("evidencias")
@Controller("evidencias")
export class EvidenciasController {
  constructor(private readonly service: EvidenciasService) {}

  @Post("upload")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("arquivo", { limits: { fileSize: 2 * 1024 * 1024 } }))
  upload(
    @CurrentUser() user: RequestUser,
    @UploadedFile() arquivo: Express.Multer.File,
  ) {
    return this.service.upload(user.colaborador_id, arquivo);
  }

  @Get("signed-url")
  signedUrl(@CurrentUser() user: RequestUser, @Query() query: SignedUrlQueryDto) {
    const ehDoProprio = query.path.startsWith(`${user.colaborador_id}/`);
    const temAcessoTotal = PERFIS_COM_ACESSO_TOTAL.has(user.perfil);
    if (!ehDoProprio && !temAcessoTotal) {
      throw new ForbiddenException({
        code: "ACESSO_NEGADO",
        message: "Sem permissão para esta evidência",
      });
    }
    const seconds = query.seconds ? Math.min(3600, Math.max(60, Number(query.seconds))) : 3600;
    return this.service.signedUrl(query.path, seconds);
  }
}
