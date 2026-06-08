import { IsIn, IsOptional, IsString } from 'class-validator';

export class GetCashflowDto {
  @IsOptional()
  @IsString()
  mes?: string; // YYYY-MM — padrão: mês atual

  @IsOptional()
  @IsIn(['all', 'entrada', 'saida'])
  tipo?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
