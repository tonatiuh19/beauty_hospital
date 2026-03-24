-- Migration 009: Add stripe_customer_id to patients table
-- This column stores the Stripe Customer ID so payment methods can be saved.
-- If a patient was created with different Stripe API keys (dev vs live),
-- the column can be updated at payment time via the getOrCreateStripeCustomer helper.

ALTER TABLE `patients`
  ADD COLUMN `stripe_customer_id` VARCHAR(255) DEFAULT NULL AFTER `updated_at`;
