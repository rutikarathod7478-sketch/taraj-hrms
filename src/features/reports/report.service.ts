import { query } from '@/lib/db/mysql';
import { RowDataPacket } from 'mysql2/promise';

export interface RecruitmentFunnelStats {
  totalRegistered: number;
  completedRound1: number;
  completedRound2: number;
  completedRound3: number;
  offeredCount: number;
  joinedCount: number;
  conversionRate: number;
}

export interface DepartmentRecruitmentSummary {
  departmentId: number;
  departmentName: string;
  departmentCode: string;
  totalApplicants: number;
  inProgress: number;
  offered: number;
  joined: number;
  averageScore: number;
}

/**
 * Generate full recruitment pipeline funnel report
 */
export async function getRecruitmentFunnelStats(): Promise<RecruitmentFunnelStats> {
  const sql = `
    SELECT
      COUNT(*) AS totalRegistered,
      SUM(CASE WHEN application_status IN ('dept_interview', 'final_screening', 'evaluation', 'offered', 'joined') THEN 1 ELSE 0 END) AS completedRound1,
      SUM(CASE WHEN application_status IN ('final_screening', 'evaluation', 'offered', 'joined') THEN 1 ELSE 0 END) AS completedRound2,
      SUM(CASE WHEN application_status IN ('evaluation', 'offered', 'joined') THEN 1 ELSE 0 END) AS completedRound3,
      SUM(CASE WHEN application_status IN ('offered', 'joined') THEN 1 ELSE 0 END) AS offeredCount,
      SUM(CASE WHEN application_status = 'joined' THEN 1 ELSE 0 END) AS joinedCount
    FROM candidates
    WHERE is_archived = 0
  `;

  const [row] = await query<RowDataPacket[]>(sql);
  const total = Number(row?.totalRegistered) || 0;
  const joined = Number(row?.joinedCount) || 0;
  const conversionRate = total > 0 ? Number(((joined / total) * 100).toFixed(1)) : 0;

  return {
    totalRegistered: total,
    completedRound1: Number(row?.completedRound1) || 0,
    completedRound2: Number(row?.completedRound2) || 0,
    completedRound3: Number(row?.completedRound3) || 0,
    offeredCount: Number(row?.offeredCount) || 0,
    joinedCount: joined,
    conversionRate,
  };
}

/**
 * Generate department-wise recruitment performance analytics
 */
export async function getDepartmentReport(): Promise<DepartmentRecruitmentSummary[]> {
  const sql = `
    SELECT 
      d.id AS departmentId,
      d.name AS departmentName,
      d.code AS departmentCode,
      COUNT(c.id) AS totalApplicants,
      SUM(CASE WHEN c.application_status IN ('registered', 'hr_interview', 'dept_interview', 'final_screening') THEN 1 ELSE 0 END) AS inProgress,
      SUM(CASE WHEN c.application_status = 'offered' THEN 1 ELSE 0 END) AS offered,
      SUM(CASE WHEN c.application_status = 'joined' THEN 1 ELSE 0 END) AS joined,
      ROUND(AVG(COALESCE(ce.overall_percentage, 0)), 1) AS averageScore
    FROM departments d
    LEFT JOIN candidates c ON d.id = c.department_id AND c.is_archived = 0
    LEFT JOIN candidate_evaluations ce ON c.id = ce.candidate_id
    WHERE d.is_active = 1
    GROUP BY d.id, d.name, d.code
    ORDER BY totalApplicants DESC
  `;

  const rows = await query<RowDataPacket[]>(sql);
  return rows.map((r) => ({
    departmentId: Number(r.departmentId),
    departmentName: String(r.departmentName),
    departmentCode: String(r.departmentCode),
    totalApplicants: Number(r.totalApplicants) || 0,
    inProgress: Number(r.inProgress) || 0,
    offered: Number(r.offered) || 0,
    joined: Number(r.joined) || 0,
    averageScore: Number(r.averageScore) || 0,
  }));
}
