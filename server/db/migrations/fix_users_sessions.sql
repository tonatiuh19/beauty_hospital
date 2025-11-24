-- Fix users_sessions table for patient authentication
-- Run this on your actual database to fix the authentication issue

-- Step 1: Add created_at column if it doesn't exist
ALTER TABLE `users_sessions` 
ADD COLUMN IF NOT EXISTS `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Step 2: Modify user_session_date_start to be timestamp instead of datetime
ALTER TABLE `users_sessions` 
MODIFY COLUMN `user_session_date_start` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Step 3: Add default value to user_session column
ALTER TABLE `users_sessions` 
MODIFY COLUMN `user_session` tinyint(1) NOT NULL DEFAULT '0';

-- Step 4: Add indexes for better query performance
ALTER TABLE `users_sessions` 
ADD INDEX IF NOT EXISTS `idx_session_code` (`session_code`);

ALTER TABLE `users_sessions` 
ADD INDEX IF NOT EXISTS `idx_user_session` (`user_session`);

ALTER TABLE `users_sessions` 
ADD INDEX IF NOT EXISTS `idx_user_session_date_start` (`user_session_date_start`);

-- Step 5: Clean up expired sessions (older than 10 minutes and not active)
DELETE FROM `users_sessions` 
WHERE `user_session` = 0 
AND `user_session_date_start` < DATE_SUB(NOW(), INTERVAL 10 MINUTE);

-- Step 6: Update the current test session to be within valid time range (optional - for testing)
-- UPDATE `users_sessions` 
-- SET `user_session_date_start` = NOW() 
-- WHERE `session_code` = 438407 AND `patient_id` = 9;

SELECT 'Migration completed successfully!' as status;
