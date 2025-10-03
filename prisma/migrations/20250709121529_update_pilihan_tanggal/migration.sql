/*
  Warnings:

  - Added the required column `pilih_date` to the `custom_rute_fasilitas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "custom_rute_fasilitas" ADD COLUMN     "pilih_date" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "dropoff" ADD COLUMN     "tanggal_layanan" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "paket_wisata" ADD COLUMN     "pilih_tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "paket_wisata_luar_kota" ADD COLUMN     "date_pick" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
