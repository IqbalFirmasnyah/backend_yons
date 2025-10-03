-- DropForeignKey
ALTER TABLE "pesanan_luar_kota" DROP CONSTRAINT "pesanan_luar_kota_paket_luar_kota_id_fkey";

-- AlterTable
ALTER TABLE "booking" ADD COLUMN     "fasilitas_id" INTEGER;

-- AlterTable
ALTER TABLE "pesanan_luar_kota" ADD COLUMN     "fasilitas_id" INTEGER,
ALTER COLUMN "paket_luar_kota_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "pesanan_luar_kota" ADD CONSTRAINT "pesanan_luar_kota_paket_luar_kota_id_fkey" FOREIGN KEY ("paket_luar_kota_id") REFERENCES "paket_wisata_luar_kota"("paket_luar_kota_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pesanan_luar_kota" ADD CONSTRAINT "pesanan_luar_kota_fasilitas_id_fkey" FOREIGN KEY ("fasilitas_id") REFERENCES "fasilitas"("fasilitas_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_fasilitas_id_fkey" FOREIGN KEY ("fasilitas_id") REFERENCES "fasilitas"("fasilitas_id") ON DELETE SET NULL ON UPDATE CASCADE;
