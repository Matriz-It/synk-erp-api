import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { ClienteTipo } from '../../../core/enums/enums';

export class UpdateClientDto {
  @IsOptional() @IsEnum(ClienteTipo)   tipo?: ClienteTipo;
  @IsOptional() @IsString() @IsNotEmpty() razaoSocial?: string;
  @IsOptional() @IsString() nomeFantasia?: string;
  @IsOptional() @IsString() @IsNotEmpty() documento?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() telefone?: string;
  @IsOptional() @IsBoolean() ativo?: boolean;
  @IsOptional() @IsString() @IsNotEmpty() cep?: string;
  @IsOptional() @IsString() @IsNotEmpty() logradouro?: string;
  @IsOptional() @IsString() @IsNotEmpty() numero?: string;
  @IsOptional() @IsString() complemento?: string;
  @IsOptional() @IsString() @IsNotEmpty() bairro?: string;
  @IsOptional() @IsString() @IsNotEmpty() cidade?: string;
  @IsOptional() @IsString() @Length(2, 2) uf?: string;
}
