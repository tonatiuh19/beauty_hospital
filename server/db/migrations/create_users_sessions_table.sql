-- =====================================================
-- CREATE users_sessions TABLE (IF IT DOESN'T EXIST)
-- =====================================================

CREATE TABLE IF NOT EXISTS `users_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `patient_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `session_code` int(11) NOT NULL,
  `user_session` varchar(255) DEFAULT '0',
  `user_session_date_start` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_patient_id` (`patient_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_session_code` (`session_code`),
  KEY `idx_user_session` (`user_session`),
  KEY `idx_user_session_date_start` (`user_session_date_start`),
  CONSTRAINT `fk_users_sessions_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_users_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify the table was created
DESCRIBE users_sessions;

-- Check if any data exists
SELECT COUNT(*) as row_count FROM users_sessions;
