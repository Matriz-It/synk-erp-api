import { PartialType } from '@nestjs/mapped-types';
import { CreateNfeDto } from './create-nfe.dto';

export class UpdateNfeDto extends PartialType(CreateNfeDto) {}
