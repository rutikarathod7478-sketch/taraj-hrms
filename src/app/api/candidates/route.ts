import { NextRequest, NextResponse } from 'next/server';
import {
  getCandidates,
  registerCandidate,
  getDashboardMetrics,
  getDepartmentCounts,
} from '@/features/candidates/candidate.service';
import { query } from '@/lib/db/mysql';
import { saveUploadedFile } from '@/lib/storage/file-storage';
import { RowDataPacket } from 'mysql2/promise';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // 1. Get Positions by Department
    if (action === 'positions') {
      const deptId = searchParams.get('department_id');
      let sql = 'SELECT * FROM positions WHERE is_active = 1';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const params: any[] = [];
      if (deptId && Number(deptId) > 0) {
        sql += ' AND department_id = ?';
        params.push(Number(deptId));
      }
      sql += ' ORDER BY title ASC';
      const positions = await query<RowDataPacket[]>(sql, params);
      return NextResponse.json({ success: true, data: positions });
    }

    // 2. Get Dashboard Metrics
    if (action === 'metrics') {
      const metrics = await getDashboardMetrics();
      const departmentCounts = await getDepartmentCounts();
      return NextResponse.json({ success: true, data: { metrics, departmentCounts } });
    }

    // 3. Check application status by candidate_code or email
    if (action === 'status') {
      const code = searchParams.get('code');
      const email = searchParams.get('email');
      if (!code && !email) {
        return NextResponse.json({ success: false, error: 'Provide code or email' }, { status: 400 });
      }

      const sql = `
        SELECT 
          c.id, c.candidate_code, c.full_name, c.email, c.application_status,
          c.round_1_score, c.round_2_score, c.round_3_score, c.overall_percentage,
          d.name AS department_name, p.title AS position_title, c.registered_at
        FROM candidates c
        LEFT JOIN departments d ON c.department_id = d.id
        LEFT JOIN positions p ON c.position_id = p.id
        LEFT JOIN candidate_evaluations ce ON c.id = ce.candidate_id
        WHERE (c.candidate_code = ? OR c.email = ?) AND c.is_archived = 0
        LIMIT 1
      `;
      const rows = await query<RowDataPacket[]>(sql, [code || '', email || '']);
      if (rows.length === 0) {
        return NextResponse.json({ success: false, error: 'Candidate application not found.' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: rows[0] });
    }

    // Standard list candidates
    const search = searchParams.get('search') || undefined;
    const departmentId = searchParams.get('department_id') ? Number(searchParams.get('department_id')) : undefined;
    const status = searchParams.get('status') || undefined;
    const candidateType = searchParams.get('candidate_type') || undefined;
    const pipelineOnly = searchParams.get('pipeline_only') === 'true';
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 10;

    const result = await getCandidates({
      search,
      departmentId,
      status,
      candidateType,
      pipeline_only: pipelineOnly,
      page,
      limit,
    });

    // Compute live counts per stage for dashboard tabs
    const statsRows = await query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_all,
        SUM(CASE WHEN 
          c.application_status NOT IN ('rejected', 'on_hold') AND NOT (c.application_status LIKE '%reject%')
          AND ce.round_1_score IS NULL 
          AND NOT EXISTS (
            SELECT 1 FROM interviews i 
            WHERE i.candidate_id = c.id AND i.round_type = 'hr' AND (i.status = 'completed' OR i.total_score IS NOT NULL)
          )
          THEN 1 ELSE 0 END) as register_hr_count,

        SUM(CASE WHEN 
          c.application_status NOT IN ('rejected', 'on_hold') AND NOT (c.application_status LIKE '%reject%')
          AND (ce.round_1_score IS NOT NULL OR EXISTS (
            SELECT 1 FROM interviews i 
            WHERE i.candidate_id = c.id AND i.round_type = 'hr' AND (i.status = 'completed' OR i.total_score IS NOT NULL)
          ))
          AND
          (ce.round_2_score IS NULL AND NOT EXISTS (
            SELECT 1 FROM interviews i 
            WHERE i.candidate_id = c.id AND i.round_type = 'department' AND (i.status = 'completed' OR i.total_score IS NOT NULL)
          ))
          THEN 1 ELSE 0 END) as tech_count,

        SUM(CASE WHEN 
          c.application_status NOT IN ('rejected', 'on_hold') AND NOT (c.application_status LIKE '%reject%')
          AND (ce.round_1_score IS NOT NULL OR EXISTS (
            SELECT 1 FROM interviews i 
            WHERE i.candidate_id = c.id AND i.round_type = 'hr' AND (i.status = 'completed' OR i.total_score IS NOT NULL)
          ))
          AND
          (ce.round_2_score IS NOT NULL OR EXISTS (
            SELECT 1 FROM interviews i 
            WHERE i.candidate_id = c.id AND i.round_type = 'department' AND (i.status = 'completed' OR i.total_score IS NOT NULL)
          ))
          AND
          (ce.round_3_score IS NULL AND NOT EXISTS (
            SELECT 1 FROM interviews i 
            WHERE i.candidate_id = c.id AND i.round_type = 'final' AND (i.status = 'completed' OR i.total_score IS NOT NULL)
          ))
          THEN 1 ELSE 0 END) as practical_count,

        SUM(CASE WHEN c.application_status IN ('rejected', 'on_hold') OR c.application_status LIKE '%reject%' THEN 1 ELSE 0 END) as rejected_count
      FROM candidates c
      LEFT JOIN candidate_evaluations ce ON c.id = ce.candidate_id
      WHERE c.is_archived = 0
        AND c.application_status NOT IN ('joined', 'offered', 'selected')
        AND (
          (c.application_status IN ('rejected', 'on_hold') OR c.application_status LIKE '%reject%')
          OR NOT (
            c.application_status = 'evaluation'
            OR (
              (ce.round_1_score IS NOT NULL OR EXISTS (SELECT 1 FROM interviews i WHERE i.candidate_id = c.id AND i.round_type = 'hr' AND (i.status = 'completed' OR i.total_score IS NOT NULL)))
              AND
              (ce.round_2_score IS NOT NULL OR EXISTS (SELECT 1 FROM interviews i WHERE i.candidate_id = c.id AND i.round_type = 'department' AND (i.status = 'completed' OR i.total_score IS NOT NULL)))
              AND
              (ce.round_3_score IS NOT NULL OR EXISTS (SELECT 1 FROM interviews i WHERE i.candidate_id = c.id AND i.round_type = 'final' AND (i.status = 'completed' OR i.total_score IS NOT NULL)))
            )
          )
        )
    `);

    const stats = (statsRows as any)?.[0] || {};
    const stageCounts = {
      all: Number(stats.total_all) || 0,
      register_hr: Number(stats.register_hr_count) || 0,
      tech: Number(stats.tech_count) || 0,
      practical: Number(stats.practical_count) || 0,
      selected: 0,
      rejected: Number(stats.rejected_count) || 0,
      // Fallback aliases for backward compatibility
      new_registrations: Number(stats.register_hr_count) || 0,
      hr_round: Number(stats.register_hr_count) || 0,
      technical_round: Number(stats.tech_count) || 0,
      practical_round: Number(stats.practical_count) || 0,
      on_hold: Number(stats.rejected_count) || 0,
    };

    return NextResponse.json({
      success: true,
      data: result.candidates,
      stageCounts,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        limit,
      },
    });
  } catch (err: unknown) {
    const e = err as Error;
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Handle CV / Resume file upload
    if (action === 'upload_cv') {
      const formData = await request.formData();
      const file = formData.get('file');

      if (!file || !(file instanceof Blob)) {
        return NextResponse.json({ success: false, error: 'Valid file is required.' }, { status: 400 });
      }

      const stored = await saveUploadedFile('resumes', file);
      return NextResponse.json({
        success: true,
        data: stored,
        filePath: stored.filePath,
      });
    }

    // Register Candidate
    const body = await request.json();

    if (!body.full_name || !body.email || !body.phone || !body.department_id || !body.position_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required candidate information.' },
        { status: 400 }
      );
    }

    const candidate = await registerCandidate({
      full_name: body.full_name,
      email: body.email,
      phone: body.phone,
      date_of_birth: body.date_of_birth,
      address: body.address,
      candidate_type: body.candidate_type || 'Experienced',
      department_id: Number(body.department_id),
      position_id: Number(body.position_id),
      qualification: body.qualification,
      college_or_institution: body.college_or_institution,
      graduation_year: body.graduation_year ? Number(body.graduation_year) : undefined,
      experience_years: body.experience_years !== undefined ? Number(body.experience_years) : 0,
      current_employer: body.current_employer,
      current_ctc: body.current_ctc,
      expected_ctc: body.expected_ctc,
      notice_period: body.notice_period ? Number(body.notice_period) : 0,
      notes: body.notes,
      registration_source: body.registration_source || 'web_portal',
      resume_file_path: body.resume_file_path,
      resume_original_name: body.resume_original_name,
    });

    return NextResponse.json({
      success: true,
      data: candidate,
      message: 'Candidate registration successful.',
    });
  } catch (err: unknown) {
    const e = err as Error;
    const msg = e.message || 'Candidate registration failed.';
    const isConflict =
      msg.toLowerCase().includes('already registered') ||
      msg.toLowerCase().includes('duplicate');
    return NextResponse.json(
      { success: false, error: msg, message: msg },
      { status: isConflict ? 409 : 500 }
    );
  }
}
