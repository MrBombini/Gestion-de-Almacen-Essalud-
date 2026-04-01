-- --------------------------------------------------------
-- ESSALUD GESTIÓN DE GASES MEDICINALES - SCHEMA SQL V1.1
-- --------------------------------------------------------

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- --------------------------------------------------------
-- 1. TABLA: USERS (Operarios y Roles)
-- --------------------------------------------------------
CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `operator_code` varchar(50) NOT NULL UNIQUE,
  `name` varchar(255) NOT NULL,
  `role` enum('engineer','technician','viewer') NOT NULL DEFAULT 'technician',
  `email` varchar(255) NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 2. TABLA: GAS_TYPES (Nitrógeno, Oxígeno, etc.)
-- --------------------------------------------------------
CREATE TABLE `gas_types` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `unit` varchar(20) DEFAULT 'm3',
  `min_stock` decimal(10,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 3. TABLA: PROVIDERS (Linde, Praxair, EsSalud)
-- --------------------------------------------------------
CREATE TABLE `providers` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_name` varchar(255) NOT NULL UNIQUE,
  `tax_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 4. TABLA: LOCATIONS (Camas y Servicios)
-- --------------------------------------------------------
CREATE TABLE `locations` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `service_name` varchar(255) NOT NULL,
  `identifier` varchar(255) NOT NULL,
  `short_code` varchar(255) NOT NULL UNIQUE,
  `type` enum('Hospital','Warehouse','Provider','Patient') NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 5. TABLA: CYLINDER_CAPACITIES (1m3, 6m3, 10m3)
-- --------------------------------------------------------
CREATE TABLE `cylinder_capacities` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `value` decimal(10,2) NOT NULL UNIQUE,
  `unit` varchar(20) DEFAULT 'm3',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 6. TABLA: CYLINDERS (El Corazón del Sistema)
-- --------------------------------------------------------
CREATE TABLE `cylinders` (
  `barcode` varchar(255) NOT NULL,
  `serial_number_stamped` varchar(255) DEFAULT NULL,
  `model` varchar(255) DEFAULT NULL,
  `gas_type_id` bigint(20) UNSIGNED NOT NULL,
  `capacity_id` bigint(20) UNSIGNED NOT NULL,
  `provider_id` bigint(20) UNSIGNED NOT NULL,
  `status` enum('Full', 'Empty', 'In Maintenance', 'Damaged', 'Retired') DEFAULT 'Empty',
  `ph_test_date` date DEFAULT NULL,
  `current_location_id` bigint(20) UNSIGNED NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`barcode`),
  KEY `cyl_gas_type_fk` (`gas_type_id`),
  KEY `cyl_capacity_fk` (`capacity_id`),
  KEY `cyl_provider_fk` (`provider_id`),
  KEY `cyl_location_fk` (`current_location_id`),
  CONSTRAINT `cyl_gas_type_fk` FOREIGN KEY (`gas_type_id`) REFERENCES `gas_types` (`id`),
  CONSTRAINT `cyl_capacity_fk` FOREIGN KEY (`capacity_id`) REFERENCES `cylinder_capacities` (`id`),
  CONSTRAINT `cyl_provider_fk` FOREIGN KEY (`provider_id`) REFERENCES `providers` (`id`),
  CONSTRAINT `cyl_location_fk` FOREIGN KEY (`current_location_id`) REFERENCES `locations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 7. TABLA: INVENTORY_MOVEMENTS (Kardex)
-- --------------------------------------------------------
CREATE TABLE `inventory_movements` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `cylinder_barcode` varchar(255) NOT NULL,
  `type` enum('Hospital Exchange','Trasiego/Refill','Entry from Provider','Exit to Provider','Patient Delivery','Patient Return') NOT NULL,
  `location_from_id` bigint(20) UNSIGNED DEFAULT NULL,
  `location_to_id` bigint(20) UNSIGNED DEFAULT NULL,
  `batch_number` varchar(255) DEFAULT NULL,
  `transaction_group_id` char(36) DEFAULT NULL,
  `movement_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `mov_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `mov_cyl_fk` FOREIGN KEY (`cylinder_barcode`) REFERENCES `cylinders` (`barcode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

COMMIT;
