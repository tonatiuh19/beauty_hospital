-- Velocity contract: up to 4 zones, 90% hair-count guarantee, extra free sessions.
-- Bliss/Legacy stay one area. Velocity area catalogs gain size + unit price.

ALTER TABLE contracts
  ADD COLUMN selected_zones json DEFAULT NULL
    COMMENT 'Array of {id,label,size,price} for Velocity multi-zone packages',
  ADD COLUMN guarantee_status varchar(32) NOT NULL DEFAULT 'not_applicable'
    COMMENT 'not_applicable | pending_baseline | in_progress | pending_eval | active | met | suspended',
  ADD COLUMN guarantee_evaluated_at timestamp NULL DEFAULT NULL,
  ADD COLUMN extra_sessions_granted int(11) NOT NULL DEFAULT 0
    COMMENT 'Staff-granted free sessions after 90% guarantee is active';

CREATE TABLE IF NOT EXISTS contract_zone_measurements (
  id int(11) NOT NULL AUTO_INCREMENT,
  contract_id int(11) NOT NULL,
  zone_id varchar(80) NOT NULL,
  zone_label varchar(200) NOT NULL,
  baseline_count int(11) DEFAULT NULL,
  baseline_at timestamp NULL DEFAULT NULL,
  final_count int(11) DEFAULT NULL,
  final_at timestamp NULL DEFAULT NULL,
  reduction_pct decimal(6,2) DEFAULT NULL,
  met_90 tinyint(1) DEFAULT NULL,
  notes text COLLATE utf8mb4_unicode_ci,
  recorded_by int(11) DEFAULT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_contract_zone (contract_id, zone_id),
  KEY idx_czm_contract (contract_id),
  CONSTRAINT czm_ibfk_contract FOREIGN KEY (contract_id) REFERENCES contracts (id) ON DELETE CASCADE,
  CONSTRAINT czm_ibfk_user FOREIGN KEY (recorded_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

UPDATE services
SET
  description = 'Paquete de 10 sesiones de depilación láser Venus Velocity por área chica ($11,900). El contrato permite hasta 4 zonas; el total es la suma del precio de cada área.',
  area_catalog = '[{"id":"media_cara","label":"Media cara","size":"chica","price":11900},{"id":"bigote","label":"Bigote","size":"chica","price":11900},{"id":"patillas","label":"Patillas","size":"chica","price":11900},{"id":"orejas","label":"Orejas","size":"chica","price":11900},{"id":"cuello","label":"Cuello","size":"chica","price":11900},{"id":"nuca","label":"Nuca","size":"chica","price":11900},{"id":"pezon","label":"Pezón","size":"chica","price":11900},{"id":"entrepecho","label":"Entrepecho","size":"chica","price":11900},{"id":"manos","label":"Manos","size":"chica","price":11900},{"id":"linea_abdomen","label":"Línea de abdomen","size":"chica","price":11900},{"id":"pies","label":"Pies","size":"chica","price":11900},{"id":"linea_interglutea","label":"Línea interglútea","size":"chica","price":11900},{"id":"coxis","label":"Coxis","size":"chica","price":11900}]'
WHERE legal_template = 'velocity' AND name LIKE '%Chicas%';

UPDATE services
SET
  description = 'Paquete de 10 sesiones de depilación láser Venus Velocity por área mediana ($14,900). El contrato permite hasta 4 zonas; el total es la suma del precio de cada área.',
  area_catalog = '[{"id":"cara_completa","label":"Cara completa","size":"mediana","price":14900},{"id":"axilas","label":"Axilas","size":"mediana","price":14900},{"id":"bikini","label":"Bikini","size":"mediana","price":14900},{"id":"gluteos","label":"Glúteos","size":"mediana","price":14900},{"id":"medio_brazo","label":"Medio brazo","size":"mediana","price":14900},{"id":"medio_abdomen","label":"Medio abdomen","size":"mediana","price":14900},{"id":"media_pierna","label":"Media pierna","size":"mediana","price":14900},{"id":"media_espalda","label":"Media espalda","size":"mediana","price":14900}]'
WHERE legal_template = 'velocity' AND name LIKE '%Medianas%';

UPDATE services
SET
  description = 'Paquete de 10 sesiones de depilación láser Venus Velocity por área grande ($17,900). El contrato permite hasta 4 zonas; el total es la suma del precio de cada área.',
  area_catalog = '[{"id":"brazo_completo","label":"Brazo completo","size":"grande","price":17900},{"id":"pierna_completa","label":"Pierna completa","size":"grande","price":17900},{"id":"espalda_completa","label":"Espalda completa","size":"grande","price":17900},{"id":"abdomen_completo","label":"Abdomen completo","size":"grande","price":17900},{"id":"pecho_completo","label":"Pecho completo","size":"grande","price":17900}]'
WHERE legal_template = 'velocity' AND name LIKE '%Grandes%';
