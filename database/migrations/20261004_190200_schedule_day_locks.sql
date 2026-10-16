-- Serializes same-day appointment writes so two receptionists cannot
-- insert overlapping durations after both seeing a free calendar.
CREATE TABLE IF NOT EXISTS schedule_day_locks (
  lock_date DATE NOT NULL,
  PRIMARY KEY (lock_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
