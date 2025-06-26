import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notifikasi } from '../database/entities/notification.entity';
import { CreateNotifikasiDto } from '../dto/create_notifikasi.dto';
import { UpdateNotifikasiDto } from '../dto/update_notifikasi.dto';

@Injectable()
export class NotifikasiService {
  constructor(
    @InjectRepository(Notifikasi)
    private readonly notifikasiRepository: Repository<Notifikasi>,
  ) {}

  async create(createDto: CreateNotifikasiDto): Promise<Notifikasi> {
    const notifikasi = this.notifikasiRepository.create(createDto);
    return await this.notifikasiRepository.save(notifikasi);
  }

  async findAll(): Promise<Notifikasi[]> {
    return await this.notifikasiRepository.find({
      relations: ['user', 'admin', 'pesanan', 'pesananLuarKota', 'booking', 'refund'],
    });
  }

  async findOne(id: number): Promise<Notifikasi> {
    const notifikasi = await this.notifikasiRepository.findOne({
      where: { notifikasiId: id },
      relations: ['user', 'admin', 'pesanan', 'pesananLuarKota', 'booking', 'refund'],
    });

    if (!notifikasi) {
      throw new NotFoundException(`Notifikasi dengan ID ${id} tidak ditemukan`);
    }

    return notifikasi;
  }

  async update(id: number, updateDto: UpdateNotifikasiDto): Promise<Notifikasi> {
    const notifikasi = await this.findOne(id);
    Object.assign(notifikasi, updateDto);
    return await this.notifikasiRepository.save(notifikasi);
  }

  async markAsRead(id: number): Promise<Notifikasi> {
    const notifikasi = await this.findOne(id);
    notifikasi.isRead = true;
    return await this.notifikasiRepository.save(notifikasi);
  }

  async delete(id: number): Promise<void> {
    const notifikasi = await this.findOne(id);
    await this.notifikasiRepository.remove(notifikasi);
  }
}
