-- Migration: Add custom contract terms functionality
-- Date: 2025-12-14
-- Description: Allow editing contract terms in the contracts section

-- Add custom_terms column to contracts table
ALTER TABLE `contracts` 
ADD COLUMN `custom_terms` TEXT COLLATE utf8mb4_unicode_ci DEFAULT NULL 
COMMENT 'Custom editable terms for this specific contract' 
AFTER `terms_and_conditions`;

-- Update existing contracts to have NULL custom_terms (will use default terms)
-- No action needed as DEFAULT NULL is already set
