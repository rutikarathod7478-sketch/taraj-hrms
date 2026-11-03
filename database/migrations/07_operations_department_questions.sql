-- =====================================================================
-- Migration 07: Operations Department Question Bank (Technical Round 2)
-- Exactly 15 questions, total 35 marks:
--   - 5 MCQ (1 mark each) = 5 marks
--   - 2 Multiple Select (2 marks each) = 4 marks
--   - 2 True/False (1 mark each) = 2 marks
--   - 3 Short Answer (3 marks each) = 9 marks
--   - 3 Scenario-Based (5 marks each) = 15 marks
-- Associated with Department ID: 6 (code: 'OPS', name: 'Operations')
-- =====================================================================

-- 1. Deactivate outdated questions for Operations department Technical round
UPDATE `interview_questions`
SET `is_active` = 0
WHERE `department_id` = 6 AND `round_type` = 'department';

-- 2. Insert or update the 15 Operations Department questions
-- MCQ 1 (1 mark)
INSERT INTO `interview_questions` (
    `department_id`, `round_type`, `question_type`, `question_text`,
    `options`, `correct_answer`, `max_score`, `expected_answer_guidance`, `time_limit_seconds`, `weight`, `is_active`
) VALUES (
    6, 'department', 'mcq',
    'What is the primary objective of business operations?',
    '{"A": "To make daily work inefficient", "B": "To ensure processes run effectively and consistently", "C": "To eliminate all reporting", "D": "To avoid measuring performance"}',
    'B', 1,
    'To ensure processes run effectively and consistently.',
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
    6, 'department', 'mcq',
    'What is a standard operating procedure (SOP)?',
    '{"A": "A documented set of instructions for carrying out a process", "B": "An employee\'s personal opinion", "C": "A marketing campaign", "D": "A database query"}',
    'A', 1,
    'A documented set of instructions for carrying out a process.',
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
    6, 'department', 'mcq',
    'What does a process bottleneck mean?',
    '{"A": "A step that limits the overall flow or capacity of a process", "B": "A completed project", "C": "An employee promotion", "D": "A new office location"}',
    'A', 1,
    'A step that limits the overall flow or capacity of a process.',
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
    6, 'department', 'mcq',
    'Which metric best measures on-time task completion?',
    '{"A": "Number of office chairs", "B": "Percentage of tasks completed by their deadlines", "C": "Number of emails received", "D": "Number of files stored"}',
    'B', 1,
    'Percentage of tasks completed by their deadlines.',
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
    6, 'department', 'mcq',
    'What should be done when an operational process repeatedly fails?',
    '{"A": "Ignore the failures", "B": "Investigate the root cause and implement corrective actions", "C": "Delete all process records", "D": "Continue without informing the responsible team"}',
    'B', 1,
    'Investigate the root cause and implement corrective actions.',
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
    6, 'department', 'multiple_select',
    'Which activities support efficient operations?',
    '{"A": "Documenting workflows", "B": "Tracking task completion", "C": "Identifying recurring delays", "D": "Coordinating across departments", "E": "Ignoring process deviations"}',
    'A, B, C, D', 2,
    'Documenting workflows, Tracking task completion, Identifying recurring delays, and Coordinating across departments.',
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
    6, 'department', 'multiple_select',
    'Which information should an operational task record generally contain?',
    '{"A": "Task description", "B": "Assigned owner", "C": "Due date", "D": "Current status", "E": "Unrelated private information"}',
    'A, B, C, D', 2,
    'Task description, Assigned owner, Due date, and Current status.',
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
    6, 'department', 'true_false',
    'Standardized processes can help improve consistency and reduce avoidable errors.',
    '{"A": "True", "B": "False"}',
    'True', 1,
    'True. Standardized processes establish operational reliability and minimize deviation.',
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
    6, 'department', 'true_false',
    'Operational reports are useful only when a problem has already occurred.',
    '{"A": "True", "B": "False"}',
    'False', 1,
    'False. Reports allow proactive monitoring and performance optimization before issues escalate.',
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
    6, 'department', 'short_answer',
    'What is a standard operating procedure, and why is it useful?',
    NULL,
    'An SOP documents how to perform a task consistently, helping with training, quality, accountability, and error reduction.',
    3,
    'An SOP documents how to perform a task consistently, helping with training, quality, accountability, and error reduction.',
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
    6, 'department', 'short_answer',
    'What is the difference between efficiency and effectiveness?',
    NULL,
    'Efficiency concerns the resources used to achieve an outcome; effectiveness concerns whether the intended outcome is achieved.',
    3,
    'Efficiency concerns the resources used to achieve an outcome; effectiveness concerns whether the intended outcome is achieved.',
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
    6, 'department', 'short_answer',
    'What is root cause analysis?',
    NULL,
    'A method of identifying the underlying reason for a problem rather than treating only its symptoms.',
    3,
    'A method of identifying the underlying reason for a problem rather than treating only its symptoms.',
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
    6, 'department', 'scenario',
    'A daily report is delayed because three departments submit their information late. What would you do?',
    NULL,
    'Identify where delays occur, establish submission deadlines and ownership, automate reminders where possible, and track compliance.',
    5,
    'Identify where delays occur, establish submission deadlines and ownership, automate reminders where possible, and track compliance.',
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
    6, 'department', 'scenario',
    'You discover that two employees are performing the same task while another critical task remains unassigned. How would you respond?',
    NULL,
    'Review task ownership, clarify responsibilities, rebalance workloads, assign the neglected task appropriately, and update the tracker.',
    5,
    'Review task ownership, clarify responsibilities, rebalance workloads, assign the neglected task appropriately, and update the tracker.',
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
    6, 'department', 'scenario',
    'An important operational process fails just before a client deadline. How would you manage the situation?',
    NULL,
    'Assess the impact, notify relevant stakeholders, activate a suitable contingency plan, assign recovery actions, and document the root cause afterward.',
    5,
    'Assess the impact, notify relevant stakeholders, activate a suitable contingency plan, assign recovery actions, and document the root cause afterward.',
    300, 1.00, 1
) ON DUPLICATE KEY UPDATE
    `options` = VALUES(`options`),
    `correct_answer` = VALUES(`correct_answer`),
    `max_score` = VALUES(`max_score`),
    `expected_answer_guidance` = VALUES(`expected_answer_guidance`),
    `is_active` = 1;
