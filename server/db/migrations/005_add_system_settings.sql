-- Migration 005: Add system_settings table for application-wide configuration
-- This table stores system-wide settings like default contract terms

CREATE TABLE IF NOT EXISTS system_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  description VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by INT,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default contract terms
INSERT INTO system_settings (setting_key, setting_value, description, updated_by) 
VALUES (
  'default_contract_terms',
  'TÉRMINOS Y CONDICIONES DEL SERVICIO

1. ALCANCE DEL SERVICIO
   El presente contrato cubre las sesiones especificadas del servicio contratado.

2. PROGRAMACIÓN Y ASISTENCIA
   - Las citas deben programarse con anticipación
   - Se requiere llegar 10 minutos antes de la hora programada
   - En caso de no asistir sin previo aviso, se considerará como sesión utilizada

3. POLÍTICA DE CANCELACIÓN
   - Las cancelaciones deben hacerse con al menos 24 horas de anticipación

4. CUIDADOS Y RECOMENDACIONES
   - Seguir todas las indicaciones del personal médico
   - Informar sobre cualquier cambio en el estado de salud',
  'Default terms and conditions used in all contracts',
  1
) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
