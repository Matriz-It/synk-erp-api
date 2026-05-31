import { IsIn, IsOptional, IsString } from 'class-validator';

export class ListBillsDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsIn(['aberto', 'vencendo', 'vencido', 'pago']) status?: string;
}
