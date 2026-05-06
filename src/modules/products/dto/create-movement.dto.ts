import { IsEnum, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MovementType } from '../../../core/enums/enums';

export class CreateMovementDto {
  @IsEnum(MovementType)
  tipo: MovementType;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  qtd: number;

  @IsString()
  @IsNotEmpty()
  motivo: string;
}
