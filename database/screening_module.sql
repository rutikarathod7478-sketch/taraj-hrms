-- =====================================================================
-- Taraj Global Solutions - HRMS
-- Department-Wise Practical Screening Module Schema & 24 Questions Seed
-- =====================================================================

USE `hrims`;

-- 1. Create Assessment Sample Tables for DBMS Evaluation (Safe Sandbox Data)
CREATE TABLE IF NOT EXISTS `assessment_employees` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `department` VARCHAR(50) NOT NULL,
  `salary` DECIMAL(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `assessment_customers` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Populate assessment sandbox tables if empty
INSERT IGNORE INTO `assessment_employees` (`id`, `name`, `department`, `salary`) VALUES
(1, 'Aarav Sharma', 'Sales', 35000.00),
(2, 'Priya Patel', 'Development', 55000.00),
(3, 'Rohan Verma', 'Sales', 42000.00),
(4, 'Sneha Rao', 'HR', 28000.00),
(5, 'Vikram Singh', 'Sales', 31000.00),
(6, 'Ananya Das', 'Quality', 33000.00),
(7, 'Karan Mehta', 'Management', 60000.00);

INSERT IGNORE INTO `assessment_customers` (`id`, `name`, `email`) VALUES
(1, 'Customer One', 'contact@clienta.com'),
(2, 'Customer Two', 'sales@clientb.com'),
(3, 'Customer Three', 'contact@clienta.com'),
(4, 'Customer Four', 'support@clientc.com'),
(5, 'Customer Five', 'sales@clientb.com'),
(6, 'Customer Six', 'info@clientd.com'),
(7, 'Customer Seven', 'contact@clienta.com');

-- 2. Create Screening Questions Table
CREATE TABLE IF NOT EXISTS `screening_questions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `department_id` INT UNSIGNED NOT NULL,
  `question_number` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `question_text` TEXT NOT NULL,
  `instructions` TEXT NULL,
  `question_type` VARCHAR(50) NOT NULL, -- 'data_quality', 'code', 'sql', 'calculation', 'written', 'prioritization', 'scheduling'
  `evaluation_type` VARCHAR(50) NOT NULL DEFAULT 'manual', -- 'automatic', 'manual', 'hybrid'
  `maximum_marks` INT NOT NULL DEFAULT 30,
  `question_data` LONGTEXT NULL, -- JSON formatted dataset, starter code, sample tables, tasks
  `private_answer_key` LONGTEXT NULL, -- Private key NEVER exposed to candidate
  `evaluation_rubric` TEXT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uq_dept_question` (`department_id`, `question_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create Screening Assessments Table
CREATE TABLE IF NOT EXISTS `screening_assessments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `candidate_id` INT UNSIGNED NOT NULL,
  `interview_id` INT UNSIGNED NULL,
  `department_id` INT UNSIGNED NOT NULL,
  `status` ENUM('not_started', 'in_progress', 'submitted', 'pending_review', 'reviewed', 'reopened') DEFAULT 'not_started',
  `started_at` DATETIME NULL,
  `submitted_at` DATETIME NULL,
  `reviewed_at` DATETIME NULL,
  `total_marks` DECIMAL(5,2) DEFAULT 0.00,
  `maximum_marks` DECIMAL(5,2) DEFAULT 100.00,
  `final_score` DECIMAL(5,2) DEFAULT NULL,
  `reviewer_id` INT UNSIGNED NULL,
  `reviewer_notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`),
  UNIQUE KEY `uq_candidate_assessment` (`candidate_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create Screening Answers Table
CREATE TABLE IF NOT EXISTS `screening_answers` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `assessment_id` INT UNSIGNED NOT NULL,
  `question_id` INT UNSIGNED NOT NULL,
  `answer_data` LONGTEXT NULL, -- Candidate submission (JSON or text)
  `awarded_marks` DECIMAL(5,2) DEFAULT 0.00,
  `auto_score` DECIMAL(5,2) DEFAULT NULL,
  `reviewer_feedback` TEXT NULL,
  `reviewed_by` INT UNSIGNED NULL,
  `reviewed_at` DATETIME NULL,
  `evaluation_status` ENUM('pending', 'auto_scored', 'reviewed') DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`assessment_id`) REFERENCES `screening_assessments`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`question_id`) REFERENCES `screening_questions`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uq_assessment_question` (`assessment_id`, `question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
