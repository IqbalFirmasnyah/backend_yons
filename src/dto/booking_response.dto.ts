import { IsInt, IsString, IsDecimal, IsDate, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { BookingStatus } from '../services/booking.service'; // Adjust path as needed

// You might need to import other DTOs if they are nested in your Booking response
// For example, if you include 'user' in the response and want to document its structure:
// import { UserResponseDto } from './user_response.dto'; // if you create one

export class BookingResponseDto {
  @IsInt()
  bookingId: number;

  @IsInt()
  userId: number;

  @IsOptional()
  @IsInt()
  paketId?: number;

  @IsOptional()
  @IsInt()
  paketLuarKotaId?: number;

  @IsOptional()
  @IsInt()
  fasilitasId?: number;

  @IsInt()
  supirId: number;

  @IsInt()
  armadaId: number;

  @IsString()
  kodeBooking: string;

  @IsDate()
  @Type(() => Date)
  tanggalBooking: Date;

  @IsDate()
  @Type(() => Date)
  tanggalMulaiWisata: Date;

  @IsDate()
  @Type(() => Date)
  tanggalSelesaiWisata: Date;

  @IsInt()
  jumlahPeserta: number;

  @IsDecimal({ decimal_digits: '2' })
  @Type(() => Number) // Ensure transformation from Decimal to Number if Prisma returns Decimal type
  estimasiHarga: number;

  @IsOptional()
  @IsString()
  inputCustomTujuan?: string;

  @IsOptional()
  @IsString()
  catatanKhusus?: string;

  @IsString() // Or IsEnum(BookingStatus) if you want strict enum validation in the response DTO
  statusBooking: BookingStatus; // Use the enum here

  @IsDate()
  @Type(() => Date)
  expiredAt: Date;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;

  // If you include nested relations in your Prisma find operations,
  // you might want to include their DTOs here for Swagger documentation.
  // Example if 'user' is included in the response:
  // @Type(() => UserResponseDto)
  // user?: UserResponseDto;
}