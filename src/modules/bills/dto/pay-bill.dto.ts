import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class PayBillDto {
  @IsOptional() @IsString() pagoEm?: string;
  @IsOptional() @IsNumber() @IsPositive() @Type(() => Number) valorPago?: number;
}
