import { NextRequest, NextResponse } from 'next/server';
import { getQuestionsForCandidate } from '@/features/interviews/interview.service';
import { query, execute } from '@/lib/db/mysql';
import { InterviewRoundType } from '@/types/question';
import { RowDataPacket } from 'mysql2/promise';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidate_id');
    const roundParam = (searchParams.get('round') || '').toLowerCase();

    if (candidateId) {
      const normalizedRound: InterviewRoundType =
        roundParam === 'tech' || roundParam === 'technical' || roundParam === 'department'
          ? 'department'
          : roundParam === 'practical' || roundParam === 'final'
          ? 'final'
          : 'hr';
      const questions = await getQuestionsForCandidate(Number(candidateId), normalizedRound);
      return NextResponse.json({ success: true, data: questions });
    }

    // Question Bank search
    const deptId = searchParams.get('department_id');
    let sql = `
      SELECT q.*, d.name AS department_name, p.title AS position_title,
             c.full_name AS candidate_name, c.candidate_code
      FROM interview_questions q
      LEFT JOIN departments d ON q.department_id = d.id
      LEFT JOIN positions p ON q.position_id = p.id
      LEFT JOIN candidates c ON q.candidate_id = c.id
      WHERE q.is_active = 1
    `;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any[] = [];

    if (deptId && Number(deptId) > 0) {
      sql += ' AND (q.department_id = ? OR q.department_id IS NULL)';
      params.push(Number(deptId));
    }
    if (roundParam && roundParam !== 'all') {
      const dbRound = roundParam === 'tech' ? 'department' : roundParam === 'practical' ? 'final' : roundParam;
      sql += ' AND q.round_type = ?';
      params.push(dbRound);
    }
    if (roundParam === 'hr') {
      sql += ' ORDER BY q.id ASC LIMIT 200';
    } else {
      sql += ' ORDER BY q.id ASC LIMIT 200';
    }

    const rows = await query<RowDataPacket[]>(sql, params);
    return NextResponse.json({ success: true, data: rows });
  } catch (err: unknown) {
    const e = err as Error;
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      department_id,
      position_id,
      candidate_id,
      round_type,
      question_type,
      question_text,
      options,
      correct_answer,
      expected_answer_guidance,
      max_score,
    } = body;

    if (!question_text || !round_type) {
      return NextResponse.json({ success: false, error: 'Question text and round type are required.' }, { status: 400 });
    }

    const normalizedRound =
      round_type === 'tech' || round_type === 'technical'
        ? 'department'
        : round_type === 'practical'
        ? 'final'
        : round_type;

    const optionsJson = options ? (typeof options === 'string' ? options : JSON.stringify(options)) : null;

    const sql = `
      INSERT INTO interview_questions (
        department_id, position_id, candidate_id, round_type, question_type,
        question_text, options, correct_answer, expected_answer_guidance,
        max_score, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `;

    const result = await execute(sql, [
      department_id ? Number(department_id) : null,
      position_id ? Number(position_id) : null,
      candidate_id ? Number(candidate_id) : null,
      normalizedRound,
      question_type || 'technical',
      question_text.trim(),
      optionsJson,
      correct_answer ? String(correct_answer).trim() : null,
      expected_answer_guidance || null,
      max_score ? Number(max_score) : 10,
    ]);

    const createdQuestion = {
      id: result.insertId,
      department_id: department_id ? Number(department_id) : null,
      position_id: position_id ? Number(position_id) : null,
      candidate_id: candidate_id ? Number(candidate_id) : null,
      round_type: normalizedRound,
      round: normalizedRound,
      question_type: question_type || 'technical',
      question_text: question_text.trim(),
      options: options || null,
      correct_answer: correct_answer ? String(correct_answer).trim() : null,
      expected_answer_guidance: expected_answer_guidance || null,
      max_score: max_score ? Number(max_score) : 10,
      time_limit_seconds: 180,
      weight: 1,
      is_active: true,
      category_id: null,
    };

    return NextResponse.json({
      success: true,
      message: 'Question added successfully to question bank.',
      data: createdQuestion,
    });
  } catch (err: unknown) {
    const e = err as Error;
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
