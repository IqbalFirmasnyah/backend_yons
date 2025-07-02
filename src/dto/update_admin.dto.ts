import { PartialType } from '@nestjs/mapped-types';
import { CreateAdminDto } from './create_admin.dto';

export class UpdateAdminDto extends PartialType(CreateAdminDto) {}
