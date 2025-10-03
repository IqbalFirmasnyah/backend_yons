/*
  Warnings:

  - A unique constraint covering the columns `[booking_id]` on the table `pembayaran` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "pembayaran_booking_id_key" ON "pembayaran"("booking_id");
