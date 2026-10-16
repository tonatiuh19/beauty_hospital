-- Legacy/Velocity informed-consent minors annex (tutor authorization).
ALTER TABLE consents
  ADD COLUMN is_minor tinyint(1) NOT NULL DEFAULT 0
    COMMENT 'Patient is a minor; tutor annex required for Legacy/Velocity',
  ADD COLUMN guardian_name varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  ADD COLUMN guardian_relationship varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  ADD COLUMN guardian_signature longtext COLLATE utf8mb4_unicode_ci,
  ADD COLUMN guardian_signed_at timestamp NULL DEFAULT NULL;
