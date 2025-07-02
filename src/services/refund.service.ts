import {
    Injectable,
    NotFoundException,
    BadRequestException,
  } from '@nestjs/common';
  import { PrismaService } from '../prisma/prisma.service';
  import { CreateRefundDto } from '../dto/create_refund.dto';
  import { StatusRefund } from 'src/database/entities/refund.entity'; 
  import { Decimal } from 'generated/prisma/runtime/library'; 
  
  @Injectable()
  export class RefundService {
    constructor(private readonly prisma: PrismaService) {}
  
    async create(createRefundDto: CreateRefundDto, userId: number) {
      const { pesananId, pesananLuarKotaId, bookingId, pembayaranId, ...rest } = createRefundDto;
  
      const refCount = [pesananId, pesananLuarKotaId, bookingId].filter(Boolean).length;
      if (refCount !== 1) {
        throw new BadRequestException('Must select only one: pesanan, pesanan luar kota, or booking.');
      }
  
      const kodeRefund = await this.generateRefundCode();
      const tanggalPengajuan = new Date();
  
      const jumlahRefundFinal = rest.jumlahRefund - rest.jumlahPotonganAdmin;
  
      return await this.prisma.refund.create({
        data: {
          ...rest,
          pesananId,
          pesananLuarKotaId,
          bookingId,
          pembayaranId,
          userId,
          kodeRefund,
          tanggalPengajuan,
          jumlahRefundFinal,
          statusRefund: StatusRefund.PENDING,
        },
      });
    }
  
    async findAll() {
      return await this.prisma.refund.findMany({
        include: {
          user: true,
          pesanan: true,
          pesananLuarKota: true,
          booking: true,
          pembayaran: true,
          approvedByAdmin: true,
          processedByAdmin: true,
        },
      });
    }
  
    async findOne(id: number) {
      const refund = await this.prisma.refund.findUnique({
        where: { refundId: id },
        include: {
          user: true,
          pesanan: true,
          pesananLuarKota: true,
          booking: true,
          pembayaran: true,
          approvedByAdmin: true,
          processedByAdmin: true,
        },
      });
  
      if (!refund) {
        throw new NotFoundException(`Refund with ID ${id} not found`);
      }
  
      return refund;
    }
  
    async approve(id: number, adminId: number, potonganAdmin = 0) {
      const refund = await this.findOne(id);
  
      if (refund.statusRefund !== StatusRefund.PENDING) {
        throw new BadRequestException('Refund has already been processed');
      }
  
      const jumlahRefundFinal = new Decimal(refund.jumlahRefund).minus(potonganAdmin);

  
      return await this.prisma.refund.update({
        where: { refundId: id },
        data: {
          statusRefund: StatusRefund.APPROVED,
          approvedByAdminId: adminId,
          tanggalDisetujui: new Date(),
          jumlahPotonganAdmin: potonganAdmin,
          jumlahRefundFinal,
        },
      });
    }
  
    async reject(id: number, adminId: number, catatanAdmin: string) {
      const refund = await this.findOne(id);
  
      if (refund.statusRefund !== StatusRefund.PENDING) {
        throw new BadRequestException('Refund has already been processed');
      }
  
      return await this.prisma.refund.update({
        where: { refundId: id },
        data: {
          statusRefund: StatusRefund.REJECTED,
          approvedByAdminId: adminId,
          tanggalDisetujui: new Date(),
          catatanAdmin,
        },
      });
    }
  
    async process(id: number, adminId: number, buktiRefund: string) {
      const refund = await this.findOne(id);
  
      if (refund.statusRefund !== StatusRefund.APPROVED) {
        throw new BadRequestException('Refund has not been approved yet');
      }
  
      return await this.prisma.refund.update({
        where: { refundId: id },
        data: {
          statusRefund: StatusRefund.PROCESSING,
          processedByAdminId: adminId,
          buktiRefund,
        },
      });
    }
  
    async complete(id: number) {
      const refund = await this.findOne(id);
  
      if (refund.statusRefund !== StatusRefund.PROCESSING) {
        throw new BadRequestException('Refund is not in processing status');
      }
  
      return await this.prisma.refund.update({
        where: { refundId: id },
        data: {
          statusRefund: StatusRefund.COMPLETED,
          tanggalRefundSelesai: new Date(),
        },
      });
    }
  
    async getRefundHistory(userId: number) {
      return await this.prisma.refund.findMany({
        where: { userId },
        include: {
          pesanan: true,
          pesananLuarKota: true,
          booking: true,
          pembayaran: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }
  
    private async generateRefundCode(): Promise<string> {
      const prefix = 'RF';
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `${prefix}${timestamp}${random}`;
    }
  }
  