import { Module } from "@nestjs/common";

import { RoletaController } from "./roleta.controller";

@Module({ controllers: [RoletaController] })
export class RoletaModule {}
