-- Track production deploy version (used by npm run deploy:prod)
INSERT INTO system_settings (setting_key, setting_value, description, updated_at)
VALUES (
  'app_version',
  '0.0.0',
  'Current deployed application version shown in admin settings.',
  NOW()
)
ON DUPLICATE KEY UPDATE
  description = VALUES(description);
