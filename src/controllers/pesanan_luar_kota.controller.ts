import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    Request,
    UseGuards,
    ParseIntPipe,
  } from '@nestjs/common';
  import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
  } from '@nestjs/swagger';
  import { PesananLuarKotaService } from 'src/services/pesanan_luar_kota.service';
  import { CreatePesananLuarKotaDto } from 'src/dto/create_pesanan_luar_kota.dto';
  import { UpdatePesananLuarKotaDto } from 'src/dto/update_pesanan_luar_kota.dto';
  import { QueryPesananLuarKotaDto } from 'src/dto/query_pesanan_luar_kota.dto';
  import { PesananLuarKotaResponseDto } from 'src/dto/pesanan_luar_kota_response.dto';
  
  import { JwtAuthGuard } from '../auth/strategies/jwt_auth.guard';
  import { RolesGuard } from '../auth/guards/roles.guard';
  import { Roles } from '../auth/decorators/roles.decorator';
  import { Role } from '../auth/enums/role.enum';
  
  @ApiTags('pesanan-luar-kota')
  @Controller('pesanan-luar-kota')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  export class PesananLuarKotaController {
    constructor(
      private readonly pesananLuarKotaService: PesananLuarKotaService,
    ) {}
  
    @Post()
@ApiOperation({ summary: 'Buat pesanan luar kota' })
@ApiResponse({
  status: 201,
  description: 'Pesanan berhasil dibuat',
  type: PesananLuarKotaResponseDto,
})
async create(
  @Body() createPesananLuarKotaDto: CreatePesananLuarKotaDto,
  @Request() req,
) {
  const userId = req.user.userId;
  return this.pesananLuarKotaService.create(userId, createPesananLuarKotaDto); // ✅ urutan diperbaiki
}

  
    @Get()
    @ApiOperation({ summary: 'Ambil daftar pesanan luar kota' })
    async findAll(
      @Query() query: QueryPesananLuarKotaDto,
      @Request() req,
    ) {
      const userId = req.user.userId;
      return this.pesananLuarKotaService.findByUser(userId, query);
    }
  
    @Get(':id')
    @ApiOperation({
      summary: 'Ambil detail pesanan luar kota berdasarkan ID',
    })
    @ApiParam({ name: 'id', required: true })
    async findOne(@Param('id', ParseIntPipe) id: number) {
      return this.pesananLuarKotaService.findOne(id);
    }
  
    @Patch(':id')
    @ApiOperation({ summary: 'Update pesanan luar kota' })
    @ApiParam({ name: 'id', required: true })
    async update(
      @Param('id', ParseIntPipe) id: number,
      @Body() updatePesananLuarKotaDto: UpdatePesananLuarKotaDto,
    ) {
      return this.pesananLuarKotaService.update(id, updatePesananLuarKotaDto);
    }
  
    @Delete(':id')
    @ApiOperation({ summary: 'Hapus pesanan luar kota' })
    @ApiParam({ name: 'id', required: true })
    async remove(@Param('id', ParseIntPipe) id: number) {
      return this.pesananLuarKotaService.remove(id);
    }
  
    @Get('admin/all')
    @Roles(Role.Admin)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Admin: Ambil semua pesanan luar kota' })
    async findAllAdmin(@Query() query: QueryPesananLuarKotaDto) {
      return this.pesananLuarKotaService.findAllAdmin(query);
    }
  }
  