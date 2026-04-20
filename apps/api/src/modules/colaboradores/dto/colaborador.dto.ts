import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

import type { Perfil } from "../../../common/decorators/roles.decorator";

const PERFIS: Perfil[] = ["admin", "rh", "gestor", "colaborador"];

export class CriarColaboradorDto {
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  matricula!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(150)
  nome!: string;

  @IsEmail()
  @MaxLength(160)
  email!: string;

  @IsString()
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, {
    message: "CPF deve estar no formato 000.000.000-00",
  })
  cpf!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefone?: string;

  @IsIn(PERFIS)
  perfil!: Perfil;

  @IsUUID()
  cargo_id!: string;

  @IsUUID()
  setor_id!: string;

  @IsUUID()
  unidade_id!: string;
}

export class AtualizarColaboradorDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  matricula?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  nome?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefone?: string;

  @IsOptional()
  @IsIn(PERFIS)
  perfil?: Perfil;

  @IsOptional()
  @IsUUID()
  cargo_id?: string;

  @IsOptional()
  @IsUUID()
  setor_id?: string;

  @IsOptional()
  @IsUUID()
  unidade_id?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class ListarColaboradoresDto {
  @IsOptional()
  @IsUUID()
  setor_id?: string;

  @IsOptional()
  @IsUUID()
  unidade_id?: string;

  @IsOptional()
  @IsIn(PERFIS)
  perfil?: Perfil;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  busca?: string;
}
