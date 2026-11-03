import { query, execute, pool } from '../src/lib/db/mysql';

interface MgmtQuestionDef {
  type: string;
  text: string;
  options: Record<string, string> | null;
  correctAnswer: string;
  marks: number;
  guidance: string;
}

export const MGMT_QUESTIONS: MgmtQuestionDef[] = [
  // 1. MCQ (5 questions, 1 mark each = 5 marks)
  {
    type: 'mcq',
    text: 'What is the main purpose of project planning?',
    options: {
      A: 'To eliminate all communication',
      B: 'To define objectives, timelines, resources, and responsibilities',
      C: 'To increase unnecessary meetings',
      D: 'To avoid tracking progress',
    },
    correctAnswer: 'B',
    marks: 1,
    guidance: 'To define objectives, timelines, resources, and responsibilities.',
  },
  {
    type: 'mcq',
    text: 'What should a manager do first when two urgent tasks compete for the same resources?',
    options: {
      A: 'Ignore both tasks',
      B: 'Evaluate business impact, deadlines, and dependencies',
      C: 'Assign both tasks to the same person without discussion',
      D: 'Cancel the project immediately',
    },
    correctAnswer: 'B',
    marks: 1,
    guidance: 'Evaluate business impact, deadlines, and dependencies.',
  },
  {
    type: 'mcq',
    text: 'Which is an example of a measurable performance indicator?',
    options: {
      A: 'The team seems busy',
      B: 'Everyone looks motivated',
      C: 'Percentage of project milestones completed on time',
      D: 'The office feels productive',
    },
    correctAnswer: 'C',
    marks: 1,
    guidance: 'Percentage of project milestones completed on time.',
  },
  {
    type: 'mcq',
    text: 'What is delegation?',
    options: {
      A: 'Assigning appropriate responsibilities and authority to team members',
      B: 'Avoiding responsibility',
      C: 'Completing every task alone',
      D: 'Removing all deadlines',
    },
    correctAnswer: 'A',
    marks: 1,
    guidance: 'Assigning appropriate responsibilities and authority to team members.',
  },
  {
    type: 'mcq',
    text: 'Which approach is best when a team repeatedly misses deadlines?',
    options: {
      A: 'Blame one employee immediately',
      B: 'Examine workload, blockers, estimates, and dependencies',
      C: 'Stop tracking tasks',
      D: 'Increase deadlines without analysis',
    },
    correctAnswer: 'B',
    marks: 1,
    guidance: 'Examine workload, blockers, estimates, and dependencies.',
  },

  // 2. Multiple Select (2 questions, 2 marks each = 4 marks)
  {
    type: 'multiple_select',
    text: 'Which activities are part of effective project management?',
    options: {
      A: 'Defining project scope',
      B: 'Tracking milestones',
      C: 'Managing risks',
      D: 'Communicating progress',
      E: 'Ignoring resource constraints',
    },
    correctAnswer: 'A, B, C, D',
    marks: 2,
    guidance: 'Defining project scope, tracking milestones, managing risks, and communicating progress.',
  },
  {
    type: 'multiple_select',
    text: 'Which actions can improve team performance?',
    options: {
      A: 'Giving constructive feedback',
      B: 'Setting clear expectations',
      C: 'Recognizing good performance',
      D: 'Resolving blockers',
      E: 'Withholding important information',
    },
    correctAnswer: 'A, B, C, D',
    marks: 2,
    guidance: 'Giving constructive feedback, setting clear expectations, recognizing good performance, and resolving blockers.',
  },

  // 3. True/False (2 questions, 1 mark each = 2 marks)
  {
    type: 'true_false',
    text: 'Effective delegation includes making responsibilities and expected outcomes clear.',
    options: {
      A: 'True',
      B: 'False',
    },
    correctAnswer: 'True',
    marks: 1,
    guidance: 'True. Clear responsibilities and outcomes are vital for successful delegation.',
  },
  {
    type: 'true_false',
    text: 'A project manager should never revise a plan after receiving new information.',
    options: {
      A: 'True',
      B: 'False',
    },
    correctAnswer: 'False',
    marks: 1,
    guidance: 'False. Project plans must adapt and update when new requirements, constraints, or information emerge.',
  },

  // 4. Short Answer (3 questions, 3 marks each = 9 marks)
  {
    type: 'short_answer',
    text: 'What is the difference between a goal and a KPI?',
    options: null,
    correctAnswer: 'A goal describes the desired outcome; a KPI measures progress or performance toward that outcome.',
    marks: 3,
    guidance: 'A goal describes the desired outcome; a KPI measures progress or performance toward that outcome.',
  },
  {
    type: 'short_answer',
    text: 'How would you prioritize tasks when multiple deadlines overlap?',
    options: null,
    correctAnswer: 'Assess urgency, business impact, dependencies, effort, and available resources; communicate priorities clearly.',
    marks: 3,
    guidance: 'Assess urgency, business impact, dependencies, effort, and available resources; communicate priorities clearly.',
  },
  {
    type: 'short_answer',
    text: 'What is risk management in a project?',
    options: null,
    correctAnswer: 'Identifying potential problems, evaluating their likelihood and impact, and planning mitigation or contingency actions.',
    marks: 3,
    guidance: 'Identifying potential problems, evaluating their likelihood and impact, and planning mitigation or contingency actions.',
  },

  // 5. Scenario-Based (3 questions, 5 marks each = 15 marks)
  {
    type: 'scenario',
    text: 'Your team is two weeks behind schedule, and the client expects delivery on the original date. What would you do?',
    options: null,
    correctAnswer: 'Identify root causes, review scope and dependencies, prioritize essential deliverables, allocate resources, and communicate a realistic recovery plan.',
    marks: 5,
    guidance: 'Identify root causes, review scope and dependencies, prioritize essential deliverables, allocate resources, and communicate a realistic recovery plan.',
  },
  {
    type: 'scenario',
    text: 'Two team members disagree about how a project should be completed. How would you resolve the conflict?',
    options: null,
    correctAnswer: 'Hear both perspectives, compare evidence and objectives, agree on decision criteria, and document responsibilities and next steps.',
    marks: 5,
    guidance: 'Hear both perspectives, compare evidence and objectives, agree on decision criteria, and document responsibilities and next steps.',
  },
  {
    type: 'scenario',
    text: 'A project is within budget but is not meeting its expected quality standards. How would you respond?',
    options: null,
    correctAnswer: 'Assess quality gaps, identify root causes, establish corrective actions, protect essential quality requirements, and revise the delivery plan if necessary.',
    marks: 5,
    guidance: 'Assess quality gaps, identify root causes, establish corrective actions, protect essential quality requirements, and revise the delivery plan if necessary.',
  },
];

async function seedManagementDepartmentQuestions() {
  console.log('--- Starting Management Department Question Seeder ---');

  try {
    // 1. Verify Management department exists (ID = 3 or code = 'MGMT')
    const depts = await query<any[]>('SELECT id, code, name FROM departments WHERE id = 3 OR code = "MGMT" LIMIT 1');
    if (depts.length === 0) {
      throw new Error('Management department not found in database.');
    }
    const mgmtDeptId = depts[0].id;
    console.log(`Verified Management Department: ID ${mgmtDeptId} (${depts[0].name})`);

    // 2. Deactivate any existing non-matching questions for Management Department Round 2 (Tech)
    const texts = MGMT_QUESTIONS.map(q => q.text);
    await execute(
      `UPDATE interview_questions 
       SET is_active = 0 
       WHERE department_id = ? AND round_type = 'department' AND question_text NOT IN (${texts.map(() => '?').join(',')})`,
      [mgmtDeptId, ...texts]
    );

    // 3. Upsert each question idempotently
    let inserted = 0;
    let updated = 0;

    for (const q of MGMT_QUESTIONS) {
      const existing = await query<any[]>(
        `SELECT id FROM interview_questions 
         WHERE department_id = ? AND round_type = 'department' AND question_text = ? LIMIT 1`,
        [mgmtDeptId, q.text]
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
          [mgmtDeptId, q.type, q.text, optionsStr, q.correctAnswer, q.marks, q.guidance]
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
      [mgmtDeptId]
    );

    const totalMarks = activeQuestions.reduce((acc, curr) => acc + Number(curr.max_score), 0);

    console.log(`\nActive Management Department Questions Count: ${activeQuestions.length}`);
    console.log(`Total Maximum Score Sum: ${totalMarks} / 35 marks`);

    if (activeQuestions.length !== 15 || totalMarks !== 35) {
      console.error(`WARNING: Expected 15 questions and 35 marks, but got ${activeQuestions.length} questions and ${totalMarks} marks!`);
    } else {
      console.log('SUCCESS: Exactly 15 questions and 35 marks verified in database for Management department!');
    }
  } catch (err) {
    console.error('Error seeding questions:', err);
  } finally {
    await pool.end();
  }
}

seedManagementDepartmentQuestions();
