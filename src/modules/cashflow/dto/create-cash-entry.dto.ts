import { IsEnum, IsNotEmpty, IsNumber, IsPositive, IsString, MaxLength } from 'class-validator';
import { MovementType } from '../../../core/enums/enums';

export class CreateCashEntryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  descricao: string;

  @IsEnum(MovementType)
  tipo: MovementType;

  @IsNumber()
  @IsPositive()
  valor: number;
}
