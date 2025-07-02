// src/assignment-supir-armada/dto/update-assignment.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateAssignmentDto } from './create_assignment_supir.dto'; 
export class UpdateAssignmentDto extends PartialType(CreateAssignmentDto) {}
