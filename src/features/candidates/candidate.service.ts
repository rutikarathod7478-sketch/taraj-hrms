import { query, execute } from '@/lib/db/mysql';
import { withTransaction } from '@/lib/db/transaction';
import { Candidate, CandidateRegistrationInput, CandidateStatus } from '@/types/candidate';
import { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';
import { generateCandidateCode } from '@/lib/utils';
import {
  sendEmail,
  generateCandidateEmailTemplate,
  generateHrRegistrationAlertTemplate,
} from '@/lib/email/mailer';

export interface CandidateQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: number;
  status?: string;
  candidateType?: string;
  pipeline_only?: boolean;
}

export interface PaginatedCandidates {
  candidates: Candidate[];
  total: number;
  page: number;
  totalPages: number;
}

export interface DashboardMetrics {
  totalRegistered: number;
  awaitingInterview: number;
  inRound1: number;
  inRound2: number;
  inRound3: number;
  evaluated: number;
  selected: number;
  rejected: number;
  joiningPending: number;
  onboardedEmployees: number;
}

export interface DepartmentCandidateCount {
  id: number;
  name: string;
  code: string;
  candidateCount: number;
}

/**
 * Retrieve paginated and filtered list of candidates
 */
export async function getCandidates(params: CandidateQueryParams = {}): Promise<PaginatedCandidates> {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(params.limit) || 10));
  const offset = (page - 1) * limit;

  const conditions: string[] = ['c.is_archived = 0'];

  // Exclude joined, offered, and selected candidates
  conditions.push("c.application_status NOT IN ('joined', 'offered', 'selected')");

  // Exclude active candidates who have completed all three rounds ("all done") - they move to /hr/decisions
  // Note: Rejected or on-hold candidates must NEVER be excluded, because they belong in the Rejected section!
  conditions.push(`(
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
  )`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queryParams: any[] = [];

  if (params.search && params.search.trim() !== '') {
    const s = `%${params.search.trim()}%`;
    conditions.push(
      '(c.full_name LIKE ? OR c.candidate_code LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)'
    );
    queryParams.push(s, s, s, s);
  }

  if (params.departmentId && Number(params.departmentId) > 0) {
    conditions.push('c.department_id = ?');
    queryParams.push(Number(params.departmentId));
  }

  if (params.status && params.status !== 'all') {
    const st = params.status.toLowerCase();
    if (st === 'register_hr' || st === 'new_registrations' || st === 'registered' || st === 'hr_round' || st === 'hr_interview') {
      // Step 1: HR round is pending (HR round is NOT completed)
      conditions.push(`(
        c.application_status NOT IN ('rejected', 'on_hold') AND NOT (c.application_status LIKE '%reject%')
        AND ce.round_1_score IS NULL 
        AND NOT EXISTS (
          SELECT 1 FROM interviews i 
          WHERE i.candidate_id = c.id AND i.round_type = 'hr' AND (i.status = 'completed' OR i.total_score IS NOT NULL)
        )
      )`);
    } else if (st === 'tech' || st === 'technical_round' || st === 'dept_interview' || st === 'dept_round') {
      // Step 2: HR round IS completed, but Technical round is NOT completed
      conditions.push(`(
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
      )`);
    } else if (st === 'practical' || st === 'practical_round' || st === 'final_screening') {
      // Step 3: BOTH HR round AND Technical round ARE completed, but Practical round is NOT completed
      conditions.push(`(
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
      )`);
    } else if (st === 'rejected' || st === 'on_hold') {
      conditions.push('(c.application_status IN ("rejected", "on_hold") OR c.application_status LIKE "%reject%")');
    } else {
      conditions.push('c.application_status = ?');
      queryParams.push(params.status);
    }
  }

  if (params.candidateType && params.candidateType !== 'all') {
    conditions.push('c.candidate_type = ?');
    queryParams.push(params.candidateType);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countSql = `
    SELECT COUNT(*) AS total 
    FROM candidates c 
    LEFT JOIN candidate_evaluations ce ON c.id = ce.candidate_id 
    ${whereClause}
  `;
  const countRows = await query<RowDataPacket[]>(countSql, queryParams);
  const total = Number(countRows[0]?.total) || 0;

  // Get candidates with department, position, latest evaluation summaries, and live round statuses
  const listSql = `
    SELECT 
      c.*,
      c.application_status AS status,
      d.name AS department_name,
      d.code AS department_code,
      p.title AS position_title,
      ce.overall_percentage,
      ce.evaluation_status,
      ce.round_1_score,
      ce.round_1_max_score,
      ce.round_2_score,
      ce.round_2_max_score,
      ce.round_3_score,
      ce.round_3_max_score,
      (SELECT status FROM interviews i WHERE i.candidate_id = c.id AND i.round_type = 'hr' AND i.status <> 'cancelled' ORDER BY i.id DESC LIMIT 1) AS hr_interview_status,
      (SELECT total_score FROM interviews i WHERE i.candidate_id = c.id AND i.round_type = 'hr' AND i.status <> 'cancelled' ORDER BY i.id DESC LIMIT 1) AS hr_interview_score,
      (SELECT maximum_score FROM interviews i WHERE i.candidate_id = c.id AND i.round_type = 'hr' AND i.status <> 'cancelled' ORDER BY i.id DESC LIMIT 1) AS hr_interview_max_score,

      (SELECT status FROM interviews i WHERE i.candidate_id = c.id AND i.round_type = 'department' AND i.status <> 'cancelled' ORDER BY i.id DESC LIMIT 1) AS tech_interview_status,
      (SELECT total_score FROM interviews i WHERE i.candidate_id = c.id AND i.round_type = 'department' AND i.status <> 'cancelled' ORDER BY i.id DESC LIMIT 1) AS tech_interview_score,
      (SELECT maximum_score FROM interviews i WHERE i.candidate_id = c.id AND i.round_type = 'department' AND i.status <> 'cancelled' ORDER BY i.id DESC LIMIT 1) AS tech_interview_max_score,

      (SELECT status FROM interviews i WHERE i.candidate_id = c.id AND i.round_type = 'final' AND i.status <> 'cancelled' ORDER BY i.id DESC LIMIT 1) AS practical_interview_status,
      (SELECT total_score FROM interviews i WHERE i.candidate_id = c.id AND i.round_type = 'final' AND i.status <> 'cancelled' ORDER BY i.id DESC LIMIT 1) AS practical_interview_score,
      (SELECT maximum_score FROM interviews i WHERE i.candidate_id = c.id AND i.round_type = 'final' AND i.status <> 'cancelled' ORDER BY i.id DESC LIMIT 1) AS practical_interview_max_score,

      (SELECT COUNT(*) FROM interviews i WHERE i.candidate_id = c.id) AS interview_count
    FROM candidates c
    LEFT JOIN departments d ON c.department_id = d.id
    LEFT JOIN positions p ON c.position_id = p.id
    LEFT JOIN candidate_evaluations ce ON c.id = ce.candidate_id
    ${whereClause}
    ORDER BY c.id ASC
    LIMIT ? OFFSET ?
  `;

  const rows = await query<(Candidate & RowDataPacket)[]>(listSql, [...queryParams, limit, offset]);

  const mappedCandidates = rows.map((r: any) => {
    // Strict sequential interview round tracking
    const hrDone = Boolean(
      r.round_1_score !== null ||
      (r.hr_interview_status === 'completed' || r.hr_interview_score !== null)
    );
    const techDone = Boolean(
      hrDone && (
        r.round_2_score !== null ||
        (r.tech_interview_status === 'completed' || r.tech_interview_score !== null)
      )
    );
    const practicalDone = Boolean(
      hrDone && techDone && (
        r.round_3_score !== null ||
        (r.practical_interview_status === 'completed' || r.practical_interview_score !== null)
      )
    );

    let hrScoreFormatted: string | null = null;
    if (r.round_1_score !== null && r.round_1_max_score && Number(r.round_1_max_score) > 0) {
      hrScoreFormatted = ((Number(r.round_1_score) / Number(r.round_1_max_score)) * 10).toFixed(1);
    } else if (r.hr_interview_score !== null && r.hr_interview_max_score && Number(r.hr_interview_max_score) > 0) {
      hrScoreFormatted = ((Number(r.hr_interview_score) / Number(r.hr_interview_max_score)) * 10).toFixed(1);
    }

    let techScoreFormatted: string | null = null;
    if (r.round_2_score !== null && r.round_2_max_score && Number(r.round_2_max_score) > 0) {
      techScoreFormatted = ((Number(r.round_2_score) / Number(r.round_2_max_score)) * 10).toFixed(1);
    } else if (r.tech_interview_score !== null && r.tech_interview_max_score && Number(r.tech_interview_max_score) > 0) {
      techScoreFormatted = ((Number(r.tech_interview_score) / Number(r.tech_interview_max_score)) * 10).toFixed(1);
    }

    let practicalScoreFormatted: string | null = null;
    if (r.round_3_score !== null && r.round_3_max_score && Number(r.round_3_max_score) > 0) {
      practicalScoreFormatted = ((Number(r.round_3_score) / Number(r.round_3_max_score)) * 10).toFixed(1);
    } else if (r.practical_interview_score !== null && r.practical_interview_max_score && Number(r.practical_interview_max_score) > 0) {
      practicalScoreFormatted = ((Number(r.practical_interview_score) / Number(r.practical_interview_max_score)) * 10).toFixed(1);
    }

    let overallScoreFormatted = '—';
    if (r.overall_percentage !== null && r.overall_percentage !== undefined && Number(r.overall_percentage) > 0) {
      overallScoreFormatted = (Number(r.overall_percentage) / 10).toFixed(1);
    } else {
      const scores = [hrScoreFormatted, techScoreFormatted, practicalScoreFormatted].filter(Boolean).map(Number);
      if (scores.length > 0) {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        overallScoreFormatted = avg.toFixed(1);
      }
    }

    // Remaining rounds ("baki rounds")
    const remainingRounds: string[] = [];
    if (!hrDone) remainingRounds.push('HR Round');
    if (!techDone) remainingRounds.push('Technical Round');
    if (!practicalDone) remainingRounds.push('Practical Round');

    return {
      ...r,
      hr_done: hrDone,
      tech_done: techDone,
      practical_done: practicalDone,
      hr_score_formatted: hrScoreFormatted,
      tech_score_formatted: techScoreFormatted,
      practical_score_formatted: practicalScoreFormatted,
      overall_score_formatted: overallScoreFormatted,
      remaining_rounds: remainingRounds,
    };
  });

  return {
    candidates: mappedCandidates,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

/**
 * Retrieve candidate details by ID
 */
export async function getCandidateById(id: number): Promise<Candidate | null> {
  const sql = `
    SELECT 
      c.*,
      c.application_status AS status,
      d.name AS department_name,
      d.code AS department_code,
      p.title AS position_title,
      ce.overall_percentage,
      ce.evaluation_status,
      ce.round_1_score,
      ce.round_1_max_score,
      ce.round_2_score,
      ce.round_2_max_score,
      ce.round_3_score,
      ce.round_3_max_score,
      i1.id AS round_1_interview_id,
      i1.status AS round_1_interview_status,
      i1.completed_at AS round_1_completed_at,
      i1.interviewer_summary AS round_1_summary,
      u1.full_name AS round_1_interviewer_name
    FROM candidates c
    LEFT JOIN departments d ON c.department_id = d.id
    LEFT JOIN positions p ON c.position_id = p.id
    LEFT JOIN candidate_evaluations ce ON c.id = ce.candidate_id
    LEFT JOIN interviews i1 ON c.id = i1.candidate_id AND i1.round_type = 'hr'
    LEFT JOIN users u1 ON i1.interviewer_id = u1.id
    WHERE c.id = ? AND c.is_archived = 0
    LIMIT 1
  `;
  const rows = await query<(Candidate & RowDataPacket)[]>(sql, [id]);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Check if a candidate already exists with the given email or phone
 */
export async function findDuplicateCandidate(email: string, phone: string): Promise<Candidate | null> {
  const sql = `
    SELECT id, candidate_code, full_name, email, phone, application_status
    FROM candidates
    WHERE (email = ? OR phone = ?) AND is_archived = 0
    LIMIT 1
  `;
  const rows = await query<(Candidate & RowDataPacket)[]>(sql, [email.trim(), phone.trim()]);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Register candidate into MySQL within a transaction
 */
export async function registerCandidate(input: CandidateRegistrationInput): Promise<Candidate> {
  const duplicate = await findDuplicateCandidate(input.email, input.phone);
  if (duplicate) {
    throw new Error(
      `A candidate with email "${input.email}" or phone "${input.phone}" is already registered (Candidate Code: ${duplicate.candidate_code}).`
    );
  }

  const candidateCode = generateCandidateCode();
  const qrToken = `TGS-QR-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const result = await withTransaction(async (conn: PoolConnection) => {
    const insertCandidateSql = `
      INSERT INTO candidates (
        candidate_code, full_name, email, phone, date_of_birth, address,
        candidate_type, department_id, position_id, qualification,
        college_or_institution, graduation_year, experience_years,
        current_employer, current_ctc, expected_ctc, notice_period,
        resume_file_path, resume_original_name, application_status,
        registration_source, qr_token, notes
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, 'registered',
        ?, ?, ?
      )
    `;

    const [candRes] = await conn.execute(insertCandidateSql, [
      candidateCode,
      input.full_name.trim(),
      input.email.trim(),
      input.phone.trim(),
      input.date_of_birth || null,
      input.address || null,
      input.candidate_type || 'Experienced',
      input.department_id,
      input.position_id,
      input.qualification || null,
      input.college_or_institution || null,
      input.graduation_year || null,
      input.experience_years !== undefined ? input.experience_years : 0.0,
      input.current_employer || null,
      input.current_ctc || null,
      input.expected_ctc || null,
      input.notice_period || 0,
      input.resume_file_path || null,
      input.resume_original_name || null,
      input.registration_source || 'web_portal',
      qrToken,
      input.notes || null,
    ]);

    const newCandidateId = (candRes as { insertId: number }).insertId;

    if (input.resume_file_path && input.resume_original_name) {
      const docSql = `
        INSERT INTO candidate_documents (
          candidate_id, document_type, original_filename, stored_filename,
          file_path, mime_type, file_size
        ) VALUES (?, 'resume', ?, ?, ?, 'application/pdf', 0)
      `;
      await conn.execute(docSql, [
        newCandidateId,
        input.resume_original_name,
        input.resume_original_name,
        input.resume_file_path,
      ]);
    }

    // Insert into notifications
    const [deptRows] = await conn.execute('SELECT name FROM departments WHERE id = ?', [input.department_id]);
    const deptName = (deptRows as RowDataPacket[])[0]?.name || 'Department';

    const notifSql = `
      INSERT INTO notifications (
        user_id, title, message, type, link, is_read, created_at
      ) VALUES (
        NULL,
        ?,
        ?,
        'candidate_registration',
        ?,
        0,
        CURRENT_TIMESTAMP
      )
    `;
    await conn.execute(notifSql, [
      'New Candidate Registered',
      `${input.full_name.trim()} (${candidateCode}) registered for ${deptName}.`,
      `/hr/candidates/${newCandidateId}`,
    ]);

    return newCandidateId;
  });

  const created = await getCandidateById(result);
  if (!created) {
    throw new Error('Failed to retrieve newly registered candidate from database.');
  }

  // 1. Automatically dispatch registration confirmation email to candidate
  if (created.email) {
    try {
      const emailTemplate = generateCandidateEmailTemplate('registration_confirmation', {
        candidateName: created.full_name,
        positionTitle: created.position_title,
        departmentName: created.department_name,
        candidateCode: created.candidate_code,
      });

      await sendEmail({
        to: created.email,
        subject: emailTemplate.subject,
        templateType: 'registration_confirmation',
        contentHtml: emailTemplate.html,
        contentText: emailTemplate.text,
      });
    } catch (mailErr) {
      console.error('[CandidateService] Failed to send registration confirmation email:', mailErr);
    }
  }

  // 2. Automatically dispatch new candidate alert to HR team (info@tgstechinfo.com)
  const hrRecipient = process.env.HR_NOTIFICATION_EMAIL || process.env.SMTP_USER || 'info@tgstechinfo.com';
  if (hrRecipient) {
    try {
      const hrTemplate = generateHrRegistrationAlertTemplate({
        candidateId: created.id,
        candidateName: created.full_name,
        candidateCode: created.candidate_code,
        candidateEmail: created.email,
        candidatePhone: created.phone,
        departmentName: created.department_name,
        positionTitle: created.position_title,
        experienceYears: created.experience_years,
        qualification: created.qualification || undefined,
        currentEmployer: created.current_employer || undefined,
        candidateType: created.candidate_type,
      });

      await sendEmail({
        to: hrRecipient,
        subject: hrTemplate.subject,
        templateType: 'hr_registration_alert',
        contentHtml: hrTemplate.html,
        contentText: hrTemplate.text,
      });
    } catch (hrErr) {
      console.error('[CandidateService] Failed to send HR registration alert email:', hrErr);
    }
  }

  return created;
}

/**
 * Update candidate status
 */
export async function updateCandidateStatus(candidateId: number, status: CandidateStatus): Promise<void> {
  await execute(
    `UPDATE candidates SET application_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [status, candidateId]
  );
}

/**
 * Update candidate record
 */
export async function updateCandidate(
  candidateId: number,
  data: Partial<CandidateRegistrationInput>
): Promise<Candidate> {
  const fields: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const values: any[] = [];

  if (data.full_name) {
    fields.push('full_name = ?');
    values.push(data.full_name.trim());
  }
  if (data.email) {
    fields.push('email = ?');
    values.push(data.email.trim());
  }
  if (data.phone) {
    fields.push('phone = ?');
    values.push(data.phone.trim());
  }
  if (data.address !== undefined) {
    fields.push('address = ?');
    values.push(data.address);
  }
  if (data.qualification !== undefined) {
    fields.push('qualification = ?');
    values.push(data.qualification);
  }
  if (data.experience_years !== undefined) {
    fields.push('experience_years = ?');
    values.push(data.experience_years);
  }
  if (data.expected_ctc !== undefined) {
    fields.push('expected_ctc = ?');
    values.push(data.expected_ctc);
  }
  if (data.notice_period !== undefined) {
    fields.push('notice_period = ?');
    values.push(data.notice_period);
  }
  if (data.notes !== undefined) {
    fields.push('notes = ?');
    values.push(data.notes);
  }
  if ((data as any).department_id !== undefined && (data as any).department_id !== null) {
    fields.push('department_id = ?');
    values.push(Number((data as any).department_id));
  }
  if ((data as any).position_id !== undefined && (data as any).position_id !== null) {
    fields.push('position_id = ?');
    values.push(Number((data as any).position_id));
  }
  const statusToUpdate = (data as any).application_status || (data as any).status;
  if (statusToUpdate) {
    fields.push('application_status = ?');
    values.push(statusToUpdate);
  }

  if (fields.length > 0) {
    values.push(candidateId);
    await execute(`UPDATE candidates SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);
  }

  const updated = await getCandidateById(candidateId);
  if (!updated) throw new Error('Candidate not found after update.');
  return updated;
}

/**
 * Recruitment pipeline metrics from real MySQL aggregation
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const sql = `
    SELECT
      COUNT(*) AS totalRegistered,
      SUM(CASE WHEN application_status = 'registered' THEN 1 ELSE 0 END) AS awaitingInterview,
      SUM(CASE WHEN application_status = 'hr_interview' THEN 1 ELSE 0 END) AS inRound1,
      SUM(CASE WHEN application_status = 'dept_interview' THEN 1 ELSE 0 END) AS inRound2,
      SUM(CASE WHEN application_status = 'final_screening' THEN 1 ELSE 0 END) AS inRound3,
      SUM(CASE WHEN application_status = 'evaluation' THEN 1 ELSE 0 END) AS evaluated,
      SUM(CASE WHEN application_status = 'offered' THEN 1 ELSE 0 END) AS selected,
      SUM(CASE WHEN application_status = 'rejected' OR application_status LIKE '%reject%' THEN 1 ELSE 0 END) AS rejected,
      SUM(CASE WHEN application_status = 'offered' THEN 1 ELSE 0 END) AS joiningPending,
      SUM(CASE WHEN application_status = 'joined' THEN 1 ELSE 0 END) AS onboardedEmployees
    FROM candidates
    WHERE is_archived = 0
  `;
  const [row] = await query<RowDataPacket[]>(sql);
  return {
    totalRegistered: Number(row?.totalRegistered) || 0,
    awaitingInterview: Number(row?.awaitingInterview) || 0,
    inRound1: Number(row?.inRound1) || 0,
    inRound2: Number(row?.inRound2) || 0,
    inRound3: Number(row?.inRound3) || 0,
    evaluated: Number(row?.evaluated) || 0,
    selected: Number(row?.selected) || 0,
    rejected: Number(row?.rejected) || 0,
    joiningPending: Number(row?.joiningPending) || 0,
    onboardedEmployees: Number(row?.onboardedEmployees) || 0,
  };
}

/**
 * Aggregated candidate counts per department
 */
export async function getDepartmentCounts(): Promise<DepartmentCandidateCount[]> {
  const sql = `
    SELECT 
      d.id, d.name, d.code,
      COUNT(c.id) AS candidateCount
    FROM departments d
    LEFT JOIN candidates c ON d.id = c.department_id AND c.is_archived = 0
    WHERE d.is_active = 1
    GROUP BY d.id, d.name, d.code
    ORDER BY d.id ASC
  `;
  const rows = await query<RowDataPacket[]>(sql);
  return rows.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    code: String(r.code),
    candidateCount: Number(r.candidateCount) || 0,
  }));
}

/**
 * Retrieve the assigned manager for a department
 */
export async function getAssignedDepartmentManager(departmentId: number): Promise<{
  id: number;
  full_name: string;
  email: string;
  role: string;
} | null> {
  const sql = `
    SELECT id, full_name, email, role
    FROM users
    WHERE department_id = ? AND role = 'dept_manager' AND is_active = 1
    ORDER BY id ASC
    LIMIT 1
  `;
  const rows = await query<RowDataPacket[]>(sql, [departmentId]);
  if (!rows || rows.length === 0) return null;
  return {
    id: Number(rows[0].id),
    full_name: String(rows[0].full_name),
    email: String(rows[0].email),
    role: String(rows[0].role),
  };
}
