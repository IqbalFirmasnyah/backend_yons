-- CreateTable
CREATE TABLE "user" (
    "user_id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "nama_lengkap" VARCHAR(100) NOT NULL,
    "alamat" TEXT NOT NULL,
    "tanggal_lahir" DATE NOT NULL,
    "no_hp" VARCHAR(15) NOT NULL,
    "foto_profil" VARCHAR(255),
    "status_aktif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "admin" (
    "admin_id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "nama_lengkap" VARCHAR(100) NOT NULL,
    "foto_profil" VARCHAR(255),
    "role" VARCHAR(20) NOT NULL,
    "status_aktif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_pkey" PRIMARY KEY ("admin_id")
);

-- CreateTable
CREATE TABLE "armada" (
    "armada_id" SERIAL NOT NULL,
    "jenis_mobil" VARCHAR(50) NOT NULL,
    "merk_mobil" VARCHAR(50) NOT NULL,
    "plat_nomor" VARCHAR(15) NOT NULL,
    "kapasitas" INTEGER NOT NULL,
    "tahun_kendaraan" INTEGER NOT NULL,
    "status_armada" VARCHAR(20) NOT NULL,
    "foto_armada" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "armada_pkey" PRIMARY KEY ("armada_id")
);

-- CreateTable
CREATE TABLE "supir" (
    "supir_id" SERIAL NOT NULL,
    "nama" VARCHAR(100) NOT NULL,
    "alamat" TEXT NOT NULL,
    "nomor_hp" VARCHAR(15) NOT NULL,
    "nomor_sim" VARCHAR(20) NOT NULL,
    "foto_supir" VARCHAR(255),
    "pengalaman_tahun" INTEGER NOT NULL,
    "rating_rata" DECIMAL(3,2),
    "status_supir" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supir_pkey" PRIMARY KEY ("supir_id")
);

-- CreateTable
CREATE TABLE "paket_wisata" (
    "paket_id" SERIAL NOT NULL,
    "nama_paket" VARCHAR(100) NOT NULL,
    "nama_tempat" VARCHAR(100) NOT NULL,
    "lokasi" VARCHAR(200) NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "itinerary" TEXT NOT NULL,
    "jarak_km" INTEGER NOT NULL,
    "durasi_hari" INTEGER NOT NULL,
    "harga" DECIMAL(12,2) NOT NULL,
    "foto_paket" VARCHAR(255),
    "kategori" VARCHAR(20) NOT NULL,
    "status_paket" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paket_wisata_pkey" PRIMARY KEY ("paket_id")
);

-- CreateTable
CREATE TABLE "pesanan" (
    "pesanan_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "paket_id" INTEGER NOT NULL,
    "supir_id" INTEGER NOT NULL,
    "armada_id" INTEGER NOT NULL,
    "tanggal_pesan" TIMESTAMP(3) NOT NULL,
    "tanggal_mulai_wisata" TIMESTAMP(3) NOT NULL,
    "tanggal_selesai_wisata" TIMESTAMP(3) NOT NULL,
    "jumlah_peserta" INTEGER NOT NULL,
    "total_harga" DECIMAL(12,2) NOT NULL,
    "status_pesanan" VARCHAR(20) NOT NULL,
    "catatan_khusus" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pesanan_pkey" PRIMARY KEY ("pesanan_id")
);

-- CreateTable
CREATE TABLE "paket_wisata_luar_kota" (
    "paket_luar_kota_id" SERIAL NOT NULL,
    "nama_paket" VARCHAR(100) NOT NULL,
    "tujuan_utama" VARCHAR(100) NOT NULL,
    "total_jarak_km" INTEGER NOT NULL,
    "estimasi_durasi" INTEGER NOT NULL,
    "harga_estimasi" DECIMAL(12,2) NOT NULL,
    "status_paket" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paket_wisata_luar_kota_pkey" PRIMARY KEY ("paket_luar_kota_id")
);

-- CreateTable
CREATE TABLE "detail_rute_luar_kota" (
    "rute_id" SERIAL NOT NULL,
    "paket_luar_kota_id" INTEGER NOT NULL,
    "urutan_ke" INTEGER NOT NULL,
    "nama_destinasi" VARCHAR(100) NOT NULL,
    "alamat_destinasi" TEXT NOT NULL,
    "jarak_dari_sebelumnya_km" INTEGER NOT NULL,
    "estimasi_waktu_tempuh" INTEGER NOT NULL,
    "waktu_kunjungan_menit" INTEGER NOT NULL,
    "deskripsi_singkat" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "detail_rute_luar_kota_pkey" PRIMARY KEY ("rute_id")
);

-- CreateTable
CREATE TABLE "pesanan_luar_kota" (
    "pesanan_luar_kota_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "paket_luar_kota_id" INTEGER NOT NULL,
    "supir_id" INTEGER NOT NULL,
    "armada_id" INTEGER NOT NULL,
    "input_tujuan_user" TEXT,
    "tanggal_pesan" TIMESTAMP(3) NOT NULL,
    "tanggal_mulai_wisata" TIMESTAMP(3) NOT NULL,
    "tanggal_selesai_wisata" TIMESTAMP(3) NOT NULL,
    "jumlah_peserta" INTEGER NOT NULL,
    "total_harga_final" DECIMAL(12,2) NOT NULL,
    "status_pesanan" VARCHAR(20) NOT NULL,
    "catatan_khusus" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pesanan_luar_kota_pkey" PRIMARY KEY ("pesanan_luar_kota_id")
);

-- CreateTable
CREATE TABLE "assignment_supir_armada" (
    "assignment_id" SERIAL NOT NULL,
    "supir_id" INTEGER NOT NULL,
    "armada_id" INTEGER NOT NULL,
    "tanggal_mulai_assignment" TIMESTAMP(3) NOT NULL,
    "tanggal_selesai_assignment" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignment_supir_armada_pkey" PRIMARY KEY ("assignment_id")
);

-- CreateTable
CREATE TABLE "notifikasi" (
    "notifikasi_id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "admin_id" INTEGER,
    "pesanan_id" INTEGER,
    "pesanan_luar_kota_id" INTEGER,
    "tipe_notifikasi" VARCHAR(50) NOT NULL,
    "judul_notifikasi" VARCHAR(200) NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "tanggal_notifikasi" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifikasi_pkey" PRIMARY KEY ("notifikasi_id")
);

-- CreateTable
CREATE TABLE "pembayaran" (
    "pembayaran_id" SERIAL NOT NULL,
    "pesanan_id" INTEGER,
    "pesanan_luar_kota_id" INTEGER,
    "user_id" INTEGER NOT NULL,
    "metode_pembayaran" VARCHAR(20) NOT NULL,
    "jumlah_bayar" DECIMAL(12,2) NOT NULL,
    "tanggal_pembayaran" TIMESTAMP(3) NOT NULL,
    "bukti_pembayaran" VARCHAR(255),
    "status_pembayaran" VARCHAR(20) NOT NULL,
    "verified_by_admin_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pembayaran_pkey" PRIMARY KEY ("pembayaran_id")
);

-- CreateTable
CREATE TABLE "booking" (
    "booking_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "paket_id" INTEGER,
    "paket_luar_kota_id" INTEGER,
    "supir_id" INTEGER,
    "armada_id" INTEGER,
    "kode_booking" VARCHAR(20) NOT NULL,
    "tanggal_booking" TIMESTAMP(3) NOT NULL,
    "tanggal_mulai_wisata" TIMESTAMP(3) NOT NULL,
    "tanggal_selesai_wisata" TIMESTAMP(3) NOT NULL,
    "jumlah_peserta" INTEGER NOT NULL,
    "estimasi_harga" DECIMAL(12,2) NOT NULL,
    "input_custom_tujuan" TEXT,
    "status_booking" VARCHAR(30) NOT NULL,
    "catatan_khusus" TEXT,
    "expired_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_pkey" PRIMARY KEY ("booking_id")
);

-- CreateTable
CREATE TABLE "update_status_booking" (
    "update_id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "status_lama" VARCHAR(30) NOT NULL,
    "status_baru" VARCHAR(30) NOT NULL,
    "updated_by_user_id" INTEGER,
    "updated_by_admin_id" INTEGER,
    "keterangan" TEXT,
    "timestamp_update" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "update_status_booking_pkey" PRIMARY KEY ("update_id")
);

-- CreateTable
CREATE TABLE "refund" (
    "refund_id" SERIAL NOT NULL,
    "pesanan_id" INTEGER,
    "pesanan_luar_kota_id" INTEGER,
    "booking_id" INTEGER,
    "pembayaran_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "kode_refund" VARCHAR(20) NOT NULL,
    "alasan_refund" TEXT NOT NULL,
    "jumlah_refund" DECIMAL(12,2) NOT NULL,
    "jumlah_potongan_admin" DECIMAL(12,2) NOT NULL,
    "jumlah_refund_final" DECIMAL(12,2) NOT NULL,
    "metode_refund" VARCHAR(20) NOT NULL,
    "rekening_tujuan" TEXT,
    "status_refund" VARCHAR(20) NOT NULL,
    "tanggal_pengajuan" TIMESTAMP(3) NOT NULL,
    "tanggal_disetujui" TIMESTAMP(3),
    "tanggal_refund_selesai" TIMESTAMP(3),
    "approved_by_admin_id" INTEGER,
    "processed_by_admin_id" INTEGER,
    "bukti_refund" VARCHAR(255),
    "catatan_admin" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refund_pkey" PRIMARY KEY ("refund_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admin_username_key" ON "admin"("username");

-- CreateIndex
CREATE UNIQUE INDEX "admin_email_key" ON "admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "armada_plat_nomor_key" ON "armada"("plat_nomor");

-- CreateIndex
CREATE UNIQUE INDEX "booking_kode_booking_key" ON "booking"("kode_booking");

-- CreateIndex
CREATE UNIQUE INDEX "refund_kode_refund_key" ON "refund"("kode_refund");

-- AddForeignKey
ALTER TABLE "pesanan" ADD CONSTRAINT "pesanan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pesanan" ADD CONSTRAINT "pesanan_paket_id_fkey" FOREIGN KEY ("paket_id") REFERENCES "paket_wisata"("paket_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pesanan" ADD CONSTRAINT "pesanan_supir_id_fkey" FOREIGN KEY ("supir_id") REFERENCES "supir"("supir_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pesanan" ADD CONSTRAINT "pesanan_armada_id_fkey" FOREIGN KEY ("armada_id") REFERENCES "armada"("armada_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_rute_luar_kota" ADD CONSTRAINT "detail_rute_luar_kota_paket_luar_kota_id_fkey" FOREIGN KEY ("paket_luar_kota_id") REFERENCES "paket_wisata_luar_kota"("paket_luar_kota_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pesanan_luar_kota" ADD CONSTRAINT "pesanan_luar_kota_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pesanan_luar_kota" ADD CONSTRAINT "pesanan_luar_kota_paket_luar_kota_id_fkey" FOREIGN KEY ("paket_luar_kota_id") REFERENCES "paket_wisata_luar_kota"("paket_luar_kota_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pesanan_luar_kota" ADD CONSTRAINT "pesanan_luar_kota_supir_id_fkey" FOREIGN KEY ("supir_id") REFERENCES "supir"("supir_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pesanan_luar_kota" ADD CONSTRAINT "pesanan_luar_kota_armada_id_fkey" FOREIGN KEY ("armada_id") REFERENCES "armada"("armada_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_supir_armada" ADD CONSTRAINT "assignment_supir_armada_supir_id_fkey" FOREIGN KEY ("supir_id") REFERENCES "supir"("supir_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_supir_armada" ADD CONSTRAINT "assignment_supir_armada_armada_id_fkey" FOREIGN KEY ("armada_id") REFERENCES "armada"("armada_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin"("admin_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_pesanan_id_fkey" FOREIGN KEY ("pesanan_id") REFERENCES "pesanan"("pesanan_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_pesanan_luar_kota_id_fkey" FOREIGN KEY ("pesanan_luar_kota_id") REFERENCES "pesanan_luar_kota"("pesanan_luar_kota_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_pesanan_id_fkey" FOREIGN KEY ("pesanan_id") REFERENCES "pesanan"("pesanan_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_pesanan_luar_kota_id_fkey" FOREIGN KEY ("pesanan_luar_kota_id") REFERENCES "pesanan_luar_kota"("pesanan_luar_kota_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_verified_by_admin_id_fkey" FOREIGN KEY ("verified_by_admin_id") REFERENCES "admin"("admin_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_paket_id_fkey" FOREIGN KEY ("paket_id") REFERENCES "paket_wisata"("paket_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_paket_luar_kota_id_fkey" FOREIGN KEY ("paket_luar_kota_id") REFERENCES "paket_wisata_luar_kota"("paket_luar_kota_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_supir_id_fkey" FOREIGN KEY ("supir_id") REFERENCES "supir"("supir_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_armada_id_fkey" FOREIGN KEY ("armada_id") REFERENCES "armada"("armada_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "update_status_booking" ADD CONSTRAINT "update_status_booking_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"("booking_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "update_status_booking" ADD CONSTRAINT "update_status_booking_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "update_status_booking" ADD CONSTRAINT "update_status_booking_updated_by_admin_id_fkey" FOREIGN KEY ("updated_by_admin_id") REFERENCES "admin"("admin_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund" ADD CONSTRAINT "refund_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund" ADD CONSTRAINT "refund_pesanan_id_fkey" FOREIGN KEY ("pesanan_id") REFERENCES "pesanan"("pesanan_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund" ADD CONSTRAINT "refund_pesanan_luar_kota_id_fkey" FOREIGN KEY ("pesanan_luar_kota_id") REFERENCES "pesanan_luar_kota"("pesanan_luar_kota_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund" ADD CONSTRAINT "refund_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"("booking_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund" ADD CONSTRAINT "refund_pembayaran_id_fkey" FOREIGN KEY ("pembayaran_id") REFERENCES "pembayaran"("pembayaran_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund" ADD CONSTRAINT "refund_approved_by_admin_id_fkey" FOREIGN KEY ("approved_by_admin_id") REFERENCES "admin"("admin_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund" ADD CONSTRAINT "refund_processed_by_admin_id_fkey" FOREIGN KEY ("processed_by_admin_id") REFERENCES "admin"("admin_id") ON DELETE SET NULL ON UPDATE CASCADE;
