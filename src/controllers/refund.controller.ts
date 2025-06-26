import { Controller, Get, Post, Body, Param, Put, ParseIntPipe, Query } from '@nestjs/common';
import { RefundService } from '../services/refund.service';
import { CreateRefundDto } from '../dto/create_refund.dto';

@Controller('refunds')
export class RefundController {
  constructor(private readonly refundService: RefundService) {}

  @Post()
  create(@Body() createRefundDto: CreateRefundDto, @Query('userId', ParseIntPipe) userId: number) {
    return this.refundService.create(createRefundDto, userId);
  }

  @Get()
  findAll() {
    return this.refundService.findAll();
  }

  @Get('user/:userId')
  getRefundHistory(@Param('userId', ParseIntPipe) userId: number) {
    return this.refundService.getRefundHistory(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.refundService.findOne(id);
  }

  @Put(':id/approve')
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() approveData: { adminId: number; potonganAdmin?: number }
  ) {
    return this.refundService.approve(id, approveData.adminId, approveData.potonganAdmin);
  }

  @Put(':id/reject')
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() rejectData: { adminId: number; catatanAdmin: string }
  ) {
    return this.refundService.reject(id, rejectData.adminId, rejectData.catatanAdmin);
  }

  @Put(':id/process')
  process(
    @Param('id', ParseIntPipe) id: number,
    @Body() processData: { adminId: number; buktiRefund: string }
  ) {
    return this.refundService.process(id, processData.adminId, processData.buktiRefund);
  }

  @Put(':id/complete')
  complete(@Param('id', ParseIntPipe) id: number) {
    return this.refundService.complete(id);
  }
}