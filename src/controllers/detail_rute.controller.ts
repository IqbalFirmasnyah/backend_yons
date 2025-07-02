import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    ParseIntPipe,
  } from '@nestjs/common';
  import { DetailRuteService } from 'src/services/detail_rute.service'; 
  import { CreateDetailRuteDto } from '../dto/create_detail_rute.dto';
  import { UpdateDetailRuteDto } from '../dto/update_detail_rute.dto';
  
  @Controller('detail-rute')
  export class DetailRuteController {
    constructor(private readonly detailRuteService: DetailRuteService) {}
  
    @Post()
    create(@Body() dto: CreateDetailRuteDto) {
      return this.detailRuteService.create(dto);
    }
  
    @Get()
    findAll() {
      return this.detailRuteService.findAll();
    }
  
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
      return this.detailRuteService.findOne(id);
    }
  
    @Patch(':id')
    update(
      @Param('id', ParseIntPipe) id: number,
      @Body() dto: UpdateDetailRuteDto,
    ) {
      return this.detailRuteService.update(id, dto);
    }
  
    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
      return this.detailRuteService.remove(id);
    }
  }
  