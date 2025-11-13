-- Add refund_status column to payments table (other refund columns already exist from migration 002)
ALTER TABLE `payments`
ADD COLUMN `refund_status` ENUM('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `refund_approved_at`;

-- Add index for refund status queries
ALTER TABLE `payments`
ADD INDEX `idx_refund_status` (`refund_status`);

-- Update payment_status enum to support partially_refunded (if not already present)
ALTER TABLE `payments` 
MODIFY COLUMN `payment_status` ENUM('pending','processing','completed','failed','refunded','partially_refunded') 
COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending';
