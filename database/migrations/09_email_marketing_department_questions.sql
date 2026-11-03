-- =====================================================================
-- Migration 09: Email Marketing Department Question Bank (Technical Round 2)
-- Exactly 15 questions, total 35 marks:
--   - 5 MCQ (1 mark each) = 5 marks
--   - 2 Multiple Select (2 marks each) = 4 marks
--   - 2 True/False (1 mark each) = 2 marks
--   - 3 Short Answer (3 marks each) = 9 marks
--   - 3 Scenario-Based (5 marks each) = 15 marks
-- Associated with Department ID: 8 (code: 'EMAIL_MKT', name: 'Email Marketing')
-- =====================================================================

-- 1. Deactivate outdated questions for Email Marketing department Technical round
UPDATE `interview_questions`
SET `is_active` = 0
WHERE `department_id` = 8 AND `round_type` = 'department';

-- 2. Insert or update the 15 Email Marketing Department questions
-- MCQ 1 (1 mark)
INSERT INTO `interview_questions` (
    `department_id`, `round_type`, `question_type`, `question_text`,
    `options`, `correct_answer`, `max_score`, `expected_answer_guidance`, `time_limit_seconds`, `weight`, `is_active`
) VALUES (
    8, 'department', 'mcq',
    'What is the main purpose of audience segmentation in email marketing?',
    '{"A": "To send identical emails to everyone", "B": "To group contacts based on relevant characteristics or behavior", "C": "To delete inactive customers automatically", "D": "To increase email size"}',
    'B', 1,
    'To group contacts based on relevant characteristics or behavior.',
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
    8, 'department', 'mcq',
    'Which metric measures the percentage of delivered emails that recipients clicked through?',
    '{"A": "Bounce rate", "B": "Click-through rate (CTR)", "C": "Unsubscribe count", "D": "Delivery time"}',
    'B', 1,
    'Click-through rate (CTR).',
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
    8, 'department', 'mcq',
    'What is an email bounce?',
    '{"A": "An email that cannot be delivered to its intended recipient", "B": "An email opened multiple times", "C": "A successfully completed campaign", "D": "A recipient clicking a link"}',
    'A', 1,
    'An email that cannot be delivered to its intended recipient.',
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
    8, 'department', 'mcq',
    'What is the purpose of A/B testing in email marketing?',
    '{"A": "To compare variations and determine which performs better", "B": "To send duplicate emails without measurement", "C": "To remove campaign reports", "D": "To prevent personalization"}',
    'A', 1,
    'To compare variations and determine which performs better.',
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
    8, 'department', 'mcq',
    'Which practice can help improve email deliverability?',
    '{"A": "Purchasing random email lists", "B": "Sending to invalid addresses repeatedly", "C": "Maintaining permission-based lists and monitoring bounce rates", "D": "Hiding the unsubscribe option"}',
    'C', 1,
    'Maintaining permission-based lists and monitoring bounce rates.',
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
    8, 'department', 'multiple_select',
    'Which elements can be tested in an email campaign?',
    '{"A": "Subject line", "B": "Call-to-action text", "C": "Email content", "D": "Sending time", "E": "Employee payroll password"}',
    'A, B, C, D', 2,
    'Subject line, Call-to-action text, Email content, and Sending time can all be tested.',
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
    8, 'department', 'multiple_select',
    'Which metrics can help evaluate an email marketing campaign?',
    '{"A": "Delivery rate", "B": "Click-through rate", "C": "Conversion rate", "D": "Unsubscribe rate", "E": "Office attendance"}',
    'A, B, C, D', 2,
    'Delivery rate, Click-through rate, Conversion rate, and Unsubscribe rate.',
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
    8, 'department', 'true_false',
    'A high open rate alone proves that an email campaign generated business revenue.',
    '{"A": "True", "B": "False"}',
    'False', 1,
    'False. High opens do not prove conversions or revenue generation.',
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
    8, 'department', 'true_false',
    'Email marketing lists should be managed in accordance with applicable privacy, consent, and unsubscribe requirements.',
    '{"A": "True", "B": "False"}',
    'True', 1,
    'True. Compliance with privacy, consent, and unsubscribe rules is legally required and preserves deliverability.',
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
    8, 'department', 'short_answer',
    'What is the difference between open rate and click-through rate?',
    NULL,
    'Open rate estimates the proportion of delivered emails recorded as opened; click-through rate measures the proportion of delivered emails that generated clicks. Open tracking can be affected by privacy features and should be interpreted cautiously.',
    3,
    'Open rate estimates the proportion of delivered emails recorded as opened; click-through rate measures the proportion of delivered emails that generated clicks. Open tracking can be affected by privacy features and should be interpreted cautiously.',
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
    8, 'department', 'short_answer',
    'What is email personalization?',
    NULL,
    'Adapting email content to relevant recipient information, preferences, role, or behavior.',
    3,
    'Adapting email content to relevant recipient information, preferences, role, or behavior.',
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
    8, 'department', 'short_answer',
    'What is the purpose of a call to action (CTA) in an email?',
    NULL,
    'To encourage the recipient to take a specific next step, such as booking a meeting, visiting a webpage, or requesting a demo.',
    3,
    'To encourage the recipient to take a specific next step, such as booking a meeting, visiting a webpage, or requesting a demo.',
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
    8, 'department', 'scenario',
    'Your email campaign has a high delivery rate but very few clicks. How would you investigate and improve performance?',
    NULL,
    'Review audience relevance, email content, CTA visibility, landing-page relevance, campaign objective, and click-through data; test improvements systematically.',
    5,
    'Review audience relevance, email content, CTA visibility, landing-page relevance, campaign objective, and click-through data; test improvements systematically.',
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
    8, 'department', 'scenario',
    'Many emails in your campaign are bouncing. What actions would you take?',
    NULL,
    'Analyze hard and soft bounces, suppress invalid addresses, verify list quality and consent, review sending practices, and investigate technical deliverability issues.',
    5,
    'Analyze hard and soft bounces, suppress invalid addresses, verify list quality and consent, review sending practices, and investigate technical deliverability issues.',
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
    8, 'department', 'scenario',
    'You are asked to email 5,000 prospects about a new B2B service, but the list contains contacts with different roles and interests. How would you plan the campaign?',
    NULL,
    'Validate the list and permission basis, segment contacts by relevant business characteristics, tailor messaging and CTAs, test a small campaign where appropriate, and measure meaningful outcomes.',
    5,
    'Validate the list and permission basis, segment contacts by relevant business characteristics, tailor messaging and CTAs, test a small campaign where appropriate, and measure meaningful outcomes.',
    300, 1.00, 1
) ON DUPLICATE KEY UPDATE
    `options` = VALUES(`options`),
    `correct_answer` = VALUES(`correct_answer`),
    `max_score` = VALUES(`max_score`),
    `expected_answer_guidance` = VALUES(`expected_answer_guidance`),
    `is_active` = 1;
