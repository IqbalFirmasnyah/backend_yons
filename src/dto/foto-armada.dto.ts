import { ApiProperty } from '@nestjs/swagger';

export class FotoArmadaDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'File gambar armada (max 5MB, format: jpg, jpeg, png, gif)',
  })
  image: any;
}