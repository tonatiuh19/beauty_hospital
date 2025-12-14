-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Dec 13, 2025 at 05:05 PM
-- Server version: 5.7.23-23
-- PHP Version: 8.1.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `alanchat_beauty_hospital`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_sessions`
--

CREATE TABLE `admin_sessions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `session_code` int(6) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `expires_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admin_sessions`
--

INSERT INTO `admin_sessions` (`id`, `user_id`, `session_code`, `is_active`, `expires_at`, `created_at`) VALUES
(9, 12, 283895, 0, '2025-11-13 00:38:35', '2025-11-13 00:38:19'),
(10, 12, 890520, 0, '2025-11-15 05:06:18', '2025-11-15 04:02:56'),
(11, 12, 865959, 0, '2025-11-15 05:06:18', '2025-11-15 04:15:09'),
(12, 12, 270634, 0, '2025-11-15 05:06:18', '2025-11-15 04:22:59'),
(13, 12, 110836, 0, '2025-11-15 05:06:18', '2025-11-15 04:29:28'),
(14, 12, 477610, 0, '2025-11-15 05:06:18', '2025-11-15 04:51:25'),
(15, 12, 110511, 0, '2025-11-15 05:06:18', '2025-11-15 04:56:03'),
(16, 12, 807442, 0, '2025-11-15 05:06:18', '2025-11-15 05:01:01'),
(17, 12, 397245, 0, '2025-11-15 05:06:18', '2025-11-15 05:06:04'),
(18, 12, 825751, 0, '2025-11-19 00:56:42', '2025-11-19 00:56:27'),
(19, 12, 304404, 0, '2025-11-19 03:18:40', '2025-11-19 03:18:23'),
(20, 12, 800868, 0, '2025-11-19 21:58:09', '2025-11-19 21:57:59'),
(21, 12, 490682, 0, '2025-11-19 22:07:08', '2025-11-19 22:06:34'),
(22, 13, 573310, 0, '2025-11-20 00:27:47', '2025-11-20 00:27:29'),
(23, 13, 993873, 0, '2025-11-20 05:33:50', '2025-11-20 05:31:25'),
(24, 13, 503008, 0, '2025-11-21 07:47:49', '2025-11-21 07:47:27'),
(25, 13, 196841, 0, '2025-11-22 04:42:17', '2025-11-22 04:41:58'),
(26, 13, 345982, 0, '2025-11-23 00:20:41', '2025-11-23 00:18:45'),
(27, 13, 623886, 0, '2025-11-23 00:20:41', '2025-11-23 00:20:21'),
(28, 12, 983836, 0, '2025-11-23 18:43:09', '2025-11-23 18:42:48'),
(29, 12, 556717, 0, '2025-11-24 03:49:11', '2025-11-24 03:48:53'),
(30, 12, 851522, 0, '2025-11-24 03:52:36', '2025-11-24 03:52:22'),
(31, 12, 987352, 0, '2025-11-24 05:24:06', '2025-11-24 05:23:54'),
(32, 12, 126479, 0, '2025-11-24 21:02:41', '2025-11-24 21:02:23'),
(33, 12, 758604, 0, '2025-11-25 18:41:41', '2025-11-25 18:41:27'),
(34, 12, 974780, 0, '2025-11-25 18:47:14', '2025-11-25 18:47:02'),
(35, 12, 539620, 0, '2025-11-27 21:18:54', '2025-11-27 21:18:38'),
(36, 12, 631618, 0, '2025-11-27 21:29:36', '2025-11-27 21:29:25'),
(37, 12, 674248, 0, '2025-11-27 21:49:25', '2025-11-27 21:49:14'),
(38, 12, 989162, 0, '2025-11-27 21:55:09', '2025-11-27 21:54:59'),
(39, 12, 897534, 0, '2025-11-27 22:00:19', '2025-11-27 22:00:07'),
(40, 12, 262226, 0, '2025-11-27 22:24:54', '2025-11-27 22:24:44'),
(41, 12, 527114, 0, '2025-11-27 22:37:23', '2025-11-27 22:37:08'),
(42, 13, 102324, 0, '2025-12-03 18:19:44', '2025-12-03 18:19:13'),
(43, 13, 861060, 0, '2025-12-03 18:25:09', '2025-12-03 18:24:48'),
(44, 13, 146580, 0, '2025-12-05 22:59:05', '2025-12-05 22:58:44'),
(45, 12, 139134, 0, '2025-12-12 05:22:07', '2025-12-12 05:21:55'),
(46, 12, 671428, 0, '2025-12-12 06:06:45', '2025-12-12 06:06:35'),
(47, 12, 950823, 0, '2025-12-13 21:57:30', '2025-12-13 21:57:14'),
(48, 12, 549290, 0, '2025-12-13 22:27:53', '2025-12-13 22:27:42'),
(49, 12, 457041, 0, '2025-12-13 22:29:11', '2025-12-13 22:28:56');

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `doctor_id` int(11) DEFAULT NULL,
  `service_id` int(11) NOT NULL,
  `status` enum('scheduled','confirmed','in_progress','completed','cancelled','no_show') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'scheduled',
  `scheduled_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `duration_minutes` int(11) NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` int(11) NOT NULL COMMENT 'Patient ID who created the appointment (logged-in user)',
  `booked_for_self` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Whether appointment is for the logged-in user (1) or someone else (0)',
  `booking_source` enum('online','receptionist','phone','walk_in') COLLATE utf8mb4_unicode_ci DEFAULT 'online',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `check_in_at` timestamp NULL DEFAULT NULL COMMENT 'When patient checked in',
  `check_in_by` int(11) DEFAULT NULL COMMENT 'Admin who checked in the patient',
  `contract_id` int(11) DEFAULT NULL COMMENT 'Associated contract if required',
  `cancellation_reason` text COLLATE utf8mb4_unicode_ci,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `cancelled_by` int(11) DEFAULT NULL,
  `rescheduled_from` int(11) DEFAULT NULL COMMENT 'Original appointment ID if rescheduled',
  `reminder_sent_at` timestamp NULL DEFAULT NULL COMMENT 'When reminder was sent'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `appointments`
--

INSERT INTO `appointments` (`id`, `patient_id`, `doctor_id`, `service_id`, `status`, `scheduled_at`, `duration_minutes`, `notes`, `created_by`, `booked_for_self`, `booking_source`, `created_at`, `updated_at`, `check_in_at`, `check_in_by`, `contract_id`, `cancellation_reason`, `cancelled_at`, `cancelled_by`, `rescheduled_from`, `reminder_sent_at`) VALUES
(26, 9, NULL, 3, 'confirmed', '2025-11-28 22:30:00', 90, 'Checked in at: 2025-11-27 16:38:25', 9, 1, 'online', '2025-11-27 22:36:41', '2025-11-27 22:38:25', '2025-11-27 22:38:25', NULL, 12, NULL, NULL, NULL, NULL, NULL),
(27, 9, NULL, 3, 'confirmed', '2025-12-19 21:00:00', 90, NULL, 9, 1, 'online', '2025-12-12 19:36:51', '2025-12-12 19:36:51', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `appointment_reminders`
--

CREATE TABLE `appointment_reminders` (
  `id` int(11) NOT NULL,
  `appointment_id` int(11) NOT NULL,
  `reminder_type` enum('email','whatsapp','sms') COLLATE utf8mb4_unicode_ci NOT NULL,
  `scheduled_for` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `sent_at` timestamp NULL DEFAULT NULL,
  `status` enum('pending','sent','failed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `patient_id` int(11) DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` int(11) NOT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `metadata` json DEFAULT NULL COMMENT 'Additional context about the action',
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `user_id`, `patient_id`, `action`, `entity_type`, `entity_id`, `old_values`, `new_values`, `metadata`, `ip_address`, `user_agent`, `created_at`) VALUES
(1, 12, NULL, 'admin_login', 'user', 12, NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-12 05:08:45'),
(2, 12, NULL, 'admin_login', 'user', 12, NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-12 05:11:56'),
(3, 12, NULL, 'admin_login', 'user', 12, NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-12 05:27:21'),
(4, 12, NULL, 'admin_login', 'user', 12, NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-12 05:47:50'),
(5, 12, NULL, 'admin_login', 'user', 12, NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-12 06:47:00'),
(6, 12, NULL, 'admin_login', 'user', 12, NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-12 06:57:31'),
(7, 12, NULL, 'admin_login', 'user', 12, NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-12 06:59:30'),
(8, 12, NULL, 'admin_login', 'user', 12, NULL, NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', '2025-11-13 00:38:35');

-- --------------------------------------------------------

--
-- Table structure for table `blocked_dates`
--

CREATE TABLE `blocked_dates` (
  `id` int(11) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `all_day` tinyint(1) NOT NULL DEFAULT '1',
  `reason` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `blocked_dates`
--

INSERT INTO `blocked_dates` (`id`, `start_date`, `end_date`, `start_time`, `end_time`, `all_day`, `reason`, `notes`, `created_by`, `created_at`, `updated_at`) VALUES
(1, '2025-11-15', '2025-11-15', NULL, NULL, 1, 'Día festivo', 'Clínica cerrada por festividad nacional', 1, '2025-11-10 20:18:30', '2025-11-10 20:18:30'),
(2, '2025-12-25', '2025-12-25', NULL, NULL, 1, 'Navidad', 'Cerrado por Navidad', 1, '2025-11-10 20:18:30', '2025-11-10 20:18:30'),
(3, '2026-01-01', '2026-01-01', NULL, NULL, 1, 'Año Nuevo', 'Cerrado por Año Nuevo', 1, '2025-11-10 20:18:30', '2025-11-10 20:18:30'),
(4, '2025-12-20', '2025-12-26', NULL, NULL, 1, 'Vacaciones de fin de año', 'Personal en vacaciones navideñas', 1, '2025-11-10 20:18:30', '2025-11-10 20:18:30'),
(5, '2026-02-14', '2026-02-16', NULL, NULL, 1, 'Mantenimiento de equipos', 'Mantenimiento programado de equipos láser', 1, '2025-11-10 20:18:30', '2025-11-10 20:18:30'),
(7, '2025-12-15', '2025-12-15', NULL, NULL, 1, 'Junta administrativa', 'Reunión anual del equipo', 1, '2025-11-10 20:18:30', '2025-11-10 20:18:30'),
(8, '2026-03-15', '2026-03-20', NULL, NULL, 1, 'Vacaciones de primavera', 'Clínica cerrada temporalmente', 1, '2025-11-10 20:18:30', '2025-11-10 20:18:30'),
(9, '2026-04-10', '2026-04-10', NULL, NULL, 1, 'Actualización de sistemas', 'Actualización del sistema de gestión', 1, '2025-11-10 20:18:30', '2025-11-10 20:18:30'),
(10, '2025-11-18', '2025-11-18', '09:00:00', '12:00:00', 0, 'Mantenimiento matutino', 'Mantenimiento de equipos en la mañana', 1, '2025-11-10 21:44:33', '2025-11-10 21:44:33'),
(11, '2025-11-22', '2025-11-22', '14:00:00', '18:00:00', 0, 'Capacitación vespertina', 'Capacitación del personal en la tarde', 1, '2025-11-10 21:44:33', '2025-11-10 21:44:33'),
(12, '2025-11-25', '2025-11-25', '10:00:00', '11:30:00', 0, 'Reunión ejecutiva', 'Reunión con proveedores médicos', 1, '2025-11-10 21:44:33', '2025-11-10 21:44:33'),
(13, '2025-11-27', '2025-11-27', '13:00:00', '14:30:00', 0, 'Almuerzo extendido', 'Evento especial del personal', 1, '2025-11-10 21:44:33', '2025-11-10 21:44:33'),
(14, '2025-11-29', '2025-11-29', '12:00:00', '13:00:00', 0, 'Pausa del mediodía', 'Cierre temporal para reorganización', 1, '2025-11-10 21:44:33', '2025-11-10 21:44:33'),
(15, '2025-12-01', '2025-12-05', '16:00:00', '18:00:00', 0, 'Sesiones de capacitación', 'Capacitación diaria en horario vespertino', 1, '2025-11-10 21:44:33', '2025-11-10 21:44:33'),
(16, '2025-12-10', '2025-12-10', '09:00:00', '10:30:00', 0, 'Inspección sanitaria', 'Visita de inspección de salud', 1, '2025-11-10 21:44:33', '2025-11-10 21:44:33'),
(17, '2025-12-12', '2025-12-12', '08:00:00', '09:30:00', 0, 'Preparación especial', 'Preparación de equipos para procedimiento especial', 1, '2025-11-10 21:44:33', '2025-11-10 21:44:33');

-- --------------------------------------------------------

--
-- Table structure for table `business_hours`
--

CREATE TABLE `business_hours` (
  `id` int(11) NOT NULL,
  `day_of_week` tinyint(4) NOT NULL COMMENT '0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday',
  `is_open` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Whether the hospital is open on this day',
  `open_time` time NOT NULL DEFAULT '09:00:00' COMMENT 'Opening time',
  `close_time` time NOT NULL DEFAULT '18:00:00' COMMENT 'Closing time',
  `break_start` time DEFAULT NULL COMMENT 'Optional lunch/break start time',
  `break_end` time DEFAULT NULL COMMENT 'Optional lunch/break end time',
  `notes` text COLLATE utf8mb4_unicode_ci COMMENT 'Additional notes about this day',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `business_hours`
--

INSERT INTO `business_hours` (`id`, `day_of_week`, `is_open`, `open_time`, `close_time`, `break_start`, `break_end`, `notes`, `created_at`, `updated_at`) VALUES
(1, 0, 0, '09:00:00', '18:00:00', NULL, NULL, 'Domingo - Cerrado', '2025-11-11 01:20:44', '2025-11-11 01:20:44'),
(2, 1, 1, '09:00:00', '18:00:00', '13:00:00', '14:00:00', 'Lunes', '2025-11-11 01:20:44', '2025-11-11 01:20:44'),
(3, 2, 1, '09:00:00', '18:00:00', '13:00:00', '14:00:00', 'Martes', '2025-11-11 01:20:44', '2025-11-11 01:20:44'),
(4, 3, 1, '09:00:00', '18:00:00', '13:00:00', '14:00:00', 'Miércoles', '2025-11-11 01:20:44', '2025-11-11 01:20:44'),
(5, 4, 1, '09:00:00', '18:00:00', '13:00:00', '14:00:00', 'Jueves', '2025-11-11 01:20:44', '2025-11-11 01:20:44'),
(6, 5, 1, '09:00:00', '18:00:00', '13:00:00', '14:00:00', 'Viernes', '2025-11-11 01:20:44', '2025-11-11 01:20:44'),
(7, 6, 1, '09:00:00', '14:00:00', NULL, NULL, 'Sábado - Medio día', '2025-11-11 01:20:44', '2025-11-11 01:20:44');

-- --------------------------------------------------------

--
-- Table structure for table `content_pages`
--

CREATE TABLE `content_pages` (
  `id` int(11) NOT NULL,
  `slug` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` longtext COLLATE utf8mb4_unicode_ci,
  `meta_description` text COLLATE utf8mb4_unicode_ci,
  `is_published` tinyint(1) DEFAULT '0',
  `created_by` int(11) NOT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `content_pages`
--

INSERT INTO `content_pages` (`id`, `slug`, `title`, `content`, `meta_description`, `is_published`, `created_by`, `updated_by`, `created_at`, `updated_at`) VALUES
(1, 'terms-and-conditions', 'Terms and Conditions', '<h1>Terms and Conditions</h1><p>Coming soon...</p>', NULL, 1, 1, NULL, '2025-11-12 04:42:12', '2025-11-12 04:42:12'),
(2, 'privacy-policy', 'Privacy Policy', '<h1>Privacy Policy</h1><p>Coming soon...</p>', NULL, 1, 1, NULL, '2025-11-12 04:42:12', '2025-11-12 04:42:12');

-- --------------------------------------------------------

--
-- Table structure for table `contracts`
--

CREATE TABLE `contracts` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `contract_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('draft','pending_signature','signed','completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `total_amount` decimal(10,2) NOT NULL,
  `sessions_included` int(11) NOT NULL,
  `sessions_completed` int(11) DEFAULT '0',
  `terms_and_conditions` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `pdf_url` text COLLATE utf8mb4_unicode_ci,
  `signature_data` text COLLATE utf8mb4_unicode_ci,
  `signed_at` timestamp NULL DEFAULT NULL,
  `signed_by` int(11) DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `docusign_envelope_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'DocuSign envelope ID',
  `docusign_status` enum('not_sent','sent','delivered','signed','completed','declined','voided') COLLATE utf8mb4_unicode_ci DEFAULT 'not_sent' COMMENT 'DocuSign envelope status',
  `docusign_signed_at` timestamp NULL DEFAULT NULL COMMENT 'When the document was signed in DocuSign'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `contracts`
--

INSERT INTO `contracts` (`id`, `patient_id`, `service_id`, `contract_number`, `status`, `total_amount`, `sessions_included`, `sessions_completed`, `terms_and_conditions`, `pdf_url`, `signature_data`, `signed_at`, `signed_by`, `created_by`, `created_at`, `updated_at`, `docusign_envelope_id`, `docusign_status`, `docusign_signed_at`) VALUES
(12, 9, 3, 'CON-1764283074949-9', 'signed', 1500.00, 1, 0, 'TÉRMINOS Y CONDICIONES DEL SERVICIO\n\n1. ALCANCE DEL SERVICIO\n   El presente contrato cubre las sesiones especificadas del servicio contratado.\n\n2. PROGRAMACIÓN Y ASISTENCIA\n   - Las citas deben programarse con anticipación\n   - Se requiere llegar 10 minutos antes de la hora programada\n   - En caso de no asistir sin previo aviso, se considerará como sesión utilizada\n\n3. POLÍTICA DE CANCELACIÓN\n   - Las cancelaciones deben hacerse con al menos 24 horas de anticipación\n\n4. CUIDADOS Y RECOMENDACIONES\n   - Seguir todas las indicaciones del personal médico\n   - Informar sobre cualquier cambio en el estado de salud', NULL, NULL, '2025-11-27 22:38:25', NULL, 1, '2025-11-27 22:37:55', '2025-11-27 22:38:25', '295c1709-9c0c-8911-802e-83d658b51b89', 'completed', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `coupons`
--

CREATE TABLE `coupons` (
  `id` int(11) NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `discount_type` enum('percentage','fixed_amount') COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_value` decimal(10,2) NOT NULL,
  `min_purchase_amount` decimal(10,2) DEFAULT NULL,
  `max_discount_amount` decimal(10,2) DEFAULT NULL COMMENT 'Max discount for percentage type',
  `usage_limit` int(11) DEFAULT NULL COMMENT 'Total times this coupon can be used',
  `usage_count` int(11) DEFAULT '0' COMMENT 'Times this coupon has been used',
  `per_user_limit` int(11) DEFAULT NULL COMMENT 'Max uses per user',
  `valid_from` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `valid_until` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `applicable_services` json DEFAULT NULL COMMENT 'Array of service IDs or null for all',
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `coupon_usage`
--

CREATE TABLE `coupon_usage` (
  `id` int(11) NOT NULL,
  `coupon_id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `appointment_id` int(11) DEFAULT NULL,
  `payment_id` int(11) DEFAULT NULL,
  `discount_amount` decimal(10,2) NOT NULL,
  `used_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dashboard_metrics`
--

CREATE TABLE `dashboard_metrics` (
  `id` int(11) NOT NULL,
  `metric_date` date NOT NULL,
  `total_appointments` int(11) DEFAULT '0',
  `completed_appointments` int(11) DEFAULT '0',
  `cancelled_appointments` int(11) DEFAULT '0',
  `no_show_appointments` int(11) DEFAULT '0',
  `total_revenue` decimal(10,2) DEFAULT '0.00',
  `total_refunds` decimal(10,2) DEFAULT '0.00',
  `new_patients` int(11) DEFAULT '0',
  `active_contracts` int(11) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invoice_requests`
--

CREATE TABLE `invoice_requests` (
  `id` int(11) NOT NULL,
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
  `pdf_url` text COLLATE utf8mb4_unicode_ci COMMENT 'URL to generated PDF invoice',
  `xml_url` text COLLATE utf8mb4_unicode_ci COMMENT 'URL to generated XML invoice',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `processed_by` int(11) DEFAULT NULL COMMENT 'Admin user who processed the invoice',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `processed_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `medical_media`
--

CREATE TABLE `medical_media` (
  `id` int(11) NOT NULL,
  `medical_record_id` int(11) NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_url` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` int(11) NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `uploaded_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `medical_records`
--

CREATE TABLE `medical_records` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `appointment_id` int(11) DEFAULT NULL,
  `visit_date` date NOT NULL,
  `diagnosis` text COLLATE utf8mb4_unicode_ci,
  `treatment` text COLLATE utf8mb4_unicode_ci,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `allergies` text COLLATE utf8mb4_unicode_ci,
  `medications` text COLLATE utf8mb4_unicode_ci,
  `prescriptions` text COLLATE utf8mb4_unicode_ci,
  `files` json DEFAULT NULL COMMENT 'Array of file URLs/paths',
  `medical_history` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `appointment_id` int(11) DEFAULT NULL,
  `type` enum('email','whatsapp','sms') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','sent','delivered','failed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `recipient` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `sent_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `patients`
--

CREATE TABLE `patients` (
  `id` int(11) NOT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('patient') COLLATE utf8mb4_unicode_ci DEFAULT 'patient',
  `is_email_verified` tinyint(1) DEFAULT '0',
  `last_login` timestamp NULL DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` enum('male','female','other') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zip_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emergency_contact_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emergency_contact_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `patients`
--

INSERT INTO `patients` (`id`, `first_name`, `last_name`, `email`, `password_hash`, `role`, `is_email_verified`, `last_login`, `phone`, `date_of_birth`, `gender`, `address`, `city`, `state`, `zip_code`, `emergency_contact_name`, `emergency_contact_phone`, `notes`, `is_active`, `created_at`, `updated_at`) VALUES
(9, 'Alex', 'Gomez', 'axgoomez@gmail.com', NULL, 'patient', 1, '2025-12-12 19:36:33', '4741400364', '1999-08-19', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2025-11-11 04:25:54', '2025-12-12 19:36:33'),
(10, 'Felix', 'Gomez', 'tonatiuh.gom@gmail.com', NULL, 'patient', 1, '2025-11-12 05:46:39', '4741400363', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2025-11-11 04:37:34', '2025-11-12 05:46:39'),
(11, 'Felix', 'Gomez', 'test@gmail.com', NULL, 'patient', 0, NULL, '1234567890', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2025-11-11 05:13:59', '2025-11-11 05:13:59'),
(12, 'Machaca', 'Gomez', 'machaca@gmail.com', NULL, 'patient', 0, NULL, '+52 474 140 0363', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2025-11-11 05:21:46', '2025-11-11 05:21:46'),
(13, 'Hebert', 'Montecino', 'hebert@dupeadsmedia.com', NULL, 'patient', 1, '2025-11-23 00:17:17', '+529095279692', '1994-11-20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2025-11-19 22:33:09', '2025-11-23 00:17:17');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `appointment_id` int(11) DEFAULT NULL,
  `patient_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` enum('cash','credit_card','debit_card','transfer','stripe') COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_status` enum('pending','processing','completed','failed','refunded','partially_refunded') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `stripe_payment_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stripe_payment_intent_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transaction_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `refund_amount` decimal(10,2) DEFAULT NULL,
  `refund_reason` text COLLATE utf8mb4_unicode_ci,
  `refunded_at` timestamp NULL DEFAULT NULL,
  `refunded_by` int(11) DEFAULT NULL,
  `refund_approved_by` int(11) DEFAULT NULL COMMENT 'General admin who approved refund',
  `refund_approved_at` timestamp NULL DEFAULT NULL,
  `refund_status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `coupon_id` int(11) DEFAULT NULL COMMENT 'Coupon used for this payment',
  `discount_amount` decimal(10,2) DEFAULT '0.00' COMMENT 'Discount applied from coupon',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `processed_by` int(11) NOT NULL,
  `processed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `appointment_id`, `patient_id`, `amount`, `payment_method`, `payment_status`, `stripe_payment_id`, `stripe_payment_intent_id`, `transaction_id`, `refund_amount`, `refund_reason`, `refunded_at`, `refunded_by`, `refund_approved_by`, `refund_approved_at`, `refund_status`, `coupon_id`, `discount_amount`, `notes`, `processed_by`, `processed_at`, `created_at`, `updated_at`) VALUES
(19, NULL, 9, 1500.00, 'stripe', 'completed', 'pi_3SV0NPAxpuzS9HfB3gU0eOQj', 'pi_3SV0NPAxpuzS9HfB3gU0eOQj', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 9, '2025-11-19 01:40:18', '2025-11-19 01:40:18', '2025-11-19 01:40:18'),
(20, NULL, 9, 1500.00, 'stripe', 'completed', 'pi_3SV0o1AxpuzS9HfB3QyhXkPs', 'pi_3SV0o1AxpuzS9HfB3QyhXkPs', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 9, '2025-11-19 02:07:54', '2025-11-19 02:07:54', '2025-11-19 02:07:54'),
(21, NULL, 9, 1500.00, 'stripe', 'completed', 'pi_3SV28IAxpuzS9HfB3AVQEAyX', 'pi_3SV28IAxpuzS9HfB3AVQEAyX', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 9, '2025-11-19 03:33:13', '2025-11-19 03:33:13', '2025-11-19 03:33:13'),
(22, NULL, 9, 800.00, 'stripe', 'completed', 'pi_3SV2DHAxpuzS9HfB11dIVkXM', 'pi_3SV2DHAxpuzS9HfB11dIVkXM', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 9, '2025-11-19 03:38:00', '2025-11-19 03:38:00', '2025-11-19 03:38:00'),
(23, NULL, 9, 1500.00, 'stripe', 'completed', 'pi_3SWj3sAxpuzS9HfB0wNu7dSl', 'pi_3SWj3sAxpuzS9HfB0wNu7dSl', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 9, '2025-11-23 19:35:24', '2025-11-23 19:35:24', '2025-11-23 19:35:24'),
(24, 26, 9, 1500.00, 'stripe', 'completed', 'pi_3SYDneAxpuzS9HfB017Gt4xD', 'pi_3SYDneAxpuzS9HfB017Gt4xD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 9, '2025-11-27 22:36:41', '2025-11-27 22:36:41', '2025-11-27 22:36:41'),
(25, 27, 9, 1500.00, 'stripe', 'completed', 'pi_3Sdc8n47qEGGczco00NdNPyQ', 'pi_3Sdc8n47qEGGczco00NdNPyQ', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 9, '2025-12-12 19:36:51', '2025-12-12 19:36:51', '2025-12-12 19:36:51');

-- --------------------------------------------------------

--
-- Table structure for table `refresh_tokens`
--

CREATE TABLE `refresh_tokens` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `patient_id` int(11) DEFAULT NULL,
  `token` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `refresh_tokens`
--

INSERT INTO `refresh_tokens` (`id`, `user_id`, `patient_id`, `token`, `expires_at`, `created_at`) VALUES
(1, NULL, 9, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OSwiZW1haWwiOiJheGdvb21lekBnbWFpbC5jb20iLCJyb2xlIjoicGF0aWVudCIsImlhdCI6MTc2MjgzNTE2NywiZXhwIjoxNzYzNDM5OTY3fQ.p_YninY4EOtkXRhlZsxfkdkp2kBRyFPsdAoCDXNGdpA', '2025-11-18 04:26:07', '2025-11-11 04:26:07'),
(2, NULL, 9, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OSwiZW1haWwiOiJheGdvb21lekBnbWFpbC5jb20iLCJyb2xlIjoicGF0aWVudCIsImlhdCI6MTc2MjgzNzU2MCwiZXhwIjoxNzYzNDQyMzYwfQ.oG_0c2iOf8lgSizQa9legZy5s9J4PAjskOOvBumisko', '2025-11-18 05:06:01', '2025-11-11 05:06:00'),
(3, NULL, 9, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OSwiZW1haWwiOiJheGdvb21lekBnbWFpbC5jb20iLCJyb2xlIjoicGF0aWVudCIsImlhdCI6MTc2MjgzODQ4NCwiZXhwIjoxNzYzNDQzMjg0fQ.3z9tMfqjwINqEa9ar1KCgl-rWGh-dIzvUTVneTQKifM', '2025-11-18 05:21:24', '2025-11-11 05:21:24'),
(4, 12, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIsImVtYWlsIjoiYXhnb29tZXpAZ21haWwuY29tIiwicm9sZSI6ImdlbmVyYWxfYWRtaW4iLCJpYXQiOjE3NjI5MjQxMjUsImV4cCI6MTc2MzUyODkyNX0.WR1J4y_PW4l-rNP6RIhRsOvYad4HEIugldWzWUK_L7M', '2025-11-19 05:08:45', '2025-11-12 05:08:45'),
(5, 12, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIsImVtYWlsIjoiYXhnb29tZXpAZ21haWwuY29tIiwicm9sZSI6ImdlbmVyYWxfYWRtaW4iLCJpYXQiOjE3NjI5MjQzMTYsImV4cCI6MTc2MzUyOTExNn0.7U6XLsf0qdXZXVuKVIe3dvOFkRJx77gDyK_d_kOgdsU', '2025-11-19 05:11:56', '2025-11-12 05:11:56'),
(6, 12, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIsImVtYWlsIjoiYXhnb29tZXpAZ21haWwuY29tIiwicm9sZSI6ImdlbmVyYWxfYWRtaW4iLCJpYXQiOjE3NjI5MjUyNDEsImV4cCI6MTc2MzUzMDA0MX0.G7VM-or7msf858Mnm5BLSmDIIqYoeAvY1Gi1muxLCl4', '2025-11-19 05:27:22', '2025-11-12 05:27:21'),
(7, NULL, 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImVtYWlsIjoidG9uYXRpdWguZ29tQGdtYWlsLmNvbSIsInJvbGUiOiJwYXRpZW50IiwiaWF0IjoxNzYyOTI2Mzk4LCJleHAiOjE3NjM1MzExOTh9.M4o4GeiOfjnOS-caYoVNona4UDzyJkYYWeB1mYtPl74', '2025-11-19 05:46:39', '2025-11-12 05:46:39'),
(8, 12, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIsImVtYWlsIjoiYXhnb29tZXpAZ21haWwuY29tIiwicm9sZSI6ImdlbmVyYWxfYWRtaW4iLCJpYXQiOjE3NjI5MjY0NzAsImV4cCI6MTc2MzUzMTI3MH0.HHm9IuZGpl5E5LICFouBmpCDZBCxhaFor-OWbw7YRvo', '2025-11-19 05:47:50', '2025-11-12 05:47:50'),
(9, 12, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIsImVtYWlsIjoiYXhnb29tZXpAZ21haWwuY29tIiwicm9sZSI6ImdlbmVyYWxfYWRtaW4iLCJpYXQiOjE3NjI5MzAwMTksImV4cCI6MTc2MzUzNDgxOX0.a2EeY_DBPWfHKp82_Et5CO5_Tingk2aQJPq0I9ZqRfg', '2025-11-19 06:47:00', '2025-11-12 06:47:00'),
(10, 12, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIsImVtYWlsIjoiYXhnb29tZXpAZ21haWwuY29tIiwicm9sZSI6ImdlbmVyYWxfYWRtaW4iLCJpYXQiOjE3NjI5MzA2NTAsImV4cCI6MTc2MzUzNTQ1MH0.PSygW1F8Gdblj_lSHMv_DlDjS6BsGoU68PXkw2JhX1o', '2025-11-19 06:57:31', '2025-11-12 06:57:31'),
(11, 12, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIsImVtYWlsIjoiYXhnb29tZXpAZ21haWwuY29tIiwicm9sZSI6ImdlbmVyYWxfYWRtaW4iLCJpYXQiOjE3NjI5MzA3NzAsImV4cCI6MTc2MzUzNTU3MH0.RGQH3CpyVS-6IpNhXkc8y6F73OSMGYtsA0AJt9Uf1AM', '2025-11-19 06:59:31', '2025-11-12 06:59:30'),
(12, NULL, 9, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OSwiZW1haWwiOiJheGdvb21lekBnbWFpbC5jb20iLCJyb2xlIjoicGF0aWVudCIsImlhdCI6MTc2Mjk5NDE4MSwiZXhwIjoxNzYzNTk4OTgxfQ.9QTsfVfEedv_lkvBobZYkWeuO_CQdbddzSgKmMkHFEI', '2025-11-20 00:36:21', '2025-11-13 00:36:21'),
(13, 12, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIsImVtYWlsIjoiYXhnb29tZXpAZ21haWwuY29tIiwicm9sZSI6ImdlbmVyYWxfYWRtaW4iLCJpYXQiOjE3NjI5OTQzMTUsImV4cCI6MTc2MzU5OTExNX0.Jj5b8UJYfnb6GFSnvFMtmU3fNXi_WIislsZivw9_9Uw', '2025-11-20 00:38:35', '2025-11-13 00:38:35');

-- --------------------------------------------------------

--
-- Table structure for table `services`
--

CREATE TABLE `services` (
  `id` int(11) NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `category` enum('laser_hair_removal','facial_treatment','body_treatment','consultation','other') COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `duration_minutes` int(11) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `services`
--

INSERT INTO `services` (`id`, `name`, `description`, `category`, `price`, `duration_minutes`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Láser Diodo - Área Pequeña', 'Depilación láser en área pequeña (labio superior, mentón)', 'laser_hair_removal', 500.00, 30, 1, '2025-11-03 01:54:22', '2025-11-03 01:54:22'),
(2, 'Láser Diodo - Área Mediana', 'Depilación láser en área mediana (axilas, bikini)', 'laser_hair_removal', 800.00, 45, 1, '2025-11-03 01:54:22', '2025-11-03 01:54:22'),
(3, 'Láser Diodo - Área Grande', 'Depilación láser en área grande (piernas completas, espalda)', 'laser_hair_removal', 1500.00, 90, 1, '2025-11-03 01:54:22', '2025-11-03 01:54:22'),
(4, 'Limpieza Facial Profunda', 'Limpieza facial completa con extracción y mascarilla', 'facial_treatment', 1200.00, 60, 1, '2025-11-03 01:54:22', '2025-11-03 01:54:22'),
(5, 'Tratamiento Corporal Reductivo', 'Tratamiento corporal para reducción de medidas', 'body_treatment', 2000.00, 90, 1, '2025-11-03 01:54:22', '2025-11-03 01:54:22'),
(6, 'Consulta Inicial', 'Consulta médica inicial con evaluación', 'consultation', 300.00, 30, 1, '2025-11-03 01:54:22', '2025-11-03 01:54:22');

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_unicode_ci,
  `setting_type` enum('text','number','boolean','json') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'text',
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'general' COMMENT 'general, notifications, payments, etc',
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_public` tinyint(1) DEFAULT '0' COMMENT 'Whether setting is visible to non-admin users',
  `updated_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `category`, `description`, `is_public`, `updated_by`, `created_at`, `updated_at`) VALUES
(1, 'site_name', 'Beauty Hospital', 'text', 'general', 'Name of the clinic', 1, NULL, '2025-11-12 04:42:12', '2025-11-12 04:42:12'),
(2, 'site_description', 'Your trusted medical aesthetic center', 'text', 'general', 'Site description', 1, NULL, '2025-11-12 04:42:12', '2025-11-12 04:42:12'),
(3, 'contact_email', 'info@beautyhospital.com', 'text', 'general', 'Contact email', 1, NULL, '2025-11-12 04:42:12', '2025-11-12 04:42:12'),
(4, 'contact_phone', '+1234567890', 'text', 'general', 'Contact phone number', 1, NULL, '2025-11-12 04:42:12', '2025-11-12 04:42:12'),
(5, 'address', '123 Beauty Street, Medical District', 'text', 'general', 'Physical address', 1, NULL, '2025-11-12 04:42:12', '2025-11-12 04:42:12'),
(6, 'whatsapp_enabled', 'true', 'boolean', 'notifications', 'Enable WhatsApp notifications', 0, NULL, '2025-11-12 04:42:12', '2025-11-12 04:42:12'),
(7, 'email_enabled', 'true', 'boolean', 'notifications', 'Enable email notifications', 0, NULL, '2025-11-12 04:42:12', '2025-11-12 04:42:12'),
(8, 'reminder_hours_before', '24', 'number', 'notifications', 'Hours before appointment to send reminder', 0, NULL, '2025-11-12 04:42:12', '2025-11-12 04:42:12'),
(9, 'auto_refund_enabled', 'false', 'boolean', 'payments', 'Enable automatic refunds without approval', 0, NULL, '2025-11-12 04:42:12', '2025-11-12 04:42:12'),
(10, 'cancellation_deadline_hours', '24', 'number', 'appointments', 'Hours before appointment when cancellation is allowed', 0, NULL, '2025-11-12 04:42:12', '2025-11-12 04:42:12'),
(11, 'terms_and_conditions', '', 'text', 'legal', 'Terms and conditions text', 1, NULL, '2025-11-12 04:42:12', '2025-11-12 04:42:12'),
(12, 'privacy_policy', '', 'text', 'legal', 'Privacy policy text', 1, NULL, '2025-11-12 04:42:12', '2025-11-12 04:42:12');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('admin','general_admin','receptionist','doctor','pos','patient') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'patient',
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profile_picture_url` text COLLATE utf8mb4_unicode_ci,
  `specialization` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'For doctors',
  `employee_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Employee identification number',
  `is_active` tinyint(1) DEFAULT '1',
  `is_email_verified` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `role`, `first_name`, `last_name`, `phone`, `profile_picture_url`, `specialization`, `employee_id`, `is_active`, `is_email_verified`, `created_at`, `updated_at`, `last_login`) VALUES
(1, 'admin@beautyhospital.com', '$2b$10$TBsX8oVXgbglL8nZqEpygO0PliVXZRqbQHPOEaUxKwhdfHr27ir5a', 'admin', 'Admin', 'User', '+1234567890', NULL, NULL, NULL, 1, 0, '2025-11-03 01:54:22', '2025-11-03 01:54:22', NULL),
(9, 'axgoomezzzz@gmail.com', '', 'patient', 'Alex', 'Gomez', '4741400363', NULL, NULL, NULL, 1, 0, '2025-11-10 17:33:24', '2025-11-12 04:43:04', '2025-11-11 03:04:36'),
(10, 'receptionist@beautyhospital.com', '', 'receptionist', 'Maria', 'Garcia', '+1234567891', NULL, NULL, 'EMP001', 1, 0, '2025-11-12 04:42:13', '2025-11-12 04:42:13', NULL),
(11, 'doctor@beautyhospital.com', '', 'doctor', 'Dr. Juan', 'Martinez', '+1234567892', NULL, NULL, 'DOC001', 1, 0, '2025-11-12 04:42:13', '2025-11-12 04:42:13', NULL),
(12, 'axgoomez@gmail.com', '', 'general_admin', 'Alex', 'Gomez', '+1234567893', NULL, NULL, 'ADM001', 1, 1, '2025-11-12 04:42:13', '2025-12-13 22:29:11', '2025-12-13 22:29:11'),
(13, 'hebert@dupeadsmedia.com', '', 'general_admin', 'Hebert', 'Montecinos', NULL, NULL, '', 'ADM002', 1, 1, '2025-11-19 22:15:46', '2025-12-05 22:59:05', '2025-12-05 22:59:05');

-- --------------------------------------------------------

--
-- Table structure for table `users_sessions`
--

CREATE TABLE `users_sessions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `patient_id` int(11) DEFAULT NULL,
  `session_code` int(6) NOT NULL,
  `user_session` tinyint(1) NOT NULL DEFAULT '0',
  `user_session_date_start` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users_sessions`
--

INSERT INTO `users_sessions` (`id`, `user_id`, `patient_id`, `session_code`, `user_session`, `user_session_date_start`, `created_at`) VALUES
(16, NULL, 10, 672509, 1, '2025-11-12 05:46:26', '2025-11-23 19:13:10'),
(29, NULL, 13, 895861, 1, '2025-11-23 06:15:49', '2025-11-23 19:13:10'),
(36, NULL, 9, 171389, 1, '2025-12-12 19:36:21', '2025-12-12 19:36:20');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_sessions`
--
ALTER TABLE `admin_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_session_code` (`session_code`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_expires_at` (`expires_at`);

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_patient_id` (`patient_id`),
  ADD KEY `idx_doctor_id` (`doctor_id`),
  ADD KEY `idx_service_id` (`service_id`),
  ADD KEY `idx_scheduled_at` (`scheduled_at`),
  ADD KEY `idx_booked_for_self` (`booked_for_self`),
  ADD KEY `idx_created_by` (`created_by`),
  ADD KEY `idx_check_in_at` (`check_in_at`),
  ADD KEY `idx_check_in_by` (`check_in_by`),
  ADD KEY `idx_contract_id` (`contract_id`),
  ADD KEY `idx_cancelled_by` (`cancelled_by`),
  ADD KEY `idx_rescheduled_from` (`rescheduled_from`),
  ADD KEY `idx_booking_source` (`booking_source`);

--
-- Indexes for table `appointment_reminders`
--
ALTER TABLE `appointment_reminders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_appointment_id` (`appointment_id`),
  ADD KEY `idx_scheduled_for` (`scheduled_for`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_entity` (`entity_type`,`entity_id`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_patient_id` (`patient_id`);

--
-- Indexes for table `blocked_dates`
--
ALTER TABLE `blocked_dates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_start_date` (`start_date`),
  ADD KEY `idx_end_date` (`end_date`),
  ADD KEY `idx_date_range` (`start_date`,`end_date`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_active_blocks` (`start_date`,`end_date`),
  ADD KEY `idx_time_range` (`start_time`,`end_time`),
  ADD KEY `idx_created_by` (`created_by`);

--
-- Indexes for table `business_hours`
--
ALTER TABLE `business_hours`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_day` (`day_of_week`);

--
-- Indexes for table `content_pages`
--
ALTER TABLE `content_pages`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_slug` (`slug`),
  ADD KEY `idx_slug` (`slug`),
  ADD KEY `idx_is_published` (`is_published`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `updated_by` (`updated_by`);

--
-- Indexes for table `contracts`
--
ALTER TABLE `contracts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `contract_number` (`contract_number`),
  ADD KEY `service_id` (`service_id`),
  ADD KEY `signed_by` (`signed_by`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_patient_id` (`patient_id`),
  ADD KEY `idx_contract_number` (`contract_number`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_docusign_envelope` (`docusign_envelope_id`);

--
-- Indexes for table `coupons`
--
ALTER TABLE `coupons`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_code` (`code`),
  ADD KEY `idx_code` (`code`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_valid_dates` (`valid_from`,`valid_until`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `coupon_usage`
--
ALTER TABLE `coupon_usage`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_coupon_id` (`coupon_id`),
  ADD KEY `idx_patient_id` (`patient_id`),
  ADD KEY `idx_appointment_id` (`appointment_id`),
  ADD KEY `idx_payment_id` (`payment_id`);

--
-- Indexes for table `dashboard_metrics`
--
ALTER TABLE `dashboard_metrics`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_metric_date` (`metric_date`),
  ADD KEY `idx_metric_date` (`metric_date`);

--
-- Indexes for table `invoice_requests`
--
ALTER TABLE `invoice_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_invoice_number` (`invoice_number`),
  ADD KEY `idx_appointment_id` (`appointment_id`),
  ADD KEY `idx_patient_id` (`patient_id`),
  ADD KEY `idx_payment_id` (`payment_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `invoice_requests_ibfk_4` (`processed_by`),
  ADD KEY `idx_status_created` (`status`,`created_at`);

--
-- Indexes for table `medical_media`
--
ALTER TABLE `medical_media`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_medical_record_id` (`medical_record_id`);

--
-- Indexes for table `medical_records`
--
ALTER TABLE `medical_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_patient_id` (`patient_id`),
  ADD KEY `idx_doctor_id` (`doctor_id`),
  ADD KEY `idx_appointment_id` (`appointment_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_patient_id` (`patient_id`),
  ADD KEY `idx_appointment_id` (`appointment_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_type` (`type`);

--
-- Indexes for table `patients`
--
ALTER TABLE `patients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_phone` (`phone`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_name` (`first_name`,`last_name`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `processed_by` (`processed_by`),
  ADD KEY `idx_appointment_id` (`appointment_id`),
  ADD KEY `idx_patient_id` (`patient_id`),
  ADD KEY `idx_payment_status` (`payment_status`),
  ADD KEY `idx_stripe_payment_id` (`stripe_payment_id`),
  ADD KEY `idx_processed_at` (`processed_at`),
  ADD KEY `idx_refunded_by` (`refunded_by`),
  ADD KEY `idx_refund_approved_by` (`refund_approved_by`),
  ADD KEY `idx_coupon_id` (`coupon_id`),
  ADD KEY `idx_refund_status` (`refund_status`);

--
-- Indexes for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `idx_token` (`token`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_patient_id` (`patient_id`);

--
-- Indexes for table `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_setting_key` (`setting_key`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `updated_by` (`updated_by`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `users_sessions`
--
ALTER TABLE `users_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_patient_id` (`patient_id`),
  ADD KEY `idx_session_code` (`session_code`),
  ADD KEY `idx_user_session` (`user_session`),
  ADD KEY `idx_user_session_date_start` (`user_session_date_start`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin_sessions`
--
ALTER TABLE `admin_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `appointment_reminders`
--
ALTER TABLE `appointment_reminders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `blocked_dates`
--
ALTER TABLE `blocked_dates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `business_hours`
--
ALTER TABLE `business_hours`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `content_pages`
--
ALTER TABLE `content_pages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `contracts`
--
ALTER TABLE `contracts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `coupons`
--
ALTER TABLE `coupons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `coupon_usage`
--
ALTER TABLE `coupon_usage`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dashboard_metrics`
--
ALTER TABLE `dashboard_metrics`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `invoice_requests`
--
ALTER TABLE `invoice_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `medical_media`
--
ALTER TABLE `medical_media`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `medical_records`
--
ALTER TABLE `medical_records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `patients`
--
ALTER TABLE `patients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `services`
--
ALTER TABLE `services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `users_sessions`
--
ALTER TABLE `users_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admin_sessions`
--
ALTER TABLE `admin_sessions`
  ADD CONSTRAINT `admin_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `appointments_ibfk_3` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`),
  ADD CONSTRAINT `appointments_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `appointments_ibfk_5` FOREIGN KEY (`check_in_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `appointments_ibfk_6` FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `appointments_ibfk_7` FOREIGN KEY (`cancelled_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `appointments_ibfk_8` FOREIGN KEY (`rescheduled_from`) REFERENCES `appointments` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `appointment_reminders`
--
ALTER TABLE `appointment_reminders`
  ADD CONSTRAINT `appointment_reminders_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `audit_logs_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `audit_logs_ibfk_3` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `blocked_dates`
--
ALTER TABLE `blocked_dates`
  ADD CONSTRAINT `blocked_dates_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `content_pages`
--
ALTER TABLE `content_pages`
  ADD CONSTRAINT `content_pages_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `content_pages_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `contracts`
--
ALTER TABLE `contracts`
  ADD CONSTRAINT `contracts_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`),
  ADD CONSTRAINT `contracts_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`),
  ADD CONSTRAINT `contracts_ibfk_3` FOREIGN KEY (`signed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `contracts_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `coupons`
--
ALTER TABLE `coupons`
  ADD CONSTRAINT `coupons_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `coupon_usage`
--
ALTER TABLE `coupon_usage`
  ADD CONSTRAINT `coupon_usage_ibfk_1` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `coupon_usage_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `coupon_usage_ibfk_3` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `coupon_usage_ibfk_4` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `invoice_requests`
--
ALTER TABLE `invoice_requests`
  ADD CONSTRAINT `invoice_requests_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `invoice_requests_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `invoice_requests_ibfk_3` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `invoice_requests_ibfk_4` FOREIGN KEY (`processed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `medical_media`
--
ALTER TABLE `medical_media`
  ADD CONSTRAINT `medical_media_ibfk_1` FOREIGN KEY (`medical_record_id`) REFERENCES `medical_records` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `medical_records`
--
ALTER TABLE `medical_records`
  ADD CONSTRAINT `medical_records_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `medical_records_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `medical_records_ibfk_3` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`),
  ADD CONSTRAINT `payments_ibfk_3` FOREIGN KEY (`processed_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `payments_ibfk_4` FOREIGN KEY (`refunded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `payments_ibfk_5` FOREIGN KEY (`refund_approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `payments_ibfk_6` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD CONSTRAINT `refresh_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `refresh_tokens_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `refresh_tokens_ibfk_3` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `settings`
--
ALTER TABLE `settings`
  ADD CONSTRAINT `settings_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `users_sessions`
--
ALTER TABLE `users_sessions`
  ADD CONSTRAINT `users_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `users_sessions_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `users_sessions_ibfk_3` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
