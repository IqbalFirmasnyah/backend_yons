import { IsString, MinLength, MaxLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString({ message: 'Password lama harus berupa string' })
  oldPassword: string;

  @IsString({ message: 'Password baru harus berupa string' })
  @MinLength(6, { message: 'Password baru minimal 6 karakter' })
  @MaxLength(50, { message: 'Password baru maksimal 50 karakter' })
  newPassword: string;
}