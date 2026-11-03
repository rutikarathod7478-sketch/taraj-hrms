import { query, pool } from '../src/lib/db/mysql';
import { getQuestionsForCandidate } from '../src/features/interviews/interview.service';

async function verifyAll() {
  console.log('=====================================================');
  console.log('1. Verify All 6 Department Question Banks');
  console.log('=====================================================');

  const depts = [
    { id: 1, name: 'Quality' },
    { id: 2, name: 'Development' },
    { id: 3, name: 'Management' },
    { id: 4, name: 'Sales' },
    { id: 5, name: 'HR' },
    { id: 6, name: 'Operations' },
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
  console.log('3. Verify Operations Candidate Assessment Retrieval');
  console.log('=====================================================');
  // Candidate ID 31 is Rajesh Sawant (Dept 6, Operations, dept_interview status)
  const opsQuestionsForCandidate = await getQuestionsForCandidate(31, 'department');
  console.log(`Fetched for Rajesh Sawant (Candidate ID: 31, Dept: 6): ${opsQuestionsForCandidate.length} questions`);
  const candidateTotalMarks = opsQuestionsForCandidate.reduce((sum: number, q: any) => sum + Number(q.max_score), 0);
  console.log(`Total Candidate Assessment Marks: ${candidateTotalMarks} / 35 marks`);

  if (opsQuestionsForCandidate.length !== 15 || candidateTotalMarks !== 35) {
    throw new Error('Operations candidate question retrieval mismatch!');
  }

  // Ensure all 15 questions belong to department_id = 6
  const foreignQuestions = opsQuestionsForCandidate.filter((q: any) => q.department_id !== 6);
  if (foreignQuestions.length > 0) {
    throw new Error(`Found ${foreignQuestions.length} foreign questions returned for Operations candidate!`);
  }
  console.log('SUCCESS: All 15 questions returned are strictly Operations department questions.');

  console.log('\n=====================================================');
  console.log('4. Verify Operations Objective Scoring Rules');
  console.log('=====================================================');
  // Helper matching the InterviewWorkspace scoring logic
  function scoreObjectiveQuestion(q: any, candidateAnswers: string[] | string): number {
    const maxScore = Number(q.max_score) || 1;
    if (q.question_type === 'mcq' || q.question_type === 'true_false') {
      const selected = Array.isArray(candidateAnswers) ? candidateAnswers[0] : candidateAnswers;
      return selected?.trim() === q.correct_answer?.trim() ? maxScore : 0;
    }
    if (q.question_type === 'multiple_select') {
      const correctList = (q.correct_answer || '')
        .split(',')
        .map((s: string) => s.trim().toUpperCase())
        .filter(Boolean)
        .sort();
      const selectedList = (Array.isArray(candidateAnswers) ? candidateAnswers : [candidateAnswers])
        .map((s: string) => s.trim().toUpperCase())
        .filter(Boolean)
        .sort();

      const isExactMatch =
        correctList.length === selectedList.length &&
        correctList.every((val: string, index: number) => val === selectedList[index]);

      return isExactMatch ? maxScore : 0;
    }
    return 0;
  }

  // Test MCQ 1
  const mcq1: any = opsQuestionsForCandidate.find((q: any) => q.question_text.includes('primary objective of business operations'));
  console.log(`MCQ 1: Correct=${mcq1?.correct_answer}, Marks=${mcq1?.max_score}`);
  if (!mcq1 || mcq1.correct_answer !== 'B' || Number(mcq1.max_score) !== 1) {
    throw new Error('MCQ 1 key or max_score invalid');
  }
  if (scoreObjectiveQuestion(mcq1, 'B') !== 1 || scoreObjectiveQuestion(mcq1, 'A') !== 0) {
    throw new Error('MCQ 1 scoring evaluation failed');
  }

  // Test Multi-Select 6
  const multi1: any = opsQuestionsForCandidate.find((q: any) => q.question_text.includes('activities support efficient operations'));
  console.log(`Multi-Select 6: Correct=${multi1?.correct_answer}, Marks=${multi1?.max_score}`);
  if (!multi1 || String(multi1.correct_answer) !== 'A, B, C, D' || Number(multi1.max_score) !== 2) {
    throw new Error('Multi-Select 6 key or max_score invalid');
  }
  if (
    scoreObjectiveQuestion(multi1, ['A', 'B', 'C', 'D']) !== 2 ||
    scoreObjectiveQuestion(multi1, ['A', 'B', 'C']) !== 0 ||
    scoreObjectiveQuestion(multi1, ['A', 'B', 'C', 'D', 'E']) !== 0
  ) {
    throw new Error('Multi-Select 6 scoring evaluation failed');
  }

  // Test True/False 8 & 9
  const tf1: any = opsQuestionsForCandidate.find((q: any) => q.question_text.includes('Standardized processes can help improve consistency'));
  console.log(`True/False 8: Correct=${tf1?.correct_answer}, Marks=${tf1?.max_score}`);
  if (!tf1 || String(tf1.correct_answer) !== 'True' || Number(tf1.max_score) !== 1) {
    throw new Error('True/False 8 key or max_score invalid');
  }
  if (scoreObjectiveQuestion(tf1, 'True') !== 1 || scoreObjectiveQuestion(tf1, 'False') !== 0) {
    throw new Error('True/False 8 scoring evaluation failed');
  }

  const tf2: any = opsQuestionsForCandidate.find((q: any) => q.question_text.includes('Operational reports are useful only when a problem has already occurred'));
  console.log(`True/False 9: Correct=${tf2?.correct_answer}, Marks=${tf2?.max_score}`);
  if (!tf2 || String(tf2.correct_answer) !== 'False' || Number(tf2.max_score) !== 1) {
    throw new Error('True/False 9 key or max_score invalid');
  }
  if (scoreObjectiveQuestion(tf2, 'False') !== 1 || scoreObjectiveQuestion(tf2, 'True') !== 0) {
    throw new Error('True/False 9 scoring evaluation failed');
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
