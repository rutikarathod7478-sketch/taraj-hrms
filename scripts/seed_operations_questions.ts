import { query, execute, pool } from '../src/lib/db/mysql';

interface OperationsQuestionDef {
  type: string;
  text: string;
  options: Record<string, string> | null;
  correctAnswer: string;
  marks: number;
  guidance: string;
}

export const OPERATIONS_QUESTIONS: OperationsQuestionDef[] = [
  // 1. MCQ (5 questions, 1 mark each = 5 marks)
  {
    type: 'mcq',
    text: 'What is the primary objective of business operations?',
    options: {
      A: 'To make daily work inefficient',
      B: 'To ensure processes run effectively and consistently',
      C: 'To eliminate all reporting',
      D: 'To avoid measuring performance',
    },
    correctAnswer: 'B',
    marks: 1,
    guidance: 'To ensure processes run effectively and consistently.',
  },
  {
    type: 'mcq',
    text: 'What is a standard operating procedure (SOP)?',
    options: {
      A: 'A documented set of instructions for carrying out a process',
      B: 'An employee\'s personal opinion',
      C: 'A marketing campaign',
      D: 'A database query',
    },
    correctAnswer: 'A',
    marks: 1,
    guidance: 'A documented set of instructions for carrying out a process.',
  },
  {
    type: 'mcq',
    text: 'What does a process bottleneck mean?',
    options: {
      A: 'A step that limits the overall flow or capacity of a process',
      B: 'A completed project',
      C: 'An employee promotion',
      D: 'A new office location',
    },
    correctAnswer: 'A',
    marks: 1,
    guidance: 'A step that limits the overall flow or capacity of a process.',
  },
  {
    type: 'mcq',
    text: 'Which metric best measures on-time task completion?',
    options: {
      A: 'Number of office chairs',
      B: 'Percentage of tasks completed by their deadlines',
      C: 'Number of emails received',
      D: 'Number of files stored',
    },
    correctAnswer: 'B',
    marks: 1,
    guidance: 'Percentage of tasks completed by their deadlines.',
  },
  {
    type: 'mcq',
    text: 'What should be done when an operational process repeatedly fails?',
    options: {
      A: 'Ignore the failures',
      B: 'Investigate the root cause and implement corrective actions',
      C: 'Delete all process records',
      D: 'Continue without informing the responsible team',
    },
    correctAnswer: 'B',
    marks: 1,
    guidance: 'Investigate the root cause and implement corrective actions.',
  },

  // 2. Multiple Select (2 questions, 2 marks each = 4 marks)
  {
    type: 'multiple_select',
    text: 'Which activities support efficient operations?',
    options: {
      A: 'Documenting workflows',
      B: 'Tracking task completion',
      C: 'Identifying recurring delays',
      D: 'Coordinating across departments',
      E: 'Ignoring process deviations',
    },
    correctAnswer: 'A, B, C, D',
    marks: 2,
    guidance: 'Documenting workflows, Tracking task completion, Identifying recurring delays, and Coordinating across departments.',
  },
  {
    type: 'multiple_select',
    text: 'Which information should an operational task record generally contain?',
    options: {
      A: 'Task description',
      B: 'Assigned owner',
      C: 'Due date',
      D: 'Current status',
      E: 'Unrelated private information',
    },
    correctAnswer: 'A, B, C, D',
    marks: 2,
    guidance: 'Task description, Assigned owner, Due date, and Current status.',
  },

  // 3. True/False (2 questions, 1 mark each = 2 marks)
  {
    type: 'true_false',
    text: 'Standardized processes can help improve consistency and reduce avoidable errors.',
    options: {
      A: 'True',
      B: 'False',
    },
    correctAnswer: 'True',
    marks: 1,
    guidance: 'True. Standardized processes establish operational reliability and minimize deviation.',
  },
  {
    type: 'true_false',
    text: 'Operational reports are useful only when a problem has already occurred.',
    options: {
      A: 'True',
      B: 'False',
    },
    correctAnswer: 'False',
    marks: 1,
    guidance: 'False. Reports allow proactive monitoring and performance optimization before issues escalate.',
  },

  // 4. Short Answer (3 questions, 3 marks each = 9 marks)
  {
    type: 'short_answer',
    text: 'What is a standard operating procedure, and why is it useful?',
    options: null,
    correctAnswer: 'An SOP documents how to perform a task consistently, helping with training, quality, accountability, and error reduction.',
    marks: 3,
    guidance: 'An SOP documents how to perform a task consistently, helping with training, quality, accountability, and error reduction.',
  },
  {
    type: 'short_answer',
    text: 'What is the difference between efficiency and effectiveness?',
    options: null,
    correctAnswer: 'Efficiency concerns the resources used to achieve an outcome; effectiveness concerns whether the intended outcome is achieved.',
    marks: 3,
    guidance: 'Efficiency concerns the resources used to achieve an outcome; effectiveness concerns whether the intended outcome is achieved.',
  },
  {
    type: 'short_answer',
    text: 'What is root cause analysis?',
    options: null,
    correctAnswer: 'A method of identifying the underlying reason for a problem rather than treating only its symptoms.',
    marks: 3,
    guidance: 'A method of identifying the underlying reason for a problem rather than treating only its symptoms.',
  },

  // 5. Scenario-Based (3 questions, 5 marks each = 15 marks)
  {
    type: 'scenario',
    text: 'A daily report is delayed because three departments submit their information late. What would you do?',
    options: null,
    correctAnswer: 'Identify where delays occur, establish submission deadlines and ownership, automate reminders where possible, and track compliance.',
    marks: 5,
    guidance: 'Identify where delays occur, establish submission deadlines and ownership, automate reminders where possible, and track compliance.',
  },
  {
    type: 'scenario',
    text: 'You discover that two employees are performing the same task while another critical task remains unassigned. How would you respond?',
    options: null,
    correctAnswer: 'Review task ownership, clarify responsibilities, rebalance workloads, assign the neglected task appropriately, and update the tracker.',
    marks: 5,
    guidance: 'Review task ownership, clarify responsibilities, rebalance workloads, assign the neglected task appropriately, and update the tracker.',
  },
  {
    type: 'scenario',
    text: 'An important operational process fails just before a client deadline. How would you manage the situation?',
    options: null,
    correctAnswer: 'Assess the impact, notify relevant stakeholders, activate a suitable contingency plan, assign recovery actions, and document the root cause afterward.',
    marks: 5,
    guidance: 'Assess the impact, notify relevant stakeholders, activate a suitable contingency plan, assign recovery actions, and document the root cause afterward.',
  },
];

async function seedOperationsDepartmentQuestions() {
  console.log('--- Starting Operations Department Question Seeder ---');

  try {
    // 1. Verify Operations department exists (ID = 6 or code = 'OPS')
    const depts = await query<any[]>('SELECT id, code, name FROM departments WHERE id = 6 OR code = "OPS" LIMIT 1');
    if (depts.length === 0) {
      throw new Error('Operations department not found in database.');
    }
    const opsDeptId = depts[0].id;
    console.log(`Verified Operations Department: ID ${opsDeptId} (${depts[0].name})`);

    // 2. Deactivate any existing non-matching questions for Operations Department Round 2 (Technical)
    const texts = OPERATIONS_QUESTIONS.map(q => q.text);
    await execute(
      `UPDATE interview_questions 
       SET is_active = 0 
       WHERE department_id = ? AND round_type = 'department' AND question_text NOT IN (${texts.map(() => '?').join(',')})`,
      [opsDeptId, ...texts]
    );

    // 3. Upsert each question idempotently
    let inserted = 0;
    let updated = 0;

    for (const q of OPERATIONS_QUESTIONS) {
      const existing = await query<any[]>(
        `SELECT id FROM interview_questions 
         WHERE department_id = ? AND round_type = 'department' AND question_text = ? LIMIT 1`,
        [opsDeptId, q.text]
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
          [opsDeptId, q.type, q.text, optionsStr, q.correctAnswer, q.marks, q.guidance]
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
      [opsDeptId]
    );

    const totalMarks = activeQuestions.reduce((acc, curr) => acc + Number(curr.max_score), 0);

    console.log(`\nActive Operations Department Questions Count: ${activeQuestions.length}`);
    console.log(`Total Maximum Score Sum: ${totalMarks} / 35 marks`);

    if (activeQuestions.length !== 15 || totalMarks !== 35) {
      console.error(`WARNING: Expected 15 questions and 35 marks, but got ${activeQuestions.length} questions and ${totalMarks} marks!`);
    } else {
      console.log('SUCCESS: Exactly 15 questions and 35 marks verified in database for Operations department!');
    }
  } catch (err) {
    console.error('Error seeding Operations questions:', err);
  } finally {
    await pool.end();
  }
}

seedOperationsDepartmentQuestions();
