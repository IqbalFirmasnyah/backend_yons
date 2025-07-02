import { PartialType } from '@nestjs/mapped-types';
import { CreatePaketWisataDto } from './create_paket_wisata.dto';

export class UpdatePaketWisataDto extends PartialType(CreatePaketWisataDto) {}