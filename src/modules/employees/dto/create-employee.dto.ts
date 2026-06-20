import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../../core/enums/enums';

const ASSIGNABLE_ROLES = [UserRole.ADMIN, UserRole.FINANCEIRO, UserRole.VENDEDOR];

export class CreateEmployeeDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsIn(ASSIGNABLE_ROLES)
  role: UserRole;

  @IsOptional()
  @IsString()
  document?: string;
}
