import { IsString, IsEmail, IsDateString, IsOptional, IsPhoneNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  nama_lengkap: string;

  @IsString()
  alamat: string;

  @IsDateString()
  @Transform(({ value }) => new Date(value))
  tanggal_lahir: Date;

  @IsPhoneNumber('ID') // 'ID' for Indonesia, or remove parameter for international
  no_hp: string;

  @IsOptional()
  @IsString()
  foto_profil?: string;
}