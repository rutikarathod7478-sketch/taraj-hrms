-- =====================================================================
-- Migration 06: HR Department Question Bank (Technical Round 2)
-- Exactly 15 questions, total 35 marks:
--   - 5 MCQ (1 mark each) = 5 marks
--   - 2 Multiple Select (2 marks each) = 4 marks
--   - 2 True/False (1 mark each) = 2 marks
--   - 3 Short Answer (3 marks each) = 9 marks
--   - 3 Scenario-Based (5 marks each) = 15 marks
-- Associated with Department ID: 5 (code: 'HR', name: 'HR')
-- =====================================================================

-- 1. Deactivate outdated questions for HR department Technical round
UPDATE `interview_questions`
SET `is_active` = 0
WHERE `department_id` = 5 AND `round_type` = 'department';

-- 2. Insert or update the 15 HR Department questions
-- MCQ 1 (1 mark)
INSERT INTO `interview_questions` (
    `department_id`, `round_type`, `question_type`, `question_text`,
    `options`, `correct_answer`, `max_score`, `expected_answer_guidance`, `time_limit_seconds`, `weight`, `is_active`
) VALUES (
    5, 'department', 'mcq',
    'What is the primary purpose of an HR screening interview?',
    '{"A": "To guarantee selection", "B": "To assess the candidate\'s suitability against role requirements", "C": "To discuss unrelated personal matters", "D": "To avoid checking qualifications"}',
    'B', 1,
    'To assess the candidate\'s suitability against role requirements.',
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
    5, 'department', 'mcq',
    'What does onboarding mean?',
    '{"A": "Advertising a vacancy", "B": "Integrating a new employee into the organization", "C": "Rejecting an application", "D": "Closing a project"}',
    'B', 1,
    'Integrating a new employee into the organization.',
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
    5, 'department', 'mcq',
    'Which document typically outlines an employee\'s job responsibilities?',
    '{"A": "Job description", "B": "Marketing brochure", "C": "Purchase invoice", "D": "Database backup"}',
    'A', 1,
    'Job description.',
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
    5, 'department', 'mcq',
    'Why should candidate information be handled confidentially?',
    '{"A": "To prevent authorized hiring managers from working", "B": "To protect personal information and restrict unauthorized access", "C": "To avoid maintaining records", "D": "To publish candidate details publicly"}',
    'B', 1,
    'To protect personal information and restrict unauthorized access.',
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
    5, 'department', 'mcq',
    'Which is the most appropriate basis for selecting a candidate?',
    '{"A": "Personal favoritism", "B": "Relevant skills, qualifications, and job-related assessment", "C": "Unrelated personal characteristics", "D": "The order in which applications arrived, regardless of requirements"}',
    'B', 1,
    'Relevant skills, qualifications, and job-related assessment.',
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
    5, 'department', 'multiple_select',
    'Which information may be relevant to a candidate\'s recruitment record?',
    '{"A": "Contact details", "B": "Relevant qualifications", "C": "Interview evaluation", "D": "Application status", "E": "Unrelated personal gossip"}',
    'A, B, C, D', 2,
    'Contact details, Relevant qualifications, Interview evaluation, and Application status are legitimate recruitment record items.',
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
    5, 'department', 'multiple_select',
    'Which activities are part of employee onboarding?',
    '{"A": "Collecting required employment documents", "B": "Explaining company policies", "C": "Arranging access and equipment", "D": "Introducing the employee to the team", "E": "Sharing confidential employee records with everyone"}',
    'A, B, C, D', 2,
    'Collecting required employment documents, Explaining company policies, Arranging access and equipment, and Introducing the employee to the team.',
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
    5, 'department', 'true_false',
    'Interview evaluations should be based on job-related evidence and consistent assessment criteria.',
    '{"A": "True", "B": "False"}',
    'True', 1,
    'True. Evaluations must be objective, job-related, and standardized.',
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
    5, 'department', 'true_false',
    'Every candidate should receive an offer letter before the selection decision is finalized.',
    '{"A": "True", "B": "False"}',
    'False', 1,
    'False. Offer letters are only extended after final selection approval.',
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
    5, 'department', 'short_answer',
    'What is the difference between recruitment and selection?',
    NULL,
    'Recruitment attracts potential candidates; selection evaluates applicants and identifies the most suitable candidate.',
    3,
    'Recruitment attracts potential candidates; selection evaluates applicants and identifies the most suitable candidate.',
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
    5, 'department', 'short_answer',
    'What is an employee onboarding checklist?',
    NULL,
    'A structured list of tasks such as document collection, policy orientation, system access, equipment allocation, and introductions.',
    3,
    'A structured list of tasks such as document collection, policy orientation, system access, equipment allocation, and introductions.',
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
    5, 'department', 'short_answer',
    'How would you maintain confidentiality in an HRMS?',
    NULL,
    'Use role-based access, secure authentication, restricted document permissions, appropriate retention policies, and audit logs.',
    3,
    'Use role-based access, secure authentication, restricted document permissions, appropriate retention policies, and audit logs.',
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
    5, 'department', 'scenario',
    'A candidate passes the HR round but performs poorly in the technical round. How would you update the candidate\'s status?',
    NULL,
    'Record the technical evaluator\'s feedback, update the relevant round result, apply established selection criteria, and communicate the next step according to company policy.',
    5,
    'Record the technical evaluator\'s feedback, update the relevant round result, apply established selection criteria, and communicate the next step according to company policy.',
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
    5, 'department', 'scenario',
    'A candidate\'s CV contains information that conflicts with their application form. What would you do?',
    NULL,
    'Verify the discrepancy respectfully, ask the candidate for clarification, document the outcome, and make a decision based on verified information.',
    5,
    'Verify the discrepancy respectfully, ask the candidate for clarification, document the outcome, and make a decision based on verified information.',
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
    5, 'department', 'scenario',
    'A selected candidate has not submitted all required joining documents before the joining date. How would you handle this?',
    NULL,
    'Identify missing documents, send a secure reminder, confirm acceptable submission timelines with the appropriate HR authority, and track completion without exposing sensitive information.',
    5,
    'Identify missing documents, send a secure reminder, confirm acceptable submission timelines with the appropriate HR authority, and track completion without exposing sensitive information.',
    300, 1.00, 1
) ON DUPLICATE KEY UPDATE
    `options` = VALUES(`options`),
    `correct_answer` = VALUES(`correct_answer`),
    `max_score` = VALUES(`max_score`),
    `expected_answer_guidance` = VALUES(`expected_answer_guidance`),
    `is_active` = 1;
