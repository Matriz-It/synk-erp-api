import { IsArray, IsNumber, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ComponentItemDto {
  @IsUUID()
  materialId: string;

  @IsNumber()
  @Min(0.001)
  @Type(() => Number)
  quantidade: number;

  @IsString()
  unidade: string;
}

export class SaveComponentsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComponentItemDto)
  componentes: ComponentItemDto[];
}
