import { PartialType } from '@nestjs/mapped-types';
import { CreateUpdateStatusBookingDto } from './create_status_booking.dto';

export class UpdateUpdateStatusBookingDto extends PartialType(CreateUpdateStatusBookingDto) {}
