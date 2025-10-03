import {
    IsString,
    IsEmail,
    IsDateString,
    IsOptional,
    MinLength,
    MaxLength,
    Matches,
    IsNotEmpty,
    ValidateBy,
    ValidationArguments,
  } from 'class-validator';
  import { Transform, Type } from 'class-transformer';
  
  // Custom validator yang bekerja dengan string
  function IsValidDateAndMinAge(minAge: number) {
    return ValidateBy({
      name: 'isValidDateAndMinAge',
      validator: {
        validate(value: any, args: ValidationArguments) {
          console.log('🔍 Custom validator called with value:', value, 'type:', typeof value);
          
          // Jika value sudah berupa Date object (dari transform), skip validasi
          if (value instanceof Date) {
            return true;
          }
          
          // Validasi format date string
          if (typeof value !== 'string') {
            return false;
          }
          
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            return false;
          }
          
          // Validasi umur minimal
          const today = new Date();
          let age = today.getFullYear() - date.getFullYear();
          const monthDiff = today.getMonth() - date.getMonth();
          
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
            age--;
          }
          
          console.log('📊 Calculated age in validator:', age);
          return age >= minAge;
        },
        defaultMessage(args: ValidationArguments) {
          return `Tanggal lahir harus berformat valid (YYYY-MM-DD) dan umur minimal ${minAge} tahun`;
        },
      },
    });
  }
  
  export class CreateUserDto {
    @IsNotEmpty({ message: 'Username tidak boleh kosong' })
    @IsString({ message: 'Username harus berupa string' })
    @MinLength(3, { message: 'Username minimal 3 karakter' })
    @MaxLength(50, { message: 'Username maksimal 50 karakter' })
    // @Matches(/^[a-zA-Z0-9_]+$/, {
    //   message: 'Username hanya boleh mengandung huruf, angka, dan underscore',
    // })
    username: string;
  
    @IsNotEmpty({ message: 'Email tidak boleh kosong' })
    @IsEmail({}, { message: 'Email harus berformat valid' })
    @MaxLength(100, { message: 'Email maksimal 100 karakter' })
    email: string;
  
    @IsNotEmpty({ message: 'Password tidak boleh kosong' })
    @IsString({ message: 'Password harus berupa string' })
    @MinLength(6, { message: 'Password minimal 6 karakter' })
    @MaxLength(255, { message: 'Password maksimal 255 karakter' })
    password: string;
  
    @IsNotEmpty({ message: 'Nama lengkap tidak boleh kosong' })
    @IsString({ message: 'Nama lengkap harus berupa string' })
    @MinLength(2, { message: 'Nama lengkap minimal 2 karakter' })
    @MaxLength(100, { message: 'Nama lengkap maksimal 100 karakter' })
    namaLengkap: string;
  
    @IsOptional({ message: 'Alamat tidak boleh kosong' })
    @IsString({ message: 'Alamat harus berupa string' })
    @MinLength(10, { message: 'Alamat minimal 10 karakter' })
    alamat: string;
  
    
    @IsOptional({ message: 'Tanggal lahir tidak boleh kosong' })
    @IsValidDateAndMinAge(13)
    @Transform(({ value }) => {
      console.log('🔄 Transform called with value:', value);
      console.log('🔄 Value type:', typeof value);
      
    
      if (value instanceof Date) {
        console.log('📅 Value is already a Date object');
        return value;
      }
      
      const date = new Date(value);
      console.log('📅 Created date object:', date);
      console.log('✅ Transform completed successfully');
      
      return date;
    })
    @Type(() => Date)
    tanggalLahir: Date;
  
    @IsOptional({ message: 'Nomor HP tidak boleh kosong' })
    @IsString({ message: 'Nomor HP harus berupa string' })
    @Matches(/^(\+62|62|0)8[1-9][0-9]{6,11}$/, {
      message: 'Format nomor HP tidak valid (contoh: 08123456789, +628123456789)',
    })
    @MaxLength(15, { message: 'Nomor HP maksimal 15 karakter' })
    noHp: string;
  
    @IsOptional()
    @IsString({ message: 'Foto profil harus berupa string URL' })
    @MaxLength(255, { message: 'URL foto profil maksimal 255 karakter' })
    fotoProfil?: string;
  }