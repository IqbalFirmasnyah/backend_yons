import { PartialType } from '@nestjs/mapped-types';
import { CreateDetailRuteDto } from './create_detail_rute.dto';

export class UpdateDetailRuteDto extends PartialType(CreateDetailRuteDto) {}
