-- Migration to add additional fields to medical_records table
-- This adds visit_date, prescriptions, and files fields for better medical record management

-- Check if columns exist before adding them
SET @dbname = DATABASE();
SET @tablename = 'medical_records';
SET @columnname = 'visit_date';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @dbname
   AND TABLE_NAME = @tablename
   AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  'ALTER TABLE `medical_records` ADD COLUMN `visit_date` DATE NOT NULL AFTER `appointment_id`'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'prescriptions';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @dbname
   AND TABLE_NAME = @tablename
   AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  'ALTER TABLE `medical_records` ADD COLUMN `prescriptions` TEXT COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `medications`'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @columnname = 'files';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @dbname
   AND TABLE_NAME = @tablename
   AND COLUMN_NAME = @columnname) > 0,
  'SELECT 1',
  'ALTER TABLE `medical_records` ADD COLUMN `files` JSON DEFAULT NULL COMMENT ''Array of file URLs/paths'' AFTER `prescriptions`'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Update existing records to set visit_date from created_at (only if visit_date is NULL)
UPDATE `medical_records` SET `visit_date` = DATE(`created_at`) WHERE `visit_date` IS NULL OR `visit_date` = '0000-00-00';
