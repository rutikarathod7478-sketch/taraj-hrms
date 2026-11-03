import { query, execute, pool } from '../src/lib/db/mysql';

interface EmailMarketingQuestionDef {
  type: string;
  text: string;
  options: Record<string, string> | null;
  correctAnswer: string;
  marks: number;
  guidance: string;
}

export const EMAIL_MARKETING_QUESTIONS: EmailMarketingQuestionDef[] = [
  // 1. MCQ (5 questions, 1 mark each = 5 marks)
  {
    type: 'mcq',
    text: 'What is the main purpose of audience segmentation in email marketing?',
    options: {
      A: 'To send identical emails to everyone',
      B: 'To group contacts based on relevant characteristics or behavior',
      C: 'To delete inactive customers automatically',
      D: 'To increase email size',
    },
    correctAnswer: 'B',
    marks: 1,
    guidance: 'To group contacts based on relevant characteristics or behavior.',
  },
  {
    type: 'mcq',
    text: 'Which metric measures the percentage of delivered emails that recipients clicked through?',
    options: {
      A: 'Bounce rate',
      B: 'Click-through rate (CTR)',
      C: 'Unsubscribe count',
      D: 'Delivery time',
    },
    correctAnswer: 'B',
    marks: 1,
    guidance: 'Click-through rate (CTR).',
  },
  {
    type: 'mcq',
    text: 'What is an email bounce?',
    options: {
      A: 'An email that cannot be delivered to its intended recipient',
      B: 'An email opened multiple times',
      C: 'A successfully completed campaign',
      D: 'A recipient clicking a link',
    },
    correctAnswer: 'A',
    marks: 1,
    guidance: 'An email that cannot be delivered to its intended recipient.',
  },
  {
    type: 'mcq',
    text: 'What is the purpose of A/B testing in email marketing?',
    options: {
      A: 'To compare variations and determine which performs better',
      B: 'To send duplicate emails without measurement',
      C: 'To remove campaign reports',
      D: 'To prevent personalization',
    },
    correctAnswer: 'A',
    marks: 1,
    guidance: 'To compare variations and determine which performs better.',
  },
  {
    type: 'mcq',
    text: 'Which practice can help improve email deliverability?',
    options: {
      A: 'Purchasing random email lists',
      B: 'Sending to invalid addresses repeatedly',
      C: 'Maintaining permission-based lists and monitoring bounce rates',
      D: 'Hiding the unsubscribe option',
    },
    correctAnswer: 'C',
    marks: 1,
    guidance: 'Maintaining permission-based lists and monitoring bounce rates.',
  },

  // 2. Multiple Select (2 questions, 2 marks each = 4 marks)
  {
    type: 'multiple_select',
    text: 'Which elements can be tested in an email campaign?',
    options: {
      A: 'Subject line',
      B: 'Call-to-action text',
      C: 'Email content',
      D: 'Sending time',
      E: 'Employee payroll password',
    },
    correctAnswer: 'A, B, C, D',
    marks: 2,
    guidance: 'Subject line, Call-to-action text, Email content, and Sending time can all be tested.',
  },
  {
    type: 'multiple_select',
    text: 'Which metrics can help evaluate an email marketing campaign?',
    options: {
      A: 'Delivery rate',
      B: 'Click-through rate',
      C: 'Conversion rate',
      D: 'Unsubscribe rate',
      E: 'Office attendance',
    },
    correctAnswer: 'A, B, C, D',
    marks: 2,
    guidance: 'Delivery rate, Click-through rate, Conversion rate, and Unsubscribe rate.',
  },

  // 3. True/False (2 questions, 1 mark each = 2 marks)
  {
    type: 'true_false',
    text: 'A high open rate alone proves that an email campaign generated business revenue.',
    options: {
      A: 'True',
      B: 'False',
    },
    correctAnswer: 'False',
    marks: 1,
    guidance: 'False. High opens do not prove conversions or revenue generation.',
  },
  {
    type: 'true_false',
    text: 'Email marketing lists should be managed in accordance with applicable privacy, consent, and unsubscribe requirements.',
    options: {
      A: 'True',
      B: 'False',
    },
    correctAnswer: 'True',
    marks: 1,
    guidance: 'True. Compliance with privacy, consent, and unsubscribe rules is legally required and preserves deliverability.',
  },

  // 4. Short Answer (3 questions, 3 marks each = 9 marks)
  {
    type: 'short_answer',
    text: 'What is the difference between open rate and click-through rate?',
    options: null,
    correctAnswer: 'Open rate estimates the proportion of delivered emails recorded as opened; click-through rate measures the proportion of delivered emails that generated clicks. Open tracking can be affected by privacy features and should be interpreted cautiously.',
    marks: 3,
    guidance: 'Open rate estimates the proportion of delivered emails recorded as opened; click-through rate measures the proportion of delivered emails that generated clicks. Open tracking can be affected by privacy features and should be interpreted cautiously.',
  },
  {
    type: 'short_answer',
    text: 'What is email personalization?',
    options: null,
    correctAnswer: 'Adapting email content to relevant recipient information, preferences, role, or behavior.',
    marks: 3,
    guidance: 'Adapting email content to relevant recipient information, preferences, role, or behavior.',
  },
  {
    type: 'short_answer',
    text: 'What is the purpose of a call to action (CTA) in an email?',
    options: null,
    correctAnswer: 'To encourage the recipient to take a specific next step, such as booking a meeting, visiting a webpage, or requesting a demo.',
    marks: 3,
    guidance: 'To encourage the recipient to take a specific next step, such as booking a meeting, visiting a webpage, or requesting a demo.',
  },

  // 5. Scenario-Based (3 questions, 5 marks each = 15 marks)
  {
    type: 'scenario',
    text: 'Your email campaign has a high delivery rate but very few clicks. How would you investigate and improve performance?',
    options: null,
    correctAnswer: 'Review audience relevance, email content, CTA visibility, landing-page relevance, campaign objective, and click-through data; test improvements systematically.',
    marks: 5,
    guidance: 'Review audience relevance, email content, CTA visibility, landing-page relevance, campaign objective, and click-through data; test improvements systematically.',
  },
  {
    type: 'scenario',
    text: 'Many emails in your campaign are bouncing. What actions would you take?',
    options: null,
    correctAnswer: 'Analyze hard and soft bounces, suppress invalid addresses, verify list quality and consent, review sending practices, and investigate technical deliverability issues.',
    marks: 5,
    guidance: 'Analyze hard and soft bounces, suppress invalid addresses, verify list quality and consent, review sending practices, and investigate technical deliverability issues.',
  },
  {
    type: 'scenario',
    text: 'You are asked to email 5,000 prospects about a new B2B service, but the list contains contacts with different roles and interests. How would you plan the campaign?',
    options: null,
    correctAnswer: 'Validate the list and permission basis, segment contacts by relevant business characteristics, tailor messaging and CTAs, test a small campaign where appropriate, and measure meaningful outcomes.',
    marks: 5,
    guidance: 'Validate the list and permission basis, segment contacts by relevant business characteristics, tailor messaging and CTAs, test a small campaign where appropriate, and measure meaningful outcomes.',
  },
];

async function seedEmailMarketingDepartmentQuestions() {
  console.log('--- Starting Email Marketing Department Question Seeder ---');

  try {
    // 1. Verify Email Marketing department exists (ID = 8 or code = 'EMAIL_MKT')
    const depts = await query<any[]>('SELECT id, code, name FROM departments WHERE id = 8 OR code = "EMAIL_MKT" LIMIT 1');
    if (depts.length === 0) {
      throw new Error('Email Marketing department not found in database.');
    }
    const deptId = depts[0].id;
    console.log(`Verified Email Marketing Department: ID ${deptId} (${depts[0].name})`);

    // 2. Deactivate any existing non-matching questions for Email Marketing Department Round 2 (Technical)
    const texts = EMAIL_MARKETING_QUESTIONS.map(q => q.text);
    await execute(
      `UPDATE interview_questions 
       SET is_active = 0 
       WHERE department_id = ? AND round_type = 'department' AND question_text NOT IN (${texts.map(() => '?').join(',')})`,
      [deptId, ...texts]
    );

    // 3. Upsert each question idempotently
    let inserted = 0;
    let updated = 0;

    for (const q of EMAIL_MARKETING_QUESTIONS) {
      const existing = await query<any[]>(
        `SELECT id FROM interview_questions 
         WHERE department_id = ? AND round_type = 'department' AND question_text = ? LIMIT 1`,
        [deptId, q.text]
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
          [deptId, q.type, q.text, optionsStr, q.correctAnswer, q.marks, q.guidance]
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
      [deptId]
    );

    const totalMarks = activeQuestions.reduce((acc, curr) => acc + Number(curr.max_score), 0);

    console.log(`\nActive Email Marketing Department Questions Count: ${activeQuestions.length}`);
    console.log(`Total Maximum Score Sum: ${totalMarks} / 35 marks`);

    if (activeQuestions.length !== 15 || totalMarks !== 35) {
      console.error(`WARNING: Expected 15 questions and 35 marks, but got ${activeQuestions.length} questions and ${totalMarks} marks!`);
    } else {
      console.log('SUCCESS: Exactly 15 questions and 35 marks verified in database for Email Marketing department!');
    }
  } catch (err) {
    console.error('Error seeding Email Marketing questions:', err);
  } finally {
    await pool.end();
  }
}

seedEmailMarketingDepartmentQuestions();
