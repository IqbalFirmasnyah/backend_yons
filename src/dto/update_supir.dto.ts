import { PartialType } from '@nestjs/mapped-types';
import { CreateSupirDto } from './create_supir.dto';

export class UpdateSupirDto extends PartialType(CreateSupirDto) {}
