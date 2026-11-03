import { NextRequest, NextResponse } from 'next/server';
import { getEvaluationSummary } from '@/features/interviews/interview.service';
import { getCandidateById } from '@/features/candidates/candidate.service';
import { evaluateCandidatePerformance } from '@/lib/ai/evaluation';
import { query, execute } from '@/lib/db/mysql';
import { RowDataPacket } from 'mysql2/promise';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const candidateIdParam = searchParams.get('candidate_id');

    // 1. Single candidate evaluation detail
    if (candidateIdParam && !isNaN(Number(candidateIdParam))) {
      const candidateId = Number(candidateIdParam);
      const summary = await getEvaluationSummary(candidateId);

      // Also fetch AI evaluation if present
      const [aiRows] = await query<RowDataPacket[]>(
        'SELECT * FROM ai_evaluations WHERE candidate_id = ? ORDER BY id DESC LIMIT 1',
        [candidateId]
      );

      return NextResponse.json({
        success: true,
        data: {
          ...summary,
          aiEvaluation: aiRows || null,
        },
      });
    }

    // 2. Full Interview Results List
    const roundFilter = searchParams.get('round');
    const deptFilter = searchParams.get('department');
    const search = searchParams.get('search');
    const feedbackFilter = searchParams.get('feedback');

    const sql = `
      SELECT 
        c.id AS candidate_id,
        c.candidate_code,
        c.full_name AS name,
        c.email,
        c.phone,
        c.application_status,
        d.id AS department_id,
        d.name AS department,
        p.title AS job_role,
        ce.round_1_score,
        ce.round_1_max_score,
        ce.round_2_score,
        ce.round_2_max_score,
        ce.round_3_score,
        ce.round_3_max_score,
        ce.total_earned_score,
        ce.total_possible_score,
        ce.overall_percentage,
        ce.evaluation_status,
        ce.evaluation_summary,
        hd.decision AS hiring_decision
      FROM candidates c
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN positions p ON c.position_id = p.id
      LEFT JOIN candidate_evaluations ce ON c.id = ce.candidate_id
      LEFT JOIN hiring_decisions hd ON c.id = hd.candidate_id AND hd.is_current = 1
      WHERE c.is_archived = 0
      ORDER BY c.id ASC
    `;

    const rows = await query<RowDataPacket[]>(sql);

    // Fetch all active interview sessions to get real-time round completion flags
    const interviewRows = await query<RowDataPacket[]>(
      'SELECT candidate_id, round_type, status, total_score, maximum_score FROM interviews WHERE status <> "cancelled"'
    );

    const mapped = rows.map((r, idx) => {
      const st = (r.application_status || '').toLowerCase();
      const candidateInterviews = interviewRows.filter((i) => i.candidate_id === r.candidate_id);

      const hrIv = candidateInterviews.find((i) => i.round_type === 'hr');
      const techIv = candidateInterviews.find((i) => i.round_type === 'department');
      const practicalIv = candidateInterviews.find((i) => i.round_type === 'final');

      const isPracticalStage = st === 'final_screening';
      const isTechStage = st === 'dept_interview';

      // Strict sequential round completion flags
      const hrDone = Boolean(
        r.round_1_score !== null ||
        (hrIv && (hrIv.status === 'completed' || hrIv.total_score !== null))
      );
      const techDone = Boolean(
        hrDone && (
          r.round_2_score !== null ||
          (techIv && (techIv.status === 'completed' || techIv.total_score !== null))
        )
      );
      const practicalDone = Boolean(
        hrDone && techDone && (
          r.round_3_score !== null ||
          (practicalIv && (practicalIv.status === 'completed' || practicalIv.total_score !== null))
        )
      );

      // Round Scores (normalized / formatted)
      let hrScore: string | null = null;
      if (r.round_1_score !== null && r.round_1_max_score && Number(r.round_1_max_score) > 0) {
        hrScore = ((Number(r.round_1_score) / Number(r.round_1_max_score)) * 10).toFixed(1);
      } else if (hrIv && hrIv.total_score !== null && hrIv.maximum_score && Number(hrIv.maximum_score) > 0) {
        hrScore = ((Number(hrIv.total_score) / Number(hrIv.maximum_score)) * 10).toFixed(1);
      }

      let techScore: string | null = null;
      if (r.round_2_score !== null && r.round_2_max_score && Number(r.round_2_max_score) > 0) {
        techScore = ((Number(r.round_2_score) / Number(r.round_2_max_score)) * 10).toFixed(1);
      } else if (techIv && techIv.total_score !== null && techIv.maximum_score && Number(techIv.maximum_score) > 0) {
        techScore = ((Number(techIv.total_score) / Number(techIv.maximum_score)) * 10).toFixed(1);
      }

      let practicalScore: string | null = null;
      if (r.round_3_score !== null && r.round_3_max_score && Number(r.round_3_max_score) > 0) {
        practicalScore = ((Number(r.round_3_score) / Number(r.round_3_max_score)) * 10).toFixed(1);
      } else if (practicalIv && practicalIv.total_score !== null && practicalIv.maximum_score && Number(practicalIv.maximum_score) > 0) {
        practicalScore = ((Number(practicalIv.total_score) / Number(practicalIv.maximum_score)) * 10).toFixed(1);
      }

      // Overall Score
      let overallScore = '—';
      if (r.overall_percentage !== null && r.overall_percentage !== undefined && Number(r.overall_percentage) > 0) {
        overallScore = (Number(r.overall_percentage) / 10).toFixed(1);
      } else {
        const scores = [hrScore, techScore, practicalScore].filter(Boolean).map(Number);
        if (scores.length > 0) {
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          overallScore = avg.toFixed(1);
        }
      }

      // Completed & Incomplete rounds calculation
      const completedRounds: string[] = [];
      if (hrDone) completedRounds.push('HR Round');
      if (techDone) completedRounds.push('Technical Round');
      if (practicalDone) completedRounds.push('Practical Round');

      const remainingRounds: string[] = [];
      if (!hrDone) remainingRounds.push('HR Round');
      if (!techDone) remainingRounds.push('Technical Round');
      if (!practicalDone) remainingRounds.push('Practical Round');

      const completedCount = completedRounds.length;
      const incompleteCount = remainingRounds.length;

      // Result calculation:
      // 1. If candidate has completed only 1 or 2 rounds (or not completed all 3 rounds):
      //    Result MUST strictly remain '—'.
      // 2. Once candidate has completed all 3 rounds:
      //    - If an explicit Hiring Decision (Hire / Hold / Reject) was recorded via the pencil (edit) option:
      //      show 'Hire', 'Hold', or 'Reject'.
      //    - Until and unless that option is selected, Result MUST strictly remain 'Pending'.
      const decisionVal = (r.hiring_decision || '').toLowerCase().trim();

      let result: 'Hire' | 'Hold' | 'Reject' | 'Pending' | '—' = '—';
      if (practicalDone && hrDone && techDone) {
        if (decisionVal === 'selected' || decisionVal === 'hire' || decisionVal === 'hired') {
          result = 'Hire';
        } else if (decisionVal === 'on_hold' || decisionVal === 'hold') {
          result = 'Hold';
        } else if (decisionVal === 'rejected' || decisionVal === 'reject') {
          result = 'Reject';
        } else {
          result = 'Pending';
        }
      } else {
        result = '—';
      }

      return {
        id: r.candidate_id,
        code: r.candidate_code || `CAN-${String(r.candidate_id).padStart(4, '0')}`,
        name: r.name,
        email: r.email || `candidate${r.candidate_id}@tarajglobal.com`,
        phone: r.phone || '—',
        department: r.department || 'General',
        job_role: r.job_role || 'Applicant',
        hr_done: hrDone,
        tech_done: techDone,
        practical_done: practicalDone,
        completed_rounds_count: completedCount,
        incomplete_rounds_count: incompleteCount,
        completed_rounds: completedRounds,
        remaining_rounds: remainingRounds,
        hr_status: hrIv?.status || (hrDone ? 'completed' : 'pending'),
        tech_status: techIv?.status || (techDone ? 'completed' : 'pending'),
        practical_status: practicalIv?.status || (practicalDone ? 'completed' : 'pending'),
        hr_score: hrScore,
        tech_score: techScore,
        practical_score: practicalScore,
        overall_score: overallScore,
        overall_percentage: r.overall_percentage,
        result,
        hiring_decision: r.hiring_decision || null,
        application_status: r.application_status,
      };
    });

    // Support tab filters: 'all' returns all candidates matching both pages!
    let filtered = mapped;
    if (roundFilter && roundFilter !== 'all') {
      if (roundFilter === 'hr') filtered = filtered.filter((i) => i.hr_done);
      if (roundFilter === 'technical') filtered = filtered.filter((i) => i.tech_done);
      if (roundFilter === 'practical') filtered = filtered.filter((i) => i.practical_done);
      if (roundFilter === 'pending') filtered = filtered.filter((i) => !i.hr_done || !i.tech_done || !i.practical_done);
    }

    return NextResponse.json({
      success: true,
      data: filtered,
    });
  } catch (err: unknown) {
    const e = err as Error;
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const candidateId = Number(body.candidate_id);

    if (!candidateId || isNaN(candidateId)) {
      return NextResponse.json({ success: false, error: 'candidate_id is required' }, { status: 400 });
    }

    const candidate = await getCandidateById(candidateId);
    if (!candidate) {
      return NextResponse.json({ success: false, error: 'Candidate not found.' }, { status: 404 });
    }

    // Fetch candidate interview answers across all rounds
    const answers = await query<RowDataPacket[]>(
      `SELECT ia.score, ia.interviewer_remarks AS remarks, ia.duration_seconds, ia.question_text_snapshot AS question,
              ia.recording_url
       FROM interview_answers ia
       JOIN interviews i ON ia.interview_id = i.id
       WHERE i.candidate_id = ?`,
      [candidateId]
    );

    const formattedAnswers = answers.map((a) => ({
      question: String(a.question || 'Interview Question'),
      remarks: String(a.remarks || ''),
      score: Number(a.score) || 0,
      durationSeconds: Number(a.duration_seconds) || 0,
      hasAudio: Boolean(a.recording_url),
    }));

    const result = await evaluateCandidatePerformance({
      candidateName: candidate.full_name,
      department: candidate.department_name || 'General',
      position: candidate.position_title || 'Position',
      experienceYears: candidate.experience_years || 0,
      interviewAnswers: formattedAnswers,
    });

    // Save into MySQL ai_evaluations
    const insertSql = `
      INSERT INTO ai_evaluations (
        candidate_id, summary, strengths, areas_for_assessment,
        suggested_followups, technical_rating, communication_rating,
        cultural_fit_rating, overall_ai_score, recommendation,
        model_used, raw_response, created_at
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, CURRENT_TIMESTAMP
      )
    `;

    await execute(insertSql, [
      candidateId,
      result.summary,
      JSON.stringify(result.strengths),
      JSON.stringify(result.areasForImprovement),
      JSON.stringify([]),
      result.technicalRating,
      result.communicationRating,
      result.culturalFitRating,
      result.suggestedScore,
      result.recommendation,
      result.modelUsed,
      JSON.stringify({ isAiAssisted: result.isAiAssisted, transcriptionNote: result.transcriptionNote }),
    ]);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Evaluation generated successfully.',
    });
  } catch (err: unknown) {
    const e = err as Error;
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
