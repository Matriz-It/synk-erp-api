import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  codigo: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nome: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  preco: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  precoCusto?: number | null;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
