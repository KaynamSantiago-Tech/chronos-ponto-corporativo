import { Module } from "@nestjs/common";

import { MarcacoesController } from "./marcacoes.controller";
import { MarcacoesService } from "./marcacoes.service";

@Module({
  controllers: [MarcacoesController],
  providers: [MarcacoesService],
  exports: [MarcacoesService],
})
export class MarcacoesModule {}
