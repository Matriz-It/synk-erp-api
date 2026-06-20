import { IsEnum, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole, UserStatus } from '../../../core/enums/enums';

const ASSIGNABLE_ROLES = [UserRole.ADMIN, UserRole.FINANCEIRO, UserRole.VENDEDOR];

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsIn(ASSIGNABLE_ROLES)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
