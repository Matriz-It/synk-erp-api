import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PurchaseOrderStatus } from '../../../core/enums/enums';

export class ListPurchaseOrdersDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsEnum(PurchaseOrderStatus) status?: PurchaseOrderStatus;
}
