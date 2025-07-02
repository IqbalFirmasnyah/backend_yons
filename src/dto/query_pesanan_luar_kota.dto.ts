import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsIn } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class QueryPesananLuarKotaDto {
  @ApiProperty({ description: 'Page number', required: false, default: 1 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', required: false, default: 10 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number = 10;

  @ApiProperty({ description: 'Search by nama paket', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ 
    description: 'Filter by status', 
    enum: ['pending', 'confirmed', 'ongoing', 'completed', 'cancelled'],
    required: false 
  })
  @IsOptional()
  @IsString()
  @IsIn(['pending', 'confirmed', 'ongoing', 'completed', 'cancelled'])
  status?: string;

  @ApiProperty({ description: 'Filter by user ID', required: false })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  userId?: number;

  @ApiProperty({ description: 'Filter by supir ID', required: false })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  supirId?: number;

  @ApiProperty({ description: 'Filter by armada ID', required: false })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  armadaId?: number;

  @ApiProperty({ description: 'Sort by field', required: false, default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiProperty({ description: 'Sort order', enum: ['asc', 'desc'], required: false, default: 'desc' })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}