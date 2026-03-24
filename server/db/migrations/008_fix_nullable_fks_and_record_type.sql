-- Migration 008: Fix nullable FK columns and add record_type to medical_records
-- Date: 2026-03-05
-- MySQL 8.0 compatible

-- 1. Make appointments.created_by nullable
--    Reason: Patient self-bookings (online) have no associated admin user ID.
--    The FK references users.id which only contains admin/doctor accounts, not patients.
ALTER TABLE appointments
  MODIFY COLUMN created_by INT(11) DEFAULT NULL
  COMMENT 'Admin/user ID who created the appointment, NULL for patient self-bookings';

-- 2. Make payments.processed_by nullable
--    Reason: Stripe-processed online payments have no admin user; processed_by FK to users.id.
ALTER TABLE payments
  MODIFY COLUMN processed_by INT(11) DEFAULT NULL;

-- 3. Add record_type to medical_records
--    Reason: PatientManagement UI categorises records by type; no column existed before.
ALTER TABLE medical_records
  ADD COLUMN record_type ENUM('consultation','treatment','follow_up','diagnosis','prescription','lab_results')
  NOT NULL DEFAULT 'consultation'
  AFTER patient_id;
