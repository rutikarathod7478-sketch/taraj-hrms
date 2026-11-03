-- =====================================================================
-- Migration 03: Development Department Question Bank (Technical Round 2)
-- Exactly 15 questions, total 35 marks:
--   - 5 MCQ (1 mark each) = 5 marks
--   - 2 Multiple Select (2 marks each) = 4 marks
--   - 2 True/False (1 mark each) = 2 marks
--   - 3 Short Answer (3 marks each) = 9 marks
--   - 3 Scenario-Based (5 marks each) = 15 marks
-- Associated with Department ID: 2 (code: 'DEV', name: 'Development')
-- =====================================================================

-- 1. Deactivate outdated questions for Development department Technical round
UPDATE `interview_questions`
SET `is_active` = 0
WHERE `department_id` = 2 AND `round_type` = 'department';

-- 2. Insert or update the 15 Development Department questions
-- MCQ 1 (1 mark)
INSERT INTO `interview_questions` (
    `department_id`, `round_type`, `question_type`, `question_text`,
    `options`, `correct_answer`, `max_score`, `expected_answer_guidance`, `time_limit_seconds`, `weight`, `is_active`
) VALUES (
    2, 'department', 'mcq',
    'Which JavaScript keyword declares a block-scoped variable that can be reassigned?',
    '{"A": "const", "B": "let", "C": "static", "D": "final"}',
    'B', 1,
    'let declares a block-scoped mutable variable that can be reassigned.',
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
    2, 'department', 'mcq',
    'Which React feature allows a component to manage its own changing data?',
    '{"A": "State", "B": "HTML attributes only", "C": "SQL joins", "D": "CSS selectors"}',
    'A', 1,
    'State allows React components to maintain, track, and update internal dynamic data between renders.',
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
    2, 'department', 'mcq',
    'What is the main purpose of an API?',
    '{"A": "To style a webpage", "B": "To enable communication between software systems", "C": "To store images exclusively", "D": "To compile CSS"}',
    'B', 1,
    'APIs define contracts and protocols allowing distinct software applications to communicate and exchange data.',
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
    2, 'department', 'mcq',
    'Which Java concept allows a subclass to provide its own implementation of a parent class method?',
    '{"A": "Encapsulation", "B": "Method overriding", "C": "Constructor overloading", "D": "Type casting"}',
    'B', 1,
    'Method overriding allows a subclass to provide a specific implementation of a method already declared in its superclass.',
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
    2, 'department', 'mcq',
    'What is the purpose of Git?',
    '{"A": "Version control", "B": "Image editing", "C": "Database hosting only", "D": "Browser automation only"}',
    'A', 1,
    'Git is a distributed version control system for tracking changes in source code during software development.',
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
    2, 'department', 'multiple_select',
    'Which are valid practices for writing maintainable code?',
    '{"A": "Use meaningful variable names", "B": "Break complex logic into reusable functions", "C": "Duplicate the same logic everywhere", "D": "Handle errors appropriately", "E": "Add useful comments when needed"}',
    'A, B, D, E', 2,
    'Meaningful naming, modularization, proper error handling, and helpful documentation foster clean, maintainable architecture.',
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
    2, 'department', 'multiple_select',
    'Which HTTP methods are commonly used when working with REST APIs?',
    '{"A": "GET", "B": "POST", "C": "PUT", "D": "DELETE", "E": "PAINT"}',
    'A, B, C, D', 2,
    'Standard REST verbs are GET (read), POST (create), PUT/PATCH (update), and DELETE (remove).',
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
    2, 'department', 'true_false',
    'React components can be reused in different parts of an application.',
    '{"A": "True", "B": "False"}',
    'True', 1,
    'True. Component reusability is a foundational architectural principle of React.',
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
    2, 'department', 'true_false',
    'Client-side validation alone is sufficient to secure all data submitted to a server.',
    '{"A": "True", "B": "False"}',
    'False', 1,
    'False. Client-side checks can be bypassed; robust server-side validation and sanitization are strictly required.',
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
    2, 'department', 'short_answer',
    'What is the difference between let and const in JavaScript?',
    NULL,
    'Both are block-scoped. A let variable can be reassigned, while a const binding cannot be reassigned.',
    3,
    'Both are block-scoped. A let variable can be reassigned, while a const binding cannot be reassigned.',
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
    2, 'department', 'short_answer',
    'What is the difference between frontend and backend development?',
    NULL,
    'Frontend handles the user interface and client-side interactions; backend handles server-side logic, data processing, and services.',
    3,
    'Frontend handles the user interface and client-side interactions; backend handles server-side logic, data processing, and services.',
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
    2, 'department', 'short_answer',
    'What is the purpose of exception handling in Java?',
    NULL,
    'It allows programs to handle runtime errors gracefully using mechanisms such as try, catch, and finally.',
    3,
    'It allows programs to handle runtime errors gracefully using mechanisms such as try, catch, and finally.',
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
    2, 'department', 'scenario',
    'A React page displays outdated information after a user updates a record. How would you investigate and fix it?',
    NULL,
    'Check state updates, API responses, component rendering, and asynchronous logic; update the correct state after a successful response.',
    5,
    'Check state updates, API responses, component rendering, and asynchronous logic; update the correct state after a successful response.',
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
    2, 'department', 'scenario',
    'Your API returns a 500 Internal Server Error. What steps would you take to identify the cause?',
    NULL,
    'Inspect server logs, reproduce the request, check input data, trace backend logic, and verify database or dependency failures.',
    5,
    'Inspect server logs, reproduce the request, check input data, trace backend logic, and verify database or dependency failures.',
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
    2, 'department', 'scenario',
    'Two developers modify the same file and a Git merge conflict occurs. How would you resolve it?',
    NULL,
    'Review both changes, discuss conflicting logic, resolve the conflict carefully, run tests, and commit the resolved file.',
    5,
    'Review both changes, discuss conflicting logic, resolve the conflict carefully, run tests, and commit the resolved file.',
    240, 1.00, 1
) ON DUPLICATE KEY UPDATE
    `options` = VALUES(`options`),
    `correct_answer` = VALUES(`correct_answer`),
    `max_score` = VALUES(`max_score`),
    `expected_answer_guidance` = VALUES(`expected_answer_guidance`),
    `is_active` = 1;
