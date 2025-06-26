import { Controller, Post, Body, Get, Param, Put, Delete } from '@nestjs/common';
import { SupirService } from '../services/supir.service';
import { CreateSupirDto } from '../dto/create_supir.dto';
import { UpdateSupirDto } from '../dto/update_supir.dto';

@Controller('supir')
export class SupirController {
  constructor(private readonly supirService: SupirService) {}

  @Post()
  create(@Body() createSupirDto: CreateSupirDto) {
    return this.supirService.create(createSupirDto);
  }

  @Get()
  findAll() {
    return this.supirService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.supirService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() updateSupirDto: UpdateSupirDto) {
    return this.supirService.update(id, updateSupirDto);
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.supirService.delete(id);
  }
}
