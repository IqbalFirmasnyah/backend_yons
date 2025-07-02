import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, IsArray, ValidateNested } from 'class-validator';
import { CreateDetailRuteDto, CreatePaketWisataLuarKotaDto } from './create_paket_wisata_luar.dto';

export class UpdateDetailRuteDto extends PartialType(CreateDetailRuteDto) {
  @ApiProperty({ description: 'ID rute (untuk update)', required: false })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  ruteId?: number;
}

export class UpdatePaketWisataLuarKotaDto extends PartialType(CreatePaketWisataLuarKotaDto) {
  @ApiProperty({ type: [UpdateDetailRuteDto], description: 'Detail rute perjalanan', required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateDetailRuteDto)
  urutanKe?: UpdateDetailRuteDto[];
}