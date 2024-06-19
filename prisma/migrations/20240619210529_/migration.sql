-- AlterTable
ALTER TABLE `ReservationHistory` MODIFY `status` ENUM('reserved', 'canceled') NOT NULL DEFAULT 'reserved';
