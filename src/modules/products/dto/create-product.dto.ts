import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductCategory } from '../../../core/enums/enums';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsEnum(ProductCategory)
  categoria: ProductCategory;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  preco: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  precoCusto?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  qtdInicial?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  qtdMin?: number;

  @IsOptional()
  @IsString()
  foto?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsBoolean()
  isMateriaPrima?: boolean;
}
