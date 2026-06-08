import {
  ArrayMinSize, IsArray, IsEnum, IsInt, IsNotEmpty,
  IsNumber, IsOptional, IsString, Min, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PurchaseOrderStatus } from '../../../core/enums/enums';

export class CreatePurchaseOrderItemDto {
  @IsString() @IsNotEmpty() productId: string;
  @IsInt() @Min(1) @Type(() => Number) qtd: number;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) desconto?: number;
}

export class CreatePurchaseOrderDto {
  @IsString() @IsNotEmpty() clientId: string; // supplierId enviado como clientId pelo front

  @IsOptional() @IsEnum(PurchaseOrderStatus) status?: PurchaseOrderStatus;
  @IsOptional() @IsString() obs?: string;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) descontoGlobal?: number;
  @IsOptional() @IsString() formaPagamento?: string;
  @IsOptional() @IsString() dataPagamento?: string;

  @IsArray() @ArrayMinSize(1)
  @ValidateNested({ each: true }) @Type(() => CreatePurchaseOrderItemDto)
  items: CreatePurchaseOrderItemDto[];
}
