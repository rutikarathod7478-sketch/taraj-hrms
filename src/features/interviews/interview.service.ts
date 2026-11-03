import { query, execute } from '@/lib/db/mysql';
import { withTransaction } from '@/lib/db/transaction';
import { Interview, InterviewAnswer, RecordingMetadata } from '@/types/interview';
import { Question, InterviewRoundType } from '@/types/question';
import { CandidateEvaluation, HiringDecision, JoiningRecord } from '@/types/evaluation';
import { updateCandidateStatus, getCandidateById } from '@/features/candidates/candidate.service';
import {
  sendEmail,
  generateThreeRoundsMarksEmailTemplate,
  generateCandidateSelectionEmailTemplate,
  generateCandidateRejectionEmailTemplate,
  SendEmailResult,
} from '@/lib/email/mailer';
import { RowDataPacket, PoolConnection } from 'mysql2/promise';

/**
 * Get interview session for a candidate and round
 */
export async function getInterviewByCandidateAndRound(
  candidateId: number,
  round: InterviewRoundType
): Promise<Interview | null> {
  const sql = `
    SELECT 
      i.*,
      i.round_type AS round,
      i.total_score AS overall_score,
      i.interviewer_summary AS remarks,
      u.full_name AS interviewer_name,
      c.full_name AS candidate_name
    FROM interviews i
    LEFT JOIN users u ON i.interviewer_id = u.id
    LEFT JOIN candidates c ON i.candidate_id = c.id
    WHERE i.candidate_id = ? AND i.round_type = ?
    LIMIT 1
  `;
  const rows = await query<(Interview & RowDataPacket)[]>(sql, [candidateId, round]);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Ensure an interview session exists in MySQL (get or create)
 */
export async function ensureInterviewSession(
  candidateId: number,
  round: InterviewRoundType,
  interviewerId?: number | null
): Promise<Interview> {
  const existing = await getInterviewByCandidateAndRound(candidateId, round);
  if (existing) {
    return existing;
  }

  // Create new session
  await execute(
    `INSERT INTO interviews (candidate_id, round_type, interviewer_id, status, started_at)
     VALUES (?, ?, ?, 'in_progress', CURRENT_TIMESTAMP)`,
    [candidateId, round, interviewerId || null]
  );

  const created = await getInterviewByCandidateAndRound(candidateId, round);
  if (!created) throw new Error('Failed to create interview session.');
  return created;
}

/**
 * Get answers recorded for an interview session
 */
export async function getInterviewAnswers(interviewId: number): Promise<InterviewAnswer[]> {
  const sql = `
    SELECT 
      ia.*,
      ia.interviewer_remarks AS remarks,
      q.question_text
    FROM interview_answers ia
    LEFT JOIN interview_questions q ON ia.question_id = q.id
    WHERE ia.interview_id = ?
    ORDER BY ia.id ASC
  `;
  return query<(InterviewAnswer & RowDataPacket)[]>(sql, [interviewId]);
}

/**
 * Retrieve questions for candidate based on round, department, and position
 */
export async function getQuestionsForCandidate(
  candidateId: number,
  round: InterviewRoundType
): Promise<Question[]> {
  const candidate = await getCandidateById(candidateId);
  if (!candidate) throw new Error('Candidate not found.');

  let sql = '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params: any[] = [round];

  if (round === 'hr') {
    // Universal cross-departmental HR questions + candidate-specific HR questions
    sql = `
      SELECT q.*, q.round_type AS round, d.name AS department_name
      FROM interview_questions q
      LEFT JOIN departments d ON q.department_id = d.id
      WHERE q.round_type = 'hr' AND q.is_active = 1
        AND (q.candidate_id = ? OR q.candidate_id IS NULL)
      ORDER BY (CASE WHEN q.candidate_id IS NOT NULL THEN 1 ELSE 0 END) ASC, q.id ASC
      LIMIT 100
    `;
    return query<(Question & RowDataPacket)[]>(sql, [candidateId]);
  }

  // Department round: strictly filter by candidate department when department-specific questions exist
  if (round === 'department' && candidate.department_id) {
    const deptSql = `
      SELECT q.*, q.round_type AS round, d.name AS department_name, p.title AS position_title
      FROM interview_questions q
      LEFT JOIN departments d ON q.department_id = d.id
      LEFT JOIN positions p ON q.position_id = p.id
      WHERE q.round_type = 'department'
        AND q.is_active = 1
        AND (q.candidate_id = ? OR q.candidate_id IS NULL)
        AND q.department_id = ?
      ORDER BY (CASE WHEN q.candidate_id IS NOT NULL THEN 1 ELSE 0 END) ASC, q.id ASC
    `;
    const deptRows = await query<(Question & RowDataPacket)[]>(deptSql, [candidateId, candidate.department_id]);
    if (deptRows.length > 0) {
      return deptRows;
    }
  }

  // Final round or fallback: filter by candidate department or universal + candidate-specific
  sql = `
    SELECT q.*, q.round_type AS round, d.name AS department_name, p.title AS position_title
    FROM interview_questions q
    LEFT JOIN departments d ON q.department_id = d.id
    LEFT JOIN positions p ON q.position_id = p.id
    WHERE q.round_type = ? 
      AND q.is_active = 1
      AND (q.candidate_id = ? OR q.candidate_id IS NULL)
      AND (q.department_id = ? OR q.department_id IS NULL)
    ORDER BY (CASE WHEN q.candidate_id IS NOT NULL THEN 1 ELSE 0 END) ASC, q.department_id DESC, q.id ASC
  `;
  params.push(candidateId, candidate.department_id);

  const rows = await query<(Question & RowDataPacket)[]>(sql, params);

  // If department-specific questions found, return them. If fewer than 2, fallback to all questions for round.
  if (rows.length >= 2) {
    return rows;
  }

  const fallbackSql = `
    SELECT q.*, q.round_type AS round, d.name AS department_name, p.title AS position_title
    FROM interview_questions q
    LEFT JOIN departments d ON q.department_id = d.id
    LEFT JOIN positions p ON q.position_id = p.id
    WHERE q.round_type = ? AND q.is_active = 1
      AND (q.candidate_id = ? OR q.candidate_id IS NULL)
    ORDER BY (CASE WHEN q.candidate_id IS NOT NULL THEN 1 ELSE 0 END) ASC, q.id ASC
    LIMIT 50
  `;
  return query<(Question & RowDataPacket)[]>(fallbackSql, [round, candidateId]);
}

/**
 * Save or update single question answer and score
 */
export async function saveInterviewAnswer(data: {
  interview_id: number;
  question_id: number;
  score: number;
  answer_text?: string;
  interviewer_remarks?: string;
  duration_seconds?: number;
  recording_url?: string;
}): Promise<void> {
  // Validate score bounds (0 to 10)
  if (data.score < 0 || data.score > 10) {
    throw new Error('Score must be between 0 and 10.');
  }

  // Check question text snapshot
  const [qRows] = await query<RowDataPacket[]>(
    'SELECT question_text FROM interview_questions WHERE id = ?',
    [data.question_id]
  );
  const questionText = qRows?.question_text || 'Interview Question';

  const sql = `
    INSERT INTO interview_answers (
      interview_id, question_id, question_text_snapshot,
      answer_text, score, maximum_score, interviewer_remarks, duration_seconds,
      recording_url, evaluation_status, answered_at
    ) VALUES (
      ?, ?, ?,
      ?, ?, 10, ?, ?,
      ?, 'evaluated', CURRENT_TIMESTAMP
    )
    ON DUPLICATE KEY UPDATE
      answer_text = COALESCE(VALUES(answer_text), answer_text),
      score = VALUES(score),
      interviewer_remarks = VALUES(interviewer_remarks),
      duration_seconds = VALUES(duration_seconds),
      recording_url = COALESCE(VALUES(recording_url), recording_url),
      answered_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
  `;

  await execute(sql, [
    data.interview_id,
    data.question_id,
    questionText,
    data.answer_text || null,
    data.score,
    data.interviewer_remarks || null,
    data.duration_seconds || 0,
    data.recording_url || null,
  ]);
}

/**
 * Save audio recording metadata to MySQL
 */
export async function saveRecordingMetadata(data: {
  interview_id: number;
  interview_answer_id?: number | null;
  candidate_id: number;
  storage_key: string;
  file_path: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  duration_seconds: number;
}): Promise<void> {
  const sql = `
    INSERT INTO interview_recordings (
      interview_id, interview_answer_id, candidate_id,
      storage_key, file_path, original_filename,
      mime_type, file_size, duration_seconds, created_at
    ) VALUES (
      ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, CURRENT_TIMESTAMP
    )
  `;

  await execute(sql, [
    data.interview_id,
    data.interview_answer_id || null,
    data.candidate_id,
    data.storage_key,
    data.file_path,
    data.original_filename,
    data.mime_type,
    data.file_size,
    data.duration_seconds,
  ]);
}

/**
 * Recalculate consolidated candidate evaluation across all 3 rounds in MySQL
 */
export async function recalculateEvaluation(candidateId: number): Promise<CandidateEvaluation> {
  // Query rounds from interviews
  const sql = `
    SELECT round_type, total_score, maximum_score, status
    FROM interviews
    WHERE candidate_id = ?
  `;
  const rounds = await query<RowDataPacket[]>(sql, [candidateId]);

  let r1Earned: number | null = null;
  let r1Max: number | null = null;
  let r2Earned: number | null = null;
  let r2Max: number | null = null;
  let r3Earned: number | null = null;
  let r3Max: number | null = null;

  for (const r of rounds) {
    if (r.round_type === 'hr' && r.total_score !== null) {
      r1Earned = Number(r.total_score);
      r1Max = Number(r.maximum_score) || (r1Earned <= 10 ? 10 : 100);
    } else if (r.round_type === 'department' && r.total_score !== null) {
      r2Earned = Number(r.total_score);
      r2Max = Number(r.maximum_score) || (r2Earned <= 10 ? 10 : 30);
    } else if (r.round_type === 'final' && r.total_score !== null) {
      r3Earned = Number(r.total_score);
      r3Max = Number(r.maximum_score) || (r3Earned <= 10 ? 10 : 100);
    }
  }

  let totalEarned = 0;
  let totalPossible = 0;
  if (r1Earned !== null && r1Max && r1Max > 0) {
    totalEarned += (r1Earned / r1Max) * 100;
    totalPossible += 100;
  }
  if (r2Earned !== null && r2Max && r2Max > 0) {
    totalEarned += (r2Earned / r2Max) * 100;
    totalPossible += 100;
  }
  if (r3Earned !== null && r3Max && r3Max > 0) {
    totalEarned += (r3Earned / r3Max) * 100;
    totalPossible += 100;
  }

  const overallPercentage = totalPossible > 0 ? Number(((totalEarned / totalPossible) * 100).toFixed(1)) : 0;
  const isCompleted = r1Earned !== null && r2Earned !== null && r3Earned !== null;

  const upsertSql = `
    INSERT INTO candidate_evaluations (
      candidate_id, round_1_score, round_1_max_score,
      round_2_score, round_2_max_score,
      round_3_score, round_3_max_score,
      total_earned_score, total_possible_score,
      overall_percentage, evaluation_status, calculated_at
    ) VALUES (
      ?, ?, ?,
      ?, ?,
      ?, ?,
      ?, ?,
      ?, ?, CURRENT_TIMESTAMP
    )
    ON DUPLICATE KEY UPDATE
      round_1_score = VALUES(round_1_score),
      round_1_max_score = VALUES(round_1_max_score),
      round_2_score = VALUES(round_2_score),
      round_2_max_score = VALUES(round_2_max_score),
      round_3_score = VALUES(round_3_score),
      round_3_max_score = VALUES(round_3_max_score),
      total_earned_score = VALUES(total_earned_score),
      total_possible_score = VALUES(total_possible_score),
      overall_percentage = VALUES(overall_percentage),
      evaluation_status = VALUES(evaluation_status),
      calculated_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
  `;

  await execute(upsertSql, [
    candidateId,
    r1Earned,
    r1Max,
    r2Earned,
    r2Max,
    r3Earned,
    r3Max,
    totalEarned,
    totalPossible,
    overallPercentage,
    isCompleted ? 'completed' : 'pending',
  ]);

  if (isCompleted) {
    sendThreeRoundsMarksEmail(candidateId, false).catch((mailErr) => {
      console.error('[InterviewService] Error in auto-dispatch of 3 rounds marks email:', mailErr);
    });
  }

  return {
    candidate_id: candidateId,
    round_1_score: r1Earned,
    round_1_max_score: r1Max,
    round_2_score: r2Earned,
    round_2_max_score: r2Max,
    round_3_score: r3Earned,
    round_3_max_score: r3Max,
    total_earned_score: totalEarned,
    total_possible_score: totalPossible,
    overall_percentage: overallPercentage,
    evaluation_status: isCompleted ? 'completed' : 'pending',
  };
}

/**
 * Complete an interview round with answers, remarks, and recommendation
 */
export async function completeInterviewRound(data: {
  candidateId: number;
  round: InterviewRoundType;
  interviewerId?: number | null;
  recommendation: 'recommended' | 'hold' | 'rejected';
  interviewerSummary?: string;
  totalScore?: number;
  maxScore?: number;
  answers?: Array<{
    question_id: number;
    score: number;
    answer_text?: string;
    remarks?: string;
    duration_seconds?: number;
    recording_url?: string;
  }>;
}): Promise<Interview> {
  const isRound1 = data.round === 'hr';
  const isDirectScore = data.totalScore !== undefined && data.totalScore !== null;
  const answersList = Array.isArray(data.answers) ? data.answers : [];

  // Server-side validation
  if (!isDirectScore && isRound1) {
    if (answersList.length < 10) {
      throw new Error('All 10 Round 1 questions must be evaluated before submitting.');
    }
  }

  for (const ans of answersList) {
    const s = Number(ans.score);
    if (isNaN(s) || s < 0 || s > 10) {
      throw new Error(`Invalid score ${ans.score}. Each question score must be between 0 and 10.`);
    }
  }

  const session = await ensureInterviewSession(data.candidateId, data.round, data.interviewerId);

  await withTransaction(async (conn: PoolConnection) => {
    // 1. Save all answers
    let totalScore = 0;

    for (const ans of answersList) {
      const s = Number(ans.score) || 0;
      totalScore += s;

      const [qRow] = await conn.execute(
        'SELECT question_text FROM interview_questions WHERE id = ?',
        [ans.question_id]
      );
      const qText = (qRow as RowDataPacket[])[0]?.question_text || 'Interview Question';

      const ansSql = `
        INSERT INTO interview_answers (
          interview_id, question_id, question_text_snapshot,
          answer_text, score, maximum_score, interviewer_remarks, duration_seconds,
          recording_url, evaluation_status, answered_at
        ) VALUES (
          ?, ?, ?,
          ?, ?, 10, ?, ?,
          ?, 'evaluated', CURRENT_TIMESTAMP
        )
        ON DUPLICATE KEY UPDATE
          answer_text = COALESCE(VALUES(answer_text), answer_text),
          score = VALUES(score),
          interviewer_remarks = VALUES(interviewer_remarks),
          duration_seconds = VALUES(duration_seconds),
          recording_url = COALESCE(VALUES(recording_url), recording_url),
          answered_at = CURRENT_TIMESTAMP
      `;
      await conn.execute(ansSql, [
        session.id,
        ans.question_id,
        qText,
        ans.answer_text || null,
        s,
        ans.remarks || null,
        ans.duration_seconds || 0,
        ans.recording_url || null,
      ]);
    }

    // Determine finalScore and finalMaxScore
    let finalScore: number;
    let finalMaxScore: number;

    if (isDirectScore) {
      finalScore = Number(data.totalScore);
      finalMaxScore = data.maxScore ? Number(data.maxScore) : (isRound1 && finalScore > 10 ? 100 : 10);
    } else {
      finalScore = isRound1
        ? totalScore
        : (answersList.length > 0 ? Number((totalScore / answersList.length).toFixed(1)) : 0);
      finalMaxScore = isRound1 ? 100 : 10;
    }

    // 2. Update interview record
    const updateInterviewSql = `
      UPDATE interviews
      SET 
        status = 'completed',
        completed_at = CURRENT_TIMESTAMP,
        total_questions = ?,
        total_score = ?,
        maximum_score = ?,
        recommendation = ?,
        interviewer_summary = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await conn.execute(updateInterviewSql, [
      answersList.length,
      finalScore,
      finalMaxScore,
      data.recommendation,
      data.interviewerSummary || null,
      session.id,
    ]);

    // 3. Advance candidate status based on round and decision
    let nextStatus = 'hr_interview';
    if (data.round === 'hr') {
      nextStatus = data.recommendation === 'recommended' ? 'dept_interview' : data.recommendation === 'rejected' ? 'rejected' : 'hr_interview';
    } else if (data.round === 'department') {
      nextStatus = data.recommendation === 'recommended' ? 'final_screening' : data.recommendation === 'rejected' ? 'rejected' : 'dept_interview';
    } else if (data.round === 'final') {
      nextStatus = data.recommendation === 'rejected' ? 'rejected' : 'evaluation';
    }

    await conn.execute(
      `UPDATE candidates SET application_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [nextStatus, data.candidateId]
    );

    // 4. Log activity
    await conn.execute(
      `INSERT INTO activity_logs (action, entity_type, entity_id, details) VALUES (?, 'interview', ?, ?)`,
      [
        `ROUND_${data.round.toUpperCase()}_COMPLETED`,
        session.id,
        JSON.stringify({ recommendation: data.recommendation, score: finalScore, max_score: finalMaxScore }),
      ]
    );
  });

  // 4. Recalculate consolidated evaluation metrics in candidate_evaluations
  await recalculateEvaluation(data.candidateId);

  const updatedSession = await getInterviewByCandidateAndRound(data.candidateId, data.round);
  return updatedSession || session;
}

/**
 * Get full evaluation summary for candidate
 */
export async function getEvaluationSummary(candidateId: number): Promise<{
  evaluation: CandidateEvaluation | null;
  decision: HiringDecision | null;
  joining: JoiningRecord | null;
}> {
  const [evalRows] = await query<RowDataPacket[]>(
    'SELECT * FROM candidate_evaluations WHERE candidate_id = ? LIMIT 1',
    [candidateId]
  );
  const [decisionRows] = await query<RowDataPacket[]>(
    `SELECT hd.*, u.full_name as decided_by_name 
     FROM hiring_decisions hd 
     LEFT JOIN users u ON hd.decided_by = u.id 
     WHERE hd.candidate_id = ? AND hd.is_current = 1 
     LIMIT 1`,
    [candidateId]
  );
  const [joiningRows] = await query<RowDataPacket[]>(
    'SELECT * FROM joining_records WHERE candidate_id = ? LIMIT 1',
    [candidateId]
  );

  return {
    evaluation: (evalRows as CandidateEvaluation) || null,
    decision: (decisionRows as HiringDecision) || null,
    joining: (joiningRows as JoiningRecord) || null,
  };
}

/**
 * Save final hiring decision and update candidate status
 */
export async function saveHiringDecision(input: {
  candidateId: number;
  decision: 'selected' | 'rejected' | 'on_hold';
  decisionNotes?: string;
  offeredSalary?: string;
  offeredPositionId?: number;
  joiningDate?: string;
  decidedBy?: number | null;
}): Promise<HiringDecision> {
  const candidate = await getCandidateById(input.candidateId);
  if (!candidate) throw new Error('Candidate not found.');

  await withTransaction(async (conn: PoolConnection) => {
    // Demote any previous current decisions
    await conn.execute(
      'UPDATE hiring_decisions SET is_current = 0 WHERE candidate_id = ?',
      [input.candidateId]
    );

    // Insert new current decision
    const insertSql = `
      INSERT INTO hiring_decisions (
        candidate_id, decision, decision_notes, offered_salary,
        offered_position_id, joining_date, decided_by, is_current,
        decision_timestamp
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?, 1,
        CURRENT_TIMESTAMP
      )
    `;
    await conn.execute(insertSql, [
      input.candidateId,
      input.decision,
      input.decisionNotes || null,
      input.offeredSalary || null,
      input.offeredPositionId || candidate.position_id,
      input.joiningDate || null,
      input.decidedBy || null,
    ]);

    // Update candidate application status
    const newStatus = input.decision === 'selected' ? 'offered' : input.decision === 'rejected' ? 'rejected' : 'on_hold';
    await conn.execute(
      'UPDATE candidates SET application_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newStatus, input.candidateId]
    );

    // If candidate was selected/offered, ensure draft joining record exists
    if (input.decision === 'selected') {
      const targetJoiningDate = input.joiningDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
      const joinSql = `
        INSERT INTO joining_records (
          candidate_id, proposed_joining_date, assigned_department_id,
          assigned_position_id, offer_status, joining_status
        ) VALUES (
          ?, ?, ?,
          ?, 'draft', 'pending'
        )
        ON DUPLICATE KEY UPDATE
          proposed_joining_date = COALESCE(VALUES(proposed_joining_date), proposed_joining_date),
          assigned_department_id = COALESCE(VALUES(assigned_department_id), assigned_department_id),
          assigned_position_id = COALESCE(VALUES(assigned_position_id), assigned_position_id),
          updated_at = CURRENT_TIMESTAMP
      `;
      await conn.execute(joinSql, [
        input.candidateId,
        targetJoiningDate,
        candidate.department_id,
        input.offeredPositionId || candidate.position_id,
      ]);
    }
  });

  const { decision } = await getEvaluationSummary(input.candidateId);
  if (!decision) throw new Error('Failed to retrieve hiring decision.');

  // Automatically dispatch Selection / Rejection email via SMTP if applicable (Hold sends no email)
  let emailResult: SendEmailResult | undefined = undefined;
  if (input.decision === 'selected' || input.decision === 'rejected') {
    try {
      emailResult = await sendHiringDecisionEmail(input.candidateId, input.decision, input.decisionNotes);
      console.log(`[saveHiringDecision] Dispatched ${input.decision} email to candidate ${input.candidateId}:`, emailResult);
    } catch (mailErr) {
      console.error(`[saveHiringDecision] Decision email dispatch failed:`, mailErr);
    }
  }

  return { ...decision, emailResult } as any;
}

/**
 * Dispatch Selection or Rejection notification email to candidate's registered email
 * based on the hiring decision made. (Hold sends no email).
 */
export async function sendHiringDecisionEmail(
  candidateId: number,
  decision: 'selected' | 'rejected',
  decisionNotes?: string
): Promise<SendEmailResult & { skipped?: boolean }> {
  try {
    // 1. Fetch candidate information
    const cands = await query<RowDataPacket[]>(
      `SELECT c.*, d.name AS department_name, p.title AS position_title
       FROM candidates c
       LEFT JOIN departments d ON c.department_id = d.id
       LEFT JOIN positions p ON c.position_id = p.id
       WHERE c.id = ? LIMIT 1`,
      [candidateId]
    );

    if (!cands || cands.length === 0) {
      return { success: false, status: 'failed', error: 'Candidate not found.' };
    }
    const cand = cands[0];
    if (!cand.email) {
      return { success: false, status: 'failed', error: 'Candidate has no registered email.' };
    }

    // 2. Fetch round feedback from interviews
    const interviewRows = await query<RowDataPacket[]>(
      `SELECT round_type, interviewer_summary, total_score, status FROM interviews WHERE candidate_id = ?`,
      [candidateId]
    );
    const hrIv = interviewRows.find((i) => i.round_type === 'hr');
    const techIv = interviewRows.find((i) => i.round_type === 'department');
    const practicalIv = interviewRows.find((i) => i.round_type === 'final');

    const evalRows = await query<RowDataPacket[]>(
      `SELECT evaluation_summary FROM candidate_evaluations WHERE candidate_id = ? LIMIT 1`,
      [candidateId]
    );
    const evaluation = evalRows && evalRows.length > 0 ? evalRows[0] : null;

    const jobRole = cand.position_title || 'Software Engineer';
    const department = cand.department_name || 'Engineering & Technology';
    const candidateName = cand.full_name || 'Candidate';
    const candidateCode = cand.candidate_code || `CAND-${cand.id}`;

    if (decision === 'selected') {
      const template = generateCandidateSelectionEmailTemplate({
        candidateName,
        candidateCode,
        candidateEmail: cand.email,
        jobRole,
        department,
        hrFeedback: hrIv?.interviewer_summary?.trim() || undefined,
        technicalFeedback: techIv?.interviewer_summary?.trim() || undefined,
        practicalFeedback: practicalIv?.interviewer_summary?.trim() || undefined,
        overallPerformance: decisionNotes?.trim() || evaluation?.evaluation_summary?.trim() || undefined,
      });

      const mailResult = await sendEmail({
        to: cand.email,
        subject: template.subject,
        templateType: 'selection',
        contentHtml: template.html,
        contentText: template.text,
      });

      return mailResult;
    } else {
      const template = generateCandidateRejectionEmailTemplate({
        candidateName,
        candidateCode,
        candidateEmail: cand.email,
        jobRole,
        department,
        hrFeedback: hrIv?.interviewer_summary?.trim() || undefined,
        technicalFeedback: techIv?.interviewer_summary?.trim() || undefined,
        practicalFeedback: practicalIv?.interviewer_summary?.trim() || undefined,
        areasForImprovement: decisionNotes?.trim() || evaluation?.evaluation_summary?.trim() || undefined,
      });

      const mailResult = await sendEmail({
        to: cand.email,
        subject: template.subject,
        templateType: 'rejection',
        contentHtml: template.html,
        contentText: template.text,
      });

      return mailResult;
    }
  } catch (err: unknown) {
    const e = err as Error;
    console.error('[sendHiringDecisionEmail] Error:', e);
    return { success: false, status: 'failed', error: e.message };
  }
}

/**
 * Send round-wise marks summary email to candidate's registered email
 * after all 3 rounds (HR, Technical, Practical) are completed.
 */
export async function sendThreeRoundsMarksEmail(
  candidateId: number,
  forceResend: boolean = false
): Promise<{ success: boolean; messageId?: string; error?: string; skipped?: boolean }> {
  try {
    // 1. Fetch candidate info
    const cands = await query<RowDataPacket[]>(
      `SELECT c.*, d.name AS department_name, p.title AS position_title
       FROM candidates c
       LEFT JOIN departments d ON c.department_id = d.id
       LEFT JOIN positions p ON c.position_id = p.id
       WHERE c.id = ? LIMIT 1`,
      [candidateId]
    );
    if (!cands || cands.length === 0) {
      return { success: false, error: 'Candidate not found.' };
    }
    const cand = cands[0];
    if (!cand.email) {
      return { success: false, error: 'Candidate has no registered email.' };
    }

    // 2. Fetch evaluation metrics
    const evalRows = await query<RowDataPacket[]>(
      `SELECT * FROM candidate_evaluations WHERE candidate_id = ? LIMIT 1`,
      [candidateId]
    );
    const evaluation = evalRows && evalRows.length > 0 ? evalRows[0] : null;

    // Fetch individual round scores from interviews to verify complete evaluations
    const interviewRows = await query<RowDataPacket[]>(
      `SELECT round_type, total_score, maximum_score, status FROM interviews WHERE candidate_id = ?`,
      [candidateId]
    );
    const hrIv = interviewRows.find((i) => i.round_type === 'hr');
    const techIv = interviewRows.find((i) => i.round_type === 'department');
    const practicalIv = interviewRows.find((i) => i.round_type === 'final');

    const r1Score = evaluation?.round_1_score !== null && evaluation?.round_1_score !== undefined
      ? evaluation.round_1_score
      : hrIv?.total_score;
    const r2Score = evaluation?.round_2_score !== null && evaluation?.round_2_score !== undefined
      ? evaluation.round_2_score
      : techIv?.total_score;
    const r3Score = evaluation?.round_3_score !== null && evaluation?.round_3_score !== undefined
      ? evaluation.round_3_score
      : practicalIv?.total_score;

    if (
      r1Score === null || r1Score === undefined ||
      r2Score === null || r2Score === undefined ||
      r3Score === null || r3Score === undefined
    ) {
      return {
        success: false,
        skipped: true,
        error: 'All 3 interview rounds must be completed before the marks email can be sent.',
      };
    }

    // 3. Prevent duplicate dispatch unless forceResend is requested
    if (!forceResend) {
      const alreadySent = await query<RowDataPacket[]>(
        `SELECT id FROM email_logs WHERE recipient_email = ? AND template_type = 'three_rounds_marks' AND status = 'sent' LIMIT 1`,
        [cand.email]
      );
      if (alreadySent && alreadySent.length > 0) {
        return {
          success: true,
          skipped: true,
          error: 'Marks email already delivered to candidate registered email.',
        };
      }
    }

    // 4. Generate email template containing ONLY round-wise marks
    const template = generateThreeRoundsMarksEmailTemplate({
      candidateName: cand.full_name,
      candidateCode: cand.candidate_code,
      candidateEmail: cand.email,
      departmentName: cand.department_name || undefined,
      positionTitle: cand.position_title || undefined,
      round1Score: r1Score,
      round1MaxScore: evaluation?.round_1_max_score || hrIv?.maximum_score || 100,
      round2Score: r2Score,
      round2MaxScore: evaluation?.round_2_max_score || techIv?.maximum_score || 10,
      round3Score: r3Score,
      round3MaxScore: evaluation?.round_3_max_score || practicalIv?.maximum_score || 10,
      overallPercentage: evaluation?.overall_percentage !== null && evaluation?.overall_percentage !== undefined
        ? evaluation.overall_percentage
        : undefined,
      totalEarnedScore: evaluation?.total_earned_score || undefined,
      totalPossibleScore: evaluation?.total_possible_score || undefined,
    });

    // 5. Send via SMTP
    const mailResult = await sendEmail({
      to: cand.email,
      subject: template.subject,
      templateType: 'three_rounds_marks',
      contentHtml: template.html,
      contentText: template.text,
    });

    return mailResult;
  } catch (err: unknown) {
    const e = err as Error;
    console.error('[sendThreeRoundsMarksEmail] Error:', e);
    return { success: false, error: e.message };
  }
}
