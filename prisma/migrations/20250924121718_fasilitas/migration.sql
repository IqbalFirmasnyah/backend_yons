/*
  Warnings:

  - You are about to drop the column `fasilitas_id` on the `paket_wisata_luar_kota` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "paket_wisata_luar_kota" DROP CONSTRAINT "paket_wisata_luar_kota_fasilitas_id_fkey";

-- AlterTable
ALTER TABLE "paket_wisata_luar_kota" DROP COLUMN "fasilitas_id";

-- AddForeignKey
ALTER TABLE "fasilitas" ADD CONSTRAINT "fasilitas_paket_luar_kota_id_fkey" FOREIGN KEY ("paket_luar_kota_id") REFERENCES "paket_wisata_luar_kota"("paket_luar_kota_id") ON DELETE SET NULL ON UPDATE CASCADE;
