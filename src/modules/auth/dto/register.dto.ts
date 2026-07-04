import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import {
  IsCnpj,
  IsCpf,
} from '../../../common/validators/cpf-cnpj.validator';
import { TenantSegment } from '../../../core/enums/enums';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  tenantName: string;

  @IsOptional()
  @IsCnpj()
  tenantDocument?: string;

  @IsOptional()
  @IsEnum(TenantSegment)
  tenantSegment?: TenantSegment;

  @IsString()
  @IsNotEmpty()
  adminName: string;

  @IsEmail()
  adminEmail: string;

  @IsString()
  @MinLength(8)
  adminPassword: string;

  @IsOptional()
  @IsCpf()
  adminDocument?: string;
}
