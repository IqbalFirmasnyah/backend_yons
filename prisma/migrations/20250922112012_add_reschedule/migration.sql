-- CreateTable
CREATE TABLE "reschedule" (
    "reschedule_id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "tanggal_lama" TIMESTAMP(3) NOT NULL,
    "tanggal_baru" TIMESTAMP(3) NOT NULL,
    "alasan" TEXT NOT NULL,
    "status_reschedule" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reschedule_pkey" PRIMARY KEY ("reschedule_id")
);

-- AddForeignKey
ALTER TABLE "reschedule" ADD CONSTRAINT "reschedule_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"("booking_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reschedule" ADD CONSTRAINT "reschedule_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
