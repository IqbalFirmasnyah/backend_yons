import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pesanan } from '../database/entities/pesanan.entity';
import { CreatePesananDto } from '../dto/create_pesanan.dto';
import { UpdatePesananDto } from '../dto/update_pesanan.dto';

@Injectable()
export class PesananService {
  constructor(
    @InjectRepository(Pesanan)
    private readonly pesananRepository: Repository<Pesanan>,
  ) {}

  async create(createDto: CreatePesananDto): Promise<Pesanan> {
    const pesanan = this.pesananRepository.create(createDto);
    return await this.pesananRepository.save(pesanan);
  }

  async findAll(): Promise<Pesanan[]> {
    return await this.pesananRepository.find({
      relations: ['user', 'paket', 'supir', 'armada', 'booking', 'pembayaran', 'refund', 'notifikasi'],
    });
  }

  async findOne(id: number): Promise<Pesanan> {
    const pesanan = await this.pesananRepository.findOne({
      where: { pesananId: id },
      relations: ['user', 'paket', 'supir', 'armada', 'booking', 'pembayaran', 'refund', 'notifikasi'],
    });

    if (!pesanan) {
      throw new NotFoundException(`Pesanan dengan ID ${id} tidak ditemukan`);
    }

    return pesanan;
  }

  async update(id: number, updateDto: UpdatePesananDto): Promise<Pesanan> {
    const pesanan = await this.findOne(id);
    Object.assign(pesanan, updateDto);
    return await this.pesananRepository.save(pesanan);
  }

  async delete(id: number): Promise<void> {
    const pesanan = await this.findOne(id);
    await this.pesananRepository.remove(pesanan);
  }
}
