import { IsNumber, IsString, IsDecimal, Min, MaxLength, IsOptional, IsDateString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomRuteDto } from './create-custom-rute-fasilitas.dto';  

export class UpdateCustomRuteDto extends PartialType(CreateCustomRuteDto) {}