-- October 2026 Venus catalog: package fields, replace public services, separate consents.
-- Old services stay for appointment/contract history; they are deactivated.

ALTER TABLE services
  ADD COLUMN package_sessions int(11) NOT NULL DEFAULT 1
    COMMENT 'Sessions included in the prepaid package',
  ADD COLUMN legal_template varchar(32) DEFAULT NULL
    COMMENT 'bliss | legacy | velocity',
  ADD COLUMN area_catalog json DEFAULT NULL
    COMMENT 'Allowed treatment areas for this package';

ALTER TABLE contracts
  ADD COLUMN legal_template varchar(32) DEFAULT NULL,
  ADD COLUMN selected_zone varchar(200) DEFAULT NULL;

CREATE TABLE IF NOT EXISTS consents (
  id int(11) NOT NULL AUTO_INCREMENT,
  patient_id int(11) NOT NULL,
  contract_id int(11) DEFAULT NULL,
  appointment_id int(11) DEFAULT NULL,
  service_id int(11) NOT NULL,
  legal_template varchar(32) NOT NULL,
  status enum('draft','pending_patient','pending_staff','signed','rejected')
    COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  zone varchar(200) DEFAULT NULL,
  health_answers json DEFAULT NULL,
  data_health_consent tinyint(1) DEFAULT NULL,
  photos_followup tinyint(1) DEFAULT NULL,
  clinical_conclusion varchar(32) DEFAULT NULL,
  clinical_notes text COLLATE utf8mb4_unicode_ci,
  patient_signature longtext COLLATE utf8mb4_unicode_ci,
  patient_signed_at timestamp NULL DEFAULT NULL,
  staff_user_id int(11) DEFAULT NULL,
  staff_signature longtext COLLATE utf8mb4_unicode_ci,
  staff_signed_at timestamp NULL DEFAULT NULL,
  signed_snapshot longtext COLLATE utf8mb4_unicode_ci,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_consents_patient (patient_id),
  KEY idx_consents_contract (contract_id),
  KEY idx_consents_appointment (appointment_id),
  KEY idx_consents_status (status),
  CONSTRAINT consents_ibfk_patient FOREIGN KEY (patient_id) REFERENCES patients (id),
  CONSTRAINT consents_ibfk_service FOREIGN KEY (service_id) REFERENCES services (id),
  CONSTRAINT consents_ibfk_contract FOREIGN KEY (contract_id) REFERENCES contracts (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

UPDATE services SET is_active = 0 WHERE id BETWEEN 1 AND 8;

INSERT INTO services
  (name, description, image_url, category, price, duration_minutes, package_sessions, legal_template, area_catalog, is_active)
VALUES
(
  'Venus Bliss — 5 sesiones',
  'Paquete de 5 sesiones de Venus Bliss para una sola zona. Tecnología corporal no invasiva (láser de diodo y/o aplicador MP2). Precio de paquete, octubre 2026.',
  '/assets/services/02.jpg',
  'body_treatment',
  25000.00,
  60,
  5,
  'bliss',
  '[{"id":"abdomen_alto","label":"Abdomen alto"},{"id":"abdomen_bajo","label":"Abdomen bajo"},{"id":"cintura","label":"Cintura"},{"id":"espalda_alta","label":"Espalda alta"},{"id":"espalda_baja","label":"Espalda baja"},{"id":"muslo_interno","label":"Muslo interno"},{"id":"muslo_externo","label":"Muslo externo"}]',
  1
),
(
  'Venus Legacy Radiofrecuencia — 10 sesiones',
  'Paquete de 10 sesiones de radiofrecuencia multipolar con campos electromagnéticos para una sola área. Precio de paquete, octubre 2026.',
  '/assets/services/04.jpg',
  'body_treatment',
  24900.00,
  60,
  10,
  'legacy',
  '[{"id":"cara","label":"Cara"},{"id":"cuello","label":"Cuello"},{"id":"escote","label":"Escote"},{"id":"manos","label":"Manos"},{"id":"pies","label":"Pies"},{"id":"abdomen","label":"Abdomen"},{"id":"cintura","label":"Cintura"},{"id":"espalda_alta","label":"Espalda alta"},{"id":"espalda_baja","label":"Espalda baja"},{"id":"muslo_interno","label":"Muslo interno"},{"id":"muslo_externo","label":"Muslo externo"},{"id":"gluteo","label":"Glúteo"},{"id":"cadera","label":"Cadera"},{"id":"brazo","label":"Brazo"},{"id":"pantorrillas","label":"Pantorrillas"}]',
  1
),
(
  'Venus Legacy Varipulse — 10 sesiones',
  'Paquete de 10 sesiones Varipulse de Venus Legacy para una sola área. Precio de paquete, octubre 2026.',
  '/assets/services/05.jpg',
  'body_treatment',
  26900.00,
  60,
  10,
  'legacy',
  '[{"id":"brazo","label":"Brazo"},{"id":"abdomen_alto","label":"Abdomen alto"},{"id":"abdomen_bajo","label":"Abdomen bajo"},{"id":"cintura","label":"Cintura"},{"id":"espalda_alta","label":"Espalda alta"},{"id":"espalda_baja","label":"Espalda baja"},{"id":"cadera","label":"Cadera"},{"id":"gluteo","label":"Glúteo"},{"id":"muslo_interno","label":"Muslo interno"},{"id":"muslo_externo","label":"Muslo externo"}]',
  1
),
(
  'Venus Velocity Áreas Chicas — 10 sesiones',
  'Paquete de 10 sesiones de depilación láser Venus Velocity para un área chica. Precio de paquete, octubre 2026.',
  '/assets/services/03.jpg',
  'laser_hair_removal',
  11900.00,
  45,
  10,
  'velocity',
  '[{"id":"media_cara","label":"Media cara"},{"id":"bigote","label":"Bigote"},{"id":"patillas","label":"Patillas"},{"id":"orejas","label":"Orejas"},{"id":"cuello","label":"Cuello"},{"id":"nuca","label":"Nuca"},{"id":"pezon","label":"Pezón"},{"id":"entrepecho","label":"Entrepecho"},{"id":"manos","label":"Manos"},{"id":"linea_abdomen","label":"Línea de abdomen"},{"id":"pies","label":"Pies"},{"id":"linea_interglutea","label":"Línea interglútea"},{"id":"coxis","label":"Coxis"}]',
  1
),
(
  'Venus Velocity Áreas Medianas — 10 sesiones',
  'Paquete de 10 sesiones de depilación láser Venus Velocity para un área mediana. Precio de paquete, octubre 2026.',
  '/assets/services/06.jpg',
  'laser_hair_removal',
  14900.00,
  45,
  10,
  'velocity',
  '[{"id":"cara_completa","label":"Cara completa"},{"id":"axilas","label":"Axilas"},{"id":"bikini","label":"Bikini"},{"id":"gluteos","label":"Glúteos"},{"id":"medio_brazo","label":"Medio brazo"},{"id":"medio_abdomen","label":"Medio abdomen"},{"id":"media_pierna","label":"Media pierna"},{"id":"media_espalda","label":"Media espalda"}]',
  1
),
(
  'Venus Velocity Áreas Grandes — 10 sesiones',
  'Paquete de 10 sesiones de depilación láser Venus Velocity para un área grande. Precio de paquete, octubre 2026.',
  '/assets/services/08.jpg',
  'laser_hair_removal',
  17900.00,
  45,
  10,
  'velocity',
  '[{"id":"brazo_completo","label":"Brazo completo"},{"id":"pierna_completa","label":"Pierna completa"},{"id":"espalda_completa","label":"Espalda completa"},{"id":"abdomen_completo","label":"Abdomen completo"},{"id":"pecho_completo","label":"Pecho completo"}]',
  1
);
