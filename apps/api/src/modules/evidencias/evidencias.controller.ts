import { Controller, Get, Post, Query, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

import { CurrentUser, type RequestUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { EvidenciasService } from "./evidencias.service";

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
}
