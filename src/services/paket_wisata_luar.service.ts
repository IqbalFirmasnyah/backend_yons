import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaketWisataLuarKota } from '../database/entities/paket_wisata_luar.entity';
import { CreatePaketWisataLuarKotaDto } from '../dto/create_paket_wisata_luar.dto';
import { UpdatePaketWisataLuarKotaDto } from '../dto/update_paket_wisata_luar.dto';

@Injectable()
export class PaketWisataLuarKotaService {
  constructor(
    @InjectRepository(PaketWisataLuarKota)
    private readonly paketRepository: Repository<PaketWisataLuarKota>,
  ) {}

  async create(createDto: CreatePaketWisataLuarKotaDto): Promise<PaketWisataLuarKota> {
    const paket = this.paketRepository.create(createDto);
    return await this.paketRepository.save(paket);
  }

  async findAll(): Promise<PaketWisataLuarKota[]> {
    return await this.paketRepository.find({
      relations: ['detailRute', 'pesananLuarKota', 'booking'],
    });
  }

  async findOne(id: number): Promise<PaketWisataLuarKota> {
    const paket = await this.paketRepository.findOne({
      where: { paketLuarKotaId: id },
      relations: ['detailRute', 'pesananLuarKota', 'booking'],
    });

    if (!paket) {
      throw new NotFoundException(`Paket wisata dengan ID ${id} tidak ditemukan`);
    }

    return paket;
  }

  async update(id: number, updateDto: UpdatePaketWisataLuarKotaDto): Promise<PaketWisataLuarKota> {
    const paket = await this.findOne(id);
    Object.assign(paket, updateDto);
    return await this.paketRepository.save(paket);
  }

  async delete(id: number): Promise<void> {
    const paket = await this.findOne(id);
    await this.paketRepository.remove(paket);
  }
}
