import { Controller, Post, Body, Get, Param, Patch, Delete, HttpCode, HttpStatus, NotFoundException, UseGuards } from '@nestjs/common';
import { DropoffService } from 'src/services/dropoff.service';
import { CreateDropoffDto } from 'src/dto/create-dropoff.dto';
import { UpdateDropoffDto } from 'src/dto/update-dropoff.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/strategies/jwt_auth.guard';

@ApiTags('Dropoff')
@ApiBearerAuth()
@Controller('dropoff')
export class DropoffController {
  constructor(private readonly dropoffService: DropoffService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDropoffDto: CreateDropoffDto) {
    return this.dropoffService.createDropoff(createDropoffDto);
  }

  @Get()
  async findAll() {
    return this.dropoffService.findAllDropoffs();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const dropoff = await this.dropoffService.findOneDropoff(parseInt(id, 10));
    if (!dropoff) throw new NotFoundException(`Dropoff with ID ${id} not found.`);
    return dropoff;
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDropoffDto: UpdateDropoffDto) {
    const updatedDropoff = await this.dropoffService.updateDropoff(parseInt(id, 10), updateDropoffDto);
    if (!updatedDropoff) throw new NotFoundException(`Dropoff with ID ${id} not found.`);
    return updatedDropoff;
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    const deleted = await this.dropoffService.removeDropoff(parseInt(id, 10));
    if (!deleted) throw new NotFoundException(`Dropoff with ID ${id} not found.`);
  }
}
