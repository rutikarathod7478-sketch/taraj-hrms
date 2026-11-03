import { NextRequest, NextResponse } from 'next/server';
import {
  ensureInterviewSession,
  getInterviewByCandidateAndRound,
  getInterviewAnswers,
  saveInterviewAnswer,
  completeInterviewRound,
  saveHiringDecision,
  getEvaluationSummary,
  sendThreeRoundsMarksEmail,
  sendHiringDecisionEmail,
} from '@/features/interviews/interview.service';
import { getSessionUser } from '@/lib/auth/session';
import { canConductInterview, canMakeHiringDecision } from '@/lib/auth/permissions';
import { InterviewRoundType } from '@/types/question';
import { query } from '@/lib/db/mysql';
import { sendEmail, generateInterviewInvitationEmail } from '@/lib/email/mailer';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const candidateIdParam = searchParams.get('candidate_id');
    const roundFilter = searchParams.get('round_type') || searchParams.get('round');
    const statusFilter = searchParams.get('status');

    // 1. Single candidate interview session detail
    if (candidateIdParam && !isNaN(Number(candidateIdParam))) {
      const candidateId = Number(candidateIdParam);
      const round = (roundFilter || 'hr') as InterviewRoundType;

      const interview = await getInterviewByCandidateAndRound(candidateId, round);
      let answers: any[] = [];
      if (interview) {
        answers = await getInterviewAnswers(interview.id);
      }

      return NextResponse.json({
        success: true,
        data: {
          interview,
          answers,
        },
      });
    }

    // 2. All interviews list for Interview Management dashboard
    // Show only Online mode interviews as requested (Offline in-person interviews are managed separately)
    const conditions: string[] = [
      'c.is_archived = 0',
      "LOWER(COALESCE(i.mode, 'Online')) = 'online'",
    ];
    const params: any[] = [];

    if (roundFilter && roundFilter !== 'all') {
      const r = roundFilter.toLowerCase();
      if (r === 'hr_round' || r === 'hr') {
        conditions.push('i.round_type = "hr"');
      } else if (r === 'technical_round' || r === 'department' || r === 'dept') {
        conditions.push('i.round_type = "department"');
      } else if (r === 'practical_round' || r === 'final' || r === 'practical') {
        conditions.push('i.round_type = "final"');
      } else {
        conditions.push('i.round_type = ?');
        params.push(roundFilter);
      }
    }

    if (statusFilter && statusFilter !== 'all') {
      conditions.push('i.status = ?');
      params.push(statusFilter);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        i.id,
        i.candidate_id,
        i.round_type,
        i.interviewer_id,
        i.scheduled_at,
        i.status,
        i.mode,
        i.total_score,
        i.maximum_score,
        i.recommendation,
        i.interviewer_summary,
        c.full_name AS candidate,
        c.candidate_code,
        c.application_status AS candidate_status,
        c.email AS candidate_email,
        c.phone AS candidate_phone,
        d.name AS department,
        p.title AS job_role,
        u.full_name AS interviewer_name
      FROM interviews i
      JOIN candidates c ON i.candidate_id = c.id
      LEFT JOIN departments d ON c.department_id = d.id
      LEFT JOIN positions p ON c.position_id = p.id
      LEFT JOIN users u ON i.interviewer_id = u.id
      ${whereClause}
      ORDER BY i.id DESC
    `;

    const rows = await query<any[]>(sql, params);

    // Provide realistic fallbacks for date, interviewer, and mode if not set in db
    const defaultInterviewers: Record<string, string> = {
      hr: 'Pooja Kumari (HR Lead)',
      department: 'Emily Davis (QA / Tech Lead)',
      final: 'Alexander Wright (Director)',
    };

    const defaultTimes = [
      '2026-10-16 10:00:00',
      '2026-10-16 14:00:00',
      '2026-10-17 11:00:00',
      '2026-10-17 15:00:00',
      '2026-10-18 10:30:00',
      '2026-10-18 14:30:00',
    ];

    const mapped = rows.map((iv, index) => {
      const mode = iv.mode || (index % 3 === 2 ? 'Offline' : 'Online');
      const scheduled = iv.scheduled_at || defaultTimes[index % defaultTimes.length];
      const interviewer = iv.interviewer_name || defaultInterviewers[iv.round_type] || 'Pooja Kumari';

      let roundLabel = 'HR Round';
      if (iv.round_type === 'department') roundLabel = 'Technical Round';
      if (iv.round_type === 'final') roundLabel = 'Practical Round';

      return {
        ...iv,
        code: `INT-${String(iv.id).padStart(4, '0')}`,
        round_display: roundLabel,
        scheduled_at: scheduled,
        interviewer: interviewer,
        mode,
      };
    });

    return NextResponse.json({
      success: true,
      data: mapped,
    });
  } catch (err: unknown) {
    const e = err as Error;
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    const body = await request.json();
    const { action } = body;

    // 0. Schedule new interview round
    if (action === 'schedule') {
      const { candidate_id, round, scheduled_at, department_id, department_name, mode } = body;

      if (!candidate_id || !round) {
        return NextResponse.json(
          { success: false, error: 'Candidate ID and round type are required.' },
          { status: 400 }
        );
      }

      // Map round to enum ('department' for tech, 'final' for practical)
      let roundType: 'department' | 'final' | 'hr' = 'department';
      const r = String(round).toLowerCase();
      if (r === 'practical' || r === 'final') {
        roundType = 'final';
      } else if (r === 'tech' || r === 'technical' || r === 'department') {
        roundType = 'department';
      } else {
        roundType = 'hr';
      }

      // Find department manager to assign as interviewer if available
      let interviewerId: number | null = null;
      let targetDeptId = department_id ? Number(department_id) : null;

      if (!targetDeptId && department_name) {
        const deptRows = await query<any[]>('SELECT id FROM departments WHERE name LIKE ? LIMIT 1', [`%${department_name}%`]);
        if (deptRows && deptRows.length > 0) targetDeptId = deptRows[0].id;
      }

      if (!targetDeptId) {
        const candRows = await query<any[]>('SELECT department_id FROM candidates WHERE id = ?', [Number(candidate_id)]);
        if (candRows && candRows.length > 0 && candRows[0].department_id) {
          targetDeptId = candRows[0].department_id;
        }
      }

      if (targetDeptId) {
        const mgrRows = await query<any[]>('SELECT id FROM users WHERE department_id = ? LIMIT 1', [targetDeptId]);
        if (mgrRows && mgrRows.length > 0) interviewerId = mgrRows[0].id;
      }

      if (!interviewerId) {
        interviewerId = user?.id || 2; // Default to HR manager if no dept manager found
      }

      // Format scheduled_at
      let formattedDate: string | null = null;
      if (scheduled_at) {
        const d = new Date(scheduled_at);
        if (!isNaN(d.getTime())) {
          formattedDate = d.toISOString().slice(0, 19).replace('T', ' ');
        } else {
          formattedDate = String(scheduled_at).replace('T', ' ');
        }
      }

      // Insert or update scheduled interview session
      const insertSql = `
        INSERT INTO interviews (candidate_id, round_type, interviewer_id, scheduled_at, status, mode)
        VALUES (?, ?, ?, ?, 'scheduled', ?)
        ON DUPLICATE KEY UPDATE
          interviewer_id = VALUES(interviewer_id),
          scheduled_at = VALUES(scheduled_at),
          mode = VALUES(mode),
          status = 'scheduled'
      `;
      const result: any = await query(insertSql, [
        Number(candidate_id),
        roundType,
        interviewerId,
        formattedDate || new Date().toISOString().slice(0, 19).replace('T', ' '),
        mode || 'Online',
      ]);

      // Update candidate application status accordingly
      let newStatus = 'hr_interview';
      if (roundType === 'hr') {
        newStatus = 'hr_interview';
      } else if (roundType === 'department') {
        newStatus = 'dept_interview';
      } else if (roundType === 'final') {
        newStatus = 'final_screening';
      }
      await query(
        'UPDATE candidates SET application_status = ?, department_id = COALESCE(?, department_id), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newStatus, targetDeptId, Number(candidate_id)]
      );

      // Fetch candidate full details for email dispatch
      let emailDispatched = false;
      try {
        const candidateDetails = await query<any[]>(
          `SELECT c.id, c.full_name, c.email, c.candidate_code, d.name AS department_name, p.title AS position_title, u.full_name AS interviewer_name
           FROM candidates c
           LEFT JOIN departments d ON c.department_id = d.id
           LEFT JOIN positions p ON c.position_id = p.id
           LEFT JOIN users u ON u.id = ?
           WHERE c.id = ? LIMIT 1`,
          [interviewerId, Number(candidate_id)]
        );

        if (candidateDetails && candidateDetails.length > 0 && candidateDetails[0].email) {
          const cand = candidateDetails[0];

          let roundTitle = 'Technical Interview (Round 2)';
          if (roundType === 'hr') roundTitle = 'HR Interview (Round 1)';
          else if (roundType === 'final') roundTitle = 'Practical Assessment (Round 3)';

          let readableDateTime = formattedDate || 'As scheduled';
          if (scheduled_at) {
            const parsed = new Date(scheduled_at);
            if (!isNaN(parsed.getTime())) {
              readableDateTime = parsed.toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              });
            }
          }

          const invitation = generateInterviewInvitationEmail({
            candidateName: cand.full_name,
            candidateCode: cand.candidate_code,
            candidateEmail: cand.email,
            roundType,
            roundTitle,
            scheduledAt: readableDateTime,
            mode: mode || 'Online',
            departmentName: cand.department_name || department_name,
            positionTitle: cand.position_title,
            interviewerName: cand.interviewer_name,
          });

          const mailResult = await sendEmail({
            to: cand.email,
            subject: invitation.subject,
            templateType: 'interview_scheduled',
            contentHtml: invitation.html,
            contentText: invitation.text,
          });

          emailDispatched = mailResult.success;
          console.log(`[Interview Schedule] Sent ${mode} interview invitation to candidate email (${cand.email}) - Result: ${mailResult.status}`);
        }
      } catch (err) {
        console.error('[Interview Schedule] Email dispatch error:', err);
      }

      return NextResponse.json({
        success: true,
        data: { id: result.insertId, emailDispatched },
        message: `${roundType === 'department' ? 'Technical' : 'Practical'} round scheduled successfully.${emailDispatched ? ' Invitation email dispatched to candidate.' : ''}`,
      });
    }

    // 1. Save single question answer
    if (action === 'save_answer') {
      const { candidate_id, round, question_id, score, answer_text, remarks, duration_seconds, recording_url } = body;

      const session = await ensureInterviewSession(candidate_id, round, user?.id || null);

      await saveInterviewAnswer({
        interview_id: session.id,
        question_id: Number(question_id),
        score: Number(score) || 0,
        answer_text,
        interviewer_remarks: remarks,
        duration_seconds: duration_seconds ? Number(duration_seconds) : 0,
        recording_url,
      });

      return NextResponse.json({ success: true, message: 'Question evaluation saved.' });
    }

    // 2. Complete entire interview round OR direct score recording by HR / Manager
    if (action === 'complete_round' || action === 'record_score') {
      const {
        candidate_id,
        round,
        recommendation = 'recommended',
        interviewer_summary,
        score,
        total_score,
        max_score,
        answers,
      } = body;

      if (!candidate_id || !round) {
        return NextResponse.json(
          { success: false, error: 'Candidate ID and round are required.' },
          { status: 400 }
        );
      }

      // Map round if needed ('tech' -> 'department', 'practical' -> 'final')
      let normalizedRound: InterviewRoundType = 'hr';
      const r = String(round).toLowerCase();
      if (r === 'tech' || r === 'technical' || r === 'department') {
        normalizedRound = 'department';
      } else if (r === 'practical' || r === 'final') {
        normalizedRound = 'final';
      }

      const assignedScore =
        score !== undefined && score !== null
          ? Number(score)
          : total_score !== undefined && total_score !== null
          ? Number(total_score)
          : undefined;

      const completed = await completeInterviewRound({
        candidateId: Number(candidate_id),
        round: normalizedRound,
        interviewerId: user?.id || null,
        recommendation: (recommendation as any) || 'recommended',
        interviewerSummary:
          interviewer_summary ||
          `Evaluated ${normalizedRound} round${assignedScore !== undefined ? ` with score ${assignedScore}` : ''}.`,
        totalScore: assignedScore,
        maxScore: max_score ? Number(max_score) : undefined,
        answers: Array.isArray(answers) ? answers : [],
      });

      return NextResponse.json({
        success: true,
        data: completed,
        message: `${normalizedRound.toUpperCase()} round score recorded successfully.`,
      });
    }

    // 2.5 Complete HR Round and Advance Candidate to Second Round (Technical / Department Round)
    if (action === 'complete_and_advance') {
      const {
        candidate_id,
        round = 'hr',
        recommendation = 'recommended',
        interviewer_summary,
        answers,
        second_round,
      } = body;

      if (!candidate_id) {
        return NextResponse.json(
          { success: false, error: 'Candidate ID is required.' },
          { status: 400 }
        );
      }

      // 1. Complete Round 1 (HR Round)
      await completeInterviewRound({
        candidateId: Number(candidate_id),
        round: (round || 'hr') as InterviewRoundType,
        interviewerId: user?.id || null,
        recommendation: (recommendation as any) || 'recommended',
        interviewerSummary: interviewer_summary || 'Passed HR round. Recommended for Second Round.',
        answers: Array.isArray(answers) ? answers : [],
      });

      // 2. Resolve department and manager for Second Round
      let targetDeptId = second_round?.department_id ? Number(second_round.department_id) : null;
      if (!targetDeptId && second_round?.department_name) {
        const deptRows = await query<any[]>('SELECT id FROM departments WHERE name LIKE ? LIMIT 1', [
          `%${second_round.department_name}%`,
        ]);
        if (deptRows && deptRows.length > 0) targetDeptId = deptRows[0].id;
      }

      let interviewerId: number | null = null;
      if (targetDeptId) {
        const mgrRows = await query<any[]>('SELECT id FROM users WHERE department_id = ? LIMIT 1', [
          targetDeptId,
        ]);
        if (mgrRows && mgrRows.length > 0) interviewerId = mgrRows[0].id;
      }
      if (!interviewerId) {
        interviewerId = user?.id || 2;
      }

      let formattedDate: string | null = null;
      if (second_round?.scheduled_at) {
        const d = new Date(second_round.scheduled_at);
        if (!isNaN(d.getTime())) {
          formattedDate = d.toISOString().slice(0, 19).replace('T', ' ');
        } else {
          formattedDate = String(second_round.scheduled_at).replace('T', ' ');
        }
      }

      const insertSql = `
        INSERT INTO interviews (candidate_id, round_type, interviewer_id, scheduled_at, status, mode, interviewer_summary)
        VALUES (?, 'department', ?, ?, 'scheduled', ?, ?)
        ON DUPLICATE KEY UPDATE
          interviewer_id = VALUES(interviewer_id),
          scheduled_at = VALUES(scheduled_at),
          mode = VALUES(mode),
          interviewer_summary = VALUES(interviewer_summary),
          status = 'scheduled'
      `;

      await query(insertSql, [
        Number(candidate_id),
        interviewerId,
        formattedDate || new Date(Date.now() + 86400000).toISOString().slice(0, 19).replace('T', ' '),
        second_round?.mode || 'Online',
        second_round?.notes || null,
      ]);

      // 3. Update candidate with target department and dept_interview status
      await query(
        'UPDATE candidates SET application_status = "dept_interview", department_id = COALESCE(?, department_id), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [targetDeptId, Number(candidate_id)]
      );

      return NextResponse.json({
        success: true,
        message: 'HR Round submitted and Second Round scheduled successfully.',
      });
    }

    // 3. Save Final Hiring Committee Decision
    if (action === 'decision') {
      if (user && !canMakeHiringDecision(user)) {
        return NextResponse.json({ success: false, error: 'Unauthorized to make hiring decisions.' }, { status: 403 });
      }

      const { candidate_id, decision, decision_notes, offered_salary, offered_position_id, joining_date } = body;

      const recordedDecision = await saveHiringDecision({
        candidateId: Number(candidate_id),
        decision,
        decisionNotes: decision_notes,
        offeredSalary: offered_salary,
        offeredPositionId: offered_position_id ? Number(offered_position_id) : undefined,
        joiningDate: joining_date,
        decidedBy: user?.id || null,
      });

      return NextResponse.json({
        success: true,
        data: recordedDecision,
        email_sent: (recordedDecision as any)?.emailResult?.success || false,
        email_result: (recordedDecision as any)?.emailResult,
        message: 'Hiring decision persisted successfully.',
      });
    }

    // 4. Send or resend 3-rounds marks summary email to candidate's registered email
    if (action === 'send_marks_email') {
      const { candidate_id, force = true } = body;
      if (!candidate_id) {
        return NextResponse.json({ success: false, error: 'Candidate ID is required.' }, { status: 400 });
      }

      const res = await sendThreeRoundsMarksEmail(Number(candidate_id), Boolean(force));
      if (!res.success && !res.skipped) {
        return NextResponse.json(
          { success: false, error: res.error || 'Failed to dispatch 3-rounds marks email via SMTP.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: res,
        message: res.skipped
          ? (res.error || 'Marks email was previously sent.')
          : '3-Rounds marks email successfully dispatched to the candidate registered email.',
      });
    }

    // 5. Send or resend official Selection or Rejection email via SMTP
    if (action === 'send_decision_email') {
      const { candidate_id, decision, decision_notes } = body;
      if (!candidate_id) {
        return NextResponse.json({ success: false, error: 'Candidate ID is required.' }, { status: 400 });
      }
      if (decision !== 'selected' && decision !== 'rejected') {
        return NextResponse.json(
          { success: false, error: 'Decision must be "selected" or "rejected" to send an email.' },
          { status: 400 }
        );
      }

      const res = await sendHiringDecisionEmail(Number(candidate_id), decision, decision_notes);
      if (!res.success) {
        return NextResponse.json(
          { success: false, error: res.error || 'Failed to dispatch hiring decision email via SMTP.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: res,
        message: `${decision === 'selected' ? 'Selection' : 'Rejection'} email successfully dispatched to candidate.`,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });
  } catch (err: unknown) {
    const e = err as Error;
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
