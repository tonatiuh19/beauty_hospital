-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jan 05, 2026 at 02:17 PM
-- Server version: 5.7.23-23
-- PHP Version: 8.1.34

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
(49, 12, 457041, 0, '2025-12-13 22:29:11', '2025-12-13 22:28:56'),
(50, 12, 774011, 0, '2025-12-14 01:03:14', '2025-12-14 01:03:01'),
(51, 12, 437879, 0, '2025-12-15 01:52:31', '2025-12-15 01:52:19'),
(52, 12, 519356, 0, '2025-12-15 02:56:10', '2025-12-15 02:55:59'),
(53, 12, 242919, 0, '2025-12-15 03:26:56', '2025-12-15 03:26:44'),
(54, 11, 358690, 0, '2025-12-15 04:53:43', '2025-12-15 04:53:23'),
(55, 11, 674766, 0, '2025-12-15 04:56:35', '2025-12-15 04:56:20'),
(56, 12, 610713, 0, '2025-12-15 04:57:10', '2025-12-15 04:56:52'),
(57, 12, 656572, 0, '2025-12-15 19:47:32', '2025-12-15 19:47:20'),
(58, 13, 962175, 0, '2025-12-15 19:53:31', '2025-12-15 19:53:08'),
(59, 12, 168217, 0, '2025-12-17 19:24:25', '2025-12-17 19:24:14'),
(60, 12, 250191, 0, '2025-12-17 19:28:22', '2025-12-17 19:28:11'),
(61, 13, 530665, 0, '2025-12-23 05:00:29', '2025-12-23 05:00:12'),
(62, 13, 871567, 1, '2025-12-27 21:21:12', '2025-12-27 21:11:12');

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
  `reminder_sent_at` timestamp NULL DEFAULT NULL COMMENT 'When reminder was sent',
  `check_in_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Unique token for QR code check-in',
  `check_in_token_expires_at` timestamp NULL DEFAULT NULL COMMENT 'When the check-in token expires',
  `signature_data_url` text COLLATE utf8mb4_unicode_ci COMMENT 'Base64 signature image data',
  `signed_contract_pdf_url` text COLLATE utf8mb4_unicode_ci COMMENT 'URL or path to signed contract PDF',
  `contract_signed_at` timestamp NULL DEFAULT NULL COMMENT 'When patient signed the contract',
  `signature_ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'IP address from which signature was captured'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
(17, '2025-12-12', '2025-12-12', '08:00:00', '09:30:00', 0, 'Preparación especial', 'Preparación de equipos para procedimiento especial', 1, '2025-11-10 21:44:33', '2025-11-10 21:44:33'),
(18, '2025-12-27', '2025-12-27', NULL, NULL, 1, 'Mantenimiento', 'Mantenimiento', 12, '2025-12-15 05:31:31', '2025-12-15 05:31:31'),
(19, '2026-01-15', '2026-01-15', '08:00:00', '15:00:00', 0, 'Mantenimiento', 'Mantenimiento', 12, '2025-12-15 05:34:07', '2025-12-15 05:35:33');

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
-- Table structure for table `check_in_logs`
--

CREATE TABLE `check_in_logs` (
  `id` int(11) NOT NULL,
  `appointment_id` int(11) NOT NULL,
  `check_in_token` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` enum('token_generated','qr_scanned','contract_viewed','signature_completed','pdf_generated','email_sent','check_in_completed','token_expired','error') COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `metadata` json DEFAULT NULL COMMENT 'Additional context about the action',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  `signed_terms` text COLLATE utf8mb4_unicode_ci COMMENT 'Exact terms that were signed by the patient (immutable for legal compliance)',
  `pdf_url` text COLLATE utf8mb4_unicode_ci,
  `signature_data` text COLLATE utf8mb4_unicode_ci,
  `signed_at` timestamp NULL DEFAULT NULL,
  `signed_by` int(11) DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `docusign_signed_at` timestamp NULL DEFAULT NULL COMMENT 'When the document was signed in DocuSign',
  `signature_canvas_data` longtext COLLATE utf8mb4_unicode_ci COMMENT 'Full signature canvas data for re-rendering',
  `signature_ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'IP from which signature was captured',
  `signature_user_agent` text COLLATE utf8mb4_unicode_ci COMMENT 'Device/browser used for signing'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `contracts`
--

INSERT INTO `contracts` (`id`, `patient_id`, `service_id`, `contract_number`, `status`, `total_amount`, `sessions_included`, `sessions_completed`, `terms_and_conditions`, `signed_terms`, `pdf_url`, `signature_data`, `signed_at`, `signed_by`, `created_by`, `created_at`, `updated_at`, `docusign_signed_at`, `signature_canvas_data`, `signature_ip_address`, `signature_user_agent`) VALUES
(19, 9, 5, 'CON-1765770562253-9', 'signed', 2000.00, 1, 0, 'Luxury & Wellness, en lo sucesivo “EL PRESTADOR”, y el cliente cuyos datos aparecen en la parte superior del presente documento, en lo sucesivo “EL CLIENTE”, conforme a las siguientes declaraciones y cláusulas:\n\nDECLARACIONES\n\nI. Declara EL PRESTADOR que:\na) Es una entidad legalmente constituida conforme a las leyes de los Estados Unidos Mexicanos.\nb) Cuenta con el personal capacitado, instalaciones y equipos necesarios para la prestación de servicios de depilación estética.\nc) Cumple con las normas sanitarias y regulatorias aplicables.\n\nII. Declara EL CLIENTE que:\na) Es mayor de edad y cuenta con capacidad legal para contratar los servicios descritos.\nb) La información mostrada en la parte superior del presente contrato es correcta y fue proporcionada por él/ella mismo(a).\nc) Ha informado de manera veraz cualquier condición médica, alergia, tratamiento dermatológico, embarazo o padecimiento relevante.\n\nIII. Declaran ambas partes que reconocen la validez legal del presente contrato y se obligan conforme a sus términos.\n\nCLÁUSULAS\n\nPRIMERA. OBJETO\nEL PRESTADOR se obliga a prestar a EL CLIENTE servicios de depilación estética, ya sea mediante láser, cera, luz pulsada u otros métodos disponibles en All Beauty Luxury & Wellness, de acuerdo con la evaluación previa realizada.\n\nSEGUNDA. CONSENTIMIENTO INFORMADO\nEL CLIENTE manifiesta que ha recibido información clara y suficiente sobre el procedimiento, posibles molestias, riesgos, efectos secundarios, cuidados posteriores y resultados esperados, otorgando su consentimiento libre y voluntario.\n\nTERCERA. ESTADO DE SALUD\nEL CLIENTE declara no presentar condiciones médicas que contraindiquen el servicio, o en su caso, haberlas informado previamente. EL PRESTADOR no será responsable por efectos derivados de información falsa u omitida.\n\nCUARTA. RESPONSABILIDAD\nEL PRESTADOR no garantiza resultados específicos, ya que estos pueden variar según el tipo de piel, vello y constancia en las sesiones. EL CLIENTE acepta que los resultados pueden diferir entre personas.\n\nQUINTA. PRECIO Y FORMA DE PAGO\nEl costo del servicio será el informado y aceptado previamente por EL CLIENTE al momento de la reserva o atención, y deberá cubrirse conforme a las políticas vigentes de All Beauty Luxury & Wellness.\n\nSEXTA. CANCELACIONES Y REEMBOLSOS\nLas cancelaciones deberán realizarse con la anticipación establecida por EL PRESTADOR. Una vez iniciado el servicio, no habrá reembolsos.\n\nSÉPTIMA. DATOS PERSONALES\nLos datos personales de EL CLIENTE serán tratados conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares y al aviso de privacidad de All Beauty Luxury & Wellness.\n\nOCTAVA. VIGENCIA\nEl presente contrato surtirá efectos a partir de la aceptación y/o firma del mismo y permanecerá vigente durante la prestación del servicio contratado.\n\nNOVENA. LEGISLACIÓN Y JURISDICCIÓN\nPara la interpretación y cumplimiento del presente contrato, las partes se someten a las leyes de los Estados Unidos Mexicanos y a los tribunales competentes del lugar donde se preste el servicio.\n\nACEPTACIÓN\n\nEL CLIENTE manifiesta haber leído y comprendido el presente contrato, aceptando su contenido en su totalidad.', 'Luxury & Wellness, en lo sucesivo “EL PRESTADOR”, y el cliente cuyos datos aparecen en la parte superior del presente documento, en lo sucesivo “EL CLIENTE”, conforme a las siguientes declaraciones y cláusulas:\n\nDECLARACIONES\n\nI. Declara EL PRESTADOR que:\na) Es una entidad legalmente constituida conforme a las leyes de los Estados Unidos Mexicanos.\nb) Cuenta con el personal capacitado, instalaciones y equipos necesarios para la prestación de servicios de depilación estética.\nc) Cumple con las normas sanitarias y regulatorias aplicables.\n\nII. Declara EL CLIENTE que:\na) Es mayor de edad y cuenta con capacidad legal para contratar los servicios descritos.\nb) La información mostrada en la parte superior del presente contrato es correcta y fue proporcionada por él/ella mismo(a).\nc) Ha informado de manera veraz cualquier condición médica, alergia, tratamiento dermatológico, embarazo o padecimiento relevante.\n\nIII. Declaran ambas partes que reconocen la validez legal del presente contrato y se obligan conforme a sus términos.\n\nCLÁUSULAS\n\nPRIMERA. OBJETO\nEL PRESTADOR se obliga a prestar a EL CLIENTE servicios de depilación estética, ya sea mediante láser, cera, luz pulsada u otros métodos disponibles en All Beauty Luxury & Wellness, de acuerdo con la evaluación previa realizada.\n\nSEGUNDA. CONSENTIMIENTO INFORMADO\nEL CLIENTE manifiesta que ha recibido información clara y suficiente sobre el procedimiento, posibles molestias, riesgos, efectos secundarios, cuidados posteriores y resultados esperados, otorgando su consentimiento libre y voluntario.\n\nTERCERA. ESTADO DE SALUD\nEL CLIENTE declara no presentar condiciones médicas que contraindiquen el servicio, o en su caso, haberlas informado previamente. EL PRESTADOR no será responsable por efectos derivados de información falsa u omitida.\n\nCUARTA. RESPONSABILIDAD\nEL PRESTADOR no garantiza resultados específicos, ya que estos pueden variar según el tipo de piel, vello y constancia en las sesiones. EL CLIENTE acepta que los resultados pueden diferir entre personas.\n\nQUINTA. PRECIO Y FORMA DE PAGO\nEl costo del servicio será el informado y aceptado previamente por EL CLIENTE al momento de la reserva o atención, y deberá cubrirse conforme a las políticas vigentes de All Beauty Luxury & Wellness.\n\nSEXTA. CANCELACIONES Y REEMBOLSOS\nLas cancelaciones deberán realizarse con la anticipación establecida por EL PRESTADOR. Una vez iniciado el servicio, no habrá reembolsos.\n\nSÉPTIMA. DATOS PERSONALES\nLos datos personales de EL CLIENTE serán tratados conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares y al aviso de privacidad de All Beauty Luxury & Wellness.\n\nOCTAVA. VIGENCIA\nEl presente contrato surtirá efectos a partir de la aceptación y/o firma del mismo y permanecerá vigente durante la prestación del servicio contratado.\n\nNOVENA. LEGISLACIÓN Y JURISDICCIÓN\nPara la interpretación y cumplimiento del presente contrato, las partes se someten a las leyes de los Estados Unidos Mexicanos y a los tribunales competentes del lugar donde se preste el servicio.\n\nACEPTACIÓN\n\nEL CLIENTE manifiesta haber leído y comprendido el presente contrato, aceptando su contenido en su totalidad.', 'CON-1765770562253-9', 'data:image/png;base64,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', '2025-12-15 03:49:22', 9, 1, '2025-12-15 03:49:22', '2025-12-15 03:49:22', NULL, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAlgAAADwCAYAAADcthp2AAAQAElEQVR4Aeyd3ZXsuHVGa/ziVzsCyxnIEciKwCFIzsCKQHIEVghSGH6SJgI7AS/JywkoA5n79kU3m82qIov4OQD2rDpNEACBczZA4iuwb8/f3PxPAhKQgAQkIAEJPCLww6NCy/YIKLD2qJgngWEJ+JQcdmiHC8yAQhH4ayhvunBGgdXFMOmkBHIR8CmZi6TtSKALAn6najZMCqxm6O1YAmUJ2LoEJCCBm9+pmk0CBVYz9HYsAQlIQAISkMCoBBRYd0fWAglIQAISkIAEJPAaAQXWa9y8KiMBf0UgI0ybkoAExidghF0QyC6wXCy7GPdQTpb7FQFnY6iB1pmGBLwXGsK360kJZBdY5RbLSUfIsC8QcDZegDfypRPG5r0w4aAbcmMC2QVW43jsXgISkIAEChBwD6wAVJscmoACa+jhLRSczUpAAtMRcA9suiE34IsEFFgXAXq5BCQgAQk0JODWWkP48bqO5JECK9Jo6IsEJCABCZwj4NbaOV7WrkZAgVUNtR1JQAISiE5A/yQggVwEKgusF/ZyX7gkFxzbkYAEJBCWgM/G+kMj8/rMO+6xssB6YS/3hUs6Hg9d75yA7kugGoFoz8YZxEc05tUmmx29QqCywHrFRa+RgAQkIIHwBBQf4YdIB+sSCCaw6gZvbxKQgAQkIAEJSKAEAQVWCaq2KQEJSEACYxEwmjEJFHy1rcAac8oYlQQkIAEJlCRQcGEu6bZtbwgUfLVdVGA5/zYD6akE5iVg5GEI+GTOMhQFF+Ys/tlIcwJFBVad+efDovks0gEJSKAjAnWezB0B0VUJFCFQVGAV8fhLo5M8LL7EbYYEJCABCUhAAlEJDCCwoqLVLwl0TMCN4Y4HT9clUJdA0d46fhYpsIrODBuXQKcE7m0Md/yw63Qk+nTbedLnuEX0+t6zKKKvG58UWBsgnkpAAg8IlH7YTbkwP+Dda1HpedIrF/2eikBbgeXDdKrJZrASeErAhfkpIitIYGYCPcmGtgLLh+nM90m22G1IAhKQgATmINCTbGgrsIrOh550blEQNi4BCUhAAhJoR2DS5fhvbrd2zMv23JPOLUvildYnvR9eQeU1EuiGgPd1N0M1lqOTLscD72CNNT9rRzPp/VAbs/1JoCqB7u7rqnR67kzpHHH0FFgRR0WfOiHgQ62TgdJNCQxOQOkccYAVWBFHRZ++EQgrX94dC/9Q+8bRHxKQgAQkUJ+AAqs+c3s8SCCsfAnr2EGwVpOABCQggeIEFFiPEFsWjMD71lEwv3RHAhKQgAQk8JmAAuszD89CE3DrKPTw6JwEJFCNgB3FJ5BXYLnBEH/E9VACEpCABCQggeIE8gosNxiKD5gdSEACOQjYhgQkIIGyBPIKrLK+2roEJCABCWQi4AuHTCArNeN4VQKdsZvKAsspkmXsAmDMEoeNSCA0gbFvNF84hJ58X5xzvL4gCZ9RWWA5RbLMCDFmwWgjEnhMwBvtMR9LJRCSQBinKgusMHF37MjY36o7Hhhdl8ABAt6/ByBZRQJDEFBgNR/Gsw9cv1U3HzIdkMDLBDq4f1+OzQtDEji7xIQMok+nFFjNx80HbvMh0AEJSEACwQm8rJNcYpqNrAKrGXo7HpSAYUlAAhLITkCdlB1p8QYVWMUR24EEJCABCYxO4OUdptHBTBxfPIE18WAYugTKE3AZKM/YHmYk4A7TjKP+OGYF1mM+loYloFB4bWhcBl7j5lWPCcxxPz5mYKkEPhNQYH3mUfDMB1BeuAqFvDxtTQJXCHg/XqHntfcI9L1uKrDujWv2fB9A2ZHa4BuBbp5Bb+76UwISkMAxAn2vm/0KLBeVY/PTWuMT6PsZNP74GKEEJDAlgWoCK7semnBRmXKGGrQEJDAIgeyrwCBcDGNUAtUElnpo1ClkXBKQgASOEHAVOEKp0zq6vUOgmsDa6duszgn4fbTzAdR9CUhAAhIoRkCBVQzt+A37fXT8MTbCSgTsRgISGI7AVALLHZfh5q8BSUACEpCABEISmEpgueMScA7mUb0BA9MlCUhAAhKYmcBUAmvmgQ4bey+qVyF4cAoJ6iAoq0lAAoMTeBNYgwd5ODzXhsOopqvYixBsPjCCaj4EOiABCYQgoMBaD4Nrw5pGnbSitg5ne5HARQKtbtWLbnu5BJoRUGA1Q2/H3wg8FbU+1r9x8ocEGhN4eqs29s/uJRCNgAIr2ojoz4aAj/UNkJOnk1Z/1+XviUlBGLYEJNCKQFiB5WOx1ZSwXwkMQOBdl78nBghqsBB8yA82oIazJRBWYEV5LG6BeS6BIgRcbIpgvd+owO+zqVTiQ74SaLtpRSCswGoFxH4l0ISAi01l7AKvDDxId0MJ6yBMdeMeAQXWPTLmS0ACErhHwHX6Hpng+Qrr4AM0lHsKrBLDefHhe/HyEhHZpgTiEzh741yJqPk6XTPYK6C8VgLzEqgjsGZ7Flx8+F68fN7ZbORzE5jqxpkq2LnntdF3S6COwPJZ0O0EeeC4RRKQgAQkIAEJ3CFQR2Dd6dzs/gjMthnZ3wjpsQQkIIHZCcSIX4EVYxy68cLNyG6GSkclIAEJSKAhAQVWQ/h2LQEJSCAiAX2SgASuE1BgXWdoCxKQwOQEfHU++QQwfAnsEFBg7UAxSwLXCHj1bAR8dT7biBuvBJ4TGFhg+Z3y+fBbQwISkIAEJCCBEgRCCqw8gfqdMg9HW5GABCQgAQlI4CyBgQXWWRTWl0BMAu7FxhwXvZqSwEfQ3pgfLEztElBg7WIxszkBH17vQ+Be7DsKExKIQ8AbM85YBPVEgRV0YFq71Vzf+PBqPQXK9G+rEpCABCYhMLDAai4R6k+hjCGrb+oPnz1KQAISkMA4BAYWWENKhMczb8KQHwOxVAISiE8g4zfD+MHq4UQEMgqsbm6Sf17GF/vDckSSYEvSjwSKEEhzjfn2uyI92KgEuiZQ5xHczQrV7Vjq+JZARoFV5ybZBnDwnEXuN0tdFrlk5C1Z3z7r9LcMf0jgIgHmFDcF84009oulTfJIL0k/EpBALQLceLX6sh8JQCCjwKK5cPZvi0cscNivl/S9he2PS1mjj9+rGoEv2W0S8/f6YC7eKzN/UgKGLQEJjEWgJ4GFSGLhejYCiCjq8oXlP5bKnC+HLx9E1b8vuY0VDm4uXvhpRCD78DP3tgKKufbfS4B/WYwPcxIjrd0jkH1o7nVkvgQkIIH8BHoRWAgrFiQWLhawPRKUU4aR3qvDQvfzpSAZ7S6nfvon8GoE2QQuc+5Pixccl8P7BxHPfPunJefvF/NzlEC2oTnaofUkIAEJ5CPQi8D62SrkH1fplEQoPRJWf14qsshhiCxsyfIjgSwEEFWI/59sWkNcMTfX2Wnucc0637QEJCABCdQgUGJ3fKfNd4FVI6ZCffzX0i6L23LY/bDI/eNSkha2JelHAtkIIKC24j4Jesq2HSmstkQ8b0JgZz245kf2Bq+549USuEugxO74Tpu9CKz1rtV6N4t/9v7TOxARVOxY7S1ydy4xWwKnCDC3tuKeefevSyscl8OnD/VTxjqd8jxKoBqBnfXgWt/ZG3x3x4QEuiTQi8Bai6oEmgWKf/aeztdHdq0QV3uL3LqeaQncbq9982bXak9c3Zt37Fyl+szPWzf/vcanm/B0VAISkEAJAr0IrG3se4sbdRBULHCIL841CTwncP6bN/MPwbRuG9HE3FvnrdNcwzn16s5Per1i5/lc6c1rJSCB0QhM+iWtR4HFwoatpyD/BP5XSwYLHCJrSfqRQBECyI3t/HskmqjLNTjD3OxLXOG1JgEJSOAKgfQEvNJGh9f2IrBYpPbwsmAhqvgn8L/dq5AhzyYkAAHmYNqF4jzZPXGV6qdrqMdcTdd5lIAEJCCBgQn0IrC2Q/D7JSOJK47LqR8JFCXA708hmtadIJr2dqTIS/WZnwgr8tbXmpaABCRwkYCXRybQg8DaLmrw/OXyg0VrOfiRQHEC7EJt5yHzb080kZfEFXUwRFZxJ+1AAhKQgATiEOhBYMWhpSdPCAz5m4z3xNVWNCHA+E0D/mUrO1vA2NZ5ws/i2gTsTwISkEApAj0ILBauUvHbblYC6Iu9BtEae/nh89iN2s6/vR0p6iHEEFS8vuY8fHA6KAEJSEAC5Qj0ILC20bOIbfM8b0LgaKf3hNfR65vUQyTxqi91zrzbE1cIK+pRzs4V16VrPEpAAhKQQI8EMuwL9CCwtn9kdP1X3XscNn2OTwCRhGhKnibxxDHlUQflyA4XwmpPfKW6HiUgAQlIoCaBq33xdL/YRg8C62KIXi6BUwQQTltxtRVP6zqIK85PdWJlCUhgIAIZdjsGomEo3wn0KLBczL4PnofsBJhba3GFeEJcpY7YreJ7DXXYzaKMa1L5p6PP3E84POmLgN6eIcBT4Uz9hnV9LtWD/1hgxRiJtRd/3kWzrrFbwUwJPCWAeEI4pYqIq7V4Is3vW1FOGeIKkcX5rnX0zN31v1qm92811HbUKYGM98hsz6WM6E5PnscCK8ZIrL3gX2h9DXJd42upORUItJzEmcJL4onmEFAIKtIYZUl8bcso/2rmHCfg/XuclTXnJOA98vK4t0T3WGC9HJIXzkag5STOwHrt/s8XsZjEFbtalHFkt4pdq1R2vdulo+uN2IIEJCABCUQkEFVgrVmxuK3PTeci4ALP3EJAJaIQ+eP3DIQUO1eUsWuFuEJkcZ7HvneUpzFbkYAEJCCBSAR6EFiReI3ly9wLPOIqCSjGFXHFMeWnV4IIK8QWZZoEJDA9AQFI4BgBBdYxTtYaiwCCKYkrdqWSuEr5iKyUz3Gs6I1GAhKQgASKE4gusFjo1hBc7NY0TL9CABGVdqeYT+xQMc8QXCmfPOyV9r3mCQGLJSABCcxAILrAmmEMjLEegT1xhbDCEFllfteqXnxfekpbc18KzJCABCQggaIEFFhF8ZZo3DZfJLAWVwgpjN9CQ1ilnSzqkH6xi3iXEWA8r/RIAhKQQF4CEb9MKrDyjrGtxSSAcEqv//hbavz/Ldm1wluEFq8DhxJWBKZJQAISqEqgYWcRv0xmEVgFlSO7Cw2HzK4HILAWV/yfAH6xxMS8QlAhrChfsvxIQAISeEKg4GL3pGeLOySQRWBVVI4sih1i1uVGBBBSaefqL4sPP1mMOeSu1QLCTzgCOhSdQMXFLjoK/XtOIIvAet6NNSTQhEB6DUjnf7f8YMcKc9dqgeFHAhKIQcCNsRjjkNuLpwLLgc+NfNteW8Jte9+yuHj++fL1d013rD6z8UwCEghEYP2wCuRWDFc6XqSeCqzGA88vI6dB5tVOSg90bEu4be9FhpHdqT+tWv7VkiZv0PmzROdHAqcIdLxinYrTyiEJnJ1+HS9Sa4EVcix0qg2Bs/dAGy8/9crvW/FKkN+54netKGTn6rcktDkIdDhvGwxMxytWA1p2mZnARNOvJ4H1Y+ZhtrkHBDq6B5KwQlyRXkfFztX63PTgBDqaqkNINgAAEABJREFUt4OPRO7wbE8C/RHoSWD1R/e5x1tB8PwKa6wJIKDWwoq/cZXK1+mU51ECEpCABCRQhYACqwrmT50gqhAFa/tUwZOnBGDIZgWvA6nM71fxdoi/c8U5tk5z/sW44EvmoBmGJQEJSEACdQlEF1gspHWJ5O+NGJKYQhSQJg+jt3QkrT0mACv4YdREWPFnFzDKkuCijN0tjneNwbhbaMETAsrTd0CieEdhQgIS+CAQUGB9elqxgCZv1+mUV+l4uBsWeQwBgLGGcyQP22uIX8TeyzfvgwDs4IiRZi7ADWFFmprkc8Qo46gVI8DULtZ4Xw2Loq/x0lsJVCIQUGB9fVp9l1xpIa2E5nA3LOws/GsjD9trhDgQBhihPd1p2WtkkjwYJq6kCRvxBLstt/XuFfU0CUhAAuMTMMKwBAIKrE+svi2q3yXXt/Sn0jYn+IGx8OMaR86xrUeIKQxBgJjCSJOHbet7/kYAlnDFSJMLL9hthRVl27ztOXU0CUjgAAEeUgeqWUUCEnhCILrAWrvPArs+r5lmkWexXxt5Wx/wMe2w8JxCEGDkb+t6/pUATBNj0tSAHQwx0uRtbf0HaeG/LfdcAvcImL8hwLfGTZanEpDACwR6ElgvhHfpEhZ4FnueNxw5x9aNsuDz97lY/JOgYveE/HU9048JwBXGGGlqwxCuGGny9gze6RrKOeeoSUACEpCABJoRUGB9Rs9CzSK/FlWfa9xuLPYs+klQcQ15tyn/ez1ouCGGtqxhCV+M9Jke3L06Q8u6EpCABCRQjEAvAuvsQnsGGAs9oioZ59vr6Z8FP4kqzrd1PD9GAL6JdfrFdHgijl7hm9qgd9rhqElAAhKQwOQEWoffi8DiNVwOVizuydIizzHlpT5YqOlTUZWIXD/CGNYYaVqEM4wxdrPIO2Pra2gL+3Y9Su1bwh8SkIAEJCCBBgR6EVhH0LBoYyy6yVjMk6VXUemculhqm8WZhf7NfrhRRt7N/y4RgGNiT5rG4PrG+e2VK3lXDUH83gYdvp+YCExAKRx3cPRMAhK4QqA3gcUCjSGgklBiLcXSOa+MklE32R6n9ULPgs85drvR4t4V5h0hAHPGA4oc0zUwZkXl+MY5lbx2/PXqMubE6tRkHwSYIn14qpcSkIAEzhAIIrBYcx+6/S9LKU9iFmuMhZVFHFuKDn9Y1FncMTrlSB52uBErfiLAGGAIHMYmjRN5VIQtnOFNmrzcxu9v5W7zcns2IAEJSEACkQmwLJXzL4jAYk3+FCSL859WOT9dpc8mWdRZ4JNxjp1tx/q3G+OCIaS2lkTvbfkPvvBm9nLkfMnO+kHQZW3wWWME86yO5RKQgAQk0AuBL9ojq+MXBVaRJYeF8w+32+0nt9f+YzFnR4OFHQc5koe91uJ8VyGiMMYC+92CYC2oKEu2FN1gu8f8Vuk/fCzeVdlbsbj7diABCUggPwFW2fytDtHiRYGVdclhAadBdkKOwmVhxxBRGEPNkQWX/KPtzFoviSSO8McYA44YY4ElsYuIwmAM62Sc12a+/uvts46fcUtAAi0I2OcHAVaMjzNTKwIXBdaqpWtJFmcW+UetIJgwFnOMxZ0jRj726PqZy2CLwRnhhHFbcExGOQYnWGKwxcjnyPUYZdSLYAi+CH7ogwQkIAEJSOCdQBSBtd2NYAFnQf+fxdP/XEwxtUA48EEIYYigJJzWQordKMqxdXPwxmC+NvKwdd0o6W0MUfzSj+cErCEBCUhgeAJRBBaLOjsRLOakMdL/t4zA3y7m53ZDUKxtLaIQU0eE1G35D64YjLHexSsclrD8SEACEpCABOIQiCKwIMJCyYLP4s85lgQF6Z4MwUM8WPI7xZKOlCWj/toQS1v7KL/dSK93o2gz9ZOOcEwGV6x3MZVi8ygBCUhAAhIITSCSwLoHCpFwryxiPqIJwYMAwpJQQhStjbJk1F/bmbjggyGgkq2FFHmUY2fajVwXVpH90zcJSEACUxIw6A8CPQisD2/7SG1/nyyn14gkBFOytZCiLFnOPiO2lQQW8Ub0T58kIAEJSGBQAiy8R0KLLLDSInokjkh1ED/p98mu+oWAoD2MMeVIXrKr7Xu9BCQQioDOSEAC0QnwWuqIj5EF1hH/o9bhNSFiCFGE2DriZxJN1E/Xckz5R9q4WwdH7hb2V5B2CX/sz3U9loAEJDAxgcEWo0cjmVFgTUTtEdGvZYgt4CCW1kbe2lIZ9RFVX1u6kHNUcV/oIsSlOiEBCUhAAoEJTLQYZRRYE1H7MnfRSV8ytxmIprVtyz0/TyDtZJ2/0isKETh0LxTq22YlIAEJxCGwEVhxHOvLk5nFZV8jpbelCXgvlCZs+xKQQB8EehBYvf6yex8zoE8v/d2rPsdNrwsSGH7vsCA7m5ZACQI9CKwScdtm3wR41UoEiG+MtCaBqQm4dzj18Bt8QAIKrICDoktPCSSB9bSiFd4JmMhAwF2iDBBtQgKTEIgssFxEJ5mEL4aZ5gd/Df/FJrxMAucIuEt0jpe1JTAzgcgCK9a46E00Avy9MHziFSFGWpOABCQgAQmEIJBXYJXbP3cBDTFdrjnxeHo8Lr3Ws1dLQAISuEog7jPqamRFrhfXLa/Acv887zwdbII+nh6PS3fA8ooQo8jXhFDQJCCBggROP6MK+tJB0+LKLLDyj3laQPO33EOLTtBno5T+XAM7nNim/mAKdROdp7kI2I4EShPwWVSacMT28+5glYtwZ/Es19nDlr1PHuKpXPhEgKtQK4+H3UlAArsEKj+LXKd2R6F2Zi8CqzaX+/1Vvk/uOxKnpKEnCCwMF3xNCAVNAhKQQOR1aiLxF1NgTTQAPgkuE1i/JrzcmA1IQAISkEBBAnXFX8FAnjcdU2B9DEBaPJ9HYo1ZCaQdLOKP8yoZbzQJSEACEghGoN4OTkyB9XU4fvY1y5w9AvWmzl7vTfLWAmuw14QTjmaTKWSndwlYIIHhCHzs4JQOrReBVZrDW/sDrGf1ps4bsiA/k8gabAdr0tEMMql0QwISkMAVAgqsNT3XszWNntLpr7rjcySRhT+aBCQgAQlMSCC6wBp0Z2LCmVY25DRP6GWw14SEpElAAhKQQG8EYgus3mhO72/Td6xJZLmDNf08FIAEJCCB9gQUWO3HYCAPmr5j9TXhQDPJUCQQnYD+SeAZgZ4EVsWdiaY7Mc/GzPJ9AmkHi1JfE0KhoXkHNYRftGtHtiheGx+KQE8CqyL4pjsxFeMcrqu1yBouuJ4Cen4H9RSNvn4QcGQ/WJiSwGMC0QWWC+bj8bP0M4H0mpDdTuxzqWcSkIAEJCCBSgSiC6xKGPrrRo8lIAEJxCTga8SY46JXtQn0ILAO7WJ5S9eeOiH7Y65gOOfvYUFBk8AzApuH5+b02dU75b5G3IEyU9YksT6/U3oQWGmwHr7y8ZZOmKY/rl8TTg9DABJ4SmDz8NycPr3cChK4QuC5TLnSeslrn98pPQms6f9/hP1OxJKT/GHbD0X5wystlEArAvYrgYkIPJcp5WGUWlt7EFg/lsfbRw8RJmIHpHhFiOGqrwmhoElAAhKQwF0CpdbWHgRWWizvwslTUErD5vHOVg4ToOL6NaG7WBDRJCABCUigKoEeBFYCUnihLKVhk/seGxEoPG8aRWW3EpCABCQQmsBXgRXa3ajOufsVbGTY9cRwa/rf3QOC1gEBHyMdDJIuSuA4gR4EVlooj0dVvaa7X9WRP++w6GvC8dbC8SJ6PkWC1Zj2MXJ87gUbMd2RwEMCPQisdQC+7lnTqJHu99mHMMeglP2X3cdbC0eKqN9Jy2Sdz0aae/ONnhF/J7Dz2PkqsHYqfb+84OFpp2mhLOiDTe8S6PvZV3QXa5dX6MxZnOt70s4ySsYpgaEI7Dx2vgqsnUrlITztNO+faniq58pHbA9VCCDMMTrLvotFo5oEJCABCUhgj8BXgbVXq31eWiTzvCJ8quf2AzY3MIH7ojmJc+YOFjgIXZOABCQggVEI9CKwRuFtHKUI3BfNv1m0VxLo7mKV4m+7EpBASwL2HZBAdoG1LGYlw/Sf3JekO2jbi/Za/y7WoFHOG1bhZ845sKGcOee6tSUggbwEsgusZTHL6+Fba+xA8Krnf99O/SmBUwSYPxgX/YEf2jgEsjxzcuEI5UyuoDbtKCI3QDyVwD6B7AJrv5ssuTy6/iFLSzYyI4H1Lpa/izXjDDDmPAR4Eudpad5WFKlTjH1PAosBYWHESGtxCPTgCTtYGL76u1hQ0CQggTYEFKltuFfutSeBlXYgKiOyu4EIpDmESMcGCs1QJCABCUjgK4F2Oe8Cq5MdS3Yg3H1oN19675n5k0SW86j30dR/CUhAAoEJvAusDnYsWRxByc7Db0ho9wh0IpfvuV82n7nDXHIeleVs64MQMAwJSOA1Au8C67XLq1/l7sMh5B3I5UNxFKuU5lG1P/uh5C02ljYsAQlIICSB3gQWOw8sjj8PSVOneiHAPMLYxcIK+v3WtJL3jYM/JSABCcxCoDeBxbikVzykv5pbBV+ZmLNHAKGOyOLvYlURWXtOmPeAgPfyAzgWSUAC0QmEF1inAbpVcBrZpBcgrvjjtX9e4ldgLRDCfbyXww2JDklAAscJxBdYfos9PprWPEuA3dDfLxfxLwpJL0k/EpCABA4RsBIEXKOhsGvxBZbfYncHbp05/PwuGyA7WeDkF97dyYKEJoETBMreniccsWobAq7Rd7nHF1h3XbcgERh+fpcNEIHFP5pAXLGTlbB6LE3go33Yu4P4waOrVNnbsysUOiuBTwQUWJ9wXDjxa9wFeM0vRWRhLvT1hwLm/EMDxC3p+h7YowQkMCCB9ouyAivXtKr/Ne6U5+2n2il3W1RmF4t+XeihUM8QV6k3BVYiEeHoQ2MZBSEsEDr9tF+UFVidTp2zbrefamc9blI/iSwWfRf78kOwfi3In81Yn5fv3R4eE/ChsfARwgLhhY+XQECBBQVNAm8EeE3IQs9ZMJE13Ddp+LJbCGu4K64goUlAAsMQmFNgDbdWDTMfIwTCQr8WWZwH8GuYb9LsDBIMR7jCOu0ccq7dbjchSCAuARfQo2Mzp8Di8X6UkPVmJICoYuEndnZZOCetvU4AQcWuFZZaQViFYeuykYalj6Pj1WqcXECPkp9TYB2lY71OCWRxm4UfAUBjiCyeKuRxrh0nsBZWpLkS8cr6yKtBzkMYAxzCEZ04RMDxOoTJSg0JvCyweDo29LvzrqXXyQAiABgsBAEuI7QQWUkokKftE4ARu1UYaWrBE9EKQ841CUhAAsMS2BVYR6L128MRSvfqSO8emaD5CAJEFobIQjSQF9TdZm4hpGCTjHOcScIKcUWaPE0CEpDA0AReFlhDUzE4CXwlgKDCEFmUIrRQyuRxPqshopKg4sg5Bg/EFKIKI02eJoErBLxWAt0QUGB1M1Q6GoQAgmr72hChlURFEDeLukGsiCni5sg5RqcIKQQVjDhyTr4mAbMufNAAAAUsSURBVAlIYCoCCqyphttgMxLYCi3OsSQ0MnaVsanXmiImYkNMrUVVag0RhZhSVCUiHkMTYKKGdlDnhiCgwDo4jN6QB0HNVw3hwfRAZPDaEBFCHqKkRxr4jREDsSRBRWzkExOxYooqaGjdEWBSd+e0DndHQIG1GTJWyk3Wt9PvN+S3tD8ksEMAQYLgoAgxshYnlK0tCRXqtrLFhx8Wu+EXvm6NGCi/ff8vCSpiTEbe92IPEpCABCSwJqDAWtNY0gqpBcKVzw9XLu7+WgQHBPhFeIyAECmIlbUhZphqyRA5GHWTcY5xznHPKMP2yuhjbamvdFzK/rrYDb9oIxk+Y8SCIaaIiSPnGOWaBCRQhQC335GOrBONgAIr2oj07g/Ld+8xXPc/CR6ejBjiBEN0YdseEDkYgicZ5xjnHPeMMmyvLAmmdPzeJ+58T95uiCUMnzB8pAJGGqP85n8SkEArAj5UW5G/2q8C6ypBr5fAcwKIFGwrvBAyCBvKnrdyvgbtJkMsLfZX+ky2nN+w5Bd133qhxltqmp8GKgEJSCAnAQVWTpol25p5wRs7dsQNIocoOWK/X6YSRwwBdsSom4y2sHTOEfGELU0f+Pil+QAkq0hAAhK4T0CBdZ9NrJLwC15BXPPEjgDCfrnQ5IghwI4YdZMtlwf/IP+Cu6h7/RBwOvUzVjN5qsCaabSNVQJRCMwjmqMQH9oPp9PQw3spuG/i+1ILr1+swHqdnVdK4DCBljf5YSetKAEJnCLgfX0KV7XK63FpKb4VWNWG3I5mJtDyJr/Gff2outaSV0ckcGh8IzoewqcI97Uj+HUqRBgXvFJgQUGTgATuEIjyqLrjntkXCTi+FwE2v9wRbD4Edx14TWApme8CtaAMgfcp954o00+RVm10PALOw/HG1IgkkJnAawLrgWT2uZN5hGzuG4H3Kfee+JbtDwm0IeA8bMO9Yq+uZRVhD9rVawLrAYwCz50HvVkkgUkJ+PSfdOANuxYB17JapMftJ7vAGheVkUkgEAGf/oEGQ1fmJWDkErhPQIF1n40lEpCABCQgAQlI4CUCCqyXsHnR+AR8B1djjFv34Si3HgH7l8C4BBRY446tkV0i4Du4S/g6udhR7mSgdHNMAoN/w1FgdT1tGzr/fmO8Jxo6Y9cSkMBsBIo+eYo2PttIPYh38G84QQSWs/nBFIxZ9H5jvCdi+qlXEpDAkATOPnlOrTJnGx+S8MWgvPwWRGA5m52LEhiGwIOV7EHRMOEbSEwCrjIxx2Vkr64LLJ+Yg82P2QZ0tngrTNcHK9mDogqOddWFzkpAAp0TuC6wfGJ2PgW27scZ0DrSJ06825HwXAISkEBUAnWez1GjP+bXdYF1rB9rSeA0gUvS53RvXiABCUhAAkcJ+Hx+TkqB9ZyRNSQggaEJ+F186OE1OAk0InBPYDVyx24lIAEJ1CYwxndxZWLteTNWf2fnz9n6Y9E6Fs11gSXlY6StJQEJSOBFAkces2PIxCOArFOCwNn5c7Z+CZ+jt3ldYEk5+hjrnwQk0DkBH7OdD6DuFydw5EtIcSc2HVwXWJsGPZWABGIT0DsJSOBFAhFX8RdDGe2yiF9CFFijzTLjkYAEJCCBMgQiruInI1UjngR2oXq/AuvBLHlQdAFVutTjKAScJ6OMpHFIQAJHCQygEY+G2rxevwLrwSx5UNQcuA7EIbA7T1RdcQaosiezDf1s8VaeTm26s9dQBPoVWKEw6swwBHZV1zDRGcgDArMN/WzxPhh6iyRQhMD/AwAA//95h26vAAAABklEQVQDAMVzEB2Igt3bAAAAAElFTkSuQmCC', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36');
INSERT INTO `contracts` (`id`, `patient_id`, `service_id`, `contract_number`, `status`, `total_amount`, `sessions_included`, `sessions_completed`, `terms_and_conditions`, `signed_terms`, `pdf_url`, `signature_data`, `signed_at`, `signed_by`, `created_by`, `created_at`, `updated_at`, `docusign_signed_at`, `signature_canvas_data`, `signature_ip_address`, `signature_user_agent`) VALUES
(20, 9, 3, 'CON-1765828082400-9', 'signed', 1500.00, 1, 0, 'Luxury & Wellness, en lo sucesivo “EL PRESTADOR”, y el cliente cuyos datos aparecen en la parte superior del presente documento, en lo sucesivo “EL CLIENTE”, conforme a las siguientes declaraciones y cláusulas:\n\nDECLARACIONES\n\nI. Declara EL PRESTADOR que:\na) Es una entidad legalmente constituida conforme a las leyes de los Estados Unidos Mexicanos.\nb) Cuenta con el personal capacitado, instalaciones y equipos necesarios para la prestación de servicios de depilación estética.\nc) Cumple con las normas sanitarias y regulatorias aplicables.\n\nII. Declara EL CLIENTE que:\na) Es mayor de edad y cuenta con capacidad legal para contratar los servicios descritos.\nb) La información mostrada en la parte superior del presente contrato es correcta y fue proporcionada por él/ella mismo(a).\nc) Ha informado de manera veraz cualquier condición médica, alergia, tratamiento dermatológico, embarazo o padecimiento relevante.\n\nIII. Declaran ambas partes que reconocen la validez legal del presente contrato y se obligan conforme a sus términos.\n\nCLÁUSULAS\n\nPRIMERA. OBJETO\nEL PRESTADOR se obliga a prestar a EL CLIENTE servicios de depilación estética, ya sea mediante láser, cera, luz pulsada u otros métodos disponibles en All Beauty Luxury & Wellness, de acuerdo con la evaluación previa realizada.\n\nSEGUNDA. CONSENTIMIENTO INFORMADO\nEL CLIENTE manifiesta que ha recibido información clara y suficiente sobre el procedimiento, posibles molestias, riesgos, efectos secundarios, cuidados posteriores y resultados esperados, otorgando su consentimiento libre y voluntario.\n\nTERCERA. ESTADO DE SALUD\nEL CLIENTE declara no presentar condiciones médicas que contraindiquen el servicio, o en su caso, haberlas informado previamente. EL PRESTADOR no será responsable por efectos derivados de información falsa u omitida.\n\nCUARTA. RESPONSABILIDAD\nEL PRESTADOR no garantiza resultados específicos, ya que estos pueden variar según el tipo de piel, vello y constancia en las sesiones. EL CLIENTE acepta que los resultados pueden diferir entre personas.\n\nQUINTA. PRECIO Y FORMA DE PAGO\nEl costo del servicio será el informado y aceptado previamente por EL CLIENTE al momento de la reserva o atención, y deberá cubrirse conforme a las políticas vigentes de All Beauty Luxury & Wellness.\n\nSEXTA. CANCELACIONES Y REEMBOLSOS\nLas cancelaciones deberán realizarse con la anticipación establecida por EL PRESTADOR. Una vez iniciado el servicio, no habrá reembolsos.\n\nSÉPTIMA. DATOS PERSONALES\nLos datos personales de EL CLIENTE serán tratados conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares y al aviso de privacidad de All Beauty Luxury & Wellness.\n\nOCTAVA. VIGENCIA\nEl presente contrato surtirá efectos a partir de la aceptación y/o firma del mismo y permanecerá vigente durante la prestación del servicio contratado.\n\nNOVENA. LEGISLACIÓN Y JURISDICCIÓN\nPara la interpretación y cumplimiento del presente contrato, las partes se someten a las leyes de los Estados Unidos Mexicanos y a los tribunales competentes del lugar donde se preste el servicio.\n\nACEPTACIÓN\n\nEL CLIENTE manifiesta haber leído y comprendido el presente contrato, aceptando su contenido en su totalidad.', 'Luxury & Wellness, en lo sucesivo “EL PRESTADOR”, y el cliente cuyos datos aparecen en la parte superior del presente documento, en lo sucesivo “EL CLIENTE”, conforme a las siguientes declaraciones y cláusulas:\n\nDECLARACIONES\n\nI. Declara EL PRESTADOR que:\na) Es una entidad legalmente constituida conforme a las leyes de los Estados Unidos Mexicanos.\nb) Cuenta con el personal capacitado, instalaciones y equipos necesarios para la prestación de servicios de depilación estética.\nc) Cumple con las normas sanitarias y regulatorias aplicables.\n\nII. Declara EL CLIENTE que:\na) Es mayor de edad y cuenta con capacidad legal para contratar los servicios descritos.\nb) La información mostrada en la parte superior del presente contrato es correcta y fue proporcionada por él/ella mismo(a).\nc) Ha informado de manera veraz cualquier condición médica, alergia, tratamiento dermatológico, embarazo o padecimiento relevante.\n\nIII. Declaran ambas partes que reconocen la validez legal del presente contrato y se obligan conforme a sus términos.\n\nCLÁUSULAS\n\nPRIMERA. OBJETO\nEL PRESTADOR se obliga a prestar a EL CLIENTE servicios de depilación estética, ya sea mediante láser, cera, luz pulsada u otros métodos disponibles en All Beauty Luxury & Wellness, de acuerdo con la evaluación previa realizada.\n\nSEGUNDA. CONSENTIMIENTO INFORMADO\nEL CLIENTE manifiesta que ha recibido información clara y suficiente sobre el procedimiento, posibles molestias, riesgos, efectos secundarios, cuidados posteriores y resultados esperados, otorgando su consentimiento libre y voluntario.\n\nTERCERA. ESTADO DE SALUD\nEL CLIENTE declara no presentar condiciones médicas que contraindiquen el servicio, o en su caso, haberlas informado previamente. EL PRESTADOR no será responsable por efectos derivados de información falsa u omitida.\n\nCUARTA. RESPONSABILIDAD\nEL PRESTADOR no garantiza resultados específicos, ya que estos pueden variar según el tipo de piel, vello y constancia en las sesiones. EL CLIENTE acepta que los resultados pueden diferir entre personas.\n\nQUINTA. PRECIO Y FORMA DE PAGO\nEl costo del servicio será el informado y aceptado previamente por EL CLIENTE al momento de la reserva o atención, y deberá cubrirse conforme a las políticas vigentes de All Beauty Luxury & Wellness.\n\nSEXTA. CANCELACIONES Y REEMBOLSOS\nLas cancelaciones deberán realizarse con la anticipación establecida por EL PRESTADOR. Una vez iniciado el servicio, no habrá reembolsos.\n\nSÉPTIMA. DATOS PERSONALES\nLos datos personales de EL CLIENTE serán tratados conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares y al aviso de privacidad de All Beauty Luxury & Wellness.\n\nOCTAVA. VIGENCIA\nEl presente contrato surtirá efectos a partir de la aceptación y/o firma del mismo y permanecerá vigente durante la prestación del servicio contratado.\n\nNOVENA. LEGISLACIÓN Y JURISDICCIÓN\nPara la interpretación y cumplimiento del presente contrato, las partes se someten a las leyes de los Estados Unidos Mexicanos y a los tribunales competentes del lugar donde se preste el servicio.\n\nACEPTACIÓN\n\nEL CLIENTE manifiesta haber leído y comprendido el presente contrato, aceptando su contenido en su totalidad.', 'CON-1765828082400-9', 'data:image/png;base64,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', '2025-12-16 01:48:02', 9, 1, '2025-12-15 19:48:02', '2025-12-15 19:48:02', NULL, 'data:image/png;base64,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', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'),
(21, 9, 3, 'CON-1765999528170-9', 'signed', 1500.00, 1, 0, 'Luxury & Wellness, en lo sucesivo “EL PRESTADOR”, y el cliente cuyos datos aparecen en la parte superior del presente documento, en lo sucesivo “EL CLIENTE”, conforme a las siguientes declaraciones y cláusulas:\n\nDECLARACIONES\n\nI. Declara EL PRESTADOR que:\na) Es una entidad legalmente constituida conforme a las leyes de los Estados Unidos Mexicanos.\nb) Cuenta con el personal capacitado, instalaciones y equipos necesarios para la prestación de servicios de depilación estética.\nc) Cumple con las normas sanitarias y regulatorias aplicables.\n\nII. Declara EL CLIENTE que:\na) Es mayor de edad y cuenta con capacidad legal para contratar los servicios descritos.\nb) La información mostrada en la parte superior del presente contrato es correcta y fue proporcionada por él/ella mismo(a).\nc) Ha informado de manera veraz cualquier condición médica, alergia, tratamiento dermatológico, embarazo o padecimiento relevante.\n\nIII. Declaran ambas partes que reconocen la validez legal del presente contrato y se obligan conforme a sus términos.\n\nCLÁUSULAS\n\nPRIMERA. OBJETO\nEL PRESTADOR se obliga a prestar a EL CLIENTE servicios de depilación estética, ya sea mediante láser, cera, luz pulsada u otros métodos disponibles en All Beauty Luxury & Wellness, de acuerdo con la evaluación previa realizada.\n\nSEGUNDA. CONSENTIMIENTO INFORMADO\nEL CLIENTE manifiesta que ha recibido información clara y suficiente sobre el procedimiento, posibles molestias, riesgos, efectos secundarios, cuidados posteriores y resultados esperados, otorgando su consentimiento libre y voluntario.\n\nTERCERA. ESTADO DE SALUD\nEL CLIENTE declara no presentar condiciones médicas que contraindiquen el servicio, o en su caso, haberlas informado previamente. EL PRESTADOR no será responsable por efectos derivados de información falsa u omitida.\n\nCUARTA. RESPONSABILIDAD\nEL PRESTADOR no garantiza resultados específicos, ya que estos pueden variar según el tipo de piel, vello y constancia en las sesiones. EL CLIENTE acepta que los resultados pueden diferir entre personas.\n\nQUINTA. PRECIO Y FORMA DE PAGO\nEl costo del servicio será el informado y aceptado previamente por EL CLIENTE al momento de la reserva o atención, y deberá cubrirse conforme a las políticas vigentes de All Beauty Luxury & Wellness.\n\nSEXTA. CANCELACIONES Y REEMBOLSOS\nLas cancelaciones deberán realizarse con la anticipación establecida por EL PRESTADOR. Una vez iniciado el servicio, no habrá reembolsos.\n\nSÉPTIMA. DATOS PERSONALES\nLos datos personales de EL CLIENTE serán tratados conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares y al aviso de privacidad de All Beauty Luxury & Wellness.\n\nOCTAVA. VIGENCIA\nEl presente contrato surtirá efectos a partir de la aceptación y/o firma del mismo y permanecerá vigente durante la prestación del servicio contratado.\n\nNOVENA. LEGISLACIÓN Y JURISDICCIÓN\nPara la interpretación y cumplimiento del presente contrato, las partes se someten a las leyes de los Estados Unidos Mexicanos y a los tribunales competentes del lugar donde se preste el servicio.\n\nACEPTACIÓN\n\nEL CLIENTE manifiesta haber leído y comprendido el presente contrato, aceptando su contenido en su totalidad.', 'Luxury & Wellness, en lo sucesivo “EL PRESTADOR”, y el cliente cuyos datos aparecen en la parte superior del presente documento, en lo sucesivo “EL CLIENTE”, conforme a las siguientes declaraciones y cláusulas:\n\nDECLARACIONES\n\nI. Declara EL PRESTADOR que:\na) Es una entidad legalmente constituida conforme a las leyes de los Estados Unidos Mexicanos.\nb) Cuenta con el personal capacitado, instalaciones y equipos necesarios para la prestación de servicios de depilación estética.\nc) Cumple con las normas sanitarias y regulatorias aplicables.\n\nII. Declara EL CLIENTE que:\na) Es mayor de edad y cuenta con capacidad legal para contratar los servicios descritos.\nb) La información mostrada en la parte superior del presente contrato es correcta y fue proporcionada por él/ella mismo(a).\nc) Ha informado de manera veraz cualquier condición médica, alergia, tratamiento dermatológico, embarazo o padecimiento relevante.\n\nIII. Declaran ambas partes que reconocen la validez legal del presente contrato y se obligan conforme a sus términos.\n\nCLÁUSULAS\n\nPRIMERA. OBJETO\nEL PRESTADOR se obliga a prestar a EL CLIENTE servicios de depilación estética, ya sea mediante láser, cera, luz pulsada u otros métodos disponibles en All Beauty Luxury & Wellness, de acuerdo con la evaluación previa realizada.\n\nSEGUNDA. CONSENTIMIENTO INFORMADO\nEL CLIENTE manifiesta que ha recibido información clara y suficiente sobre el procedimiento, posibles molestias, riesgos, efectos secundarios, cuidados posteriores y resultados esperados, otorgando su consentimiento libre y voluntario.\n\nTERCERA. ESTADO DE SALUD\nEL CLIENTE declara no presentar condiciones médicas que contraindiquen el servicio, o en su caso, haberlas informado previamente. EL PRESTADOR no será responsable por efectos derivados de información falsa u omitida.\n\nCUARTA. RESPONSABILIDAD\nEL PRESTADOR no garantiza resultados específicos, ya que estos pueden variar según el tipo de piel, vello y constancia en las sesiones. EL CLIENTE acepta que los resultados pueden diferir entre personas.\n\nQUINTA. PRECIO Y FORMA DE PAGO\nEl costo del servicio será el informado y aceptado previamente por EL CLIENTE al momento de la reserva o atención, y deberá cubrirse conforme a las políticas vigentes de All Beauty Luxury & Wellness.\n\nSEXTA. CANCELACIONES Y REEMBOLSOS\nLas cancelaciones deberán realizarse con la anticipación establecida por EL PRESTADOR. Una vez iniciado el servicio, no habrá reembolsos.\n\nSÉPTIMA. DATOS PERSONALES\nLos datos personales de EL CLIENTE serán tratados conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares y al aviso de privacidad de All Beauty Luxury & Wellness.\n\nOCTAVA. VIGENCIA\nEl presente contrato surtirá efectos a partir de la aceptación y/o firma del mismo y permanecerá vigente durante la prestación del servicio contratado.\n\nNOVENA. LEGISLACIÓN Y JURISDICCIÓN\nPara la interpretación y cumplimiento del presente contrato, las partes se someten a las leyes de los Estados Unidos Mexicanos y a los tribunales competentes del lugar donde se preste el servicio.\n\nACEPTACIÓN\n\nEL CLIENTE manifiesta haber leído y comprendido el presente contrato, aceptando su contenido en su totalidad.', 'CON-1765999528170-9', 'data:image/png;base64,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', '2025-12-18 01:25:28', 9, 1, '2025-12-17 19:25:28', '2025-12-17 19:25:28', NULL, 'data:image/png;base64,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', '127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Mobile/15E148 Safari/604.1');

-- --------------------------------------------------------

--
-- Table structure for table `contract_emails`
--

CREATE TABLE `contract_emails` (
  `id` int(11) NOT NULL,
  `appointment_id` int(11) NOT NULL,
  `contract_id` int(11) DEFAULT NULL,
  `patient_id` int(11) NOT NULL,
  `email_to` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_type` enum('signed_contract','contract_reminder','contract_update') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'signed_contract',
  `status` enum('pending','sent','failed','bounced') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `pdf_attachment_path` text COLLATE utf8mb4_unicode_ci COMMENT 'Path to PDF attachment',
  `sent_at` timestamp NULL DEFAULT NULL,
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
(9, 'Alex', 'Gomez', 'axgoomez@gmail.com', NULL, 'patient', 1, '2025-12-17 19:23:16', '4741400364', '1999-08-19', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2025-11-11 04:25:54', '2025-12-17 19:23:16'),
(10, 'Felix', 'Gomez', 'tonatiuh.gom@gmail.com', NULL, 'patient', 1, '2025-11-12 05:46:39', '4741400363', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2025-11-11 04:37:34', '2025-11-12 05:46:39'),
(11, 'Felix', 'Gomez', 'test@gmail.com', NULL, 'patient', 0, NULL, '1234567890', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2025-11-11 05:13:59', '2025-11-11 05:13:59'),
(12, 'Machaca', 'Gomez', 'machaca@gmail.com', NULL, 'patient', 0, NULL, '+52 474 140 0363', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2025-11-11 05:21:46', '2025-11-11 05:21:46'),
(13, 'Hebert', 'Montecino', 'hebert@dupeadsmedia.com', NULL, 'patient', 1, '2025-11-23 00:17:17', '+529095279692', '1994-11-20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2025-11-19 22:33:09', '2025-11-23 00:17:17'),
(14, 'Angel', 'Alvarez', 'aangelcrza@gmail.com', NULL, 'patient', 1, '2025-12-23 21:14:01', '+525664096410', '2005-09-23', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2025-12-23 21:13:08', '2025-12-23 21:14:01');

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
(24, NULL, 9, 1500.00, 'stripe', 'completed', 'pi_3SYDneAxpuzS9HfB017Gt4xD', 'pi_3SYDneAxpuzS9HfB017Gt4xD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 9, '2025-11-27 22:36:41', '2025-11-27 22:36:41', '2025-11-27 22:36:41'),
(25, NULL, 9, 1500.00, 'stripe', 'completed', 'pi_3Sdc8n47qEGGczco00NdNPyQ', 'pi_3Sdc8n47qEGGczco00NdNPyQ', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 9, '2025-12-12 19:36:51', '2025-12-12 19:36:51', '2025-12-12 19:36:51'),
(26, NULL, 9, 1200.00, 'stripe', 'completed', 'pi_3Se3hQ47qEGGczco1lVEL3p6', 'pi_3Se3hQ47qEGGczco1lVEL3p6', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 9, '2025-12-14 01:02:23', '2025-12-14 01:02:23', '2025-12-14 01:02:23'),
(27, NULL, 9, 2000.00, 'stripe', 'completed', 'pi_3SeRvj47qEGGczco0enAty4k', 'pi_3SeRvj47qEGGczco0enAty4k', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 9, '2025-12-15 02:54:47', '2025-12-15 02:54:47', '2025-12-15 02:54:47'),
(28, NULL, 9, 300.00, 'stripe', 'completed', 'pi_3SeSQL47qEGGczco1nXcPNaf', 'pi_3SeSQL47qEGGczco1nXcPNaf', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 9, '2025-12-15 03:26:25', '2025-12-15 03:26:25', '2025-12-15 03:26:25'),
(29, NULL, 9, 2000.00, 'stripe', 'completed', 'pi_3SeSlr47qEGGczco2CPrEDcU', 'pi_3SeSlr47qEGGczco2CPrEDcU', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 9, '2025-12-15 03:48:37', '2025-12-15 03:48:37', '2025-12-15 03:48:37'),
(30, NULL, 9, 1500.00, 'stripe', 'completed', 'pi_3SehjQAxpuzS9HfB3oeDGubb', 'pi_3SehjQAxpuzS9HfB3oeDGubb', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 9, '2025-12-15 19:47:07', '2025-12-15 19:47:07', '2025-12-15 19:47:07'),
(31, NULL, 9, 1500.00, 'stripe', 'completed', 'pi_3SfQJg47qEGGczco2b6LNRwV', 'pi_3SfQJg47qEGGczco2b6LNRwV', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, NULL, 9, '2025-12-17 19:23:34', '2025-12-17 19:23:34', '2025-12-17 19:23:34');

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
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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

INSERT INTO `services` (`id`, `name`, `description`, `image_url`, `category`, `price`, `duration_minutes`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Láser Diodo - Área Pequeña', 'Depilación láser en área pequeña (labio superior, mentón)', NULL, 'laser_hair_removal', 500.00, 30, 1, '2025-11-03 01:54:22', '2025-11-03 01:54:22'),
(2, 'Láser Diodo - Área Mediana', 'Depilación láser en área mediana (axilas, bikini)', NULL, 'laser_hair_removal', 800.00, 45, 1, '2025-11-03 01:54:22', '2025-11-03 01:54:22'),
(3, 'Láser Diodo - Área Grande', 'Depilación láser en área grande (piernas completas, espalda)', NULL, 'laser_hair_removal', 1500.00, 90, 1, '2025-11-03 01:54:22', '2025-11-03 01:54:22'),
(4, 'Limpieza Facial Profunda', 'Limpieza facial completa con extracción y mascarilla', NULL, 'facial_treatment', 1200.00, 60, 1, '2025-11-03 01:54:22', '2025-11-03 01:54:22'),
(5, 'Tratamiento Corporal Reductivo', 'Tratamiento corporal para reducción de medidas', NULL, 'body_treatment', 2000.00, 90, 1, '2025-11-03 01:54:22', '2025-11-03 01:54:22'),
(6, 'Consulta Inicial', 'Consulta médica inicial con evaluación', NULL, 'consultation', 300.00, 30, 1, '2025-11-03 01:54:22', '2025-11-03 01:54:22');

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
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_unicode_ci,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`id`, `setting_key`, `setting_value`, `description`, `updated_at`, `updated_by`) VALUES
(1, 'default_contract_terms', 'Luxury & Wellness, en lo sucesivo “EL PRESTADOR”, y el cliente cuyos datos aparecen en la parte superior del presente documento, en lo sucesivo “EL CLIENTE”, conforme a las siguientes declaraciones y cláusulas:\n\nDECLARACIONES\n\nI. Declara EL PRESTADOR que:\na) Es una entidad legalmente constituida conforme a las leyes de los Estados Unidos Mexicanos.\nb) Cuenta con el personal capacitado, instalaciones y equipos necesarios para la prestación de servicios de depilación estética.\nc) Cumple con las normas sanitarias y regulatorias aplicables.\n\nII. Declara EL CLIENTE que:\na) Es mayor de edad y cuenta con capacidad legal para contratar los servicios descritos.\nb) La información mostrada en la parte superior del presente contrato es correcta y fue proporcionada por él/ella mismo(a).\nc) Ha informado de manera veraz cualquier condición médica, alergia, tratamiento dermatológico, embarazo o padecimiento relevante.\n\nIII. Declaran ambas partes que reconocen la validez legal del presente contrato y se obligan conforme a sus términos.\n\nCLÁUSULAS\n\nPRIMERA. OBJETO\nEL PRESTADOR se obliga a prestar a EL CLIENTE servicios de depilación estética, ya sea mediante láser, cera, luz pulsada u otros métodos disponibles en All Beauty Luxury & Wellness, de acuerdo con la evaluación previa realizada.\n\nSEGUNDA. CONSENTIMIENTO INFORMADO\nEL CLIENTE manifiesta que ha recibido información clara y suficiente sobre el procedimiento, posibles molestias, riesgos, efectos secundarios, cuidados posteriores y resultados esperados, otorgando su consentimiento libre y voluntario.\n\nTERCERA. ESTADO DE SALUD\nEL CLIENTE declara no presentar condiciones médicas que contraindiquen el servicio, o en su caso, haberlas informado previamente. EL PRESTADOR no será responsable por efectos derivados de información falsa u omitida.\n\nCUARTA. RESPONSABILIDAD\nEL PRESTADOR no garantiza resultados específicos, ya que estos pueden variar según el tipo de piel, vello y constancia en las sesiones. EL CLIENTE acepta que los resultados pueden diferir entre personas.\n\nQUINTA. PRECIO Y FORMA DE PAGO\nEl costo del servicio será el informado y aceptado previamente por EL CLIENTE al momento de la reserva o atención, y deberá cubrirse conforme a las políticas vigentes de All Beauty Luxury & Wellness.\n\nSEXTA. CANCELACIONES Y REEMBOLSOS\nLas cancelaciones deberán realizarse con la anticipación establecida por EL PRESTADOR. Una vez iniciado el servicio, no habrá reembolsos.\n\nSÉPTIMA. DATOS PERSONALES\nLos datos personales de EL CLIENTE serán tratados conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares y al aviso de privacidad de All Beauty Luxury & Wellness.\n\nOCTAVA. VIGENCIA\nEl presente contrato surtirá efectos a partir de la aceptación y/o firma del mismo y permanecerá vigente durante la prestación del servicio contratado.\n\nNOVENA. LEGISLACIÓN Y JURISDICCIÓN\nPara la interpretación y cumplimiento del presente contrato, las partes se someten a las leyes de los Estados Unidos Mexicanos y a los tribunales competentes del lugar donde se preste el servicio.\n\nACEPTACIÓN\n\nEL CLIENTE manifiesta haber leído y comprendido el presente contrato, aceptando su contenido en su totalidad.', 'Default terms and conditions used in all contracts', '2025-12-15 03:25:06', 1);

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
(11, 'tonatiuh.gom@gmail.com', '', 'doctor', 'Dr. Alex', 'Gomez', '+1234567892', NULL, 'Depilacion', 'DOC001', 1, 0, '2025-11-12 04:42:13', '2025-12-15 20:03:47', '2025-12-15 04:56:35'),
(12, 'axgoomez@gmail.com', '', 'general_admin', 'Alex', 'Gomez', '+1234567893', NULL, NULL, 'ADM001', 1, 1, '2025-11-12 04:42:13', '2025-12-17 19:28:22', '2025-12-17 19:28:22'),
(13, 'hebert@dupeadsmedia.com', '', 'general_admin', 'Hebert', 'Montecinos', NULL, NULL, '', 'ADM002', 1, 1, '2025-11-19 22:15:46', '2025-12-23 05:00:29', '2025-12-23 05:00:29');

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
(42, NULL, 9, 561058, 1, '2025-12-18 01:23:02', '2025-12-17 19:23:02'),
(43, NULL, 14, 936533, 1, '2025-12-24 03:13:48', '2025-12-23 21:13:47');

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
  ADD KEY `idx_booking_source` (`booking_source`),
  ADD KEY `idx_check_in_token` (`check_in_token`);

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
-- Indexes for table `check_in_logs`
--
ALTER TABLE `check_in_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_appointment_id` (`appointment_id`),
  ADD KEY `idx_check_in_token` (`check_in_token`);

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
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `contract_emails`
--
ALTER TABLE `contract_emails`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_appointment_id` (`appointment_id`),
  ADD KEY `idx_patient_id` (`patient_id`),
  ADD KEY `idx_status` (`status`);

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
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`),
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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=63;

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `business_hours`
--
ALTER TABLE `business_hours`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `check_in_logs`
--
ALTER TABLE `check_in_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT for table `content_pages`
--
ALTER TABLE `content_pages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `contracts`
--
ALTER TABLE `contracts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `contract_emails`
--
ALTER TABLE `contract_emails`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

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
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `users_sessions`
--
ALTER TABLE `users_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

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
-- Constraints for table `check_in_logs`
--
ALTER TABLE `check_in_logs`
  ADD CONSTRAINT `check_in_logs_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE;

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
-- Constraints for table `contract_emails`
--
ALTER TABLE `contract_emails`
  ADD CONSTRAINT `contract_emails_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `contract_emails_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE;

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
-- Constraints for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD CONSTRAINT `system_settings_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

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
