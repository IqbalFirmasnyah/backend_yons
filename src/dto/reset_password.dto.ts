import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Format email tidak valid.' })
  @IsNotEmpty({ message: 'Email wajib diisi.' })
  email: string;

  @IsNotEmpty({ message: 'Kode verifikasi wajib diisi.' })
  code: string; 

  @IsNotEmpty({ message: 'Password baru wajib diisi.' })
  @MinLength(6, { message: 'Password minimal 6 karakter.' })
  newPassword: string;
}
