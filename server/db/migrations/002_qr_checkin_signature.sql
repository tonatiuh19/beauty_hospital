-- Migration: Add QR Check-in and Signature System
-- Description: Adds fields for QR-based check-in with digital signature capture
-- Date: 2025-12-13

-- Add columns to appointments table for QR check-in and signature
ALTER TABLE `appointments`
  ADD COLUMN `check_in_token` VARCHAR(100) NULL COMMENT 'Unique token for QR code check-in' AFTER `reminder_sent_at`,
  ADD COLUMN `check_in_token_expires_at` TIMESTAMP NULL COMMENT 'When the check-in token expires' AFTER `check_in_token`,
  ADD COLUMN `signature_data_url` TEXT NULL COMMENT 'Base64 signature image data' AFTER `check_in_token_expires_at`,
  ADD COLUMN `signed_contract_pdf_url` TEXT NULL COMMENT 'URL or path to signed contract PDF' AFTER `signature_data_url`,
  ADD COLUMN `contract_signed_at` TIMESTAMP NULL COMMENT 'When patient signed the contract' AFTER `signed_contract_pdf_url`,
  ADD COLUMN `signature_ip_address` VARCHAR(45) NULL COMMENT 'IP address from which signature was captured' AFTER `contract_signed_at`,
  ADD INDEX `idx_check_in_token` (`check_in_token`);

-- Add columns to contracts table for signature capture
ALTER TABLE `contracts`
  ADD COLUMN `signature_canvas_data` LONGTEXT NULL COMMENT 'Full signature canvas data for re-rendering' AFTER `docusign_signed_at`,
  ADD COLUMN `signature_ip_address` VARCHAR(45) NULL COMMENT 'IP from which signature was captured' AFTER `signature_canvas_data`,
  ADD COLUMN `signature_user_agent` TEXT NULL COMMENT 'Device/browser used for signing' AFTER `signature_ip_address`;

-- Create check-in logs table for tracking check-in attempts
CREATE TABLE IF NOT EXISTS `check_in_logs` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `appointment_id` INT(11) NOT NULL,
  `check_in_token` VARCHAR(100) NOT NULL,
  `action` ENUM('token_generated', 'qr_scanned', 'contract_viewed', 'signature_completed', 'pdf_generated', 'email_sent', 'check_in_completed', 'token_expired', 'error') NOT NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `metadata` JSON NULL COMMENT 'Additional context about the action',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_appointment_id` (`appointment_id`),
  INDEX `idx_check_in_token` (`check_in_token`),
  FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add email tracking for signed contract PDFs
CREATE TABLE IF NOT EXISTS `contract_emails` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `appointment_id` INT(11) NOT NULL,
  `contract_id` INT(11) NULL,
  `patient_id` INT(11) NOT NULL,
  `email_to` VARCHAR(255) NOT NULL,
  `email_type` ENUM('signed_contract', 'contract_reminder', 'contract_update') NOT NULL DEFAULT 'signed_contract',
  `status` ENUM('pending', 'sent', 'failed', 'bounced') NOT NULL DEFAULT 'pending',
  `pdf_attachment_path` TEXT NULL COMMENT 'Path to PDF attachment',
  `sent_at` TIMESTAMP NULL,
  `error_message` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_appointment_id` (`appointment_id`),
  INDEX `idx_patient_id` (`patient_id`),
  INDEX `idx_status` (`status`),
  FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add sample comment
-- This migration enables a complete QR-based check-in workflow:
-- 1. Admin generates unique check-in token for each appointment
-- 2. Patient scans QR code with iPad or phone
-- 3. System validates token and displays contract
-- 4. Patient signs contract using HTML5 canvas
-- 5. System generates PDF with signature
-- 6. PDF is emailed to patient automatically
-- All actions are logged for audit trail
