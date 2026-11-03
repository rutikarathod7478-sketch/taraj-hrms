import { query, pool } from '../src/lib/db/mysql';
import { getQuestionsForCandidate } from '../src/features/interviews/interview.service';

async function verifyAll() {
  console.log('=====================================================');
  console.log('1. Verify All 8 Department Question Banks');
  console.log('=====================================================');

  const depts = [
    { id: 1, name: 'Quality' },
    { id: 2, name: 'Development' },
    { id: 3, name: 'Management' },
    { id: 4, name: 'Sales' },
    { id: 5, name: 'HR' },
    { id: 6, name: 'Operations' },
    { id: 7, name: 'DBMS' },
    { id: 8, name: 'Email Marketing' },
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
  console.log('3. Verify Email Marketing Candidate Assessment Retrieval');
  console.log('=====================================================');
  // Candidate ID 30 is Tanvi Gaikwad (Dept 8, Email Marketing, dept_interview status)
  const emailMktQuestionsForCandidate = await getQuestionsForCandidate(30, 'department');
  console.log(`Fetched for Tanvi Gaikwad (Candidate ID: 30, Dept: 8): ${emailMktQuestionsForCandidate.length} questions`);
  const candidateTotalMarks = emailMktQuestionsForCandidate.reduce((sum: number, q: any) => sum + Number(q.max_score), 0);
  console.log(`Total Candidate Assessment Marks: ${candidateTotalMarks} / 35 marks`);

  if (emailMktQuestionsForCandidate.length !== 15 || candidateTotalMarks !== 35) {
    throw new Error('Email Marketing candidate question retrieval mismatch!');
  }

  // Ensure all 15 questions belong to department_id = 8
  const foreignQuestions = emailMktQuestionsForCandidate.filter((q: any) => q.department_id !== 8);
  if (foreignQuestions.length > 0) {
    throw new Error(`Found ${foreignQuestions.length} foreign questions returned for Email Marketing candidate!`);
  }
  console.log('SUCCESS: All 15 questions returned are strictly Email Marketing department questions.');

  console.log('\n=====================================================');
  console.log('4. Verify Email Marketing Objective Scoring Rules');
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
  const mcq1: any = emailMktQuestionsForCandidate.find((q: any) => q.question_text.includes('purpose of audience segmentation'));
  console.log(`MCQ 1: Correct=${mcq1?.correct_answer}, Marks=${mcq1?.max_score}`);
  if (!mcq1 || mcq1.correct_answer !== 'B' || Number(mcq1.max_score) !== 1) {
    throw new Error('MCQ 1 key or max_score invalid');
  }
  if (scoreObjectiveQuestion(mcq1, 'B') !== 1 || scoreObjectiveQuestion(mcq1, 'A') !== 0) {
    throw new Error('MCQ 1 scoring evaluation failed');
  }

  // Test MCQ 2
  const mcq2: any = emailMktQuestionsForCandidate.find((q: any) => q.question_text.includes('percentage of delivered emails that recipients clicked through'));
  console.log(`MCQ 2: Correct=${mcq2?.correct_answer}, Marks=${mcq2?.max_score}`);
  if (!mcq2 || mcq2.correct_answer !== 'B' || Number(mcq2.max_score) !== 1) {
    throw new Error('MCQ 2 key or max_score invalid');
  }

  // Test Multi-Select 6
  const multi1: any = emailMktQuestionsForCandidate.find((q: any) => q.question_text.includes('elements can be tested in an email campaign'));
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

  // Test Multi-Select 7
  const multi2: any = emailMktQuestionsForCandidate.find((q: any) => q.question_text.includes('metrics can help evaluate an email marketing campaign'));
  console.log(`Multi-Select 7: Correct=${multi2?.correct_answer}, Marks=${multi2?.max_score}`);
  if (!multi2 || String(multi2.correct_answer) !== 'A, B, C, D' || Number(multi2.max_score) !== 2) {
    throw new Error('Multi-Select 7 key or max_score invalid');
  }

  // Test True/False 8 & 9
  const tf1: any = emailMktQuestionsForCandidate.find((q: any) => q.question_text.includes('high open rate alone proves'));
  console.log(`True/False 8: Correct=${tf1?.correct_answer}, Marks=${tf1?.max_score}`);
  if (!tf1 || String(tf1.correct_answer) !== 'False' || Number(tf1.max_score) !== 1) {
    throw new Error('True/False 8 key or max_score invalid');
  }
  if (scoreObjectiveQuestion(tf1, 'False') !== 1 || scoreObjectiveQuestion(tf1, 'True') !== 0) {
    throw new Error('True/False 8 scoring evaluation failed');
  }

  const tf2: any = emailMktQuestionsForCandidate.find((q: any) => q.question_text.includes('privacy, consent, and unsubscribe requirements'));
  console.log(`True/False 9: Correct=${tf2?.correct_answer}, Marks=${tf2?.max_score}`);
  if (!tf2 || String(tf2.correct_answer) !== 'True' || Number(tf2.max_score) !== 1) {
    throw new Error('True/False 9 key or max_score invalid');
  }
  if (scoreObjectiveQuestion(tf2, 'True') !== 1 || scoreObjectiveQuestion(tf2, 'False') !== 0) {
    throw new Error('True/False 9 scoring evaluation failed');
  }

  console.log('\n=====================================================');
  console.log('ALL 8 DEPARTMENTS VERIFICATION CHECKS PASSED SUCCESSFULLY!');
  console.log('=====================================================');

  await pool.end();
  process.exit(0);
}

verifyAll().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
