-- DropForeignKey
ALTER TABLE "booking" DROP CONSTRAINT "booking_armada_id_fkey";

-- DropForeignKey
ALTER TABLE "booking" DROP CONSTRAINT "booking_supir_id_fkey";

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_supir_id_fkey" FOREIGN KEY ("supir_id") REFERENCES "supir"("supir_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_armada_id_fkey" FOREIGN KEY ("armada_id") REFERENCES "armada"("armada_id") ON DELETE CASCADE ON UPDATE CASCADE;
