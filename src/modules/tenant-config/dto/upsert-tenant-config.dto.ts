import { IsOptional, IsString, MaxLength, IsNumber, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class UpsertTenantConfigDto {
  // Dados complementares
  @IsOptional() @IsString() @MaxLength(150) nomeFantasia?: string;
  @IsOptional() @IsString() @MaxLength(20)  ie?: string;
  @IsOptional() @IsString() @MaxLength(20)  im?: string;
  @IsOptional() @IsString() @MaxLength(10)  cnae?: string;
  @IsOptional() @IsString() @MaxLength(20)  telefone?: string;
  @IsOptional() @IsString() @MaxLength(100) emailComercial?: string;

  // Endereço
  @IsOptional() @IsString() @MaxLength(9)   cep?: string;
  @IsOptional() @IsString() @MaxLength(150) logradouro?: string;
  @IsOptional() @IsString() @MaxLength(20)  numero?: string;
  @IsOptional() @IsString() @MaxLength(100) complemento?: string;
  @IsOptional() @IsString() @MaxLength(100) bairro?: string;
  @IsOptional() @IsString() @MaxLength(100) cidade?: string;
  @IsOptional() @IsString() @MaxLength(2)   uf?: string;

  // Fiscal / NFe
  @IsOptional() @IsIn(['1', '2', '3']) crt?: string;
  @IsOptional() @IsString() @MaxLength(3)   serieNfe?: string;
  @IsOptional() @IsIn(['homologacao', 'producao']) ambienteNfe?: string;
  @IsOptional() @IsString() @MaxLength(5)   cfopPadrao?: string;
  @IsOptional() @IsString() @MaxLength(3)   cstPadrao?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(100) @Type(() => Number) aliqIcms?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) @Type(() => Number) aliqIbs?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) @Type(() => Number) aliqCbs?: number;
  @IsOptional() @IsString() @MaxLength(100) emailNfe?: string;

  // Certificado Digital
  @IsOptional() @IsString() certificadoBase64?: string;
  @IsOptional() @IsString() @MaxLength(100) certificadoSenha?: string;
  @IsOptional() @IsString() @MaxLength(10)  certificadoValidade?: string;
  @IsOptional() @IsString() @MaxLength(100) certificadoNome?: string;
}
