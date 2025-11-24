-- =====================================================
-- CHECK WHAT TABLES EXIST IN THE DATABASE
-- =====================================================

-- 1. Show all tables in the database
SHOW TABLES;

-- 2. Check if users_sessions table exists
SELECT COUNT(*) as table_exists
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
  AND table_name = 'users_sessions';

-- 3. If table exists, show its structure
-- Run this separately if table exists:
-- DESCRIBE users_sessions;

-- 4. Check what patient-related tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
  AND table_name LIKE '%patient%' OR table_name LIKE '%session%' OR table_name LIKE '%user%'
ORDER BY table_name;
