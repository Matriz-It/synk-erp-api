import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { ClienteTipo } from '../../../core/enums/enums';

export class ListClientsDto {
  @IsOptional() @IsString()
  search?: string;

  @IsOptional() @IsEnum(ClienteTipo)
  tipo?: ClienteTipo;

  @IsOptional() @IsIn(['all', 'ativo', 'inativo'])
  status?: string;
}
