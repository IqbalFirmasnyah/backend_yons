/*
  Warnings:

  - You are about to drop the column `date_pick` on the `paket_wisata_luar_kota` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "paket_wisata_luar_kota" DROP COLUMN "date_pick",
ADD COLUMN     "pilih_tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
