-- Track the logged-in patient who paid when booking for someone else.
-- created_by stays a users.id FK (staff). Patient bookers cannot go there.
ALTER TABLE appointments
  ADD COLUMN booked_by_patient_id int(11) DEFAULT NULL
    COMMENT 'Patient who booked/paid when booked_for_self = 0'
    AFTER booked_for_self;

ALTER TABLE appointments
  ADD KEY idx_booked_by_patient_id (booked_by_patient_id);

ALTER TABLE appointments
  ADD CONSTRAINT appointments_ibfk_booked_by_patient
    FOREIGN KEY (booked_by_patient_id) REFERENCES patients (id) ON DELETE SET NULL;
