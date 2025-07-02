import { IsEmail, IsOptional, IsString, IsIn } from 'class-validator';

export class CreateAdminDto {
  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  namaLengkap: string;

  @IsOptional()
  @IsString()
  fotoProfil?: string;

  @IsIn(['super_admin', 'admin'])
  role: string;
}
