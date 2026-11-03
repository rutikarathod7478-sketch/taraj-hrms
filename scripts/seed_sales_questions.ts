import { query, execute, pool } from '../src/lib/db/mysql';

interface SalesQuestionDef {
  type: string;
  text: string;
  options: Record<string, string> | null;
  correctAnswer: string;
  marks: number;
  guidance: string;
}

export const SALES_QUESTIONS: SalesQuestionDef[] = [
  // 1. MCQ (5 questions, 1 mark each = 5 marks)
  {
    type: 'mcq',
    text: 'What is the primary purpose of lead qualification?',
    options: {
      A: 'To contact every lead repeatedly',
      B: 'To determine whether a lead fits the target customer profile and has potential to buy',
      C: 'To close every lead immediately',
      D: 'To avoid asking discovery questions',
    },
    correctAnswer: 'B',
    marks: 1,
    guidance: 'To determine whether a lead fits the target customer profile and has potential to buy.',
  },
  {
    type: 'mcq',
    text: 'What does B2B stand for?',
    options: {
      A: 'Business-to-Business',
      B: 'Buyer-to-Brand',
      C: 'Business-to-Browser',
      D: 'Brand-to-Backend',
    },
    correctAnswer: 'A',
    marks: 1,
    guidance: 'Business-to-Business.',
  },
  {
    type: 'mcq',
    text: 'What is the best first step when contacting a potential client?',
    options: {
      A: 'Immediately demand a purchase',
      B: 'Understand the prospect\'s needs and business context',
      C: 'Send the same long message repeatedly',
      D: 'Promise results without evidence',
    },
    correctAnswer: 'B',
    marks: 1,
    guidance: 'Understand the prospect\'s needs and business context.',
  },
  {
    type: 'mcq',
    text: 'Which information is most useful when qualifying a sales lead?',
    options: {
      A: 'Prospect\'s favorite movie',
      B: 'Business need, budget, decision authority, and timing',
      C: 'Personal gossip',
      D: 'Number of social media photos',
    },
    correctAnswer: 'B',
    marks: 1,
    guidance: 'Business need, budget, decision authority, and timing.',
  },
  {
    type: 'mcq',
    text: 'What is the purpose of a CRM system in sales?',
    options: {
      A: 'To track leads, interactions, and sales opportunities',
      B: 'To replace every customer conversation',
      C: 'To create graphic designs',
      D: 'To delete customer records automatically',
    },
    correctAnswer: 'A',
    marks: 1,
    guidance: 'To track leads, interactions, and sales opportunities.',
  },

  // 2. Multiple Select (2 questions, 2 marks each = 4 marks)
  {
    type: 'multiple_select',
    text: 'Which are good practices when conducting B2B prospecting?',
    options: {
      A: 'Research the target company',
      B: 'Personalize relevant outreach',
      C: 'Identify appropriate decision-makers',
      D: 'Track follow-ups in the CRM',
      E: 'Make unsupported claims about results',
    },
    correctAnswer: 'A, B, C, D',
    marks: 2,
    guidance: 'Research the target company, personalize relevant outreach, identify appropriate decision-makers, and track follow-ups in the CRM.',
  },
  {
    type: 'multiple_select',
    text: 'Which activities help maintain a healthy sales pipeline?',
    options: {
      A: 'Regularly updating opportunity stages',
      B: 'Following up at appropriate intervals',
      C: 'Recording customer objections',
      D: 'Forecasting using current deal information',
      E: 'Marking every lead as won',
    },
    correctAnswer: 'A, B, C, D',
    marks: 2,
    guidance: 'Regularly updating opportunity stages, following up at appropriate intervals, recording customer objections, and forecasting using current deal information.',
  },

  // 3. True/False (2 questions, 1 mark each = 2 marks)
  {
    type: 'true_false',
    text: 'A sales representative should understand a prospect\'s needs before recommending a solution.',
    options: {
      A: 'True',
      B: 'False',
    },
    correctAnswer: 'True',
    marks: 1,
    guidance: 'True. Understanding prospect needs before prescribing solutions is fundamental to consultative sales.',
  },
  {
    type: 'true_false',
    text: 'A lead should always be marked as qualified simply because the person replied to an email.',
    options: {
      A: 'True',
      B: 'False',
    },
    correctAnswer: 'False',
    marks: 1,
    guidance: 'False. A reply indicates engagement, but qualification requires assessing fit, need, budget, and decision authority.',
  },

  // 4. Short Answer (3 questions, 3 marks each = 9 marks)
  {
    type: 'short_answer',
    text: 'What is the difference between a lead and a sales-qualified lead?',
    options: null,
    correctAnswer: 'A lead is a potential customer; a sales-qualified lead has been assessed against relevant criteria and is considered ready for sales engagement.',
    marks: 3,
    guidance: 'A lead is a potential customer; a sales-qualified lead has been assessed against relevant criteria and is considered ready for sales engagement.',
  },
  {
    type: 'short_answer',
    text: 'What is an ideal customer profile (ICP)?',
    options: null,
    correctAnswer: 'A description of the types of companies most likely to benefit from and purchase a business\'s product or service.',
    marks: 3,
    guidance: 'A description of the types of companies most likely to benefit from and purchase a business\'s product or service.',
  },
  {
    type: 'short_answer',
    text: 'How would you handle a prospect who says your service is too expensive?',
    options: null,
    correctAnswer: 'Understand the objection, explore the prospect\'s priorities, explain relevant value and evidence, and discuss suitable options without making false promises.',
    marks: 3,
    guidance: 'Understand the objection, explore the prospect\'s priorities, explain relevant value and evidence, and discuss suitable options without making false promises.',
  },

  // 5. Scenario-Based (3 questions, 5 marks each = 15 marks)
  {
    type: 'scenario',
    text: 'A prospect agrees to a discovery call but does not attend. What would you do?',
    options: null,
    correctAnswer: 'Send a polite follow-up, offer alternative times, check whether the timing remains suitable, and update the CRM.',
    marks: 5,
    guidance: 'Send a polite follow-up, offer alternative times, check whether the timing remains suitable, and update the CRM.',
  },
  {
    type: 'scenario',
    text: 'A prospect wants a guaranteed number of leads, but your company cannot guarantee that outcome. How would you respond?',
    options: null,
    correctAnswer: 'Set honest expectations, explain the service scope and measurable deliverables, share substantiated evidence, and avoid unsupported guarantees.',
    marks: 5,
    guidance: 'Set honest expectations, explain the service scope and measurable deliverables, share substantiated evidence, and avoid unsupported guarantees.',
  },
  {
    type: 'scenario',
    text: 'You have 50 new leads but limited time to contact them. How would you prioritize them?',
    options: null,
    correctAnswer: 'Apply ICP fit, intent signals, business need, potential value, and engagement or qualification data; prioritize transparently and record activity.',
    marks: 5,
    guidance: 'Apply ICP fit, intent signals, business need, potential value, and engagement or qualification data; prioritize transparently and record activity.',
  },
];

async function seedSalesDepartmentQuestions() {
  console.log('--- Starting Sales Department Question Seeder ---');

  try {
    // 1. Verify Sales department exists (ID = 4 or code = 'SALES')
    const depts = await query<any[]>('SELECT id, code, name FROM departments WHERE id = 4 OR code = "SALES" LIMIT 1');
    if (depts.length === 0) {
      throw new Error('Sales department not found in database.');
    }
    const salesDeptId = depts[0].id;
    console.log(`Verified Sales Department: ID ${salesDeptId} (${depts[0].name})`);

    // 2. Deactivate any existing non-matching questions for Sales Department Round 2 (Tech)
    const texts = SALES_QUESTIONS.map(q => q.text);
    await execute(
      `UPDATE interview_questions 
       SET is_active = 0 
       WHERE department_id = ? AND round_type = 'department' AND question_text NOT IN (${texts.map(() => '?').join(',')})`,
      [salesDeptId, ...texts]
    );

    // 3. Upsert each question idempotently
    let inserted = 0;
    let updated = 0;

    for (const q of SALES_QUESTIONS) {
      const existing = await query<any[]>(
        `SELECT id FROM interview_questions 
         WHERE department_id = ? AND round_type = 'department' AND question_text = ? LIMIT 1`,
        [salesDeptId, q.text]
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
          [salesDeptId, q.type, q.text, optionsStr, q.correctAnswer, q.marks, q.guidance]
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
      [salesDeptId]
    );

    const totalMarks = activeQuestions.reduce((acc, curr) => acc + Number(curr.max_score), 0);

    console.log(`\nActive Sales Department Questions Count: ${activeQuestions.length}`);
    console.log(`Total Maximum Score Sum: ${totalMarks} / 35 marks`);

    if (activeQuestions.length !== 15 || totalMarks !== 35) {
      console.error(`WARNING: Expected 15 questions and 35 marks, but got ${activeQuestions.length} questions and ${totalMarks} marks!`);
    } else {
      console.log('SUCCESS: Exactly 15 questions and 35 marks verified in database for Sales department!');
    }
  } catch (err) {
    console.error('Error seeding questions:', err);
  } finally {
    await pool.end();
  }
}

seedSalesDepartmentQuestions();
