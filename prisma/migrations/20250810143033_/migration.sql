/*
  Warnings:

  - You are about to drop the column `bookingId` on the `pembayaran` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "pembayaran" DROP CONSTRAINT "pembayaran_bookingId_fkey";

-- AlterTable
ALTER TABLE "pembayaran" DROP COLUMN "bookingId",
ADD COLUMN     "booking_id" INTEGER;

-- AddForeignKey
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"("booking_id") ON DELETE SET NULL ON UPDATE CASCADE;
