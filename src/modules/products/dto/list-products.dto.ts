import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { ProductCategory } from '../../../core/enums/enums';

export class ListProductsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ProductCategory)
  categoria?: ProductCategory;

  @IsOptional()
  @IsIn(['all', 'ativo', 'inativo', 'baixo', 'zerado'])
  status?: string;

  @IsOptional()
  @IsIn(['nome', 'preco', 'qtd'])
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDir?: string;
}
