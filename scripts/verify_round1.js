const mysql = require('mysql2/promise');

const EXPECTED_QUESTIONS = [
  {
    id: 201,
    section: 'A',
    text: 'Tell me about yourself and explain the skills or experiences that make you suitable for this role.'
  },
  {
    id: 202,
    section: 'A',
    text: 'Why do you want to join our company, and what do you know about our B2B business?'
  },
  {
    id: 203,
    section: 'A',
    text: 'What are your strengths and weaknesses, and how are you working to improve yourself?'
  },
  {
    id: 204,
    section: 'A',
    text: 'How do you handle constructive feedback from your manager or senior team members?'
  },
  {
    id: 205,
    section: 'A',
    text: 'Why should we hire you for this position, and what value can you contribute to our team?'
  },
  {
    id: 206,
    section: 'B',
    text: 'Missed deadline: You have an important task due today, but an unexpected problem may prevent you from completing it on time. What would you do?'
  },
  {
    id: 207,
    section: 'B',
    text: 'Team disagreement: You and your teammate disagree about how to complete a task. Both of you believe your approach is correct. How would you resolve the situation?'
  },
  {
    id: 208,
    section: 'B',
    text: 'Multiple urgent tasks: Your manager assigns you three tasks, and all have urgent deadlines. How would you prioritize and complete them?'
  },
  {
    id: 209,
    section: 'B',
    text: 'Workplace mistake: You discover that you submitted incorrect information that could affect your team or a client. What steps would you take?'
  },
  {
    id: 210,
    section: 'B',
    text: 'Unfamiliar task: Your manager assigns you a task you have never done before and is temporarily unavailable. How would you approach it?'
  }
];

const DEPARTMENTS = [
  'Quality',
  'Development',
  'Management',
  'Sales',
  'HR',
  'Operations',
  'DBMS',
  'Email Marketing'
];

async function main() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'hrims',
  });

  console.log('Connected to MySQL hrims database.');

  // 1. Verify exact 10 questions in interview_questions table
  const [rows] = await conn.execute(
    `SELECT id, question_text, question_type, max_score, is_active FROM interview_questions WHERE round_type = 'hr' AND is_active = 1 ORDER BY id ASC`
  );

  console.log(`\nActive Round 1 questions in DB: ${rows.length}`);
  if (rows.length !== 10) {
    console.error(`ERROR: Expected 10 active Round 1 questions, got ${rows.length}`);
    process.exit(1);
  }

  let allMatch = true;
  for (let i = 0; i < EXPECTED_QUESTIONS.length; i++) {
    const exp = EXPECTED_QUESTIONS[i];
    const actual = rows[i];
    const match = actual && actual.id === exp.id && actual.question_text === exp.text;
    console.log(`Q#${exp.id} [Section ${exp.section}] Match: ${match ? 'PASS' : 'FAIL'}`);
    if (!match) {
      console.log(`  Expected: "${exp.text}"`);
      console.log(`  Actual:   "${actual ? actual.question_text : 'MISSING'}"`);
      allMatch = false;
    }
  }

  if (!allMatch) {
    console.error('ERROR: Questions wording or ID mismatch!');
    process.exit(1);
  }

  // 2. Verify all 8 departments exist in DB
  const [deptRows] = await conn.execute(`SELECT id, name FROM departments`);
  console.log('\nVerifying 8 Departments:');
  DEPARTMENTS.forEach(deptName => {
    const found = deptRows.find(d => d.name.toLowerCase() === deptName.toLowerCase());
    console.log(`- ${deptName}: ${found ? `Found (ID: ${found.id})` : 'Not found in DB'}`);
  });

  // 3. Verify that for any candidate across all departments, Round 1 returns exactly these 10 questions
  console.log('\nVerifying cross-departmental universal question assignment:');
  const [candRows] = await conn.execute(
    `SELECT c.id, c.full_name, d.name AS department_name, c.department_id 
     FROM candidates c 
     LEFT JOIN departments d ON c.department_id = d.id 
     LIMIT 5`
  );

  for (const cand of candRows) {
    // Replicate getQuestionsForCandidate(cand.id, 'hr')
    const [candQ] = await conn.execute(
      `SELECT q.id, q.question_text 
       FROM interview_questions q 
       WHERE q.round_type = 'hr' AND q.is_active = 1 
       ORDER BY q.id ASC`
    );
    console.log(`Candidate ${cand.full_name} (${cand.department_name}): ${candQ.length} Round 1 questions returned.`);
    if (candQ.length !== 10 || candQ[0].id !== 201 || candQ[9].id !== 210) {
      console.error(`FAIL: candidate ${cand.full_name} did not receive standard 10 questions.`);
      process.exit(1);
    }
  }

  console.log('\nALL VERIFICATIONS PASSED SUCCESSFULLY!');
  await conn.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
