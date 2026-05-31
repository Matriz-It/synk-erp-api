import { IsIn, IsOptional, IsString } from 'class-validator';

export class ListReceivablesDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsIn(['aberto', 'vencendo', 'vencido', 'pago']) status?: string;
}
