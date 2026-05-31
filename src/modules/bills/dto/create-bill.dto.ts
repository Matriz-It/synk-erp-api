import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { FinanceStatus } from '../../../core/enums/enums';

export class CreateBillDto {
  @IsString() @IsNotEmpty() parceiro: string;
  @IsString() @IsNotEmpty() descricao: string;
  @IsNumber() @IsPositive() @Type(() => Number) valor: number;
  @IsString() @IsNotEmpty() vencimento: string;
  @IsOptional() @IsEnum(FinanceStatus) status?: FinanceStatus;
  @IsOptional() @IsString() categoria?: string;
  @IsOptional() @IsString() obs?: string;
}
