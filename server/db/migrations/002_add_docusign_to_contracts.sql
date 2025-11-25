-- Add DocuSign fields to contracts table
ALTER TABLE `contracts`
ADD COLUMN `docusign_envelope_id` VARCHAR(100) NULL DEFAULT NULL COMMENT 'DocuSign envelope ID' AFTER `updated_at`,
ADD COLUMN `docusign_status` ENUM('not_sent', 'sent', 'delivered', 'signed', 'completed', 'declined', 'voided') NULL DEFAULT 'not_sent' COMMENT 'DocuSign envelope status' AFTER `docusign_envelope_id`,
ADD COLUMN `docusign_signed_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'When the document was signed in DocuSign' AFTER `docusign_status`,
ADD INDEX `idx_docusign_envelope` (`docusign_envelope_id`);
