-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Nov 10, 2025 at 10:38 PM
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
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `doctor_id` int(11) DEFAULT NULL,
  `service_id` int(11) NOT NULL,
  `status` enum('scheduled','confirmed','in_progress','completed','cancelled','no_show') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'scheduled',
  `scheduled_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `duration_minutes` int(11) NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` int(11) NOT NULL COMMENT 'Patient ID who created the appointment (logged-in user)',
  `booked_for_self` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Whether appointment is for the logged-in user (1) or someone else (0)',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `appointments`
--

INSERT INTO `appointments` (`id`, `patient_id`, `doctor_id`, `service_id`, `status`, `scheduled_at`, `duration_minutes`, `notes`, `created_by`, `booked_for_self`, `created_at`, `updated_at`) VALUES
(8, 9, NULL, 1, 'confirmed', '2025-11-14 18:30:00', 30, NULL, 9, 1, '2025-11-11 04:26:46', '2025-11-11 04:26:46'),
(9, 9, NULL, 2, 'confirmed', '2025-11-21 17:15:00', 45, NULL, 9, 0, '2025-11-11 04:33:59', '2025-11-11 04:33:59'),
(10, 10, NULL, 1, 'confirmed', '2025-11-14 16:30:00', 30, NULL, 9, 0, '2025-11-11 04:37:46', '2025-11-11 04:37:46');

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
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
(6, '2025-11-20', '2025-11-20', NULL, NULL, 1, 'Evento especial', 'Capacitación del personal médico', 1, '2025-11-10 20:18:30', '2025-11-10 20:18:30'),
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
  `diagnosis` text COLLATE utf8mb4_unicode_ci,
  `treatment` text COLLATE utf8mb4_unicode_ci,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `allergies` text COLLATE utf8mb4_unicode_ci,
  `medications` text COLLATE utf8mb4_unicode_ci,
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
(9, 'Alex', 'Gomez', 'axgoomez@gmail.com', NULL, 'patient', 1, '2025-11-11 04:26:07', '4741400363', '1999-08-19', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2025-11-11 04:25:54', '2025-11-11 04:26:07'),
(10, 'Felix', 'Gomez', 'tonatiuh.gom@gmail.com', NULL, 'patient', 0, NULL, '4741400363', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2025-11-11 04:37:34', '2025-11-11 04:37:34');

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
  `payment_status` enum('pending','processing','completed','failed','refunded') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `stripe_payment_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stripe_payment_intent_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transaction_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `processed_by` int(11) NOT NULL,
  `processed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `appointment_id`, `patient_id`, `amount`, `payment_method`, `payment_status`, `stripe_payment_id`, `stripe_payment_intent_id`, `transaction_id`, `notes`, `processed_by`, `processed_at`, `created_at`, `updated_at`) VALUES
(7, 8, 9, 500.00, 'stripe', 'completed', 'pi_3SS9A4AxpuzS9HfB1rvSYVga', 'pi_3SS9A4AxpuzS9HfB1rvSYVga', NULL, NULL, 9, '2025-11-11 04:26:46', '2025-11-11 04:26:33', '2025-11-11 04:26:46'),
(8, 9, 9, 800.00, 'stripe', 'completed', 'pi_3SS9H4AxpuzS9HfB3YBou4A5', 'pi_3SS9H4AxpuzS9HfB3YBou4A5', NULL, NULL, 9, '2025-11-11 04:33:59', '2025-11-11 04:33:46', '2025-11-11 04:33:59'),
(9, 10, 10, 500.00, 'stripe', 'completed', 'pi_3SS9KlAxpuzS9HfB0CYibD1N', 'pi_3SS9KlAxpuzS9HfB0CYibD1N', NULL, NULL, 9, '2025-11-11 04:37:47', '2025-11-11 04:37:35', '2025-11-11 04:37:47');

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
(1, NULL, 9, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OSwiZW1haWwiOiJheGdvb21lekBnbWFpbC5jb20iLCJyb2xlIjoicGF0aWVudCIsImlhdCI6MTc2MjgzNTE2NywiZXhwIjoxNzYzNDM5OTY3fQ.p_YninY4EOtkXRhlZsxfkdkp2kBRyFPsdAoCDXNGdpA', '2025-11-18 04:26:07', '2025-11-11 04:26:07');

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
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','pos','doctor','receptionist','patient') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'patient',
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `role`, `first_name`, `last_name`, `phone`, `is_active`, `created_at`, `updated_at`, `last_login`) VALUES
(1, 'admin@beautyhospital.com', '$2b$10$TBsX8oVXgbglL8nZqEpygO0PliVXZRqbQHPOEaUxKwhdfHr27ir5a', 'admin', 'Admin', 'User', '+1234567890', 1, '2025-11-03 01:54:22', '2025-11-03 01:54:22', NULL),
(9, 'axgoomez@gmail.com', '', 'patient', 'Alex', 'Gomez', '4741400363', 1, '2025-11-10 17:33:24', '2025-11-11 03:04:36', '2025-11-11 03:04:36');

-- --------------------------------------------------------

--
-- Table structure for table `users_sessions`
--

CREATE TABLE `users_sessions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `patient_id` int(11) DEFAULT NULL,
  `session_code` int(6) NOT NULL,
  `user_session` tinyint(1) NOT NULL,
  `user_session_date_start` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users_sessions`
--

INSERT INTO `users_sessions` (`id`, `user_id`, `patient_id`, `session_code`, `user_session`, `user_session_date_start`) VALUES
(13, NULL, 9, 975847, 1, '2025-11-10 22:25:55');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_patient_id` (`patient_id`),
  ADD KEY `idx_doctor_id` (`doctor_id`),
  ADD KEY `idx_service_id` (`service_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_scheduled_at` (`scheduled_at`),
  ADD KEY `idx_booked_for_self` (`booked_for_self`),
  ADD KEY `idx_created_by` (`created_by`);

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
  ADD KEY `idx_time_range` (`start_time`,`end_time`);

--
-- Indexes for table `business_hours`
--
ALTER TABLE `business_hours`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_day` (`day_of_week`);

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
  ADD KEY `idx_processed_at` (`processed_at`);

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
  ADD KEY `idx_patient_id` (`patient_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

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
-- AUTO_INCREMENT for table `contracts`
--
ALTER TABLE `contracts`
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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `services`
--
ALTER TABLE `services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `users_sessions`
--
ALTER TABLE `users_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `appointments_ibfk_3` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`),
  ADD CONSTRAINT `appointments_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

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
-- Constraints for table `contracts`
--
ALTER TABLE `contracts`
  ADD CONSTRAINT `contracts_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`),
  ADD CONSTRAINT `contracts_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`),
  ADD CONSTRAINT `contracts_ibfk_3` FOREIGN KEY (`signed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `contracts_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

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
  ADD CONSTRAINT `payments_ibfk_3` FOREIGN KEY (`processed_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD CONSTRAINT `refresh_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `refresh_tokens_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `refresh_tokens_ibfk_3` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE;

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
