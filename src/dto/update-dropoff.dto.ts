import { IsNumber, IsString, IsDecimal, Min, MaxLength, IsOptional, IsDateString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateDropoffDto } from './create-dropoff.dto';

export class UpdateDropoffDto extends PartialType(CreateDropoffDto) {
    fasilitasId: any;
}