-- Fix users_sessions table for patient authentication
-- Compatible version for MySQL 5.7 (HostGator)
-- Run this on your actual database to fix the authentication issue

-- Step 1: Modify user_session_date_start to be timestamp instead of datetime
ALTER TABLE `users_sessions` 
MODIFY COLUMN `user_session_date_start` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Step 2: Add default value to user_session column
ALTER TABLE `users_sessions` 
MODIFY COLUMN `user_session` tinyint(1) NOT NULL DEFAULT '0';

-- Step 3: Add created_at column (will fail if exists, that's ok)
-- If you get an error "Duplicate column name", ignore it
ALTER TABLE `users_sessions` 
ADD COLUMN `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Step 4: Add indexes for better query performance
-- These will fail if indexes already exist, that's ok
ALTER TABLE `users_sessions` 
ADD INDEX `idx_session_code` (`session_code`);

ALTER TABLE `users_sessions` 
ADD INDEX `idx_user_session` (`user_session`);

ALTER TABLE `users_sessions` 
ADD INDEX `idx_user_session_date_start` (`user_session_date_start`);

-- Step 5: Clean up expired sessions (older than 10 minutes and not active)
DELETE FROM `users_sessions` 
WHERE `user_session` = 0 
AND `user_session_date_start` < DATE_SUB(NOW(), INTERVAL 10 MINUTE);

-- Step 6 (OPTIONAL): If you want to test with the current code 438407
-- Uncomment these lines to reset the session to current time:
-- UPDATE `users_sessions` 
-- SET `user_session_date_start` = NOW(), `user_session` = 0
-- WHERE `session_code` = 438407 AND `patient_id` = 9;

SELECT 'Migration completed! You may see some errors for duplicate columns/indexes - this is normal.' as status;
