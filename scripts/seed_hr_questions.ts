import { query, execute, pool } from '../src/lib/db/mysql';

interface HRQuestionDef {
  type: string;
  text: string;
  options: Record<string, string> | null;
  correctAnswer: string;
  marks: number;
  guidance: string;
}

export const HR_QUESTIONS: HRQuestionDef[] = [
  // 1. MCQ (5 questions, 1 mark each = 5 marks)
  {
    type: 'mcq',
    text: 'What is the primary purpose of an HR screening interview?',
    options: {
      A: 'To guarantee selection',
      B: 'To assess the candidate\'s suitability against role requirements',
      C: 'To discuss unrelated personal matters',
      D: 'To avoid checking qualifications',
    },
    correctAnswer: 'B',
    marks: 1,
    guidance: 'To assess the candidate\'s suitability against role requirements.',
  },
  {
    type: 'mcq',
    text: 'What does onboarding mean?',
    options: {
      A: 'Advertising a vacancy',
      B: 'Integrating a new employee into the organization',
      C: 'Rejecting an application',
      D: 'Closing a project',
    },
    correctAnswer: 'B',
    marks: 1,
    guidance: 'Integrating a new employee into the organization.',
  },
  {
    type: 'mcq',
    text: 'Which document typically outlines an employee\'s job responsibilities?',
    options: {
      A: 'Job description',
      B: 'Marketing brochure',
      C: 'Purchase invoice',
      D: 'Database backup',
    },
    correctAnswer: 'A',
    marks: 1,
    guidance: 'Job description.',
  },
  {
    type: 'mcq',
    text: 'Why should candidate information be handled confidentially?',
    options: {
      A: 'To prevent authorized hiring managers from working',
      B: 'To protect personal information and restrict unauthorized access',
      C: 'To avoid maintaining records',
      D: 'To publish candidate details publicly',
    },
    correctAnswer: 'B',
    marks: 1,
    guidance: 'To protect personal information and restrict unauthorized access.',
  },
  {
    type: 'mcq',
    text: 'Which is the most appropriate basis for selecting a candidate?',
    options: {
      A: 'Personal favoritism',
      B: 'Relevant skills, qualifications, and job-related assessment',
      C: 'Unrelated personal characteristics',
      D: 'The order in which applications arrived, regardless of requirements',
    },
    correctAnswer: 'B',
    marks: 1,
    guidance: 'Relevant skills, qualifications, and job-related assessment.',
  },

  // 2. Multiple Select (2 questions, 2 marks each = 4 marks)
  {
    type: 'multiple_select',
    text: 'Which information may be relevant to a candidate\'s recruitment record?',
    options: {
      A: 'Contact details',
      B: 'Relevant qualifications',
      C: 'Interview evaluation',
      D: 'Application status',
      E: 'Unrelated personal gossip',
    },
    correctAnswer: 'A, B, C, D',
    marks: 2,
    guidance: 'Contact details, Relevant qualifications, Interview evaluation, and Application status are legitimate recruitment record items.',
  },
  {
    type: 'multiple_select',
    text: 'Which activities are part of employee onboarding?',
    options: {
      A: 'Collecting required employment documents',
      B: 'Explaining company policies',
      C: 'Arranging access and equipment',
      D: 'Introducing the employee to the team',
      E: 'Sharing confidential employee records with everyone',
    },
    correctAnswer: 'A, B, C, D',
    marks: 2,
    guidance: 'Collecting required employment documents, Explaining company policies, Arranging access and equipment, and Introducing the employee to the team.',
  },

  // 3. True/False (2 questions, 1 mark each = 2 marks)
  {
    type: 'true_false',
    text: 'Interview evaluations should be based on job-related evidence and consistent assessment criteria.',
    options: {
      A: 'True',
      B: 'False',
    },
    correctAnswer: 'True',
    marks: 1,
    guidance: 'True. Evaluations must be objective, job-related, and standardized.',
  },
  {
    type: 'true_false',
    text: 'Every candidate should receive an offer letter before the selection decision is finalized.',
    options: {
      A: 'True',
      B: 'False',
    },
    correctAnswer: 'False',
    marks: 1,
    guidance: 'False. Offer letters are only extended after final selection approval.',
  },

  // 4. Short Answer (3 questions, 3 marks each = 9 marks)
  {
    type: 'short_answer',
    text: 'What is the difference between recruitment and selection?',
    options: null,
    correctAnswer: 'Recruitment attracts potential candidates; selection evaluates applicants and identifies the most suitable candidate.',
    marks: 3,
    guidance: 'Recruitment attracts potential candidates; selection evaluates applicants and identifies the most suitable candidate.',
  },
  {
    type: 'short_answer',
    text: 'What is an employee onboarding checklist?',
    options: null,
    correctAnswer: 'A structured list of tasks such as document collection, policy orientation, system access, equipment allocation, and introductions.',
    marks: 3,
    guidance: 'A structured list of tasks such as document collection, policy orientation, system access, equipment allocation, and introductions.',
  },
  {
    type: 'short_answer',
    text: 'How would you maintain confidentiality in an HRMS?',
    options: null,
    correctAnswer: 'Use role-based access, secure authentication, restricted document permissions, appropriate retention policies, and audit logs.',
    marks: 3,
    guidance: 'Use role-based access, secure authentication, restricted document permissions, appropriate retention policies, and audit logs.',
  },

  // 5. Scenario-Based (3 questions, 5 marks each = 15 marks)
  {
    type: 'scenario',
    text: 'A candidate passes the HR round but performs poorly in the technical round. How would you update the candidate\'s status?',
    options: null,
    correctAnswer: 'Record the technical evaluator\'s feedback, update the relevant round result, apply established selection criteria, and communicate the next step according to company policy.',
    marks: 5,
    guidance: 'Record the technical evaluator\'s feedback, update the relevant round result, apply established selection criteria, and communicate the next step according to company policy.',
  },
  {
    type: 'scenario',
    text: 'A candidate\'s CV contains information that conflicts with their application form. What would you do?',
    options: null,
    correctAnswer: 'Verify the discrepancy respectfully, ask the candidate for clarification, document the outcome, and make a decision based on verified information.',
    marks: 5,
    guidance: 'Verify the discrepancy respectfully, ask the candidate for clarification, document the outcome, and make a decision based on verified information.',
  },
  {
    type: 'scenario',
    text: 'A selected candidate has not submitted all required joining documents before the joining date. How would you handle this?',
    options: null,
    correctAnswer: 'Identify missing documents, send a secure reminder, confirm acceptable submission timelines with the appropriate HR authority, and track completion without exposing sensitive information.',
    marks: 5,
    guidance: 'Identify missing documents, send a secure reminder, confirm acceptable submission timelines with the appropriate HR authority, and track completion without exposing sensitive information.',
  },
];

async function seedHRDepartmentQuestions() {
  console.log('--- Starting HR Department Question Seeder ---');

  try {
    // 1. Verify HR department exists (ID = 5 or code = 'HR')
    const depts = await query<any[]>('SELECT id, code, name FROM departments WHERE id = 5 OR code = "HR" LIMIT 1');
    if (depts.length === 0) {
      throw new Error('HR department not found in database.');
    }
    const hrDeptId = depts[0].id;
    console.log(`Verified HR Department: ID ${hrDeptId} (${depts[0].name})`);

    // 2. Deactivate any existing non-matching questions for HR Department Round 2 (Technical)
    const texts = HR_QUESTIONS.map(q => q.text);
    await execute(
      `UPDATE interview_questions 
       SET is_active = 0 
       WHERE department_id = ? AND round_type = 'department' AND question_text NOT IN (${texts.map(() => '?').join(',')})`,
      [hrDeptId, ...texts]
    );

    // 3. Upsert each question idempotently
    let inserted = 0;
    let updated = 0;

    for (const q of HR_QUESTIONS) {
      const existing = await query<any[]>(
        `SELECT id FROM interview_questions 
         WHERE department_id = ? AND round_type = 'department' AND question_text = ? LIMIT 1`,
        [hrDeptId, q.text]
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
          [hrDeptId, q.type, q.text, optionsStr, q.correctAnswer, q.marks, q.guidance]
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
      [hrDeptId]
    );

    const totalMarks = activeQuestions.reduce((acc, curr) => acc + Number(curr.max_score), 0);

    console.log(`\nActive HR Department Questions Count: ${activeQuestions.length}`);
    console.log(`Total Maximum Score Sum: ${totalMarks} / 35 marks`);

    if (activeQuestions.length !== 15 || totalMarks !== 35) {
      console.error(`WARNING: Expected 15 questions and 35 marks, but got ${activeQuestions.length} questions and ${totalMarks} marks!`);
    } else {
      console.log('SUCCESS: Exactly 15 questions and 35 marks verified in database for HR department!');
    }
  } catch (err) {
    console.error('Error seeding HR questions:', err);
  } finally {
    await pool.end();
  }
}

seedHRDepartmentQuestions();
