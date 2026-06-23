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

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  sku?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nome?: string;

  @IsOptional()
  @IsEnum(ProductCategory)
  categoria?: ProductCategory;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  preco?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  precoCusto?: number;

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
}
