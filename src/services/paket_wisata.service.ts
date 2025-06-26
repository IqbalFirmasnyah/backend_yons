import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaketWisata } from '../database/entities/paket_wisata.entity';
import { CreatePaketWisataDto } from '../dto/create_paket_wisata.dto';
import { UpdatePaketWisataDto } from '../dto/update_paket_wisata.dto';

@Injectable()
export class PaketWisataService {
  constructor(
    @InjectRepository(PaketWisata)
    private readonly paketRepository: Repository<PaketWisata>,
  ) {}

  async create(createDto: CreatePaketWisataDto): Promise<PaketWisata> {
    const paket = this.paketRepository.create(createDto);
    return await this.paketRepository.save(paket);
  }

  async findAll(): Promise<PaketWisata[]> {
    return await this.paketRepository.find({
      relations: ['pesanan', 'booking'],
    });
  }

  async findOne(id: number): Promise<PaketWisata> {
    const paket = await this.paketRepository.findOne({
      where: { paketId: id },
      relations: ['pesanan', 'booking'],
    });

    if (!paket) {
      throw new NotFoundException(`Paket wisata dengan ID ${id} tidak ditemukan`);
    }

    return paket;
  }

  async update(id: number, updateDto: UpdatePaketWisataDto): Promise<PaketWisata> {
    const paket = await this.findOne(id);
    Object.assign(paket, updateDto);
    return await this.paketRepository.save(paket);
  }

  async delete(id: number): Promise<void> {
    const paket = await this.findOne(id);
    await this.paketRepository.remove(paket);
  }
}
