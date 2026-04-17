import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class CriarSetorDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nome!: string;

  @IsUUID()
  unidade_id!: string;
}

export class AtualizarSetorDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nome?: string;

  @IsOptional()
  @IsUUID()
  unidade_id?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
