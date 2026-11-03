import { query, pool } from '../src/lib/db/mysql';
import { getQuestionsForCandidate } from '../src/features/interviews/interview.service';

async function verifyAll() {
  console.log('=====================================================');
  console.log('1. Verify All 5 Department Question Banks');
  console.log('=====================================================');

  const depts = [
    { id: 1, name: 'Quality' },
    { id: 2, name: 'Development' },
    { id: 3, name: 'Management' },
    { id: 4, name: 'Sales' },
    { id: 5, name: 'HR' },
  ];

  for (const dept of depts) {
    const questions = await query<any[]>(
      `SELECT id, question_type, max_score, question_text, correct_answer 
       FROM interview_questions 
       WHERE department_id = ? AND round_type = 'department' AND is_active = 1
       ORDER BY id ASC`,
      [dept.id]
    );

    const totalMarks = questions.reduce((sum, q) => sum + Number(q.max_score), 0);
    const typeCounts: Record<string, number> = {};
    questions.forEach(q => {
      typeCounts[q.question_type] = (typeCounts[q.question_type] || 0) + 1;
    });

    console.log(`Dept ${dept.id} (${dept.name}): ${questions.length} questions, Total Marks: ${totalMarks}/35`);
    console.log(`   Types breakdown:`, typeCounts);

    if (questions.length !== 15 || totalMarks !== 35) {
      throw new Error(`Dept ${dept.name} verification failed! Expected 15 questions and 35 marks.`);
    }
  }

  console.log('\n=====================================================');
  console.log('2. Verify Generic Round 1 (round_type = hr) Untouched');
  console.log('=====================================================');
  const genericHr = await query<any[]>(
    `SELECT count(*) as count FROM interview_questions WHERE round_type = 'hr' AND is_active = 1`
  );
  console.log(`Generic Round 1 (round_type = 'hr') active questions: ${genericHr[0].count}`);

  console.log('\n=====================================================');
  console.log('3. Verify HR Candidate Assessment Retrieval');
  console.log('=====================================================');
  // Candidate ID 28 is Meera Nair (Dept 5, HR, dept_interview status)
  const hrQuestionsForCandidate = await getQuestionsForCandidate(28, 'department');
  console.log(`Fetched for Meera Nair (Candidate ID: 28, Dept: 5): ${hrQuestionsForCandidate.length} questions`);
  const candidateTotalMarks = hrQuestionsForCandidate.reduce((sum: number, q: any) => sum + Number(q.max_score), 0);
  console.log(`Total Candidate Assessment Marks: ${candidateTotalMarks} / 35 marks`);

  if (hrQuestionsForCandidate.length !== 15 || candidateTotalMarks !== 35) {
    throw new Error('HR candidate question retrieval mismatch!');
  }

  // Ensure all 15 questions belong to department_id = 5
  const foreignQuestions = hrQuestionsForCandidate.filter((q: any) => q.department_id !== 5);
  if (foreignQuestions.length > 0) {
    throw new Error(`Found ${foreignQuestions.length} foreign questions returned for HR candidate!`);
  }
  console.log('SUCCESS: All 15 questions returned are strictly HR department questions.');

  console.log('\n=====================================================');
  console.log('4. Verify HR Objective Scoring Rules');
  console.log('=====================================================');
  // Test MCQ scoring
  const mcq1: any = hrQuestionsForCandidate.find((q: any) => q.question_text.includes('primary purpose of an HR screening interview'));
  console.log(`MCQ 1: Correct=${mcq1?.correct_answer}, Marks=${mcq1?.max_score}`);
  if (!mcq1 || mcq1.correct_answer !== 'B' || Number(mcq1.max_score) !== 1) {
    throw new Error('MCQ 1 key or max_score invalid');
  }

  // Test Multi-Select scoring
  const multi1: any = hrQuestionsForCandidate.find((q: any) => q.question_text.includes('recruitment record'));
  console.log(`Multi-Select 6: Correct=${multi1?.correct_answer}, Marks=${multi1?.max_score}`);
  if (!multi1 || String(multi1.correct_answer) !== 'A, B, C, D' || Number(multi1.max_score) !== 2) {
    throw new Error('Multi-Select 6 key or max_score invalid');
  }

  // Test True/False scoring
  const tf1: any = hrQuestionsForCandidate.find((q: any) => q.question_text.includes('Interview evaluations should be based on job-related evidence'));
  console.log(`True/False 8: Correct=${tf1?.correct_answer}, Marks=${tf1?.max_score}`);
  if (!tf1 || String(tf1.correct_answer) !== 'True' || Number(tf1.max_score) !== 1) {
    throw new Error('True/False 8 key or max_score invalid');
  }

  const tf2: any = hrQuestionsForCandidate.find((q: any) => q.question_text.includes('Every candidate should receive an offer letter'));
  console.log(`True/False 9: Correct=${tf2?.correct_answer}, Marks=${tf2?.max_score}`);
  if (!tf2 || String(tf2.correct_answer) !== 'False' || Number(tf2.max_score) !== 1) {
    throw new Error('True/False 9 key or max_score invalid');
  }

  console.log('\n=====================================================');
  console.log('ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
  console.log('=====================================================');

  await pool.end();
  process.exit(0);
}

verifyAll().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
