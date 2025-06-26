import { Controller, Post, Body, Put, Param } from '@nestjs/common';
import { AssignmentSupirArmadaService } from '..//services/assignment_supir.service';
import { CreateAssignmentSupirArmadaDto } from '../dto/create_assignment_supir.dto';
import { UpdateAssignmentSupirArmadaDto } from '../dto/update_assignment_supir.dto';

@Controller('assignments')
export class AssignmentSupirArmadaController {
  constructor(private readonly assignmentService: AssignmentSupirArmadaService) {}

  @Post()
  create(@Body() createAssignmentDto: CreateAssignmentSupirArmadaDto) {
    return this.assignmentService.create(createAssignmentDto);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() updateAssignmentDto: UpdateAssignmentSupirArmadaDto) {
    return this.assignmentService.update(id, updateAssignmentDto);
  }
}
