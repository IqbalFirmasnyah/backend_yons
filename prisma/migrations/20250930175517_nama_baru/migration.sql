/*
  Warnings:

  - You are about to drop the column `images` on the `paket_wisata_luar_kota` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "paket_wisata_luar_kota" DROP COLUMN "images",
ADD COLUMN     "fotoPaketLuar" TEXT[];
