import { query, execute, pool } from '../src/lib/db/mysql';

interface QualityQuestionDef {
  type: string;
  text: string;
  options: Record<string, string> | null;
  correctAnswer: string;
  marks: number;
  guidance: string;
}

export const QUALITY_QUESTIONS: QualityQuestionDef[] = [
  // 1. MCQ (5 questions, 1 mark each)
  {
    type: 'mcq',
    text: 'What is the primary purpose of software testing?',
    options: {
      A: 'To increase the number of features',
      B: 'To identify defects and verify requirements',
      C: 'To design the user interface',
      D: 'To reduce documentation',
    },
    correctAnswer: 'B',
    marks: 1,
    guidance: 'To identify defects and verify requirements against system specifications.',
  },
  {
    type: 'mcq',
    text: 'What is a test case?',
    options: {
      A: 'A list of employee details',
      B: 'A set of steps, inputs, and expected results used to test functionality',
      C: 'A programming language',
      D: 'A database backup',
    },
    correctAnswer: 'B',
    marks: 1,
    guidance: 'A documented set of steps, inputs, preconditions, and expected outcomes to verify functionality.',
  },
  {
    type: 'mcq',
    text: 'Which testing checks individual components of an application?',
    options: {
      A: 'System testing',
      B: 'Acceptance testing',
      C: 'Unit testing',
      D: 'Performance testing',
    },
    correctAnswer: 'C',
    marks: 1,
    guidance: 'Unit testing checks individual components, functions, or modules of an application in isolation.',
  },
  {
    type: 'mcq',
    text: 'What is regression testing?',
    options: {
      A: 'Testing only new employees',
      B: 'Checking whether changes have broken existing functionality',
      C: 'Deleting old test cases',
      D: 'Testing without requirements',
    },
    correctAnswer: 'B',
    marks: 1,
    guidance: 'Re-testing existing functionalities to ensure new code changes or bug fixes have not introduced side effects.',
  },
  {
    type: 'mcq',
    text: 'Which defect should generally receive the highest priority?',
    options: {
      A: 'A minor spelling mistake',
      B: 'A slightly misaligned icon',
      C: 'A payment failure affecting all users',
      D: 'A small color difference',
    },
    correctAnswer: 'C',
    marks: 1,
    guidance: 'A payment failure affecting all users is a critical revenue blocker requiring immediate triage and fix.',
  },

  // 2. Multiple Select (2 questions, 2 marks each)
  {
    type: 'multiple_select',
    text: 'Which details should a good bug report contain?',
    options: {
      A: 'Steps to reproduce',
      B: 'Expected result',
      C: 'Actual result',
      D: 'Personal opinions about the developer',
      E: 'Relevant screenshots or logs',
    },
    correctAnswer: 'A, B, C, E',
    marks: 2,
    guidance: 'A quality bug report must include steps to reproduce, expected result, actual result, and attachments (screenshots/logs). Personal opinions must never be included.',
  },
  {
    type: 'multiple_select',
    text: 'Which types of testing can help evaluate a web application?',
    options: {
      A: 'Functional testing',
      B: 'Performance testing',
      C: 'Security testing',
      D: 'Usability testing',
      E: 'Employee attendance testing',
    },
    correctAnswer: 'A, B, C, D',
    marks: 2,
    guidance: 'Web applications should be assessed across functional, performance, security, and usability dimensions.',
  },

  // 3. True/False (2 questions, 1 mark each)
  {
    type: 'true_false',
    text: 'Testing can help identify defects, but it cannot guarantee that software is completely defect-free.',
    options: {
      A: 'True',
      B: 'False',
    },
    correctAnswer: 'True',
    marks: 1,
    guidance: 'Testing shows the presence of defects, not their complete absence (ISTQB principle).',
  },
  {
    type: 'true_false',
    text: 'A tester should close a defect without verifying the fix.',
    options: {
      A: 'True',
      B: 'False',
    },
    correctAnswer: 'False',
    marks: 1,
    guidance: 'Testers must always reproduce the scenario on the updated build and verify the fix before closing any defect.',
  },

  // 4. Short Answer (3 questions, 3 marks each)
  {
    type: 'short_answer',
    text: 'What is the difference between quality assurance and quality control?',
    options: null,
    correctAnswer: 'Quality assurance focuses on improving processes to prevent defects. Quality control focuses on checking the product to identify defects.',
    marks: 3,
    guidance: 'Quality assurance focuses on improving processes to prevent defects. Quality control focuses on checking the product to identify defects.',
  },
  {
    type: 'short_answer',
    text: 'What is the difference between severity and priority?',
    options: null,
    correctAnswer: 'Severity describes the impact of a defect; priority describes how urgently it should be fixed.',
    marks: 3,
    guidance: 'Severity describes the impact of a defect; priority describes how urgently it should be fixed.',
  },
  {
    type: 'short_answer',
    text: 'What is boundary value analysis?',
    options: null,
    correctAnswer: 'A testing technique that checks values at and around the minimum and maximum limits of an input range.',
    marks: 3,
    guidance: 'A testing technique that checks values at and around the minimum and maximum limits of an input range.',
  },

  // 5. Scenario-Based (3 questions, 5 marks each)
  {
    type: 'scenario',
    text: 'A login page works correctly with valid credentials but crashes when a user enters a very long password. What would you do?',
    options: null,
    correctAnswer: 'Reproduce the issue, record test data and steps, capture evidence, report severity, and retest after the fix.',
    marks: 5,
    guidance: 'Reproduce the issue, record test data and steps, capture evidence, report severity, and retest after the fix.',
  },
  {
    type: 'scenario',
    text: 'A developer says that a defect cannot be reproduced, but you can reproduce it consistently. How would you handle this?',
    options: null,
    correctAnswer: 'Share exact steps, environment, browser/device details, test data, and logs or recordings; collaborate to reproduce the issue.',
    marks: 5,
    guidance: 'Share exact steps, environment, browser/device details, test data, and logs or recordings; collaborate to reproduce the issue.',
  },
  {
    type: 'scenario',
    text: 'A critical defect is discovered shortly before a release. The project manager wants to release the software on time. What would you recommend?',
    options: null,
    correctAnswer: 'Explain risk and user impact, document evidence, communicate with stakeholders, and recommend a release decision based on risk and release criteria.',
    marks: 5,
    guidance: 'Explain risk and user impact, document evidence, communicate with stakeholders, and recommend a release decision based on risk and release criteria.',
  },
];

async function seedQualityDepartmentQuestions() {
  console.log('--- Starting Quality Department Question Seeder ---');

  try {
    // 1. Verify Quality department exists (ID = 1 or code = 'QUALITY')
    const depts = await query<any[]>('SELECT id, code, name FROM departments WHERE id = 1 OR code = "QUALITY" LIMIT 1');
    if (depts.length === 0) {
      throw new Error('Quality department not found in database.');
    }
    const qualityDeptId = depts[0].id;
    console.log(`Verified Quality Department: ID ${qualityDeptId} (${depts[0].name})`);

    // 2. Deactivate any existing non-matching questions for Quality Department Round 2 (Tech)
    const texts = QUALITY_QUESTIONS.map(q => q.text);
    await execute(
      `UPDATE interview_questions 
       SET is_active = 0 
       WHERE department_id = ? AND round_type = 'department' AND question_text NOT IN (${texts.map(() => '?').join(',')})`,
      [qualityDeptId, ...texts]
    );

    // 3. Upsert each question idempotently
    let inserted = 0;
    let updated = 0;

    for (const q of QUALITY_QUESTIONS) {
      const existing = await query<any[]>(
        `SELECT id FROM interview_questions 
         WHERE department_id = ? AND round_type = 'department' AND question_text = ? LIMIT 1`,
        [qualityDeptId, q.text]
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
          [qualityDeptId, q.type, q.text, optionsStr, q.correctAnswer, q.marks, q.guidance]
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
      [qualityDeptId]
    );

    const totalMarks = activeQuestions.reduce((acc, curr) => acc + Number(curr.max_score), 0);

    console.log(`\nActive Quality Department Questions Count: ${activeQuestions.length}`);
    console.log(`Total Maximum Score Sum: ${totalMarks} / 35 marks`);

    if (activeQuestions.length !== 15 || totalMarks !== 35) {
      console.error(`WARNING: Expected 15 questions and 35 marks, but got ${activeQuestions.length} questions and ${totalMarks} marks!`);
    } else {
      console.log('SUCCESS: Exactly 15 questions and 35 marks verified in database!');
    }
  } catch (err) {
    console.error('Error seeding questions:', err);
  } finally {
    await pool.end();
  }
}

seedQualityDepartmentQuestions();
