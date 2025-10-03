// import { Injectable, NotFoundException } from '@nestjs/common';
// import { PrismaService } from 'src/prisma/prisma.service';
// import { CreateUpdateStatusBookingDto } from '../dto/create_status_booking.dto';
// import { UpdateUpdateStatusBookingDto } from '../dto/update_status_booking.dto';

// @Injectable()
// export class UpdateStatusBookingService {
//   constructor(private readonly prisma: PrismaService) {}

//   async create(createDto: CreateUpdateStatusBookingDto) {
//     return await this.prisma.updateStatusBooking.create({
//       data: {
//         bookingId: createDto.bookingId,
//         statusLama: createDto.statusLama,
//         statusBaru: createDto.statusBaru,
//         updatedByUserId: createDto.updatedByUserId,
//         updatedByAdminId: createDto.updatedByAdminId,
//         keterangan: createDto.keterangan,
//         timestampUpdate: new Date(createDto.timestampUpdate),
//       },
//     });
//   }

//   async findAll() {
//     return await this.prisma.updateStatusBooking.findMany({
//       include: {
//         booking: true,
//         updatedByUser: true,
//         updatedByAdmin: true,
//       },
//     });
//   }

//   async findOne(id: number) {
//     const result = await this.prisma.updateStatusBooking.findUnique({
//       where: { updateId: id },
//       include: {
//         booking: true,
//         updatedByUser: true,
//         updatedByAdmin: true,
//       },
//     });

//     if (!result) {
//       throw new NotFoundException(`Update status booking dengan ID ${id} tidak ditemukan`);
//     }

//     return result;
//   }

//   async update(id: number, updateDto: UpdateUpdateStatusBookingDto) {
//     await this.findOne(id); // cek dulu ada/tidak

//     return await this.prisma.updateStatusBooking.update({
//       where: { updateId: id },
//       data: {
//         ...updateDto,
//         timestampUpdate: updateDto.timestampUpdate
//           ? new Date(updateDto.timestampUpdate)
//           : undefined,
//       },
//     });
//   }

//   async delete(id: number) {
//     await this.findOne(id); // cek dulu
//     await this.prisma.updateStatusBooking.delete({
//       where: { updateId: id },
//     });
//   }
// }
