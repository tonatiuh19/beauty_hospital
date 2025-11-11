-- Migration: Add booked_for_self field to appointments table
-- This field tracks whether the appointment was booked by the user for themselves
-- or for someone else

ALTER TABLE `appointments`
ADD COLUMN `booked_for_self` TINYINT(1) NOT NULL DEFAULT 1 
COMMENT 'Whether appointment is for the logged-in user (1) or someone else (0)'
AFTER `created_by`;

-- Add index for better query performance
ALTER TABLE `appointments`
ADD INDEX `idx_booked_for_self` (`booked_for_self`);

-- Update existing appointments to assume they are for self
UPDATE `appointments` SET `booked_for_self` = 1 WHERE `booked_for_self` IS NULL;
