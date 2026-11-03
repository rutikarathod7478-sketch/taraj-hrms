const path = require('path');
const mysql = require(path.join(__dirname, '..', 'node_modules', 'mysql2', 'promise'));

const ROUND_1_QUESTIONS = [
  // Section A: HR Questions (1-5)
  {
    id: 201,
    question_text: 'Tell me about yourself and explain the skills or experiences that make you suitable for this role.',
    question_type: 'hr',
    expected_answer_guidance: 'Section A: HR Question. Evaluate communication clarity, relevant educational/professional background, personal strengths, and suitability for the role.',
    max_score: 10,
    time_limit_seconds: 180,
  },
  {
    id: 202,
    question_text: 'Why do you want to join our company, and what do you know about our B2B business?',
    question_type: 'hr',
    expected_answer_guidance: 'Section A: HR Question. Evaluate company research, understanding of B2B business model, motivation to work at Taraj Global Solutions, and organizational fit.',
    max_score: 10,
    time_limit_seconds: 180,
  },
  {
    id: 203,
    question_text: 'What are your strengths and weaknesses, and how are you working to improve yourself?',
    question_type: 'hr',
    expected_answer_guidance: 'Section A: HR Question. Evaluate self-awareness, authentic strengths with real examples, self-critique maturity, and active personal development steps.',
    max_score: 10,
    time_limit_seconds: 180,
  },
  {
    id: 204,
    question_text: 'How do you handle constructive feedback from your manager or senior team members?',
    question_type: 'hr',
    expected_answer_guidance: 'Section A: HR Question. Evaluate emotional maturity, coachability, positive attitude towards feedback, and willingness to adapt and improve.',
    max_score: 10,
    time_limit_seconds: 180,
  },
  {
    id: 205,
    question_text: 'Why should we hire you for this position, and what value can you contribute to our team?',
    question_type: 'hr',
    expected_answer_guidance: 'Section A: HR Question. Evaluate candidate value proposition, enthusiasm, understanding of deliverables, and team commitment.',
    max_score: 10,
    time_limit_seconds: 180,
  },

  // Section B: Scenario-Based Questions (6-10)
  {
    id: 206,
    question_text: 'Missed deadline: You have an important task due today, but an unexpected problem may prevent you from completing it on time. What would you do?',
    question_type: 'scenario',
    expected_answer_guidance: 'Section B: Scenario-Based Question. Evaluate: (1) Problem identification & impact assessment, (2) Prompt and transparent communication with manager, (3) Proactive proposed mitigation or revised delivery schedule.',
    max_score: 10,
    time_limit_seconds: 240,
  },
  {
    id: 207,
    question_text: 'Team disagreement: You and your teammate disagree about how to complete a task. Both of you believe your approach is correct. How would you resolve the situation?',
    question_type: 'scenario',
    expected_answer_guidance: 'Section B: Scenario-Based Question. Evaluate: (1) Active, respectful listening, (2) Objective comparison using facts and company goals, (3) Compromise or involving a lead/manager constructively.',
    max_score: 10,
    time_limit_seconds: 240,
  },
  {
    id: 208,
    question_text: 'Multiple urgent tasks: Your manager assigns you three tasks, and all have urgent deadlines. How would you prioritize and complete them?',
    question_type: 'scenario',
    expected_answer_guidance: 'Section B: Scenario-Based Question. Evaluate: (1) Urgency vs impact matrix, (2) Seeking manager alignment on priorities, (3) Time-boxing, execution focus, and proactive progress updates.',
    max_score: 10,
    time_limit_seconds: 240,
  },
  {
    id: 209,
    question_text: 'Workplace mistake: You discover that you submitted incorrect information that could affect your team or a client. What steps would you take?',
    question_type: 'scenario',
    expected_answer_guidance: 'Section B: Scenario-Based Question. Evaluate: (1) Honesty and immediate disclosure, (2) Accountability without blame-shifting, (3) Rectifying the data/impact, and (4) Establishing safeguards against recurrence.',
    max_score: 10,
    time_limit_seconds: 240,
  },
  {
    id: 210,
    question_text: 'Unfamiliar task: Your manager assigns you a task you have never done before and is temporarily unavailable. How would you approach it?',
    question_type: 'scenario',
    expected_answer_guidance: 'Section B: Scenario-Based Question. Evaluate: (1) Independent research and reviewing documentation, (2) Consulting knowledgeable peers or guidelines, (3) Preparing draft/framework, and (4) Validating with manager upon return.',
    max_score: 10,
    time_limit_seconds: 240,
  },
];

async function updateRound1Questions() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'hrims',
    port: 3306
  });

  console.log('Connecting to hrims database...');

  // 1. Deactivate any existing HR questions that are not part of the official 10
  await conn.query('UPDATE interview_questions SET is_active = 0 WHERE round_type = "hr"');
  console.log('Deactivated previous HR questions.');

  // 2. Upsert the exact 10 questions into interview_questions (IDs 201 to 210)
  for (const q of ROUND_1_QUESTIONS) {
    const upsertSql = `
      INSERT INTO interview_questions (
        id, department_id, position_id, round_type, question_text,
        question_type, max_score, expected_answer_guidance, time_limit_seconds,
        weight, is_active
      ) VALUES (?, NULL, NULL, 'hr', ?, ?, ?, ?, ?, 1.00, 1)
      ON DUPLICATE KEY UPDATE
        department_id = NULL,
        position_id = NULL,
        round_type = 'hr',
        question_text = VALUES(question_text),
        question_type = VALUES(question_type),
        max_score = VALUES(max_score),
        expected_answer_guidance = VALUES(expected_answer_guidance),
        time_limit_seconds = VALUES(time_limit_seconds),
        weight = 1.00,
        is_active = 1
    `;

    await conn.query(upsertSql, [
      q.id,
      q.question_text,
      q.question_type,
      q.max_score,
      q.expected_answer_guidance,
      q.time_limit_seconds,
    ]);
  }

  console.log('Successfully upserted official 10 Round 1 questions!');

  // Verify
  const [activeRows] = await conn.query(
    'SELECT id, question_text, question_type, max_score FROM interview_questions WHERE round_type = "hr" AND is_active = 1 ORDER BY id ASC'
  );
  console.log(`\nVerified ${activeRows.length} Active Round 1 Questions:`);
  activeRows.forEach((r, idx) => {
    console.log(`${idx + 1}. [ID: ${r.id}] [${idx < 5 ? 'Section A' : 'Section B'}] ${r.question_text}`);
  });

  await conn.end();
}

updateRound1Questions().catch(console.error);
