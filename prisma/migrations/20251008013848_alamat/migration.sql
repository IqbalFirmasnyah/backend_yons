/*
  Warnings:

  - Added the required column `alamat_jemputan` to the `dropoff` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "dropoff" ADD COLUMN     "alamat_jemputan" VARCHAR(100) NOT NULL;
