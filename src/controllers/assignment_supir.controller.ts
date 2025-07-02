import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    ParseIntPipe,
    HttpStatus,
    UseGuards,
  } from '@nestjs/common';
  import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
  } from '@nestjs/swagger';
  import { AssignmentSupirArmadaService } from 'src/services/assignment_supir.service'; 
  import { CreateAssignmentDto } from 'src/dto/create_assignment_supir.dto'; 
  import { UpdateAssignmentDto } from 'src/dto/update_assignment_supir.dto';
  import { JwtAuthGuard } from 'src/auth/strategies/jwt_auth.guard';
  
  @ApiTags('Assignment Supir Armada')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Controller('assignment-supir-armada')
  export class AssignmentSupirArmadaController {
    constructor(
      private readonly assignmentSupirService: AssignmentSupirArmadaService,
    ) {}
  
    @Post()
    @ApiOperation({ summary: 'Buat assignment supir-armada baru' })
    @ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Assignment berhasil dibuat',
    })
    @ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Data tidak valid atau armada tidak tersedia',
    })
    create(@Body() dto: CreateAssignmentDto) {
      return this.assignmentSupirService.create(dto);
    }
  
    @Get()
    @ApiOperation({ summary: 'Ambil semua assignment' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Daftar assignment berhasil diambil',
    })
    findAll() {
      return this.assignmentSupirService.findAll();
    }
  
    @Get('aktif')
    @ApiOperation({ summary: 'Ambil semua assignment dengan status AKTIF' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Assignment aktif berhasil diambil',
    })
    findActiveAssignments() {
      return this.assignmentSupirService.findActiveAssignments();
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Ambil detail assignment berdasarkan ID' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Detail assignment berhasil diambil',
    })
    @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Assignment tidak ditemukan',
    })
    findOne(@Param('id', ParseIntPipe) id: number) {
      return this.assignmentSupirService.findOne(id);
    }
  
    @Get('supir/:supirId')
    @ApiOperation({ summary: 'Ambil semua assignment berdasarkan ID Supir' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Berhasil' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Supir tidak ditemukan' })
    findAssignmentsByDriver(@Param('supirId', ParseIntPipe) supirId: number) {
      return this.assignmentSupirService.findAssignmentsByDriver(supirId);
    }
  
    @Get('armada/:armadaId')
    @ApiOperation({ summary: 'Ambil semua assignment berdasarkan ID Armada' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Berhasil' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Armada tidak ditemukan' })
    findAssignmentsByVehicle(@Param('armadaId', ParseIntPipe) armadaId: number) {
      return this.assignmentSupirService.findAssignmentsByVehicle(armadaId);
    }
  
    @Patch(':id')
    @ApiOperation({ summary: 'Update assignment' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Assignment berhasil diperbarui',
    })
    @ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validasi gagal atau armada tidak tersedia',
    })
    update(
      @Param('id', ParseIntPipe) id: number,
      @Body() dto: UpdateAssignmentDto,
    ) {
      return this.assignmentSupirService.update(id, dto);
    }
  
    @Patch(':id/complete')
    @ApiOperation({ summary: 'Tandai assignment selesai' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Assignment berhasil diselesaikan',
    })
    @ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Assignment sudah selesai',
    })
    complete(@Param('id', ParseIntPipe) id: number) {
      return this.assignmentSupirService.completeAssignment(id);
    }
  
    @Delete(':id')
    @ApiOperation({ summary: 'Soft delete assignment (ubah status menjadi selesai)' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Assignment berhasil dihapus (soft delete)',
    })
    remove(@Param('id', ParseIntPipe) id: number) {
      return this.assignmentSupirService.update(id, {
        status: 'selesai',
        tanggalSelesaiAssignment: new Date().toISOString(),
      });
    }
  }
  