import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';
import { getInterviewAnswers } from '@/features/interviews/interview.service';
import { RowDataPacket } from 'mysql2/promise';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const interviewId = Number(id);

    const [interviewRows] = await query<RowDataPacket[]>(
      `SELECT i.*, c.full_name AS candidate_name, c.candidate_code, u.full_name AS interviewer_name
       FROM interviews i
       LEFT JOIN candidates c ON i.candidate_id = c.id
       LEFT JOIN users u ON i.interviewer_id = u.id
       WHERE i.id = ?`,
      [interviewId]
    );

    let targetInterview = interviewRows;

    // If not found by interview ID, check if id is a candidate ID
    if (!targetInterview) {
      const [candInterview] = await query<RowDataPacket[]>(
        `SELECT i.*, c.full_name AS candidate_name, c.candidate_code, u.full_name AS interviewer_name
         FROM interviews i
         LEFT JOIN candidates c ON i.candidate_id = c.id
         LEFT JOIN users u ON i.interviewer_id = u.id
         WHERE i.candidate_id = ? AND i.round_type = 'hr'
         ORDER BY i.id DESC LIMIT 1`,
        [interviewId]
      );
      targetInterview = candInterview;
    }

    if (!targetInterview) {
      // Check if candidate exists
      const [candRows] = await query<RowDataPacket[]>(
        `SELECT id, full_name AS candidate_name, candidate_code FROM candidates WHERE id = ?`,
        [interviewId]
      );
      if (candRows) {
        return NextResponse.json({
          success: true,
          data: {
            interview: null,
            candidate_id: candRows.id,
            candidate_name: candRows.candidate_name,
            candidate_code: candRows.candidate_code,
            answers: [],
          },
        });
      }

      return NextResponse.json({ success: false, error: 'Interview session or candidate not found.' }, { status: 404 });
    }

    const answers = await getInterviewAnswers(targetInterview.id);

    return NextResponse.json({
      success: true,
      data: {
        interview: targetInterview,
        answers,
      },
    });
  } catch (err: unknown) {
    const e = err as Error;
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
