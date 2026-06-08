import {
  ArrayMinSize, IsArray, IsEnum, IsNumber, IsOptional,
  IsString, Min, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PurchaseOrderStatus } from '../../../core/enums/enums';
import { CreatePurchaseOrderItemDto } from './create-purchase-order.dto';

export class UpdatePurchaseOrderDto {
  @IsOptional() @IsString() clientId?: string;
  @IsOptional() @IsEnum(PurchaseOrderStatus) status?: PurchaseOrderStatus;
  @IsOptional() @IsString() obs?: string;
  @IsOptional() @IsNumber() @Min(0) @Type(() => Number) descontoGlobal?: number;
  @IsOptional() @IsString() formaPagamento?: string;
  @IsOptional() @IsString() dataPagamento?: string;

  @IsOptional() @IsArray() @ArrayMinSize(1)
  @ValidateNested({ each: true }) @Type(() => CreatePurchaseOrderItemDto)
  items?: CreatePurchaseOrderItemDto[];
}
