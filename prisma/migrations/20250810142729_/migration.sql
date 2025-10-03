-- AlterTable
ALTER TABLE "pembayaran" ADD COLUMN     "bookingId" INTEGER;

-- AddForeignKey
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("booking_id") ON DELETE SET NULL ON UPDATE CASCADE;
