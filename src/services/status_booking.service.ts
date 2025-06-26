import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateStatusBooking } from '../database/entities/update_status_booking.entity';
import { CreateUpdateStatusBookingDto } from '../dto/create_status_booking.dto';
import { UpdateUpdateStatusBookingDto } from '../dto/update_status_booking.dto';

@Injectable()
export class UpdateStatusBookingService {
  constructor(
    @InjectRepository(UpdateStatusBooking)
    private readonly updateStatusBookingRepository: Repository<UpdateStatusBooking>,
  ) {}

  async create(createDto: CreateUpdateStatusBookingDto): Promise<UpdateStatusBooking> {
    const updateStatusBooking = this.updateStatusBookingRepository.create(createDto);
    return await this.updateStatusBookingRepository.save(updateStatusBooking);
  }

  async findAll(): Promise<UpdateStatusBooking[]> {
    return await this.updateStatusBookingRepository.find({
      relations: ['booking', 'updatedBy', 'updatedByAdmin'],
    });
  }

  async findOne(id: number): Promise<UpdateStatusBooking> {
    const updateStatusBooking = await this.updateStatusBookingRepository.findOne({
      where: { updateId: id },
      relations: ['booking', 'updatedBy', 'updatedByAdmin'],
    });

    if (!updateStatusBooking) {
      throw new NotFoundException(`Update status booking dengan ID ${id} tidak ditemukan`);
    }

    return updateStatusBooking;
  }

  async update(id: number, updateDto: UpdateUpdateStatusBookingDto): Promise<UpdateStatusBooking> {
    const updateStatusBooking = await this.findOne(id);
    Object.assign(updateStatusBooking, updateDto);
    return await this.updateStatusBookingRepository.save(updateStatusBooking);
  }

  async delete(id: number): Promise<void> {
    const updateStatusBooking = await this.findOne(id);
    await this.updateStatusBookingRepository.remove(updateStatusBooking);
  }
}
