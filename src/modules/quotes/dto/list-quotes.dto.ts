import { IsEnum, IsOptional, IsString } from 'class-validator';
import { QuoteStatus } from '../../../core/enums/enums';

export class ListQuotesDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(QuoteStatus)
  status?: QuoteStatus;
}
