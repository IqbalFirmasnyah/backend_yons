import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Refund, StatusRefund } from '../database/entities/refund.entity';
import { CreateRefundDto } from '../dto/create_refund.dto';

@Injectable()
export class RefundService {
  constructor(
    @InjectRepository(Refund)
    private refundRepository: Repository<Refund>,
  ) {}

  async create(createRefundDto: CreateRefundDto, userId: number): Promise<Refund> {
    // Validate that only one reference is selected
    const refCount = [
      createRefundDto.pesanan_id,
      createRefundDto.pesanan_luar_kota_id,
      createRefundDto.booking_id
    ].filter(id => id != null).length;
    
    if (refCount !== 1) {
      throw new BadRequestException('Must select one: order, out-of-town order, or booking');
    }

    const refund = new Refund();
    Object.assign(refund, createRefundDto);
    
    refund.userId = userId; // Use camelCase for property names
    refund.kodeRefund = await this.generateRefundCode();
    refund.tanggalPengajuan = new Date();
    
    // Calculate final refund amount (before admin deduction)
    refund.jumlahRefundFinal = refund.jumlahRefund - refund.jumlahPotonganAdmin;
    
    return await this.refundRepository.save(refund);
  }

  async findAll(): Promise<Refund[]> {
    return await this.refundRepository.find({
      relations: ['user', 'pesanan', 'pesananLuarKota', 'booking', 'pembayaran']
    });
  }

  async findOne(id: number): Promise<Refund> {
    const refund = await this.refundRepository.findOne({
      where: { refundId: id }, // Use camelCase for property names
      relations: ['user', 'pesanan', 'pesananLuarKota', 'booking', 'pembayaran', 'approvedByAdmin', 'processedByAdmin']
    });
    
    if (!refund) {
      throw new NotFoundException(`Refund with ID ${id} not found`);
    }
    
    return refund;
  }

  async approve(id: number, adminId: number, potonganAdmin: number = 0): Promise<Refund> {
    const refund = await this.findOne(id);
    
    if (refund.statusRefund !== StatusRefund.PENDING) {
      throw new BadRequestException('Refund has already been processed');
    }
    
    refund.statusRefund = StatusRefund.APPROVED;
    refund.approvedByAdminId = adminId;
    refund.tanggalDisetujui = new Date();
    refund.jumlahPotonganAdmin = potonganAdmin;
    refund.jumlahRefundFinal = refund.jumlahRefund - potonganAdmin;
    
    return await this.refundRepository.save(refund);
  }

  async reject(id: number, adminId: number, catatanAdmin: string): Promise<Refund> {
    const refund = await this.findOne(id);
    
    if (refund.statusRefund !== StatusRefund.PENDING) {
      throw new BadRequestException('Refund has already been processed');
    }
    
    refund.statusRefund = StatusRefund.REJECTED;
    refund.approvedByAdminId = adminId;
    refund.tanggalDisetujui = new Date();
    refund.catatanAdmin = catatanAdmin;
    
    return await this.refundRepository.save(refund);
  }

  async process(id: number, adminId: number, buktiRefund: string): Promise<Refund> {
    const refund = await this.findOne(id);
    
    if (refund.statusRefund !== StatusRefund.APPROVED) {
      throw new BadRequestException('Refund has not been approved yet');
    }
    
    refund.statusRefund = StatusRefund.PROCESSING;
    refund.processedByAdminId = adminId;
    refund.buktiRefund = buktiRefund;
    
    return await this.refundRepository.save(refund);
  }

  async complete(id: number): Promise<Refund> {
    const refund = await this.findOne(id);
    
    if (refund.statusRefund !== StatusRefund.PROCESSING) {
      throw new BadRequestException('Refund is not in processing status');
    }
    
    refund.statusRefund = StatusRefund.COMPLETED;
    refund.tanggalRefundSelesai = new Date();
    
    return await this.refundRepository.save(refund);
  }

  private async generateRefundCode(): Promise<string> {
    const prefix = 'RF';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `${prefix}${timestamp}${random}`;
  }

  async getRefundHistory(userId: number): Promise<Refund[]> {
    return await this.refundRepository.find({
      where: { userId: userId }, // Use camelCase for property names
      relations: ['pesanan', 'pesananLuarKota', 'booking', 'pembayaran'],
      order: { createdAt: 'DESC' } // Use camelCase for property names
    });
  }
}
