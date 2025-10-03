import { IsInt, IsString, IsDecimal, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class DetailRuteResponseDto {
    ruteId: number;
    urutanKe: number;
    namaDestinasi: string;
    alamatDestinasi: string;
    jarakDariSebelumnyaKm: number;
    estimasiWaktuTempuh: number;
    waktuKunjunganMenit: number;
    deskripsiSingkat?: string;
    createdAt: Date;
    updatedAt: Date;
}

export class PaketWisataLuarKotaResponseDto {
    paketLuarKotaId: number;
    namaPaket: string;
    tujuanUtama: string;
    totalJarakKm: number;
    // images:string[];
    estimasiDurasi: number;
    hargaEstimasi: number;
    statusPaket: string;
    // fotoPaketLuar:string[]
    
    // Field tanggal yang dipilih user
    @IsDate()
    @Type(() => Date)
    pilihTanggal: Date;
    
    // Field tanggal yang dihitung otomatis
    @IsDate()
    tanggalMulaiWisata: Date;
    
    @IsDate()
    tanggalSelesaiWisata: Date;
    
    @IsOptional()
    @IsString()
    durasi?: string;
    
    @IsOptional()
    @IsString()
    deskripsi?: string;

    @ApiProperty({ type: [String], example: ['image-1.jpg', 'image-2.jpg'] })
    fotoPaketLuar: string[];
    
    createdAt: Date;
    updatedAt: Date;
    detailRute: DetailRuteResponseDto[];
}