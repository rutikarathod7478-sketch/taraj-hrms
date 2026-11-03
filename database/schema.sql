-- =====================================================================
-- Taraj Global Solutions - HRMS (Human Resource Management System)
-- Relational Database Schema for MySQL 8+ / MariaDB / XAMPP / phpMyAdmin
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `hrims` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `hrims`;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `activity_logs`;
DROP TABLE IF EXISTS `employees`;
DROP TABLE IF EXISTS `joining_records`;
DROP TABLE IF EXISTS `hiring_decisions`;
DROP TABLE IF EXISTS `candidate_evaluations`;
DROP TABLE IF EXISTS `ai_evaluations`;
DROP TABLE IF EXISTS `interview_recordings`;
DROP TABLE IF EXISTS `interview_answers`;
DROP TABLE IF EXISTS `interviews`;
DROP TABLE IF EXISTS `interview_questions`;
DROP TABLE IF EXISTS `question_categories`;
DROP TABLE IF EXISTS `candidate_documents`;
DROP TABLE IF EXISTS `candidates`;
DROP TABLE IF EXISTS `positions`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `departments`;
SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------
-- 1. Departments (8 Core Defined Departments)
-- -----------------------------------------------------
CREATE TABLE `departments` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(50) NOT NULL UNIQUE,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `description` TEXT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_dept_code` (`code`),
    INDEX `idx_dept_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 2. Positions / Job Roles
-- -----------------------------------------------------
CREATE TABLE `positions` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `department_id` INT UNSIGNED NOT NULL,
    `code` VARCHAR(50) NOT NULL UNIQUE,
    `title` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `requirements` TEXT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX `idx_positions_dept` (`department_id`),
    INDEX `idx_positions_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 3. Users and Authentication
-- -----------------------------------------------------
CREATE TABLE `users` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(60) NOT NULL UNIQUE,
    `email` VARCHAR(120) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(120) NOT NULL,
    `role` ENUM('super_admin', 'hr_manager', 'dept_manager', 'interviewer', 'viewer') NOT NULL DEFAULT 'interviewer',
    `department_id` INT UNSIGNED NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `last_login_at` DATETIME NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_users_role` (`role`),
    INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 4. Candidates (Preserved across entire recruitment workflow)
-- -----------------------------------------------------
CREATE TABLE `candidates` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `candidate_code` VARCHAR(30) NOT NULL UNIQUE,
    `full_name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(25) NOT NULL,
    `date_of_birth` DATE NULL,
    `address` TEXT NULL,
    `candidate_type` ENUM('Fresher', 'Experienced') NOT NULL DEFAULT 'Experienced',
    `department_id` INT UNSIGNED NOT NULL,
    `position_id` INT UNSIGNED NOT NULL,
    `qualification` VARCHAR(120) NULL,
    `college_or_institution` VARCHAR(150) NULL,
    `graduation_year` INT UNSIGNED NULL,
    `experience_years` DECIMAL(4, 1) NOT NULL DEFAULT 0.0,
    `current_employer` VARCHAR(120) NULL,
    `current_ctc` VARCHAR(60) NULL,
    `expected_ctc` VARCHAR(60) NULL,
    `notice_period` INT UNSIGNED NULL DEFAULT 0, -- in days
    `resume_file_path` VARCHAR(500) NULL,
    `resume_original_name` VARCHAR(255) NULL,
    `application_status` ENUM(
        'registered',
        'hr_interview',
        'dept_interview',
        'final_screening',
        'evaluation',
        'offered',
        'rejected',
        'on_hold',
        'joined'
    ) NOT NULL DEFAULT 'registered',
    `registration_source` VARCHAR(50) NOT NULL DEFAULT 'qr_code',
    `qr_token` VARCHAR(64) NULL UNIQUE,
    `notes` TEXT NULL,
    `is_archived` TINYINT(1) NOT NULL DEFAULT 0,
    `registered_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (`position_id`) REFERENCES `positions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX `idx_cand_status` (`application_status`),
    INDEX `idx_cand_dept` (`department_id`),
    INDEX `idx_cand_pos` (`position_id`),
    INDEX `idx_cand_code` (`candidate_code`),
    INDEX `idx_cand_email` (`email`),
    INDEX `idx_cand_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 5. Candidate Documents
-- -----------------------------------------------------
CREATE TABLE `candidate_documents` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `candidate_id` INT UNSIGNED NOT NULL,
    `document_type` ENUM('resume', 'id_proof', 'qualification', 'offer_letter', 'relieving_letter', 'other') NOT NULL DEFAULT 'resume',
    `original_filename` VARCHAR(255) NOT NULL,
    `stored_filename` VARCHAR(255) NOT NULL,
    `file_path` VARCHAR(500) NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `file_size` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `uploaded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_docs_candidate` (`candidate_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 6. Question Categories
-- -----------------------------------------------------
CREATE TABLE `question_categories` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `description` TEXT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 7. Interview Question Bank
-- -----------------------------------------------------
CREATE TABLE `interview_questions` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `department_id` INT UNSIGNED NULL, -- NULL indicates universal/cross-departmental
    `position_id` INT UNSIGNED NULL,
    `category_id` INT UNSIGNED NULL,
    `round_type` ENUM('hr', 'department', 'final') NOT NULL,
    `question_text` TEXT NOT NULL,
    `question_type` VARCHAR(50) NOT NULL DEFAULT 'technical',
    `max_score` INT UNSIGNED NOT NULL DEFAULT 10,
    `expected_answer_guidance` TEXT NULL,
    `time_limit_seconds` INT UNSIGNED NOT NULL DEFAULT 120,
    `weight` DECIMAL(3, 2) NOT NULL DEFAULT 1.00,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (`position_id`) REFERENCES `positions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (`category_id`) REFERENCES `question_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_quest_round` (`round_type`),
    INDEX `idx_quest_dept` (`department_id`),
    INDEX `idx_quest_pos` (`position_id`),
    INDEX `idx_quest_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 8. Interview Sessions (HR, Department, Final)
-- -----------------------------------------------------
CREATE TABLE `interviews` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `candidate_id` INT UNSIGNED NOT NULL,
    `round_type` ENUM('hr', 'department', 'final') NOT NULL,
    `interviewer_id` INT UNSIGNED NULL,
    `scheduled_at` DATETIME NULL,
    `started_at` DATETIME NULL,
    `completed_at` DATETIME NULL,
    `status` ENUM('scheduled', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
    `total_questions` INT UNSIGNED NOT NULL DEFAULT 0,
    `total_score` DECIMAL(5, 2) NULL,
    `maximum_score` DECIMAL(5, 2) NULL,
    `recommendation` ENUM('recommended', 'hold', 'rejected') NULL,
    `interviewer_summary` TEXT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`interviewer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    UNIQUE KEY `uniq_cand_round` (`candidate_id`, `round_type`),
    INDEX `idx_interview_cand` (`candidate_id`),
    INDEX `idx_interview_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 9. Interview Answers and Ratings
-- -----------------------------------------------------
CREATE TABLE `interview_answers` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `interview_id` INT UNSIGNED NOT NULL,
    `question_id` INT UNSIGNED NOT NULL,
    `question_text_snapshot` TEXT NOT NULL, -- Preserves frozen historical question
    `answer_text` TEXT NULL,
    `started_at` DATETIME NULL,
    `answered_at` DATETIME NULL,
    `duration_seconds` INT UNSIGNED NOT NULL DEFAULT 0,
    `score` DECIMAL(4, 2) NOT NULL DEFAULT 0.00,
    `maximum_score` INT UNSIGNED NOT NULL DEFAULT 10,
    `interviewer_remarks` TEXT NULL,
    `evaluation_status` ENUM('pending', 'evaluated') NOT NULL DEFAULT 'evaluated',
    `recording_url` VARCHAR(500) NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`interview_id`) REFERENCES `interviews`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`question_id`) REFERENCES `interview_questions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE KEY `uniq_interview_quest` (`interview_id`, `question_id`),
    INDEX `idx_ans_interview` (`interview_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 10. Voice / Audio Recordings
-- -----------------------------------------------------
CREATE TABLE `interview_recordings` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `interview_id` INT UNSIGNED NOT NULL,
    `interview_answer_id` INT UNSIGNED NULL,
    `candidate_id` INT UNSIGNED NOT NULL,
    `storage_key` VARCHAR(255) NOT NULL,
    `file_path` VARCHAR(500) NOT NULL,
    `original_filename` VARCHAR(255) NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL DEFAULT 'audio/webm',
    `file_size` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `duration_seconds` INT UNSIGNED NOT NULL DEFAULT 0,
    `consent_recorded_at` DATETIME NULL,
    `uploaded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`interview_id`) REFERENCES `interviews`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`interview_answer_id`) REFERENCES `interview_answers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_rec_interview` (`interview_id`),
    INDEX `idx_rec_candidate` (`candidate_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 11. AI-Assisted Evaluation Summaries (Advisory)
-- -----------------------------------------------------
CREATE TABLE `ai_evaluations` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `candidate_id` INT UNSIGNED NOT NULL,
    `interview_id` INT UNSIGNED NULL,
    `summary` TEXT NOT NULL,
    `strengths` JSON NULL,
    `areas_for_assessment` JSON NULL,
    `suggested_followups` JSON NULL,
    `technical_rating` DECIMAL(4, 2) NOT NULL DEFAULT 0.00,
    `communication_rating` DECIMAL(4, 2) NOT NULL DEFAULT 0.00,
    `cultural_fit_rating` DECIMAL(4, 2) NOT NULL DEFAULT 0.00,
    `overall_ai_score` DECIMAL(4, 2) NOT NULL DEFAULT 0.00,
    `recommendation` ENUM('strongly_recommend', 'recommend', 'neutral', 'reject') NOT NULL DEFAULT 'neutral',
    `rubric_version` VARCHAR(50) NOT NULL DEFAULT 'v1.0',
    `model_used` VARCHAR(100) NOT NULL DEFAULT 'gpt-4o-mini',
    `generation_status` ENUM('pending', 'completed', 'failed') NOT NULL DEFAULT 'completed',
    `raw_response` JSON NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`interview_id`) REFERENCES `interviews`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_ai_candidate` (`candidate_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 12. Final Candidate Evaluation (Consolidated 3 Rounds)
-- Formula: (Total earned score / Total possible score) * 100
-- -----------------------------------------------------
CREATE TABLE `candidate_evaluations` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `candidate_id` INT UNSIGNED NOT NULL UNIQUE,
    `round_1_score` DECIMAL(5, 2) NULL,
    `round_1_max_score` DECIMAL(5, 2) NULL,
    `round_2_score` DECIMAL(5, 2) NULL,
    `round_2_max_score` DECIMAL(5, 2) NULL,
    `round_3_score` DECIMAL(5, 2) NULL,
    `round_3_max_score` DECIMAL(5, 2) NULL,
    `total_earned_score` DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
    `total_possible_score` DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
    `overall_percentage` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `evaluation_summary` TEXT NULL,
    `evaluation_status` ENUM('pending', 'completed') NOT NULL DEFAULT 'pending',
    `calculated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 13. HR Hiring Decisions
-- -----------------------------------------------------
CREATE TABLE `hiring_decisions` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `candidate_id` INT UNSIGNED NOT NULL,
    `decision` ENUM('selected', 'rejected', 'on_hold') NOT NULL,
    `decision_notes` TEXT NULL,
    `offered_salary` VARCHAR(60) NULL,
    `offered_position_id` INT UNSIGNED NULL,
    `joining_date` DATE NULL,
    `decided_by` INT UNSIGNED NULL,
    `decision_timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `is_current` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`decided_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (`offered_position_id`) REFERENCES `positions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_decision_cand` (`candidate_id`),
    INDEX `idx_decision_current` (`candidate_id`, `is_current`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 14. Joining and Onboarding Records
-- -----------------------------------------------------
CREATE TABLE `joining_records` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `candidate_id` INT UNSIGNED NOT NULL UNIQUE,
    `employee_id` INT UNSIGNED NULL UNIQUE,
    `joining_status` ENUM('pending', 'confirmed', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    `proposed_joining_date` DATE NOT NULL,
    `confirmed_joining_date` DATE NULL,
    `assigned_department_id` INT UNSIGNED NOT NULL,
    `assigned_position_id` INT UNSIGNED NOT NULL,
    `reporting_manager_id` INT UNSIGNED NULL,
    `probation_months` TINYINT UNSIGNED NOT NULL DEFAULT 3,
    `offer_status` ENUM('draft', 'sent', 'accepted', 'declined') NOT NULL DEFAULT 'draft',
    `documents_verified` TINYINT(1) NOT NULL DEFAULT 0,
    `checklist_status` JSON NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`assigned_department_id`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (`assigned_position_id`) REFERENCES `positions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (`reporting_manager_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 15. Formal Employee Records
-- -----------------------------------------------------
CREATE TABLE `employees` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `candidate_id` INT UNSIGNED NOT NULL UNIQUE,
    `employee_code` VARCHAR(30) NOT NULL UNIQUE,
    `full_name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(120) NOT NULL UNIQUE,
    `phone` VARCHAR(25) NOT NULL,
    `department_id` INT UNSIGNED NOT NULL,
    `position_id` INT UNSIGNED NOT NULL,
    `join_date` DATE NOT NULL,
    `status` ENUM('active', 'probation', 'notice', 'terminated', 'resigned') NOT NULL DEFAULT 'probation',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (`position_id`) REFERENCES `positions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX `idx_employees_code` (`employee_code`),
    INDEX `idx_employees_dept` (`department_id`),
    INDEX `idx_employees_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Connect foreign key for joining_records.employee_id
ALTER TABLE `joining_records`
    ADD CONSTRAINT `fk_joining_records_employee`
    FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- -----------------------------------------------------
-- 16. Activity & Audit Logs
-- -----------------------------------------------------
CREATE TABLE `activity_logs` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(60) NOT NULL,
    `entity_id` INT UNSIGNED NULL,
    `details` JSON NULL,
    `ip_address` VARCHAR(45) NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_logs_action` (`action`),
    INDEX `idx_logs_entity` (`entity_type`, `entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 17. In-App Notifications
-- -----------------------------------------------------
CREATE TABLE `notifications` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NULL,
    `title` VARCHAR(150) NOT NULL,
    `message` TEXT NOT NULL,
    `type` VARCHAR(50) NOT NULL DEFAULT 'info',
    `link` VARCHAR(255) NULL,
    `is_read` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_notif_user_read` (`user_id`, `is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 18. Email Delivery Logs
-- -----------------------------------------------------
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

