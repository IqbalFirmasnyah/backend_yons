import { IsString, IsEmail, IsDateString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsString({ message: 'Username harus berupa string' })
  @MinLength(3, { message: 'Username minimal 3 karakter' })
  @MaxLength(50, { message: 'Username maksimal 50 karakter' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Username hanya boleh mengandung huruf, angka, dan underscore' })
  username: string;

  @IsEmail({}, { message: 'Email harus berformat valid' })
  @MaxLength(100, { message: 'Email maksimal 100 karakter' })
  email: string;

  @IsString({ message: 'Password harus berupa string' })
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  @MaxLength(255, { message: 'Password maksimal 255 karakter' })
  password: string;

  @IsString({ message: 'Nama lengkap harus berupa string' })
  @MinLength(2, { message: 'Nama lengkap minimal 2 karakter' })
  @MaxLength(100, { message: 'Nama lengkap maksimal 100 karakter' })
  nama_lengkap: string;

  @IsString({ message: 'Alamat harus berupa string' })
  @MinLength(10, { message: 'Alamat minimal 10 karakter' })
  alamat: string;

  @IsDateString({}, { message: 'Tanggal lahir harus berformat valid (YYYY-MM-DD)' })
  @Transform(({ value }) => {
    const date = new Date(value);
    // Validasi umur minimal 13 tahun
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      age--;
    }
    
    if (age < 13) {
      throw new Error('Umur minimal 13 tahun');
    }
    
    return date;
  })
  tanggal_lahir: Date;

  @IsString({ message: 'Nomor HP harus berupa string' })
  @Matches(/^(\+62|62|0)8[1-9][0-9]{6,11}$/, { 
    message: 'Format nomor HP tidak valid (contoh: 08123456789, +628123456789)' 
  })
  @MaxLength(15, { message: 'Nomor HP maksimal 15 karakter' })
  no_hp: string;

  @IsOptional()
  @IsString({ message: 'Foto profil harus berupa string URL' })
  @MaxLength(255, { message: 'URL foto profil maksimal 255 karakter' })
  foto_profil?: string;
}

// Response interfaces
export interface AuthResponse {
  message: string;
  user: {
    userId: number;
    username: string;
    email: string;
    namaLengkap: string;
    alamat: string;
    tanggalLahir: Date;
    noHp: string;
    fotoProfil?: string;
    statusAktif: boolean;
    createdAt: Date;
    updatedAt?: Date;
  };
  access_token: string;
  token_type: string;
  expires_in: string;
}

export interface UserProfileResponse {
  message: string;
  user: {
    userId: number;
    username: string;
    email: string;
    namaLengkap: string;
    alamat: string;
    tanggalLahir: Date;
    noHp: string;
    fotoProfil?: string;
    statusAktif: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface MessageResponse {
  message: string;
}