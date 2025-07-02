import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Patch,
    Query,
    UseGuards,
    ParseIntPipe,
    Request,
  } from '@nestjs/common';
  import { RefundService } from 'src/services/refund.service';
  import { CreateRefundDto } from '../dto/create_refund.dto';
  import { JwtAuthGuard } from 'src/auth/strategies/jwt_auth.guard';
  import { RolesGuard } from 'src/auth/guards/roles.guard'; // Jika kamu pakai guard manual
  
  @Controller('refund')
  export class RefundController {
    constructor(private readonly refundService: RefundService) {}
  
    @UseGuards(JwtAuthGuard)
    @Post()
    async create(
      @Body() createRefundDto: CreateRefundDto,
      @Request() req: any,
    ) {
      const userId = req.user.userId;
      return this.refundService.create(createRefundDto, userId);
    }
  
    @UseGuards(JwtAuthGuard)
    @Get('history')
    async getRefundHistory(@Request() req: any) {
      const userId = req.user.userId;
      return this.refundService.getRefundHistory(userId);
    }
  
    @UseGuards(JwtAuthGuard)
    @Get()
    async findAll() {
      return this.refundService.findAll();
    }
  
    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
      return this.refundService.findOne(id);
    }
  
    @UseGuards(JwtAuthGuard)
    @Patch(':id/approve')
    async approveRefund(
      @Param('id', ParseIntPipe) id: number,
      @Query('adminId', ParseIntPipe) adminId: number,
      @Query('potonganAdmin') potonganAdmin: string,
      @Request() req: any,
    ) {
      // optional: verifikasi role langsung dari req.user.role
      const potongan = parseFloat(potonganAdmin || '0');
      return this.refundService.approve(id, adminId, potongan);
    }
  
    @UseGuards(JwtAuthGuard)
    @Patch(':id/reject')
    async rejectRefund(
      @Param('id', ParseIntPipe) id: number,
      @Query('adminId', ParseIntPipe) adminId: number,
      @Body('catatanAdmin') catatanAdmin: string,
    ) {
      return this.refundService.reject(id, adminId, catatanAdmin);
    }
  
    @UseGuards(JwtAuthGuard)
    @Patch(':id/process')
    async processRefund(
      @Param('id', ParseIntPipe) id: number,
      @Query('adminId', ParseIntPipe) adminId: number,
      @Body('buktiRefund') buktiRefund: string,
    ) {
      return this.refundService.process(id, adminId, buktiRefund);
    }
  
    @UseGuards(JwtAuthGuard)
    @Patch(':id/complete')
    async completeRefund(@Param('id', ParseIntPipe) id: number) {
      return this.refundService.complete(id);
    }
  }
  