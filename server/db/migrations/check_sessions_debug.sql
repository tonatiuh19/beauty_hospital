-- =====================================================
-- DIAGNOSTIC QUERIES FOR PATIENT AUTHENTICATION DEBUG
-- Run these queries in HostGator phpMyAdmin
-- =====================================================

-- 1. Check the structure of users_sessions table
DESCRIBE users_sessions;

-- 2. Check all sessions for patient_id 9
SELECT 
    id,
    patient_id,
    session_code,
    user_session,
    user_session_date_start,
    created_at,
    -- Check if session is still valid (within 10 minutes)
    CASE 
        WHEN user_session_date_start > DATE_SUB(NOW(), INTERVAL 10 MINUTE) THEN 'VALID'
        ELSE 'EXPIRED'
    END as session_status,
    -- Show time difference
    TIMESTAMPDIFF(MINUTE, user_session_date_start, NOW()) as minutes_ago,
    NOW() as server_time
FROM users_sessions 
WHERE patient_id = 9
ORDER BY user_session_date_start DESC;

-- 3. Check the exact data type of user_session_date_start column
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    EXTRA
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'alanchat_beauty_hospital' 
  AND TABLE_NAME = 'users_sessions' 
  AND COLUMN_NAME = 'user_session_date_start';

-- 4. Test the exact query that verifyCode uses
SET @patient_id = 9;
SET @code = 618589;

SELECT 
    id, 
    patient_id, 
    session_code, 
    user_session,
    user_session_date_start,
    -- This is what the query checks
    CASE 
        WHEN user_session_date_start > DATE_SUB(NOW(), INTERVAL 10 MINUTE) THEN 'MATCHES'
        ELSE 'DOES NOT MATCH'
    END as query_condition,
    NOW() as server_time_now,
    DATE_SUB(NOW(), INTERVAL 10 MINUTE) as ten_minutes_ago
FROM users_sessions
WHERE patient_id = @patient_id 
  AND session_code = @code;

-- 5. Show all indexes on users_sessions table
SHOW INDEXES FROM users_sessions;

-- 6. Check if there are any triggers affecting the table
SHOW TRIGGERS LIKE 'users_sessions';

-- 7. Check server timezone settings
SELECT @@global.time_zone, @@session.time_zone, NOW() as server_time;

-- 8. Create a fresh test session to verify insertion works
-- UNCOMMENT THIS TO TEST:
-- DELETE FROM users_sessions WHERE patient_id = 9;
-- INSERT INTO users_sessions (patient_id, session_code, user_session, user_session_date_start)
-- VALUES (9, 999888, 0, NOW());
-- 
-- -- Check if it was inserted correctly
-- SELECT * FROM users_sessions WHERE patient_id = 9 AND session_code = 999888;

-- 9. Compare datetime vs timestamp behavior
SELECT 
    NOW() as now_function,
    CURRENT_TIMESTAMP as current_timestamp,
    CAST(NOW() as DATETIME) as cast_datetime,
    UNIX_TIMESTAMP(NOW()) as unix_timestamp;

-- 10. Check patient exists
SELECT id, email, first_name, last_name, is_active, created_at 
FROM patients 
WHERE id = 9;
