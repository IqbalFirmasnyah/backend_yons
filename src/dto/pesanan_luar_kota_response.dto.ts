import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PesananLuarKotaResponseDto {
  @ApiProperty()
  pesananLuarKotaId: number;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  paketLuarKotaId: number;

  @ApiProperty()
  supirId: number;

  @ApiProperty()
  armadaId: number;

  @ApiProperty()
  inputTujuanUser: string;

  @ApiProperty()
  tanggalPesan: Date;

  @ApiProperty()
  tanggalMulaiWisata: Date;

  @ApiProperty()
  tanggalSelesaiWisata: Date;

  @ApiProperty()
  jumlahPeserta: number;

  @ApiProperty()
  totalHargaFinal: number;

  @ApiProperty()
  statusPesanan: string;

  @ApiProperty()
  catatanKhusus: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  user?: any;
  
  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  paketLuarKota?: any;
  
  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  supir?: any;
  
  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  armada?: any;
  
}
