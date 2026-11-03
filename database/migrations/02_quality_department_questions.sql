-- =====================================================================
-- Migration 02: Quality Department Question Bank (Technical Round 2)
-- Exactly 15 questions, total 35 marks:
--   - 5 MCQ (1 mark each) = 5 marks
--   - 2 Multiple Select (2 marks each) = 4 marks
--   - 2 True/False (1 mark each) = 2 marks
--   - 3 Short Answer (3 marks each) = 9 marks
--   - 3 Scenario-Based (5 marks each) = 15 marks
-- =====================================================================

-- 1. Deactivate old non-standard questions for Quality department Technical round
UPDATE `interview_questions`
SET `is_active` = 0
WHERE `department_id` = 1 AND `round_type` = 'department';

-- 2. Insert or update the 15 Quality Department questions
-- MCQ 1 (1 mark)
INSERT INTO `interview_questions` (
    `department_id`, `round_type`, `question_type`, `question_text`,
    `options`, `correct_answer`, `max_score`, `expected_answer_guidance`, `time_limit_seconds`, `weight`, `is_active`
) VALUES (
    1, 'department', 'mcq',
    'What is the primary purpose of software testing?',
    '{"A": "To increase the number of features", "B": "To identify defects and verify requirements", "C": "To design the user interface", "D": "To reduce documentation"}',
    'B', 1,
    'To identify defects and verify requirements against system specifications.',
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
    1, 'department', 'mcq',
    'What is a test case?',
    '{"A": "A list of employee details", "B": "A set of steps, inputs, and expected results used to test functionality", "C": "A programming language", "D": "A database backup"}',
    'B', 1,
    'A documented set of steps, inputs, preconditions, and expected outcomes to verify functionality.',
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
    1, 'department', 'mcq',
    'Which testing checks individual components of an application?',
    '{"A": "System testing", "B": "Acceptance testing", "C": "Unit testing", "D": "Performance testing"}',
    'C', 1,
    'Unit testing checks individual components, functions, or modules of an application in isolation.',
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
    1, 'department', 'mcq',
    'What is regression testing?',
    '{"A": "Testing only new employees", "B": "Checking whether changes have broken existing functionality", "C": "Deleting old test cases", "D": "Testing without requirements"}',
    'B', 1,
    'Re-testing existing functionalities to ensure new code changes or bug fixes have not introduced side effects.',
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
    1, 'department', 'mcq',
    'Which defect should generally receive the highest priority?',
    '{"A": "A minor spelling mistake", "B": "A slightly misaligned icon", "C": "A payment failure affecting all users", "D": "A small color difference"}',
    'C', 1,
    'A payment failure affecting all users is a critical revenue blocker requiring immediate triage and fix.',
    120, 1.00, 1
) ON DUPLICATE KEY UPDATE
    `options` = VALUES(`options`),
    `correct_answer` = VALUES(`correct_answer`),
    `max_score` = VALUES(`max_score`),
    `expected_answer_guidance` = VALUES(`expected_answer_guidance`),
    `is_active` = 1;

-- Multiple Select 1 (2 marks)
INSERT INTO `interview_questions` (
    `department_id`, `round_type`, `question_type`, `question_text`,
    `options`, `correct_answer`, `max_score`, `expected_answer_guidance`, `time_limit_seconds`, `weight`, `is_active`
) VALUES (
    1, 'department', 'multiple_select',
    'Which details should a good bug report contain?',
    '{"A": "Steps to reproduce", "B": "Expected result", "C": "Actual result", "D": "Personal opinions about the developer", "E": "Relevant screenshots or logs"}',
    'A, B, C, E', 2,
    'A quality bug report must include steps to reproduce, expected result, actual result, and attachments (screenshots/logs). Personal opinions must never be included.',
    180, 1.00, 1
) ON DUPLICATE KEY UPDATE
    `options` = VALUES(`options`),
    `correct_answer` = VALUES(`correct_answer`),
    `max_score` = VALUES(`max_score`),
    `expected_answer_guidance` = VALUES(`expected_answer_guidance`),
    `is_active` = 1;

-- Multiple Select 2 (2 marks)
INSERT INTO `interview_questions` (
    `department_id`, `round_type`, `question_type`, `question_text`,
    `options`, `correct_answer`, `max_score`, `expected_answer_guidance`, `time_limit_seconds`, `weight`, `is_active`
) VALUES (
    1, 'department', 'multiple_select',
    'Which types of testing can help evaluate a web application?',
    '{"A": "Functional testing", "B": "Performance testing", "C": "Security testing", "D": "Usability testing", "E": "Employee attendance testing"}',
    'A, B, C, D', 2,
    'Web applications should be assessed across functional, performance, security, and usability dimensions.',
    180, 1.00, 1
) ON DUPLICATE KEY UPDATE
    `options` = VALUES(`options`),
    `correct_answer` = VALUES(`correct_answer`),
    `max_score` = VALUES(`max_score`),
    `expected_answer_guidance` = VALUES(`expected_answer_guidance`),
    `is_active` = 1;

-- True/False 1 (1 mark)
INSERT INTO `interview_questions` (
    `department_id`, `round_type`, `question_type`, `question_text`,
    `options`, `correct_answer`, `max_score`, `expected_answer_guidance`, `time_limit_seconds`, `weight`, `is_active`
) VALUES (
    1, 'department', 'true_false',
    'Testing can help identify defects, but it cannot guarantee that software is completely defect-free.',
    '{"A": "True", "B": "False"}',
    'True', 1,
    'True. Testing shows the presence of defects, not their complete absence (ISTQB principle).',
    60, 1.00, 1
) ON DUPLICATE KEY UPDATE
    `options` = VALUES(`options`),
    `correct_answer` = VALUES(`correct_answer`),
    `max_score` = VALUES(`max_score`),
    `expected_answer_guidance` = VALUES(`expected_answer_guidance`),
    `is_active` = 1;

-- True/False 2 (1 mark)
INSERT INTO `interview_questions` (
    `department_id`, `round_type`, `question_type`, `question_text`,
    `options`, `correct_answer`, `max_score`, `expected_answer_guidance`, `time_limit_seconds`, `weight`, `is_active`
) VALUES (
    1, 'department', 'true_false',
    'A tester should close a defect without verifying the fix.',
    '{"A": "True", "B": "False"}',
    'False', 1,
    'False. Testers must always reproduce the scenario on the updated build and verify the fix before closing any defect.',
    60, 1.00, 1
) ON DUPLICATE KEY UPDATE
    `options` = VALUES(`options`),
    `correct_answer` = VALUES(`correct_answer`),
    `max_score` = VALUES(`max_score`),
    `expected_answer_guidance` = VALUES(`expected_answer_guidance`),
    `is_active` = 1;

-- Short Answer 1 (3 marks)
INSERT INTO `interview_questions` (
    `department_id`, `round_type`, `question_type`, `question_text`,
    `options`, `correct_answer`, `max_score`, `expected_answer_guidance`, `time_limit_seconds`, `weight`, `is_active`
) VALUES (
    1, 'department', 'short_answer',
    'What is the difference between quality assurance and quality control?',
    NULL,
    'Quality assurance focuses on improving processes to prevent defects. Quality control focuses on checking the product to identify defects.',
    3,
    'Quality assurance focuses on improving processes to prevent defects. Quality control focuses on checking the product to identify defects.',
    180, 1.00, 1
) ON DUPLICATE KEY UPDATE
    `options` = VALUES(`options`),
    `correct_answer` = VALUES(`correct_answer`),
    `max_score` = VALUES(`max_score`),
    `expected_answer_guidance` = VALUES(`expected_answer_guidance`),
    `is_active` = 1;

-- Short Answer 2 (3 marks)
INSERT INTO `interview_questions` (
    `department_id`, `round_type`, `question_type`, `question_text`,
    `options`, `correct_answer`, `max_score`, `expected_answer_guidance`, `time_limit_seconds`, `weight`, `is_active`
) VALUES (
    1, 'department', 'short_answer',
    'What is the difference between severity and priority?',
    NULL,
    'Severity describes the impact of a defect; priority describes how urgently it should be fixed.',
    3,
    'Severity describes the impact of a defect; priority describes how urgently it should be fixed.',
    180, 1.00, 1
) ON DUPLICATE KEY UPDATE
    `options` = VALUES(`options`),
    `correct_answer` = VALUES(`correct_answer`),
    `max_score` = VALUES(`max_score`),
    `expected_answer_guidance` = VALUES(`expected_answer_guidance`),
    `is_active` = 1;

-- Short Answer 3 (3 marks)
INSERT INTO `interview_questions` (
    `department_id`, `round_type`, `question_type`, `question_text`,
    `options`, `correct_answer`, `max_score`, `expected_answer_guidance`, `time_limit_seconds`, `weight`, `is_active`
) VALUES (
    1, 'department', 'short_answer',
    'What is boundary value analysis?',
    NULL,
    'A testing technique that checks values at and around the minimum and maximum limits of an input range.',
    3,
    'A testing technique that checks values at and around the minimum and maximum limits of an input range.',
    180, 1.00, 1
) ON DUPLICATE KEY UPDATE
    `options` = VALUES(`options`),
    `correct_answer` = VALUES(`correct_answer`),
    `max_score` = VALUES(`max_score`),
    `expected_answer_guidance` = VALUES(`expected_answer_guidance`),
    `is_active` = 1;

-- Scenario 1 (5 marks)
INSERT INTO `interview_questions` (
    `department_id`, `round_type`, `question_type`, `question_text`,
    `options`, `correct_answer`, `max_score`, `expected_answer_guidance`, `time_limit_seconds`, `weight`, `is_active`
) VALUES (
    1, 'department', 'scenario',
    'A login page works correctly with valid credentials but crashes when a user enters a very long password. What would you do?',
    NULL,
    'Reproduce the issue, record test data and steps, capture evidence, report severity, and retest after the fix.',
    5,
    'Reproduce the issue, record test data and steps, capture evidence, report severity, and retest after the fix.',
    240, 1.00, 1
) ON DUPLICATE KEY UPDATE
    `options` = VALUES(`options`),
    `correct_answer` = VALUES(`correct_answer`),
    `max_score` = VALUES(`max_score`),
    `expected_answer_guidance` = VALUES(`expected_answer_guidance`),
    `is_active` = 1;

-- Scenario 2 (5 marks)
INSERT INTO `interview_questions` (
    `department_id`, `round_type`, `question_type`, `question_text`,
    `options`, `correct_answer`, `max_score`, `expected_answer_guidance`, `time_limit_seconds`, `weight`, `is_active`
) VALUES (
    1, 'department', 'scenario',
    'A developer says that a defect cannot be reproduced, but you can reproduce it consistently. How would you handle this?',
    NULL,
    'Share exact steps, environment, browser/device details, test data, and logs or recordings; collaborate to reproduce the issue.',
    5,
    'Share exact steps, environment, browser/device details, test data, and logs or recordings; collaborate to reproduce the issue.',
    240, 1.00, 1
) ON DUPLICATE KEY UPDATE
    `options` = VALUES(`options`),
    `correct_answer` = VALUES(`correct_answer`),
    `max_score` = VALUES(`max_score`),
    `expected_answer_guidance` = VALUES(`expected_answer_guidance`),
    `is_active` = 1;

-- Scenario 3 (5 marks)
INSERT INTO `interview_questions` (
    `department_id`, `round_type`, `question_type`, `question_text`,
    `options`, `correct_answer`, `max_score`, `expected_answer_guidance`, `time_limit_seconds`, `weight`, `is_active`
) VALUES (
    1, 'department', 'scenario',
    'A critical defect is discovered shortly before a release. The project manager wants to release the software on time. What would you recommend?',
    NULL,
    'Explain risk and user impact, document evidence, communicate with stakeholders, and recommend a release decision based on risk and release criteria.',
    5,
    'Explain risk and user impact, document evidence, communicate with stakeholders, and recommend a release decision based on risk and release criteria.',
    240, 1.00, 1
) ON DUPLICATE KEY UPDATE
    `options` = VALUES(`options`),
    `correct_answer` = VALUES(`correct_answer`),
    `max_score` = VALUES(`max_score`),
    `expected_answer_guidance` = VALUES(`expected_answer_guidance`),
    `is_active` = 1;
