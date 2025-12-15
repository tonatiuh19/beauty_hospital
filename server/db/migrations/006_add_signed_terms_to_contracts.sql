-- Migration 006: Add signed_terms column to contracts table
-- This column stores the EXACT terms that were signed by the patient
-- Critical for legal compliance - we must preserve what was actually agreed to

ALTER TABLE contracts 
ADD COLUMN signed_terms TEXT COMMENT 'Exact terms that were signed by the patient (immutable for legal compliance)' AFTER terms_and_conditions;

-- Note: 
-- - signed_terms is populated when the patient signs the contract
-- - It should NEVER be modified after signing
-- - terms_and_conditions is the default template
-- - When downloading/viewing a signed contract, always use signed_terms
-- - When creating a new contract, copy from system_settings default
