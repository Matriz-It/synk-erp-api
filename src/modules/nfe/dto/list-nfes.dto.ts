import { IsEnum, IsOptional, IsString } from 'class-validator';
import { NFeStatus } from '../../../core/enums/enums';

export class ListNfesDto {
  @IsEnum(NFeStatus) @IsOptional()
  status?: NFeStatus;

  @IsString() @IsOptional()
  search?: string;
}
