import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, StatusBooking } from '../database/entities/booking.entity';
import { UpdateStatusBooking } from '../database/entities/update_status_booking.entity';
import { CreateBookingDto } from '../dto/create_booking.dto';
import { UpdateBookingStatusDto } from '../dto/update_booking_status.dto';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(UpdateStatusBooking)
    private updateStatusRepository: Repository<UpdateStatusBooking>,
  ) {}

  async create(createBookingDto: CreateBookingDto): Promise<Booking> {
    // Validate that only one package is selected
    if (createBookingDto.paket_id && createBookingDto.paket_luar_kota_id) {
      throw new BadRequestException('Cannot select both regular package and out-of-town package');
    }
    
    if (!createBookingDto.paket_id && !createBookingDto.paket_luar_kota_id) {
      throw new BadRequestException('Must select at least one package');
    }

    const booking = new Booking();
    Object.assign(booking, createBookingDto);
    
    // Generate booking code
    booking.kodeBooking = await this.generateBookingCode();
    booking.tanggalBooking = new Date();
    
    // Set expiration time (24 hours from now)
    booking.expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    return await this.bookingRepository.save(booking);
  }

  async findAll(): Promise<Booking[]> {
    return await this.bookingRepository.find({
      relations: ['user', 'paket', 'paketLuarKota', 'supir', 'armada']
    });
  }

  async findOne(id: number): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { bookingId: id },
      relations: ['user', 'paket', 'paketLuarKota', 'supir', 'armada', 'updateStatus']
    });
    
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }
    
    return booking;
  }

  async updateStatus(id: number, updateStatusDto: UpdateBookingStatusDto, updatedBy: { userId?: number, adminId?: number }): Promise<Booking> {
    const booking = await this.findOne(id);
    const oldStatus = booking.statusBooking;
    
    // Update booking status
    booking.statusBooking = updateStatusDto.status_booking;
    await this.bookingRepository.save(booking);
    
    // Log status update
    const statusUpdate = new UpdateStatusBooking();
    statusUpdate.bookingId = id;
    statusUpdate.statusLama = oldStatus;
    statusUpdate.statusBaru = updateStatusDto.status_booking;
    statusUpdate.timestampUpdate = new Date();
    
    if (updatedBy.userId) {
      statusUpdate.updatedByUser = updatedBy.userId;
    }
    if (updatedBy.adminId) {
      statusUpdate.updatedByAdminId = updatedBy.adminId;
    }
    
    await this.updateStatusRepository.save(statusUpdate);
    
    return booking;
  }

  async assignSupirArmada(id: number, supirId: number, armadaId: number): Promise<Booking> {
    const booking = await this.findOne(id);
    booking.supirId = supirId;
    booking.armadaId = armadaId;
    
    return await this.bookingRepository.save(booking);
  }

  private async generateBookingCode(): Promise<string> {
    const prefix = 'BK';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `${prefix}${timestamp}${random}`;
  }

  async getBookingHistory(userId: number): Promise<Booking[]> {
    return await this.bookingRepository.find({
      where: { userId: userId },
      relations: ['paket', 'paketLuarKota', 'supir', 'armada'],
      order: { createdAt: 'DESC' }
    });
  }
}
