/*
  Warnings:

  - You are about to drop the column `tanggal_layanan` on the `dropoff` table. All the data in the column will be lost.
  - Added the required column `tanggal_selesai` to the `dropoff` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "dropoff" DROP COLUMN "tanggal_layanan",
ADD COLUMN     "tanggal_mulai" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "tanggal_selesai" TIMESTAMP(3) NOT NULL;
