-- =====================================================================
-- Migration 08: DBMS Department Question Bank (Technical Round 2)
-- Exactly 15 questions, total 35 marks:
--   - 5 MCQ (1 mark each) = 5 marks
--   - 2 Multiple Select (2 marks each) = 4 marks
--   - 2 True/False (1 mark each) = 2 marks
--   - 3 Short Answer (3 marks each) = 9 marks
--   - 3 Scenario-Based (5 marks each) = 15 marks
-- Associated with Department ID: 7 (code: 'DBMS', name: 'DBMS')
-- =====================================================================

-- 1. Deactivate outdated questions for DBMS department Technical round
UPDATE `interview_questions`
SET `is_active` = 0
WHERE `department_id` = 7 AND `round_type` = 'department';

-- 2. Insert or update the 15 DBMS Department questions
-- MCQ 1 (1 mark)
INSERT INTO `interview_questions` (
    `department_id`, `round_type`, `question_type`, `question_text`,
    `options`, `correct_answer`, `max_score`, `expected_answer_guidance`, `time_limit_seconds`, `weight`, `is_active`
) VALUES (
    7, 'department', 'mcq',
    'What is the primary purpose of a primary key?',
    '{"A": "To uniquely identify each record in a table", "B": "To format database reports", "C": "To encrypt every column automatically", "D": "To duplicate rows"}',
    'A', 1,
    'To uniquely identify each record in a table.',
    120, 1.00, 1
) ON DUPLICATE KEY UPDATE
    `options` = VALUES(`options`),
    `correct_answer` = VALUES(`correct_answer`),
    `max_score` = VALUES(`max_score`),
    `expected_answer_guidance` = VALUES(`expected_answer_guidance`),
    `is_active` = 1;

-- MCQ 2 (1 mark)
INSERT INTO `interview_questions` (
    `department_id`, `round_type`, `question_type`, `question_text`,
    `options`, `correct_answer`, `max_score`, `expected_answer_guidance`, `time_limit_seconds`, `weight`, `is_active`
) VALUES (
    7, 'department', 'mcq',
    'Which SQL statement retrieves data from a table?',
    '{"A": "SELECT", "B": "INSERT", "C": "DROP", "D": "UPDATE"}',
    'A', 1,
    'SELECT.',
    120, 1.00, 1
) ON DUPLICATE KEY UPDATE
    `options` = VALUES(`options`),
    `correct_answer` = VALUES(`correct_answer`),
    `max_score` = VALUES(`max_score`),
    `expected_answer_guidance` = VALUES(`expected_answer_guidance`),
    `is_active` = 1;

-- MCQ 3 (1 mark)
INSERT INTO `interview_questions` (
    `department_id`, `round_type`, `question_type`, `question_text`,
    `options`, `correct_answer`, `max_score`, `expected_answer_guidance`, `time_limit_seconds`, `weight`, `is_active`
) VALUES (
    7, 'department', 'mcq',
    'Which SQL clause filters rows based on a condition?',
    '{"A": "ORDER BY", "B": "WHERE", "C": "GROUP BY", "D": "CREATE"}',
    'B', 1,
    'WHERE.',
    120, 1.00, 1
) ON DUPLICATE KEY UPDATE
    `options` = VALUES(`options`),
    `correct_answer` = VALUES(`correct_answer`),
    `max_score` = VALUES(`max_score`),
    `expected_answer_guidance` = VALUES(`expected_answer_guidance`),
    `is_active` = 1;

-- MCQ 4 (1 mark)
INSERT INTO `interview_questions` (
    `department_id`, `round_type`, `question_type`, `question_text`,
    `options`, `correct_answer`, `max_score`, `expected_answer_guidance`, `time_limit_seconds`, `weight`, `is_active`
) VALUES (
    7, 'department', 'mcq',
    'What is the purpose of a foreign key?',
    '{"A": "To establish a relationship between tables and enforce referential integrity", "B": "To rename a database", "C": "To sort records alphabetically", "D": "To remove all constraints"}',
    'A', 1,
    'To establish a relationship between tables and enforce referential integrity.',
    120, 1.00, 1
) ON DUPLICATE KEY UPDATE
    `options` = VALUES(`options`),
    `correct_answer` = VALUES(`correct_answer`),
    `max_score` = VALUES(`max_score`),
    `expected_answer_guidance` = VALUES(`expected_answer_guidance`),
    `is_active` = 1;

-- MCQ 5 (1 mark)
INSERT INTO `interview_questions` (
    `department_id`, `round_type`, `question_type`, `question_text`,
    `options`, `correct_answer`, `max_score`, `expected_answer_guidance`, `time_limit_seconds`, `weight`, `is_active`
) VALUES (
    7, 'department', 'mcq',
    'Which SQL command modifies existing records in a table?',
    '{"A": "SELECT", "B": "UPDATE", "C": "CREATE", "D": "GRANT"}',
    'B', 1,
    'UPDATE.',
    120, 1.00, 1
) ON DUPLICATE KEY UPDATE
    `options` = VALUES(`options`),
    `correct_answer` = VALUES(`correct_answer`),
    `max_score` = VALUES(`max_score`),
    `expected_answer_guidance` = VALUES(`expected_answer_guidance`),
    `is_active` = 1;

-- Multiple Select 6 (2 marks)
INSERT INTO `interview_questions` (
    `department_id`, `round_type`, `question_type`, `question_text`,
    `options`, `correct_answer`, `max_score`, `expected_answer_guidance`, `time_limit_seconds`, `weight`, `is_active`
) VALUES (
    7, 'department', 'multiple_select',
    'Which are aggregate functions commonly available in SQL?',
    '{"A": "COUNT()", "B": "SUM()", "C": "AVG()", "D": "MAX()", "E": "PRINT()"}',
    'A, B, C, D', 2,
    'COUNT(), SUM(), AVG(), and MAX() are standard SQL aggregate functions.',
    180, 1.00, 1
) ON DUPLICATE KEY UPDATE
    `options` = VALUES(`options`),
    `correct_answer` = VALUES(`correct_answer`),
    `max_score` = VALUES(`max_score`),
    `expected_answer_guidance` = VALUES(`expected_answer_guidance`),
    `is_active` = 1;

-- Multiple Select 7 (2 marks)
INSERT INTO `interview_questions` (
    `department_id`, `round_type`, `question_type`, `question_text`,
    `options`, `correct_answer`, `max_score`, `expected_answer_guidance`, `time_limit_seconds`, `weight`, `is_active`
) VALUES (
    7, 'department', 'multiple_select',
    'Which practices help maintain database reliability and security?',
    '{"A": "Regular backups", "B": "Appropriate access permissions", "C": "Database transactions where needed", "D": "Parameterized queries for user input", "E": "Sharing administrator credentials with everyone"}',
    'A, B, C, D', 2,
    'Regular backups, Appropriate access permissions, Database transactions where needed, and Parameterized queries for user input.',
    180, 1.00, 1
) ON DUPLICATE KEY UPDATE
    `options` = VALUES(`options`),
    `correct_answer` = VALUES(`correct_answer`),
    `max_score` = VALUES(`max_score`),
    `expected_answer_guidance` = VALUES(`expected_answer_guidance`),
    `is_active` = 1;

-- True/False 8 (1 mark)
INSERT INTO `interview_questions` (
    `department_id`, `round_type`, `question_type`, `question_text`,
    `options`, `correct_answer`, `max_score`, `expected_answer_guidance`, `time_limit_seconds`, `weight`, `is_active`
) VALUES (
    7, 'department', 'true_false',
    'A primary key must uniquely identify records and cannot contain NULL values.',
    '{"A": "True", "B": "False"}',
    'True', 1,
    'True. A primary key constraint enforces uniqueness and non-nullability on the column(s).',
    90, 1.00, 1
) ON DUPLICATE KEY UPDATE
    `options` = VALUES(`options`),
    `correct_answer` = VALUES(`correct_answer`),
    `max_score` = VALUES(`max_score`),
    `expected_answer_guidance` = VALUES(`expected_answer_guidance`),
    `is_active` = 1;

-- True/False 9 (1 mark)
INSERT INTO `interview_questions` (
    `department_id`, `round_type`, `question_type`, `question_text`,
    `options`, `correct_answer`, `max_score`, `expected_answer_guidance`, `time_limit_seconds`, `weight`, `is_active`
) VALUES (
    7, 'department', 'true_false',
    'The SQL condition WHERE salary > 50000 selects employees whose salary is exactly 50000 or higher.',
    '{"A": "True", "B": "False"}',
    'False', 1,
    'False. The strictly greater than operator (>) excludes 50000; (>=) would include it.',
    90, 1.00, 1
) ON DUPLICATE KEY UPDATE
    `options` = VALUES(`options`),
    `correct_answer` = VALUES(`correct_answer`),
    `max_score` = VALUES(`max_score`),
    `expected_answer_guidance` = VALUES(`expected_answer_guidance`),
    `is_active` = 1;

-- Short Answer 10 (3 marks)
INSERT INTO `interview_questions` (
    `department_id`, `round_type`, `question_type`, `question_text`,
    `options`, `correct_answer`, `max_score`, `expected_answer_guidance`, `time_limit_seconds`, `weight`, `is_active`
) VALUES (
    7, 'department', 'short_answer',
    'What is database normalization?',
    NULL,
    'Organizing tables and relationships to reduce unnecessary duplication and prevent data anomalies.',
    3,
    'Organizing tables and relationships to reduce unnecessary duplication and prevent data anomalies.',
    240, 1.00, 1
) ON DUPLICATE KEY UPDATE
    `options` = VALUES(`options`),
    `correct_answer` = VALUES(`correct_answer`),
    `max_score` = VALUES(`max_score`),
    `expected_answer_guidance` = VALUES(`expected_answer_guidance`),
    `is_active` = 1;

-- Short Answer 11 (3 marks)
INSERT INTO `interview_questions` (
    `department_id`, `round_type`, `question_type`, `question_text`,
    `options`, `correct_answer`, `max_score`, `expected_answer_guidance`, `time_limit_seconds`, `weight`, `is_active`
) VALUES (
    7, 'department', 'short_answer',
    'What is the difference between DELETE and DROP in SQL?',
    NULL,
    'DELETE removes rows from a table; DROP removes a database object such as a table itself. Exact behavior depends on the database system and transaction context.',
    3,
    'DELETE removes rows from a table; DROP removes a database object such as a table itself. Exact behavior depends on the database system and transaction context.',
    240, 1.00, 1
) ON DUPLICATE KEY UPDATE
    `options` = VALUES(`options`),
    `correct_answer` = VALUES(`correct_answer`),
    `max_score` = VALUES(`max_score`),
    `expected_answer_guidance` = VALUES(`expected_answer_guidance`),
    `is_active` = 1;

-- Short Answer 12 (3 marks)
INSERT INTO `interview_questions` (
    `department_id`, `round_type`, `question_type`, `question_text`,
    `options`, `correct_answer`, `max_score`, `expected_answer_guidance`, `time_limit_seconds`, `weight`, `is_active`
) VALUES (
    7, 'department', 'short_answer',
    'What is an SQL JOIN? Name two types.',
    NULL,
    'A JOIN combines related rows from tables. Examples include INNER JOIN and LEFT JOIN.',
    3,
    'A JOIN combines related rows from tables. Examples include INNER JOIN and LEFT JOIN.',
    240, 1.00, 1
) ON DUPLICATE KEY UPDATE
    `options` = VALUES(`options`),
    `correct_answer` = VALUES(`correct_answer`),
    `max_score` = VALUES(`max_score`),
    `expected_answer_guidance` = VALUES(`expected_answer_guidance`),
    `is_active` = 1;

-- Scenario-Based 13 (5 marks)
INSERT INTO `interview_questions` (
    `department_id`, `round_type`, `question_type`, `question_text`,
    `options`, `correct_answer`, `max_score`, `expected_answer_guidance`, `time_limit_seconds`, `weight`, `is_active`
) VALUES (
    7, 'department', 'scenario',
    'A query that previously ran quickly is now taking several seconds on a large employee table. How would you investigate?',
    NULL,
    'Examine the query and execution plan, check indexes and filtering conditions, assess table size and statistics, and optimize after measuring the impact.',
    5,
    'Examine the query and execution plan, check indexes and filtering conditions, assess table size and statistics, and optimize after measuring the impact.',
    300, 1.00, 1
) ON DUPLICATE KEY UPDATE
    `options` = VALUES(`options`),
    `correct_answer` = VALUES(`correct_answer`),
    `max_score` = VALUES(`max_score`),
    `expected_answer_guidance` = VALUES(`expected_answer_guidance`),
    `is_active` = 1;

-- Scenario-Based 14 (5 marks)
INSERT INTO `interview_questions` (
    `department_id`, `round_type`, `question_type`, `question_text`,
    `options`, `correct_answer`, `max_score`, `expected_answer_guidance`, `time_limit_seconds`, `weight`, `is_active`
) VALUES (
    7, 'department', 'scenario',
    'An employee record is deleted, but related attendance records remain in the database. How would you prevent data inconsistencies?',
    NULL,
    'Review foreign key constraints and deletion rules, consider soft deletion or controlled cascading where appropriate, and preserve records according to retention requirements.',
    5,
    'Review foreign key constraints and deletion rules, consider soft deletion or controlled cascading where appropriate, and preserve records according to retention requirements.',
    300, 1.00, 1
) ON DUPLICATE KEY UPDATE
    `options` = VALUES(`options`),
    `correct_answer` = VALUES(`correct_answer`),
    `max_score` = VALUES(`max_score`),
    `expected_answer_guidance` = VALUES(`expected_answer_guidance`),
    `is_active` = 1;

-- Scenario-Based 15 (5 marks)
INSERT INTO `interview_questions` (
    `department_id`, `round_type`, `question_type`, `question_text`,
    `options`, `correct_answer`, `max_score`, `expected_answer_guidance`, `time_limit_seconds`, `weight`, `is_active`
) VALUES (
    7, 'department', 'scenario',
    'An application sometimes inserts the same candidate twice when a user clicks Submit repeatedly. How would you solve this at the database level?',
    NULL,
    'Add a suitable unique constraint based on the business rule, use transactions where appropriate, handle duplicate-key errors, and implement application-level idempotency or duplicate prevention.',
    5,
    'Add a suitable unique constraint based on the business rule, use transactions where appropriate, handle duplicate-key errors, and implement application-level idempotency or duplicate prevention.',
    300, 1.00, 1
) ON DUPLICATE KEY UPDATE
    `options` = VALUES(`options`),
    `correct_answer` = VALUES(`correct_answer`),
    `max_score` = VALUES(`max_score`),
    `expected_answer_guidance` = VALUES(`expected_answer_guidance`),
    `is_active` = 1;
