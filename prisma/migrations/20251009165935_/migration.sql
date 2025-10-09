/*
  Warnings:

  - You are about to alter the column `harga_estimasi` on the `dropoff` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(12,0)`.

*/
-- AlterTable
ALTER TABLE "dropoff" ALTER COLUMN "harga_estimasi" SET DATA TYPE DECIMAL(12,0);
