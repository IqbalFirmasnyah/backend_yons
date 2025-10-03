/*
  Warnings:

  - Made the column `supir_id` on table `booking` required. This step will fail if there are existing NULL values in that column.
  - Made the column `armada_id` on table `booking` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "booking" ALTER COLUMN "supir_id" SET NOT NULL,
ALTER COLUMN "armada_id" SET NOT NULL;

-- CreateTable
CREATE TABLE "fasilitas" (
    "fasilitas_id" SERIAL NOT NULL,
    "jenisFasilitas" VARCHAR(30) NOT NULL,
    "namaFasilitas" VARCHAR(100) NOT NULL,
    "deskripsi" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "paket_luar_kota_id" INTEGER,

    CONSTRAINT "fasilitas_pkey" PRIMARY KEY ("fasilitas_id")
);

-- CreateTable
CREATE TABLE "custom_rute_fasilitas" (
    "custom_rute_id" SERIAL NOT NULL,
    "fasilitas_id" INTEGER NOT NULL,
    "tujuan_list" TEXT NOT NULL,
    "total_jarak_km" INTEGER NOT NULL,
    "estimasi_durasi" INTEGER NOT NULL,
    "harga_estimasi" DECIMAL(12,2) NOT NULL,
    "catatan_khusus" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_rute_fasilitas_pkey" PRIMARY KEY ("custom_rute_id")
);

-- CreateTable
CREATE TABLE "dropoff" (
    "dropoff_id" SERIAL NOT NULL,
    "fasilitas_id" INTEGER NOT NULL,
    "nama_tujuan" VARCHAR(100) NOT NULL,
    "alamat_tujuan" TEXT NOT NULL,
    "jarak_km" INTEGER NOT NULL,
    "estimasi_durasi" INTEGER NOT NULL,
    "harga_estimasi" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dropoff_pkey" PRIMARY KEY ("dropoff_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fasilitas_paket_luar_kota_id_key" ON "fasilitas"("paket_luar_kota_id");

-- CreateIndex
CREATE UNIQUE INDEX "custom_rute_fasilitas_fasilitas_id_key" ON "custom_rute_fasilitas"("fasilitas_id");

-- CreateIndex
CREATE UNIQUE INDEX "dropoff_fasilitas_id_key" ON "dropoff"("fasilitas_id");

-- AddForeignKey
ALTER TABLE "fasilitas" ADD CONSTRAINT "fasilitas_paket_luar_kota_id_fkey" FOREIGN KEY ("paket_luar_kota_id") REFERENCES "paket_wisata_luar_kota"("paket_luar_kota_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_rute_fasilitas" ADD CONSTRAINT "custom_rute_fasilitas_fasilitas_id_fkey" FOREIGN KEY ("fasilitas_id") REFERENCES "fasilitas"("fasilitas_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dropoff" ADD CONSTRAINT "dropoff_fasilitas_id_fkey" FOREIGN KEY ("fasilitas_id") REFERENCES "fasilitas"("fasilitas_id") ON DELETE CASCADE ON UPDATE CASCADE;
