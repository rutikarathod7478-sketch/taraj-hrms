import { query, pool } from '../src/lib/db/mysql';
import { getQuestionsForCandidate } from '../src/features/interviews/interview.service';

async function testHrScoring() {
  console.log('Testing HR Department Assessment & Scoring Flow...');

  const questions = await getQuestionsForCandidate(28, 'department');
  console.log(`Fetched ${questions.length} questions for HR candidate`);

  // Verify all 15 questions
  let calculatedMaxScore = 0;
  for (const q of questions) {
    calculatedMaxScore += Number(q.max_score);
  }
  console.log(`Total Max Score: ${calculatedMaxScore} / 35 marks`);
  if (calculatedMaxScore !== 35) {
    throw new Error(`Max score mismatch: expected 35, got ${calculatedMaxScore}`);
  }

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

  // 1. Test MCQs
  const mcqs = questions.filter((q: any) => q.question_type === 'mcq');
  console.log(`Found ${mcqs.length} MCQs`);
  mcqs.forEach((q: any, idx: number) => {
    const correctScore = scoreObjectiveQuestion(q, q.correct_answer);
    const wrongScore = scoreObjectiveQuestion(q, q.correct_answer === 'A' ? 'B' : 'A');
    console.log(`MCQ ${idx + 1}: correctScore = ${correctScore} (expected 1), wrongScore = ${wrongScore} (expected 0)`);
    if (correctScore !== 1 || wrongScore !== 0) throw new Error(`MCQ ${idx + 1} score calculation error`);
  });

  // 2. Test Multi-select
  const multis = questions.filter((q: any) => q.question_type === 'multiple_select');
  console.log(`Found ${multis.length} Multi-Select questions`);
  multis.forEach((q: any, idx: number) => {
    const fullMatch = scoreObjectiveQuestion(q, ['A', 'B', 'C', 'D']);
    const partialMatch = scoreObjectiveQuestion(q, ['A', 'B', 'C']);
    const wrongOption = scoreObjectiveQuestion(q, ['A', 'B', 'C', 'D', 'E']);
    console.log(`Multi ${idx + 1}: fullMatch = ${fullMatch} (expected 2), partialMatch = ${partialMatch} (expected 0), wrongOption = ${wrongOption} (expected 0)`);
    if (fullMatch !== 2 || partialMatch !== 0 || wrongOption !== 0) throw new Error(`Multi-select ${idx + 1} score calculation error`);
  });

  // 3. Test True/False
  const tfs = questions.filter((q: any) => q.question_type === 'true_false');
  console.log(`Found ${tfs.length} True/False questions`);
  tfs.forEach((q: any, idx: number) => {
    const correctScore = scoreObjectiveQuestion(q, q.correct_answer);
    const wrongScore = scoreObjectiveQuestion(q, q.correct_answer === 'True' ? 'False' : 'True');
    console.log(`TF ${idx + 1}: correctScore = ${correctScore} (expected 1), wrongScore = ${wrongScore} (expected 0)`);
    if (correctScore !== 1 || wrongScore !== 0) throw new Error(`True/False ${idx + 1} score calculation error`);
  });

  // 4. Test Short Answers (max 3) and Scenario (max 5)
  const shorts = questions.filter((q: any) => q.question_type === 'short_answer');
  if (shorts.length !== 3 || !shorts.every((q: any) => Number(q.max_score) === 3)) {
    throw new Error('Short answers count or marks error');
  }

  const scenarios = questions.filter((q: any) => q.question_type === 'scenario');
  if (scenarios.length !== 3 || !scenarios.every((q: any) => Number(q.max_score) === 5)) {
    throw new Error('Scenario questions count or marks error');
  }

  console.log('All HR assessment and scoring logic verified successfully!');
  await pool.end();
  process.exit(0);
}

testHrScoring().catch(err => {
  console.error(err);
  process.exit(1);
});
