// src/pembayaran/dto/update-pembayaran.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreatePembayaranDto } from './create_pembayaran.dto';

export class UpdatePembayaranDto extends PartialType(CreatePembayaranDto) {}
