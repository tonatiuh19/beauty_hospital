-- Migration 018: Delete all data for patient id = 18 (test@gmail.com)
-- Run via: npx tsx scripts/apply-migration-018.mjs

SET FOREIGN_KEY_CHECKS = 0;

-- Session tokens
DELETE FROM users_sessions WHERE patient_id = 18;
DELETE FROM refresh_tokens WHERE patient_id = 18;

-- Audit & notifications
DELETE FROM audit_logs WHERE patient_id = 18;
DELETE FROM notifications WHERE patient_id = 18;

-- Coupon usage & invoices
DELETE FROM coupon_usage WHERE patient_id = 18;
DELETE FROM invoice_requests WHERE patient_id = 18;

-- Medical media (child of medical_records)
DELETE mm FROM medical_media mm
  INNER JOIN medical_records mr ON mm.medical_record_id = mr.id
  WHERE mr.patient_id = 18;

-- Medical records
DELETE FROM medical_records WHERE patient_id = 18;

-- Check-in logs and appointment reminders (children of appointments)
DELETE cl FROM check_in_logs cl
  INNER JOIN appointments a ON cl.appointment_id = a.id
  WHERE a.patient_id = 18;

DELETE ar FROM appointment_reminders ar
  INNER JOIN appointments a ON ar.appointment_id = a.id
  WHERE a.patient_id = 18;

-- Null out appointments.contract_id to break FK before deleting contracts
UPDATE appointments SET contract_id = NULL WHERE patient_id = 18;

-- Payments
DELETE FROM payments WHERE patient_id = 18;

-- Appointments
DELETE FROM appointments WHERE patient_id = 18;

-- Contract emails and contracts
DELETE FROM contract_emails WHERE patient_id = 18;
DELETE FROM contracts WHERE patient_id = 18;

-- Patient record
DELETE FROM patients WHERE id = 18;

SET FOREIGN_KEY_CHECKS = 1;
