import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { MovementType } from '../../../core/enums/enums';

export class ListAllMovementsDto {
  @IsOptional()
  @IsEnum(MovementType)
  tipo?: MovementType;

  @IsOptional()
  @IsUUID()
  productId?: string;
}
