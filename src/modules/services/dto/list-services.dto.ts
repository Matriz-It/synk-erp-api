import { IsIn, IsOptional, IsString } from 'class-validator';

export class ListServicesDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['ativo', 'inativo'])
  status?: string;

  @IsOptional()
  @IsIn(['nome', 'preco'])
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDir?: string;
}
