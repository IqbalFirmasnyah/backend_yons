/*
  Warnings:

  - You are about to drop the column `pilih_date` on the `custom_rute_fasilitas` table. All the data in the column will be lost.
  - Added the required column `tanggal_mulai` to the `custom_rute_fasilitas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tanggal_selesai` to the `custom_rute_fasilitas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "custom_rute_fasilitas" DROP COLUMN "pilih_date",
ADD COLUMN     "tanggal_mulai" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "tanggal_selesai" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "dropoff" ALTER COLUMN "tanggal_selesai" SET DEFAULT CURRENT_TIMESTAMP;
