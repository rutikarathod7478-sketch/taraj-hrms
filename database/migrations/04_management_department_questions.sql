-- =====================================================================
-- Migration 04: Management Department Question Bank (Technical Round 2)
-- Exactly 15 questions, total 35 marks:
--   - 5 MCQ (1 mark each) = 5 marks
--   - 2 Multiple Select (2 marks each) = 4 marks
--   - 2 True/False (1 mark each) = 2 marks
--   - 3 Short Answer (3 marks each) = 9 marks
--   - 3 Scenario-Based (5 marks each) = 15 marks
-- Associated with Department ID: 3 (code: 'MGMT', name: 'Management')
-- =====================================================================

-- 1. Deactivate outdated questions for Management department Technical round
UPDATE `interview_questions`
SET `is_active` = 0
WHERE `department_id` = 3 AND `round_type` = 'department';

-- 2. Insert or update the 15 Management Department questions
-- MCQ 1 (1 mark)
INSERT INTO `interview_questions` (
    `department_id`, `round_type`, `question_type`, `question_text`,
    `options`, `correct_answer`, `max_score`, `expected_answer_guidance`, `time_limit_seconds`, `weight`, `is_active`
) VALUES (
    3, 'department', 'mcq',
    'What is the main purpose of project planning?',
    '{"A": "To eliminate all communication", "B": "To define objectives, timelines, resources, and responsibilities", "C": "To increase unnecessary meetings", "D": "To avoid tracking progress"}',
    'B', 1,
    'To define objectives, timelines, resources, and responsibilities.',
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
    3, 'department', 'mcq',
    'What should a manager do first when two urgent tasks compete for the same resources?',
    '{"A": "Ignore both tasks", "B": "Evaluate business impact, deadlines, and dependencies", "C": "Assign both tasks to the same person without discussion", "D": "Cancel the project immediately"}',
    'B', 1,
    'Evaluate business impact, deadlines, and dependencies.',
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
    3, 'department', 'mcq',
    'Which is an example of a measurable performance indicator?',
    '{"A": "The team seems busy", "B": "Everyone looks motivated", "C": "Percentage of project milestones completed on time", "D": "The office feels productive"}',
    'C', 1,
    'Percentage of project milestones completed on time.',
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
    3, 'department', 'mcq',
    'What is delegation?',
    '{"A": "Assigning appropriate responsibilities and authority to team members", "B": "Avoiding responsibility", "C": "Completing every task alone", "D": "Removing all deadlines"}',
    'A', 1,
    'Assigning appropriate responsibilities and authority to team members.',
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
    3, 'department', 'mcq',
    'Which approach is best when a team repeatedly misses deadlines?',
    '{"A": "Blame one employee immediately", "B": "Examine workload, blockers, estimates, and dependencies", "C": "Stop tracking tasks", "D": "Increase deadlines without analysis"}',
    'B', 1,
    'Examine workload, blockers, estimates, and dependencies.',
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
    3, 'department', 'multiple_select',
    'Which activities are part of effective project management?',
    '{"A": "Defining project scope", "B": "Tracking milestones", "C": "Managing risks", "D": "Communicating progress", "E": "Ignoring resource constraints"}',
    'A, B, C, D', 2,
    'Defining project scope, tracking milestones, managing risks, and communicating progress.',
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
    3, 'department', 'multiple_select',
    'Which actions can improve team performance?',
    '{"A": "Giving constructive feedback", "B": "Setting clear expectations", "C": "Recognizing good performance", "D": "Resolving blockers", "E": "Withholding important information"}',
    'A, B, C, D', 2,
    'Giving constructive feedback, setting clear expectations, recognizing good performance, and resolving blockers.',
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
    3, 'department', 'true_false',
    'Effective delegation includes making responsibilities and expected outcomes clear.',
    '{"A": "True", "B": "False"}',
    'True', 1,
    'True. Clear responsibilities and outcomes are vital for successful delegation.',
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
    3, 'department', 'true_false',
    'A project manager should never revise a plan after receiving new information.',
    '{"A": "True", "B": "False"}',
    'False', 1,
    'False. Project plans must adapt and update when new requirements, constraints, or information emerge.',
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
    3, 'department', 'short_answer',
    'What is the difference between a goal and a KPI?',
    NULL,
    'A goal describes the desired outcome; a KPI measures progress or performance toward that outcome.',
    3,
    'A goal describes the desired outcome; a KPI measures progress or performance toward that outcome.',
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
    3, 'department', 'short_answer',
    'How would you prioritize tasks when multiple deadlines overlap?',
    NULL,
    'Assess urgency, business impact, dependencies, effort, and available resources; communicate priorities clearly.',
    3,
    'Assess urgency, business impact, dependencies, effort, and available resources; communicate priorities clearly.',
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
    3, 'department', 'short_answer',
    'What is risk management in a project?',
    NULL,
    'Identifying potential problems, evaluating their likelihood and impact, and planning mitigation or contingency actions.',
    3,
    'Identifying potential problems, evaluating their likelihood and impact, and planning mitigation or contingency actions.',
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
    3, 'department', 'scenario',
    'Your team is two weeks behind schedule, and the client expects delivery on the original date. What would you do?',
    NULL,
    'Identify root causes, review scope and dependencies, prioritize essential deliverables, allocate resources, and communicate a realistic recovery plan.',
    5,
    'Identify root causes, review scope and dependencies, prioritize essential deliverables, allocate resources, and communicate a realistic recovery plan.',
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
    3, 'department', 'scenario',
    'Two team members disagree about how a project should be completed. How would you resolve the conflict?',
    NULL,
    'Hear both perspectives, compare evidence and objectives, agree on decision criteria, and document responsibilities and next steps.',
    5,
    'Hear both perspectives, compare evidence and objectives, agree on decision criteria, and document responsibilities and next steps.',
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
    3, 'department', 'scenario',
    'A project is within budget but is not meeting its expected quality standards. How would you respond?',
    NULL,
    'Assess quality gaps, identify root causes, establish corrective actions, protect essential quality requirements, and revise the delivery plan if necessary.',
    5,
    'Assess quality gaps, identify root causes, establish corrective actions, protect essential quality requirements, and revise the delivery plan if necessary.',
    240, 1.00, 1
) ON DUPLICATE KEY UPDATE
    `options` = VALUES(`options`),
    `correct_answer` = VALUES(`correct_answer`),
    `max_score` = VALUES(`max_score`),
    `expected_answer_guidance` = VALUES(`expected_answer_guidance`),
    `is_active` = 1;
