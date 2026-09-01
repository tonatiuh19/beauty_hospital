-- Remove leftover DocuSign column; contracts use in-app canvas signatures.
ALTER TABLE contracts
  DROP COLUMN IF EXISTS docusign_signed_at;
