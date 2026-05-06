import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '../../../core/enums/enums';

export class ListOrdersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
