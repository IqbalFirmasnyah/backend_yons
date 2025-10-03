-- DropForeignKey
ALTER TABLE "fasilitas" DROP CONSTRAINT "fasilitas_paket_luar_kota_id_fkey";

-- AlterTable
ALTER TABLE "paket_wisata_luar_kota" ADD COLUMN     "fasilitas_id" INTEGER;

-- AddForeignKey
ALTER TABLE "paket_wisata_luar_kota" ADD CONSTRAINT "paket_wisata_luar_kota_fasilitas_id_fkey" FOREIGN KEY ("fasilitas_id") REFERENCES "fasilitas"("fasilitas_id") ON DELETE SET NULL ON UPDATE CASCADE;
