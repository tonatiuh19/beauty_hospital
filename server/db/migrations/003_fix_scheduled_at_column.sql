-- Fix scheduled_at column to prevent automatic updates
-- The scheduled_at should only change when explicitly rescheduled, 
-- not on every row update

ALTER TABLE appointments 
  MODIFY COLUMN scheduled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- This removes the ON UPDATE CURRENT_TIMESTAMP behavior
-- scheduled_at will now only be set during INSERT or explicit UPDATE
