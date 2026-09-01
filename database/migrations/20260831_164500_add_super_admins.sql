-- Super admin in this app is role general_admin (Users + Settings).
-- Idempotent: unique email. Safe to re-run via db:migrate.
INSERT INTO users (
  email,
  password_hash,
  role,
  first_name,
  last_name,
  is_active,
  is_email_verified
) VALUES
  ('enfeliana1714@gmail.com', '', 'general_admin', 'Enfeliaana', 'Admin', 1, 1),
  ('aleezajazmin99@gmail.com', '', 'general_admin', 'Ale', 'Admin', 1, 1)
ON DUPLICATE KEY UPDATE
  role = 'general_admin',
  first_name = VALUES(first_name),
  last_name = VALUES(last_name),
  is_active = 1,
  is_email_verified = 1;
