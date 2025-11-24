-- Run these queries ONE AT A TIME in phpMyAdmin

-- Query 1: Check table structure
DESCRIBE users_sessions;

-- Query 2: Check all sessions for patient_id 9
SELECT 
    id,
    patient_id,
    session_code,
    user_session,
    user_session_date_start,
    created_at,
    TIMESTAMPDIFF(MINUTE, user_session_date_start, NOW()) as minutes_ago,
    CASE 
        WHEN user_session_date_start > DATE_SUB(NOW(), INTERVAL 10 MINUTE) THEN 'VALID'
        ELSE 'EXPIRED'
    END as status
FROM users_sessions 
WHERE patient_id = 9
ORDER BY user_session_date_start DESC;

-- Query 3: Check current server time
SELECT NOW() as server_time, @@session.time_zone as timezone;
