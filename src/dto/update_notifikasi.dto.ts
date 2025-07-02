import { PartialType } from '@nestjs/mapped-types';
import { CreateNotifikasiDto } from './create_notifikasi.dto';

export class UpdateNotifikasiDto extends PartialType(CreateNotifikasiDto) {}
