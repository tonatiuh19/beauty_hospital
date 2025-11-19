-- Create invoice_requests table
CREATE TABLE IF NOT EXISTS `invoice_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `appointment_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `payment_id` int(11) NOT NULL,
  `invoice_number` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rfc` varchar(13) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'RFC (Registro Federal de Contribuyentes)',
  `business_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Razón Social',
  `cfdi_use` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Uso de CFDI: G01, G03, D01, etc.',
  `payment_method` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Forma de pago: PUE, PPD',
  `payment_type` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Método de pago: 01, 02, 03, 04, 28',
  `fiscal_address` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'JSON with address details',
  `status` enum('pending','processing','completed','failed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `pdf_url` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'URL to generated PDF invoice',
  `xml_url` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'URL to generated XML invoice',
  `notes` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `processed_by` int(11) DEFAULT NULL COMMENT 'Admin user who processed the invoice',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `processed_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_invoice_number` (`invoice_number`),
  KEY `idx_appointment_id` (`appointment_id`),
  KEY `idx_patient_id` (`patient_id`),
  KEY `idx_payment_id` (`payment_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `invoice_requests_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `invoice_requests_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `invoice_requests_ibfk_3` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `invoice_requests_ibfk_4` FOREIGN KEY (`processed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add index for admin queries
CREATE INDEX idx_status_created ON invoice_requests(status, created_at DESC);
