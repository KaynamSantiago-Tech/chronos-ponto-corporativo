import { Type } from "class-transformer";
import {
  IsIn,
  IsISO8601,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";

import type { TipoMarcacao } from "@midrah/shared";

const TIPOS: TipoMarcacao[] = ["entrada", "saida", "pausa_inicio", "pausa_fim"];

export class RegistrarMarcacaoDto {
  @IsIn(TIPOS)
  tipo!: TipoMarcacao;

  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  precisao_m?: number;

  @IsOptional()
  @IsString()
  evidencia_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacao?: string;
}

export class ListarMarcacoesDto {
  @IsOptional()
  @IsUUID()
  colaborador_id?: string;

  @IsOptional()
  @IsUUID()
  setor_id?: string;

  @IsOptional()
  @IsUUID()
  unidade_id?: string;

  @IsOptional()
  @IsIn(TIPOS)
  tipo?: TipoMarcacao;

  @IsOptional()
  @IsISO8601()
  inicio?: string;

  @IsOptional()
  @IsISO8601()
  fim?: string;
}
