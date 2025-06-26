import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supir } from '../database/entities/supir.entity';
import { CreateSupirDto } from '../dto/create_supir.dto';
import { UpdateSupirDto } from '../dto/update_supir.dto';

@Injectable()
export class SupirService {
  constructor(
    @InjectRepository(Supir)
    private readonly supirRepository: Repository<Supir>,
  ) {}

  async create(createDto: CreateSupirDto): Promise<Supir> {
    const supir = this.supirRepository.create(createDto);
    return await this.supirRepository.save(supir);
  }

  async findAll(): Promise<Supir[]> {
    return await this.supirRepository.find({
      relations: ['pesanan', 'pesananLuarKota', 'booking', 'assignments'],
    });
  }

  async findOne(id: number): Promise<Supir> {
    const supir = await this.supirRepository.findOne({
      where: { supirId: id },
      relations: ['pesanan', 'pesananLuarKota', 'booking', 'assignments'],
    });

    if (!supir) {
      throw new NotFoundException(`Supir dengan ID ${id} tidak ditemukan`);
    }

    return supir;
  }

  async update(id: number, updateDto: UpdateSupirDto): Promise<Supir> {
    const supir = await this.findOne(id);
    Object.assign(supir, updateDto);
    return await this.supirRepository.save(supir);
  }

  async delete(id: number): Promise<void> {
    const supir = await this.findOne(id);
    await this.supirRepository.remove(supir);
  }
}
