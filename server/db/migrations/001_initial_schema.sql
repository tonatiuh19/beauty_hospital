-- Beauty Hospital Database Schema
-- Initial migration: Complete database structure

-- ==================== USERS TABLE ====================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'pos', 'doctor', 'receptionist', 'patient') NOT NULL DEFAULT 'patient',
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== REFRESH TOKENS TABLE ====================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(500) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== PATIENTS TABLE ====================
CREATE TABLE IF NOT EXISTS patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender ENUM('male', 'female', 'other') NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(20),
  emergency_contact_name VARCHAR(200),
  emergency_contact_phone VARCHAR(20),
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_email (email),
  INDEX idx_phone (phone),
  INDEX idx_user_id (user_id),
  INDEX idx_is_active (is_active),
  INDEX idx_name (first_name, last_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== SERVICES TABLE ====================
CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category ENUM('laser_hair_removal', 'facial_treatment', 'body_treatment', 'consultation', 'other') NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  duration_minutes INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== APPOINTMENTS TABLE ====================
CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NULL,
  service_id INT NOT NULL,
  status ENUM('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show') NOT NULL DEFAULT 'scheduled',
  scheduled_at TIMESTAMP NOT NULL,
  duration_minutes INT NOT NULL,
  notes TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_patient_id (patient_id),
  INDEX idx_doctor_id (doctor_id),
  INDEX idx_service_id (service_id),
  INDEX idx_status (status),
  INDEX idx_scheduled_at (scheduled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== PAYMENTS TABLE ====================
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT NULL,
  patient_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method ENUM('cash', 'credit_card', 'debit_card', 'transfer', 'stripe') NOT NULL,
  payment_status ENUM('pending', 'processing', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  stripe_payment_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  transaction_id VARCHAR(255),
  notes TEXT,
  processed_by INT NOT NULL,
  processed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
  FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_appointment_id (appointment_id),
  INDEX idx_patient_id (patient_id),
  INDEX idx_payment_status (payment_status),
  INDEX idx_stripe_payment_id (stripe_payment_id),
  INDEX idx_processed_at (processed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== MEDICAL RECORDS TABLE ====================
CREATE TABLE IF NOT EXISTS medical_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  appointment_id INT NULL,
  diagnosis TEXT,
  treatment TEXT,
  notes TEXT,
  allergies TEXT,
  medications TEXT,
  medical_history TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
  INDEX idx_patient_id (patient_id),
  INDEX idx_doctor_id (doctor_id),
  INDEX idx_appointment_id (appointment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== MEDICAL MEDIA TABLE ====================
CREATE TABLE IF NOT EXISTS medical_media (
  id INT AUTO_INCREMENT PRIMARY KEY,
  medical_record_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INT NOT NULL,
  description TEXT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medical_record_id) REFERENCES medical_records(id) ON DELETE CASCADE,
  INDEX idx_medical_record_id (medical_record_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== CONTRACTS TABLE ====================
CREATE TABLE IF NOT EXISTS contracts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  service_id INT NOT NULL,
  contract_number VARCHAR(50) NOT NULL UNIQUE,
  status ENUM('draft', 'pending_signature', 'signed', 'completed', 'cancelled') NOT NULL DEFAULT 'draft',
  total_amount DECIMAL(10, 2) NOT NULL,
  sessions_included INT NOT NULL,
  sessions_completed INT DEFAULT 0,
  terms_and_conditions TEXT NOT NULL,
  pdf_url TEXT,
  signature_data TEXT,
  signed_at TIMESTAMP NULL,
  signed_by INT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
  FOREIGN KEY (signed_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_patient_id (patient_id),
  INDEX idx_contract_number (contract_number),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== NOTIFICATIONS TABLE ====================
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  appointment_id INT NULL,
  type ENUM('email', 'whatsapp', 'sms') NOT NULL,
  status ENUM('pending', 'sent', 'delivered', 'failed') NOT NULL DEFAULT 'pending',
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  message TEXT NOT NULL,
  sent_at TIMESTAMP NULL,
  delivered_at TIMESTAMP NULL,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
  INDEX idx_patient_id (patient_id),
  INDEX idx_appointment_id (appointment_id),
  INDEX idx_status (status),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== AUDIT LOGS TABLE ====================
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id INT NOT NULL,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== INITIAL DATA ====================

-- Insert default admin user (password: admin123)
-- Password hash generated with bcrypt (10 rounds)
-- ⚠️ IMPORTANT: Change this password immediately after first login!
INSERT INTO users (email, password_hash, role, first_name, last_name, phone, is_active) VALUES
('admin@beautyhospital.com', '$2b$10$TBsX8oVXgbglL8nZqEpygO0PliVXZRqbQHPOEaUxKwhdfHr27ir5a', 'admin', 'Admin', 'User', '+1234567890', TRUE)
ON DUPLICATE KEY UPDATE id=id;

-- Insert sample services
INSERT INTO services (name, description, category, price, duration_minutes, is_active) VALUES
('Láser Diodo - Área Pequeña', 'Depilación láser en área pequeña (labio superior, mentón)', 'laser_hair_removal', 500.00, 30, TRUE),
('Láser Diodo - Área Mediana', 'Depilación láser en área mediana (axilas, bikini)', 'laser_hair_removal', 800.00, 45, TRUE),
('Láser Diodo - Área Grande', 'Depilación láser en área grande (piernas completas, espalda)', 'laser_hair_removal', 1500.00, 90, TRUE),
('Limpieza Facial Profunda', 'Limpieza facial completa con extracción y mascarilla', 'facial_treatment', 1200.00, 60, TRUE),
('Tratamiento Corporal Reductivo', 'Tratamiento corporal para reducción de medidas', 'body_treatment', 2000.00, 90, TRUE),
('Consulta Inicial', 'Consulta médica inicial con evaluación', 'consultation', 300.00, 30, TRUE)
ON DUPLICATE KEY UPDATE id=id;

-- ==================== END OF MIGRATION ====================
