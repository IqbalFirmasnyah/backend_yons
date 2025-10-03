import { IsNotEmpty, IsString, IsDateString, MaxLength } from 'class-validator';

export class CreateDropoffDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  namaTujuan: string;

  @IsNotEmpty()
  @IsString()
  alamatTujuan: string;

  @IsNotEmpty()
  @IsDateString()
  tanggalLayanan: string;
}