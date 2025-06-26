import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PesananLuarKota } from '../database/entities/pesanan_luar_kota.entity';
import { CreatePesananLuarKotaDto } from '../dto/create_pesanan_luar_kota.dto';
import { UpdatePesananLuarKotaDto } from '../dto/update_pesanan_luar_kota.dto';

@Injectable()
export class PesananLuarKotaService {
  constructor(
    @InjectRepository(PesananLuarKota)
    private readonly pesananRepository: Repository<PesananLuarKota>,
  ) {}

  async create(createDto: CreatePesananLuarKotaDto): Promise<PesananLuarKota> {
    const pesanan = this.pesananRepository.create(createDto);
    return await this.pesananRepository.save(pesanan);
  }

  async findAll(): Promise<PesananLuarKota[]> {
    return await this.pesananRepository.find({
      relations: ['user', 'paketLuarKota', 'supir', 'armada', 'booking', 'pembayaran', 'refund', 'notifikasi'],
    });
  }

  async findOne(id: number): Promise<PesananLuarKota> {
    const pesanan = await this.pesananRepository.findOne({
      where: { pesananLuarKotaId: id },
      relations: ['user', 'paketLuarKota', 'supir', 'armada', 'booking', 'pembayaran', 'refund', 'notifikasi'],
    });

    if (!pesanan) {
      throw new NotFoundException(`Pesanan luar kota dengan ID ${id} tidak ditemukan`);
    }

    return pesanan;
  }

  async update(id: number, updateDto: UpdatePesananLuarKotaDto): Promise<PesananLuarKota> {
    const pesanan = await this.findOne(id);
    Object.assign(pesanan, updateDto);
    return await this.pesananRepository.save(pesanan);
  }

  async delete(id: number): Promise<void> {
    const pesanan = await this.findOne(id);
    await this.pesananRepository.remove(pesanan);
  }
}
