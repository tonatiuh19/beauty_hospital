-- Remove seed Admin User (id 1 / admin@beautyhospital.com).
-- created_by is NOT NULL on several tables, so reassign first.
-- Idempotent: safe to re-run after the row is already gone.

UPDATE blocked_dates
SET created_by = (
  SELECT id FROM (
    SELECT id FROM users
    WHERE email <> 'admin@beautyhospital.com'
      AND role IN ('general_admin', 'admin')
      AND is_active = 1
    ORDER BY FIELD(role, 'general_admin', 'admin'), id
    LIMIT 1
  ) AS keep_admin
)
WHERE created_by = 1;

UPDATE content_pages
SET created_by = (
  SELECT id FROM (
    SELECT id FROM users
    WHERE email <> 'admin@beautyhospital.com'
      AND role IN ('general_admin', 'admin')
      AND is_active = 1
    ORDER BY FIELD(role, 'general_admin', 'admin'), id
    LIMIT 1
  ) AS keep_admin
)
WHERE created_by = 1;

UPDATE contracts
SET created_by = (
  SELECT id FROM (
    SELECT id FROM users
    WHERE email <> 'admin@beautyhospital.com'
      AND role IN ('general_admin', 'admin')
      AND is_active = 1
    ORDER BY FIELD(role, 'general_admin', 'admin'), id
    LIMIT 1
  ) AS keep_admin
)
WHERE created_by = 1;

UPDATE system_settings
SET updated_by = NULL
WHERE updated_by = 1;

DELETE FROM users
WHERE id = 1 AND email = 'admin@beautyhospital.com';
