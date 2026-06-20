import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '../../../core/enums/enums';

export class CreateOrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  qtd: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  desconto?: number;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  obs?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  descontoGlobal?: number;

  @IsOptional()
  @IsString()
  formaPagamento?: string;

  @IsOptional()
  @IsString()
  dataPagamento?: string;

  @IsOptional()
  @IsBoolean()
  pago?: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
