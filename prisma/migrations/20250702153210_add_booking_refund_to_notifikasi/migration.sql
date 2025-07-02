-- AlterTable
ALTER TABLE "notifikasi" ADD COLUMN     "booking_id" INTEGER,
ADD COLUMN     "refund_id" INTEGER;

-- AddForeignKey
ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"("booking_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_refund_id_fkey" FOREIGN KEY ("refund_id") REFERENCES "refund"("refund_id") ON DELETE CASCADE ON UPDATE CASCADE;
