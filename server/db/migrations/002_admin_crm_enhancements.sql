-- Migration for Admin CRM Enhancement
-- This migration adds necessary tables and columns for the admin CRM system

-- Update users table role enum to include all admin roles
ALTER TABLE `users` 
MODIFY `role` enum('admin','general_admin','receptionist','doctor','pos','patient') 
COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'patient';

-- Add profile picture and additional fields to users table for admin profiles
ALTER TABLE `users`
ADD COLUMN `profile_picture_url` TEXT COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `phone`,
ADD COLUMN `specialization` VARCHAR(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'For doctors' AFTER `profile_picture_url`,
ADD COLUMN `employee_id` VARCHAR(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Employee identification number' AFTER `specialization`,
ADD COLUMN `is_email_verified` TINYINT(1) DEFAULT 0 AFTER `is_active`;

-- Create coupons table for promotional codes
CREATE TABLE IF NOT EXISTS `coupons` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` TEXT COLLATE utf8mb4_unicode_ci,
  `discount_type` ENUM('percentage','fixed_amount') COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_value` DECIMAL(10,2) NOT NULL,
  `min_purchase_amount` DECIMAL(10,2) DEFAULT NULL,
  `max_discount_amount` DECIMAL(10,2) DEFAULT NULL COMMENT 'Max discount for percentage type',
  `usage_limit` INT(11) DEFAULT NULL COMMENT 'Total times this coupon can be used',
  `usage_count` INT(11) DEFAULT 0 COMMENT 'Times this coupon has been used',
  `per_user_limit` INT(11) DEFAULT NULL COMMENT 'Max uses per user',
  `valid_from` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `valid_until` TIMESTAMP NULL DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `applicable_services` JSON DEFAULT NULL COMMENT 'Array of service IDs or null for all',
  `created_by` INT(11) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_code` (`code`),
  KEY `idx_code` (`code`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_valid_dates` (`valid_from`, `valid_until`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `coupons_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create coupon_usage table to track coupon usage
CREATE TABLE IF NOT EXISTS `coupon_usage` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `coupon_id` INT(11) NOT NULL,
  `patient_id` INT(11) NOT NULL,
  `appointment_id` INT(11) DEFAULT NULL,
  `payment_id` INT(11) DEFAULT NULL,
  `discount_amount` DECIMAL(10,2) NOT NULL,
  `used_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_coupon_id` (`coupon_id`),
  KEY `idx_patient_id` (`patient_id`),
  KEY `idx_appointment_id` (`appointment_id`),
  KEY `idx_payment_id` (`payment_id`),
  CONSTRAINT `coupon_usage_ibfk_1` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE CASCADE,
  CONSTRAINT `coupon_usage_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `coupon_usage_ibfk_3` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `coupon_usage_ibfk_4` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add fields to appointments table for better admin management
ALTER TABLE `appointments`
ADD COLUMN `check_in_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'When patient checked in' AFTER `updated_at`,
ADD COLUMN `check_in_by` INT(11) DEFAULT NULL COMMENT 'Admin who checked in the patient' AFTER `check_in_at`,
ADD COLUMN `contract_id` INT(11) DEFAULT NULL COMMENT 'Associated contract if required' AFTER `check_in_by`,
ADD COLUMN `cancellation_reason` TEXT COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `contract_id`,
ADD COLUMN `cancelled_at` TIMESTAMP NULL DEFAULT NULL AFTER `cancellation_reason`,
ADD COLUMN `cancelled_by` INT(11) DEFAULT NULL AFTER `cancelled_at`,
ADD COLUMN `rescheduled_from` INT(11) DEFAULT NULL COMMENT 'Original appointment ID if rescheduled' AFTER `cancelled_by`,
ADD COLUMN `reminder_sent_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'When reminder was sent' AFTER `rescheduled_from`,
ADD KEY `idx_check_in_at` (`check_in_at`),
ADD KEY `idx_check_in_by` (`check_in_by`),
ADD KEY `idx_contract_id` (`contract_id`),
ADD KEY `idx_cancelled_by` (`cancelled_by`),
ADD KEY `idx_rescheduled_from` (`rescheduled_from`);

-- Add foreign keys for new appointment fields
ALTER TABLE `appointments`
ADD CONSTRAINT `appointments_ibfk_5` FOREIGN KEY (`check_in_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
ADD CONSTRAINT `appointments_ibfk_6` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`) ON DELETE SET NULL,
ADD CONSTRAINT `appointments_ibfk_7` FOREIGN KEY (`cancelled_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
ADD CONSTRAINT `appointments_ibfk_8` FOREIGN KEY (`rescheduled_from`) REFERENCES `appointments` (`id`) ON DELETE SET NULL;

-- Add refund fields to payments table
ALTER TABLE `payments`
ADD COLUMN `refund_amount` DECIMAL(10,2) DEFAULT NULL AFTER `transaction_id`,
ADD COLUMN `refund_reason` TEXT COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `refund_amount`,
ADD COLUMN `refunded_at` TIMESTAMP NULL DEFAULT NULL AFTER `refund_reason`,
ADD COLUMN `refunded_by` INT(11) DEFAULT NULL AFTER `refunded_at`,
ADD COLUMN `refund_approved_by` INT(11) DEFAULT NULL COMMENT 'General admin who approved refund' AFTER `refunded_by`,
ADD COLUMN `refund_approved_at` TIMESTAMP NULL DEFAULT NULL AFTER `refund_approved_by`,
ADD COLUMN `coupon_id` INT(11) DEFAULT NULL COMMENT 'Coupon used for this payment' AFTER `refund_approved_at`,
ADD COLUMN `discount_amount` DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Discount applied from coupon' AFTER `coupon_id`,
ADD KEY `idx_refunded_by` (`refunded_by`),
ADD KEY `idx_refund_approved_by` (`refund_approved_by`),
ADD KEY `idx_coupon_id` (`coupon_id`);

-- Add foreign keys for payment refunds
ALTER TABLE `payments`
ADD CONSTRAINT `payments_ibfk_4` FOREIGN KEY (`refunded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
ADD CONSTRAINT `payments_ibfk_5` FOREIGN KEY (`refund_approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
ADD CONSTRAINT `payments_ibfk_6` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE SET NULL;

-- Create settings table for system configuration
CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `setting_key` VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` TEXT COLLATE utf8mb4_unicode_ci,
  `setting_type` ENUM('text','number','boolean','json') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'text',
  `category` VARCHAR(50) COLLATE utf8mb4_unicode_ci DEFAULT 'general' COMMENT 'general, notifications, payments, etc',
  `description` TEXT COLLATE utf8mb4_unicode_ci,
  `is_public` TINYINT(1) DEFAULT 0 COMMENT 'Whether setting is visible to non-admin users',
  `updated_by` INT(11) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_setting_key` (`setting_key`),
  KEY `idx_category` (`category`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `settings_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default settings
INSERT INTO `settings` (`setting_key`, `setting_value`, `setting_type`, `category`, `description`, `is_public`) VALUES
('site_name', 'All Beauty Luxury & Wellness', 'text', 'general', 'Name of the clinic', 1),
('site_description', 'Your trusted medical aesthetic center', 'text', 'general', 'Site description', 1),
('contact_email', 'info@allbeautyluxury.com', 'text', 'general', 'Contact email', 1),
('contact_phone', '+1234567890', 'text', 'general', 'Contact phone number', 1),
('address', '123 Beauty Street, Medical District', 'text', 'general', 'Physical address', 1),
('whatsapp_enabled', 'true', 'boolean', 'notifications', 'Enable WhatsApp notifications', 0),
('email_enabled', 'true', 'boolean', 'notifications', 'Enable email notifications', 0),
('reminder_hours_before', '24', 'number', 'notifications', 'Hours before appointment to send reminder', 0),
('auto_refund_enabled', 'false', 'boolean', 'payments', 'Enable automatic refunds without approval', 0),
('cancellation_deadline_hours', '24', 'number', 'appointments', 'Hours before appointment when cancellation is allowed', 0),
('terms_and_conditions', '', 'text', 'legal', 'Terms and conditions text', 1),
('privacy_policy', '', 'text', 'legal', 'Privacy policy text', 1);

-- Create content_pages table for managing terms, privacy, etc.
CREATE TABLE IF NOT EXISTS `content_pages` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` VARCHAR(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` LONGTEXT COLLATE utf8mb4_unicode_ci,
  `meta_description` TEXT COLLATE utf8mb4_unicode_ci,
  `is_published` TINYINT(1) DEFAULT 0,
  `created_by` INT(11) NOT NULL,
  `updated_by` INT(11) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_slug` (`slug`),
  KEY `idx_slug` (`slug`),
  KEY `idx_is_published` (`is_published`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `content_pages_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `content_pages_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default content pages
INSERT INTO `content_pages` (`slug`, `title`, `content`, `is_published`, `created_by`) VALUES
('terms-and-conditions', 'Terms and Conditions', '<h1>Terms and Conditions</h1><p>Coming soon...</p>', 1, 1),
('privacy-policy', 'Privacy Policy', '<h1>Privacy Policy</h1><p>Coming soon...</p>', 1, 1);

-- Create admin_sessions table for passwordless admin login
CREATE TABLE IF NOT EXISTS `admin_sessions` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) NOT NULL,
  `session_code` INT(6) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_session_code` (`session_code`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_expires_at` (`expires_at`),
  CONSTRAINT `admin_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create dashboard_metrics table for caching dashboard data
CREATE TABLE IF NOT EXISTS `dashboard_metrics` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `metric_date` DATE NOT NULL,
  `total_appointments` INT(11) DEFAULT 0,
  `completed_appointments` INT(11) DEFAULT 0,
  `cancelled_appointments` INT(11) DEFAULT 0,
  `no_show_appointments` INT(11) DEFAULT 0,
  `total_revenue` DECIMAL(10,2) DEFAULT 0.00,
  `total_refunds` DECIMAL(10,2) DEFAULT 0.00,
  `new_patients` INT(11) DEFAULT 0,
  `active_contracts` INT(11) DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_metric_date` (`metric_date`),
  KEY `idx_metric_date` (`metric_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add appointment source tracking
ALTER TABLE `appointments`
ADD COLUMN `booking_source` ENUM('online','receptionist','phone','walk_in') COLLATE utf8mb4_unicode_ci DEFAULT 'online' AFTER `booked_for_self`,
ADD KEY `idx_booking_source` (`booking_source`);

-- Update existing appointments to have a booking source
UPDATE `appointments` SET `booking_source` = 'online' WHERE `booking_source` IS NULL;

-- Enhance audit logs for admin actions
ALTER TABLE `audit_logs`
ADD COLUMN `metadata` JSON DEFAULT NULL COMMENT 'Additional context about the action' AFTER `new_values`;

-- Add index to created_by in users table for better query performance
ALTER TABLE `blocked_dates`
ADD INDEX `idx_created_by` (`created_by`);

-- Create appointment_reminders table to track reminder sending
CREATE TABLE IF NOT EXISTS `appointment_reminders` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `appointment_id` INT(11) NOT NULL,
  `reminder_type` ENUM('email','whatsapp','sms') COLLATE utf8mb4_unicode_ci NOT NULL,
  `scheduled_for` TIMESTAMP NOT NULL,
  `sent_at` TIMESTAMP NULL DEFAULT NULL,
  `status` ENUM('pending','sent','failed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `error_message` TEXT COLLATE utf8mb4_unicode_ci,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_appointment_id` (`appointment_id`),
  KEY `idx_scheduled_for` (`scheduled_for`),
  KEY `idx_status` (`status`),
  CONSTRAINT `appointment_reminders_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample admin users if they don't exist
INSERT INTO `users` (`email`, `password_hash`, `role`, `first_name`, `last_name`, `phone`, `is_active`, `employee_id`) 
VALUES 
('receptionist@beautyhospital.com', '', 'receptionist', 'Maria', 'Garcia', '+1234567891', 1, 'EMP001'),
('doctor@beautyhospital.com', '', 'doctor', 'Dr. Juan', 'Martinez', '+1234567892', 1, 'DOC001'),
('generaladmin@beautyhospital.com', '', 'general_admin', 'Carlos', 'Rodriguez', '+1234567893', 1, 'ADM001')
ON DUPLICATE KEY UPDATE `email` = `email`;

COMMIT;
