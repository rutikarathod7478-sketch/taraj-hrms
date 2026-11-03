-- Migration: 01_create_email_logs.sql
USE `hrims`;

CREATE TABLE IF NOT EXISTS `email_logs` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `recipient_email` VARCHAR(150) NOT NULL,
    `subject` VARCHAR(255) NOT NULL,
    `template_type` VARCHAR(60) NOT NULL,
    `status` ENUM('sent', 'failed', 'pending') NOT NULL DEFAULT 'pending',
    `error_message` TEXT NULL,
    `sent_at` DATETIME NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_email_status` (`status`),
    INDEX `idx_email_recipient` (`recipient_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
