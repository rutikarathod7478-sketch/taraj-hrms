import { query, execute, pool } from '../src/lib/db/mysql';

interface DevQuestionDef {
  type: string;
  text: string;
  options: Record<string, string> | null;
  correctAnswer: string;
  marks: number;
  guidance: string;
}

export const DEV_QUESTIONS: DevQuestionDef[] = [
  // 1. MCQ (5 questions, 1 mark each = 5 marks)
  {
    type: 'mcq',
    text: 'Which JavaScript keyword declares a block-scoped variable that can be reassigned?',
    options: {
      A: 'const',
      B: 'let',
      C: 'static',
      D: 'final',
    },
    correctAnswer: 'B',
    marks: 1,
    guidance: 'let declares a block-scoped mutable variable that can be reassigned.',
  },
  {
    type: 'mcq',
    text: 'Which React feature allows a component to manage its own changing data?',
    options: {
      A: 'State',
      B: 'HTML attributes only',
      C: 'SQL joins',
      D: 'CSS selectors',
    },
    correctAnswer: 'A',
    marks: 1,
    guidance: 'State allows React components to maintain, track, and update internal dynamic data between renders.',
  },
  {
    type: 'mcq',
    text: 'What is the main purpose of an API?',
    options: {
      A: 'To style a webpage',
      B: 'To enable communication between software systems',
      C: 'To store images exclusively',
      D: 'To compile CSS',
    },
    correctAnswer: 'B',
    marks: 1,
    guidance: 'APIs define contracts and protocols allowing distinct software applications to communicate and exchange data.',
  },
  {
    type: 'mcq',
    text: 'Which Java concept allows a subclass to provide its own implementation of a parent class method?',
    options: {
      A: 'Encapsulation',
      B: 'Method overriding',
      C: 'Constructor overloading',
      D: 'Type casting',
    },
    correctAnswer: 'B',
    marks: 1,
    guidance: 'Method overriding allows a subclass to provide a specific implementation of a method already declared in its superclass.',
  },
  {
    type: 'mcq',
    text: 'What is the purpose of Git?',
    options: {
      A: 'Version control',
      B: 'Image editing',
      C: 'Database hosting only',
      D: 'Browser automation only',
    },
    correctAnswer: 'A',
    marks: 1,
    guidance: 'Git is a distributed version control system for tracking changes in source code during software development.',
  },

  // 2. Multiple Select (2 questions, 2 marks each = 4 marks)
  {
    type: 'multiple_select',
    text: 'Which are valid practices for writing maintainable code?',
    options: {
      A: 'Use meaningful variable names',
      B: 'Break complex logic into reusable functions',
      C: 'Duplicate the same logic everywhere',
      D: 'Handle errors appropriately',
      E: 'Add useful comments when needed',
    },
    correctAnswer: 'A, B, D, E',
    marks: 2,
    guidance: 'Meaningful naming, modularization, proper error handling, and helpful documentation foster clean, maintainable architecture.',
  },
  {
    type: 'multiple_select',
    text: 'Which HTTP methods are commonly used when working with REST APIs?',
    options: {
      A: 'GET',
      B: 'POST',
      C: 'PUT',
      D: 'DELETE',
      E: 'PAINT',
    },
    correctAnswer: 'A, B, C, D',
    marks: 2,
    guidance: 'Standard REST verbs are GET (read), POST (create), PUT/PATCH (update), and DELETE (remove).',
  },

  // 3. True/False (2 questions, 1 mark each = 2 marks)
  {
    type: 'true_false',
    text: 'React components can be reused in different parts of an application.',
    options: {
      A: 'True',
      B: 'False',
    },
    correctAnswer: 'True',
    marks: 1,
    guidance: 'True. Component reusability is a foundational architectural principle of React.',
  },
  {
    type: 'true_false',
    text: 'Client-side validation alone is sufficient to secure all data submitted to a server.',
    options: {
      A: 'True',
      B: 'False',
    },
    correctAnswer: 'False',
    marks: 1,
    guidance: 'False. Client-side checks can be bypassed; robust server-side validation and sanitization are strictly required.',
  },

  // 4. Short Answer (3 questions, 3 marks each = 9 marks)
  {
    type: 'short_answer',
    text: 'What is the difference between let and const in JavaScript?',
    options: null,
    correctAnswer: 'Both are block-scoped. A let variable can be reassigned, while a const binding cannot be reassigned.',
    marks: 3,
    guidance: 'Both are block-scoped. A let variable can be reassigned, while a const binding cannot be reassigned.',
  },
  {
    type: 'short_answer',
    text: 'What is the difference between frontend and backend development?',
    options: null,
    correctAnswer: 'Frontend handles the user interface and client-side interactions; backend handles server-side logic, data processing, and services.',
    marks: 3,
    guidance: 'Frontend handles the user interface and client-side interactions; backend handles server-side logic, data processing, and services.',
  },
  {
    type: 'short_answer',
    text: 'What is the purpose of exception handling in Java?',
    options: null,
    correctAnswer: 'It allows programs to handle runtime errors gracefully using mechanisms such as try, catch, and finally.',
    marks: 3,
    guidance: 'It allows programs to handle runtime errors gracefully using mechanisms such as try, catch, and finally.',
  },

  // 5. Scenario-Based (3 questions, 5 marks each = 15 marks)
  {
    type: 'scenario',
    text: 'A React page displays outdated information after a user updates a record. How would you investigate and fix it?',
    options: null,
    correctAnswer: 'Check state updates, API responses, component rendering, and asynchronous logic; update the correct state after a successful response.',
    marks: 5,
    guidance: 'Check state updates, API responses, component rendering, and asynchronous logic; update the correct state after a successful response.',
  },
  {
    type: 'scenario',
    text: 'Your API returns a 500 Internal Server Error. What steps would you take to identify the cause?',
    options: null,
    correctAnswer: 'Inspect server logs, reproduce the request, check input data, trace backend logic, and verify database or dependency failures.',
    marks: 5,
    guidance: 'Inspect server logs, reproduce the request, check input data, trace backend logic, and verify database or dependency failures.',
  },
  {
    type: 'scenario',
    text: 'Two developers modify the same file and a Git merge conflict occurs. How would you resolve it?',
    options: null,
    correctAnswer: 'Review both changes, discuss conflicting logic, resolve the conflict carefully, run tests, and commit the resolved file.',
    marks: 5,
    guidance: 'Review both changes, discuss conflicting logic, resolve the conflict carefully, run tests, and commit the resolved file.',
  },
];

async function seedDevelopmentDepartmentQuestions() {
  console.log('--- Starting Development Department Question Seeder ---');

  try {
    // 1. Verify Development department exists (ID = 2 or code = 'DEV')
    const depts = await query<any[]>('SELECT id, code, name FROM departments WHERE id = 2 OR code = "DEV" LIMIT 1');
    if (depts.length === 0) {
      throw new Error('Development department not found in database.');
    }
    const devDeptId = depts[0].id;
    console.log(`Verified Development Department: ID ${devDeptId} (${depts[0].name})`);

    // 2. Deactivate any existing non-matching questions for Development Department Round 2 (Tech)
    const texts = DEV_QUESTIONS.map(q => q.text);
    await execute(
      `UPDATE interview_questions 
       SET is_active = 0 
       WHERE department_id = ? AND round_type = 'department' AND question_text NOT IN (${texts.map(() => '?').join(',')})`,
      [devDeptId, ...texts]
    );

    // 3. Upsert each question idempotently
    let inserted = 0;
    let updated = 0;

    for (const q of DEV_QUESTIONS) {
      const existing = await query<any[]>(
        `SELECT id FROM interview_questions 
         WHERE department_id = ? AND round_type = 'department' AND question_text = ? LIMIT 1`,
        [devDeptId, q.text]
      );

      const optionsStr = q.options ? JSON.stringify(q.options) : null;

      if (existing.length > 0) {
        await execute(
          `UPDATE interview_questions
           SET question_type = ?,
               options = ?,
               correct_answer = ?,
               max_score = ?,
               expected_answer_guidance = ?,
               is_active = 1,
               time_limit_seconds = 180,
               weight = 1.00
           WHERE id = ?`,
          [q.type, optionsStr, q.correctAnswer, q.marks, q.guidance, existing[0].id]
        );
        updated++;
      } else {
        await execute(
          `INSERT INTO interview_questions (
             department_id, round_type, question_type, question_text,
             options, correct_answer, max_score, expected_answer_guidance,
             time_limit_seconds, weight, is_active
           ) VALUES (?, 'department', ?, ?, ?, ?, ?, ?, 180, 1.00, 1)`,
          [devDeptId, q.type, q.text, optionsStr, q.correctAnswer, q.marks, q.guidance]
        );
        inserted++;
      }
    }

    console.log(`Seeding complete: ${inserted} inserted, ${updated} updated.`);

    // 4. Verify the active questions
    const activeQuestions = await query<any[]>(
      `SELECT id, question_type, question_text, max_score, correct_answer 
       FROM interview_questions 
       WHERE department_id = ? AND round_type = 'department' AND is_active = 1
       ORDER BY id ASC`,
      [devDeptId]
    );

    const totalMarks = activeQuestions.reduce((acc, curr) => acc + Number(curr.max_score), 0);

    console.log(`\nActive Development Department Questions Count: ${activeQuestions.length}`);
    console.log(`Total Maximum Score Sum: ${totalMarks} / 35 marks`);

    if (activeQuestions.length !== 15 || totalMarks !== 35) {
      console.error(`WARNING: Expected 15 questions and 35 marks, but got ${activeQuestions.length} questions and ${totalMarks} marks!`);
    } else {
      console.log('SUCCESS: Exactly 15 questions and 35 marks verified in database for Development department!');
    }
  } catch (err) {
    console.error('Error seeding questions:', err);
  } finally {
    await pool.end();
  }
}

seedDevelopmentDepartmentQuestions();
