-- AlterTable
ALTER TABLE `Spot` MODIFY `status` ENUM('available', 'reserved') NOT NULL DEFAULT 'available';
