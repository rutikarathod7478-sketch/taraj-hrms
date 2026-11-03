import { query, execute, pool } from '../src/lib/db/mysql';

interface DBMSQuestionDef {
  type: string;
  text: string;
  options: Record<string, string> | null;
  correctAnswer: string;
  marks: number;
  guidance: string;
}

export const DBMS_QUESTIONS: DBMSQuestionDef[] = [
  // 1. MCQ (5 questions, 1 mark each = 5 marks)
  {
    type: 'mcq',
    text: 'What is the primary purpose of a primary key?',
    options: {
      A: 'To uniquely identify each record in a table',
      B: 'To format database reports',
      C: 'To encrypt every column automatically',
      D: 'To duplicate rows',
    },
    correctAnswer: 'A',
    marks: 1,
    guidance: 'To uniquely identify each record in a table.',
  },
  {
    type: 'mcq',
    text: 'Which SQL statement retrieves data from a table?',
    options: {
      A: 'SELECT',
      B: 'INSERT',
      C: 'DROP',
      D: 'UPDATE',
    },
    correctAnswer: 'A',
    marks: 1,
    guidance: 'SELECT.',
  },
  {
    type: 'mcq',
    text: 'Which SQL clause filters rows based on a condition?',
    options: {
      A: 'ORDER BY',
      B: 'WHERE',
      C: 'GROUP BY',
      D: 'CREATE',
    },
    correctAnswer: 'B',
    marks: 1,
    guidance: 'WHERE.',
  },
  {
    type: 'mcq',
    text: 'What is the purpose of a foreign key?',
    options: {
      A: 'To establish a relationship between tables and enforce referential integrity',
      B: 'To rename a database',
      C: 'To sort records alphabetically',
      D: 'To remove all constraints',
    },
    correctAnswer: 'A',
    marks: 1,
    guidance: 'To establish a relationship between tables and enforce referential integrity.',
  },
  {
    type: 'mcq',
    text: 'Which SQL command modifies existing records in a table?',
    options: {
      A: 'SELECT',
      B: 'UPDATE',
      C: 'CREATE',
      D: 'GRANT',
    },
    correctAnswer: 'B',
    marks: 1,
    guidance: 'UPDATE.',
  },

  // 2. Multiple Select (2 questions, 2 marks each = 4 marks)
  {
    type: 'multiple_select',
    text: 'Which are aggregate functions commonly available in SQL?',
    options: {
      A: 'COUNT()',
      B: 'SUM()',
      C: 'AVG()',
      D: 'MAX()',
      E: 'PRINT()',
    },
    correctAnswer: 'A, B, C, D',
    marks: 2,
    guidance: 'COUNT(), SUM(), AVG(), and MAX() are standard SQL aggregate functions.',
  },
  {
    type: 'multiple_select',
    text: 'Which practices help maintain database reliability and security?',
    options: {
      A: 'Regular backups',
      B: 'Appropriate access permissions',
      C: 'Database transactions where needed',
      D: 'Parameterized queries for user input',
      E: 'Sharing administrator credentials with everyone',
    },
    correctAnswer: 'A, B, C, D',
    marks: 2,
    guidance: 'Regular backups, Appropriate access permissions, Database transactions where needed, and Parameterized queries for user input.',
  },

  // 3. True/False (2 questions, 1 mark each = 2 marks)
  {
    type: 'true_false',
    text: 'A primary key must uniquely identify records and cannot contain NULL values.',
    options: {
      A: 'True',
      B: 'False',
    },
    correctAnswer: 'True',
    marks: 1,
    guidance: 'True. A primary key constraint enforces uniqueness and non-nullability on the column(s).',
  },
  {
    type: 'true_false',
    text: 'The SQL condition WHERE salary > 50000 selects employees whose salary is exactly 50000 or higher.',
    options: {
      A: 'True',
      B: 'False',
    },
    correctAnswer: 'False',
    marks: 1,
    guidance: 'False. The strictly greater than operator (>) excludes 50000; (>=) would include it.',
  },

  // 4. Short Answer (3 questions, 3 marks each = 9 marks)
  {
    type: 'short_answer',
    text: 'What is database normalization?',
    options: null,
    correctAnswer: 'Organizing tables and relationships to reduce unnecessary duplication and prevent data anomalies.',
    marks: 3,
    guidance: 'Organizing tables and relationships to reduce unnecessary duplication and prevent data anomalies.',
  },
  {
    type: 'short_answer',
    text: 'What is the difference between DELETE and DROP in SQL?',
    options: null,
    correctAnswer: 'DELETE removes rows from a table; DROP removes a database object such as a table itself. Exact behavior depends on the database system and transaction context.',
    marks: 3,
    guidance: 'DELETE removes rows from a table; DROP removes a database object such as a table itself. Exact behavior depends on the database system and transaction context.',
  },
  {
    type: 'short_answer',
    text: 'What is an SQL JOIN? Name two types.',
    options: null,
    correctAnswer: 'A JOIN combines related rows from tables. Examples include INNER JOIN and LEFT JOIN.',
    marks: 3,
    guidance: 'A JOIN combines related rows from tables. Examples include INNER JOIN and LEFT JOIN.',
  },

  // 5. Scenario-Based (3 questions, 5 marks each = 15 marks)
  {
    type: 'scenario',
    text: 'A query that previously ran quickly is now taking several seconds on a large employee table. How would you investigate?',
    options: null,
    correctAnswer: 'Examine the query and execution plan, check indexes and filtering conditions, assess table size and statistics, and optimize after measuring the impact.',
    marks: 5,
    guidance: 'Examine the query and execution plan, check indexes and filtering conditions, assess table size and statistics, and optimize after measuring the impact.',
  },
  {
    type: 'scenario',
    text: 'An employee record is deleted, but related attendance records remain in the database. How would you prevent data inconsistencies?',
    options: null,
    correctAnswer: 'Review foreign key constraints and deletion rules, consider soft deletion or controlled cascading where appropriate, and preserve records according to retention requirements.',
    marks: 5,
    guidance: 'Review foreign key constraints and deletion rules, consider soft deletion or controlled cascading where appropriate, and preserve records according to retention requirements.',
  },
  {
    type: 'scenario',
    text: 'An application sometimes inserts the same candidate twice when a user clicks Submit repeatedly. How would you solve this at the database level?',
    options: null,
    correctAnswer: 'Add a suitable unique constraint based on the business rule, use transactions where appropriate, handle duplicate-key errors, and implement application-level idempotency or duplicate prevention.',
    marks: 5,
    guidance: 'Add a suitable unique constraint based on the business rule, use transactions where appropriate, handle duplicate-key errors, and implement application-level idempotency or duplicate prevention.',
  },
];

async function seedDBMSDepartmentQuestions() {
  console.log('--- Starting DBMS Department Question Seeder ---');

  try {
    // 1. Verify DBMS department exists (ID = 7 or code = 'DBMS')
    const depts = await query<any[]>('SELECT id, code, name FROM departments WHERE id = 7 OR code = "DBMS" LIMIT 1');
    if (depts.length === 0) {
      throw new Error('DBMS department not found in database.');
    }
    const dbmsDeptId = depts[0].id;
    console.log(`Verified DBMS Department: ID ${dbmsDeptId} (${depts[0].name})`);

    // 2. Deactivate any existing non-matching questions for DBMS Department Round 2 (Technical)
    const texts = DBMS_QUESTIONS.map(q => q.text);
    await execute(
      `UPDATE interview_questions 
       SET is_active = 0 
       WHERE department_id = ? AND round_type = 'department' AND question_text NOT IN (${texts.map(() => '?').join(',')})`,
      [dbmsDeptId, ...texts]
    );

    // 3. Upsert each question idempotently
    let inserted = 0;
    let updated = 0;

    for (const q of DBMS_QUESTIONS) {
      const existing = await query<any[]>(
        `SELECT id FROM interview_questions 
         WHERE department_id = ? AND round_type = 'department' AND question_text = ? LIMIT 1`,
        [dbmsDeptId, q.text]
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
          [dbmsDeptId, q.type, q.text, optionsStr, q.correctAnswer, q.marks, q.guidance]
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
      [dbmsDeptId]
    );

    const totalMarks = activeQuestions.reduce((acc, curr) => acc + Number(curr.max_score), 0);

    console.log(`\nActive DBMS Department Questions Count: ${activeQuestions.length}`);
    console.log(`Total Maximum Score Sum: ${totalMarks} / 35 marks`);

    if (activeQuestions.length !== 15 || totalMarks !== 35) {
      console.error(`WARNING: Expected 15 questions and 35 marks, but got ${activeQuestions.length} questions and ${totalMarks} marks!`);
    } else {
      console.log('SUCCESS: Exactly 15 questions and 35 marks verified in database for DBMS department!');
    }
  } catch (err) {
    console.error('Error seeding DBMS questions:', err);
  } finally {
    await pool.end();
  }
}

seedDBMSDepartmentQuestions();
