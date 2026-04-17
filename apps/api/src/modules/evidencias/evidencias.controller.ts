import { Controller, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiConsumes, ApiTags } from "@nestjs/swagger";

import { CurrentUser, type RequestUser } from "../../common/decorators/current-user.decorator";
import { EvidenciasService } from "./evidencias.service";

@ApiBearerAuth()
@ApiTags("evidencias")
@Controller("evidencias")
export class EvidenciasController {
  constructor(private readonly service: EvidenciasService) {}

  @Post("upload")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 2 * 1024 * 1024 } }))
  upload(
    @CurrentUser() user: RequestUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.upload(user.colaborador_id, file);
  }
}
