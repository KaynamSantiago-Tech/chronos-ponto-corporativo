import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CriarUnidadeDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nome!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  endereco?: string;
}

export class AtualizarUnidadeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nome?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  endereco?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
