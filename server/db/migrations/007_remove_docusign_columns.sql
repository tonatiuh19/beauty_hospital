-- Migration 007: Remove DocuSign columns from contracts table
-- We're not using DocuSign integration, these columns are unused

ALTER TABLE contracts 
DROP COLUMN docusign_envelope_id,
DROP COLUMN docusign_status;
