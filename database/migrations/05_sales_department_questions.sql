-- =====================================================================
-- Migration 05: Sales Department Question Bank (Technical Round 2)
-- Exactly 15 questions, total 35 marks:
--   - 5 MCQ (1 mark each) = 5 marks
--   - 2 Multiple Select (2 marks each) = 4 marks
--   - 2 True/False (1 mark each) = 2 marks
--   - 3 Short Answer (3 marks each) = 9 marks
--   - 3 Scenario-Based (5 marks each) = 15 marks
-- Associated with Department ID: 4 (code: 'SALES', name: 'Sales')
-- =====================================================================

-- 1. Deactivate outdated questions for Sales department Technical round
UPDATE `interview_questions`
SET `is_active` = 0
WHERE `department_id` = 4 AND `round_type` = 'department';

-- 2. Insert or update the 15 Sales Department questions
-- MCQ 1 (1 mark)
INSERT INTO `interview_questions` (
    `department_id`, `round_type`, `question_type`, `question_text`,
    `options`, `correct_answer`, `max_score`, `expected_answer_guidance`, `time_limit_seconds`, `weight`, `is_active`
) VALUES (
    4, 'department', 'mcq',
    'What is the primary purpose of lead qualification?',
    '{"A": "To contact every lead repeatedly", "B": "To determine whether a lead fits the target customer profile and has potential to buy", "C": "To close every lead immediately", "D": "To avoid asking discovery questions"}',
    'B', 1,
    'To determine whether a lead fits the target customer profile and has potential to buy.',
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
    4, 'department', 'mcq',
    'What does B2B stand for?',
    '{"A": "Business-to-Business", "B": "Buyer-to-Brand", "C": "Business-to-Browser", "D": "Brand-to-Backend"}',
    'A', 1,
    'Business-to-Business.',
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
    4, 'department', 'mcq',
    'What is the best first step when contacting a potential client?',
    '{"A": "Immediately demand a purchase", "B": "Understand the prospect\'s needs and business context", "C": "Send the same long message repeatedly", "D": "Promise results without evidence"}',
    'B', 1,
    'Understand the prospect\'s needs and business context.',
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
    4, 'department', 'mcq',
    'Which information is most useful when qualifying a sales lead?',
    '{"A": "Prospect\'s favorite movie", "B": "Business need, budget, decision authority, and timing", "C": "Personal gossip", "D": "Number of social media photos"}',
    'B', 1,
    'Business need, budget, decision authority, and timing.',
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
    4, 'department', 'mcq',
    'What is the purpose of a CRM system in sales?',
    '{"A": "To track leads, interactions, and sales opportunities", "B": "To replace every customer conversation", "C": "To create graphic designs", "D": "To delete customer records automatically"}',
    'A', 1,
    'To track leads, interactions, and sales opportunities.',
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
    4, 'department', 'multiple_select',
    'Which are good practices when conducting B2B prospecting?',
    '{"A": "Research the target company", "B": "Personalize relevant outreach", "C": "Identify appropriate decision-makers", "D": "Track follow-ups in the CRM", "E": "Make unsupported claims about results"}',
    'A, B, C, D', 2,
    'Research the target company, personalize relevant outreach, identify appropriate decision-makers, and track follow-ups in the CRM.',
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
    4, 'department', 'multiple_select',
    'Which activities help maintain a healthy sales pipeline?',
    '{"A": "Regularly updating opportunity stages", "B": "Following up at appropriate intervals", "C": "Recording customer objections", "D": "Forecasting using current deal information", "E": "Marking every lead as won"}',
    'A, B, C, D', 2,
    'Regularly updating opportunity stages, following up at appropriate intervals, recording customer objections, and forecasting using current deal information.',
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
    4, 'department', 'true_false',
    'A sales representative should understand a prospect\'s needs before recommending a solution.',
    '{"A": "True", "B": "False"}',
    'True', 1,
    'True. Understanding prospect needs before prescribing solutions is fundamental to consultative sales.',
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
    4, 'department', 'true_false',
    'A lead should always be marked as qualified simply because the person replied to an email.',
    '{"A": "True", "B": "False"}',
    'False', 1,
    'False. A reply indicates engagement, but qualification requires assessing fit, need, budget, and decision authority.',
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
    4, 'department', 'short_answer',
    'What is the difference between a lead and a sales-qualified lead?',
    NULL,
    'A lead is a potential customer; a sales-qualified lead has been assessed against relevant criteria and is considered ready for sales engagement.',
    3,
    'A lead is a potential customer; a sales-qualified lead has been assessed against relevant criteria and is considered ready for sales engagement.',
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
    4, 'department', 'short_answer',
    'What is an ideal customer profile (ICP)?',
    NULL,
    'A description of the types of companies most likely to benefit from and purchase a business\'s product or service.',
    3,
    'A description of the types of companies most likely to benefit from and purchase a business\'s product or service.',
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
    4, 'department', 'short_answer',
    'How would you handle a prospect who says your service is too expensive?',
    NULL,
    'Understand the objection, explore the prospect\'s priorities, explain relevant value and evidence, and discuss suitable options without making false promises.',
    3,
    'Understand the objection, explore the prospect\'s priorities, explain relevant value and evidence, and discuss suitable options without making false promises.',
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
    4, 'department', 'scenario',
    'A prospect agrees to a discovery call but does not attend. What would you do?',
    NULL,
    'Send a polite follow-up, offer alternative times, check whether the timing remains suitable, and update the CRM.',
    5,
    'Send a polite follow-up, offer alternative times, check whether the timing remains suitable, and update the CRM.',
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
    4, 'department', 'scenario',
    'A prospect wants a guaranteed number of leads, but your company cannot guarantee that outcome. How would you respond?',
    NULL,
    'Set honest expectations, explain the service scope and measurable deliverables, share substantiated evidence, and avoid unsupported guarantees.',
    5,
    'Set honest expectations, explain the service scope and measurable deliverables, share substantiated evidence, and avoid unsupported guarantees.',
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
    4, 'department', 'scenario',
    'You have 50 new leads but limited time to contact them. How would you prioritize them?',
    NULL,
    'Apply ICP fit, intent signals, business need, potential value, and engagement or qualification data; prioritize transparently and record activity.',
    5,
    'Apply ICP fit, intent signals, business need, potential value, and engagement or qualification data; prioritize transparently and record activity.',
    240, 1.00, 1
) ON DUPLICATE KEY UPDATE
    `options` = VALUES(`options`),
    `correct_answer` = VALUES(`correct_answer`),
    `max_score` = VALUES(`max_score`),
    `expected_answer_guidance` = VALUES(`expected_answer_guidance`),
    `is_active` = 1;
