import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { FinanceStatus } from '../../../core/enums/enums';

export class UpdateReceivableDto {
  @IsOptional() @IsString() @IsNotEmpty() parceiro?: string;
  @IsOptional() @IsString() @IsNotEmpty() descricao?: string;
  @IsOptional() @IsNumber() @IsPositive() @Type(() => Number) valor?: number;
  @IsOptional() @IsString() @IsNotEmpty() vencimento?: string;
  @IsOptional() @IsEnum(FinanceStatus) status?: FinanceStatus;
  @IsOptional() @IsString() categoria?: string;
  @IsOptional() @IsString() obs?: string;
}
