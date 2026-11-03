export type EmployeeStatus = 'active' | 'joined' | 'probation' | 'notice' | 'terminated' | 'resigned';

export interface Employee {
  id: number;
  candidate_id: number;
  employee_code: string;
  full_name: string;
  email: string;
  phone: string;
  department_id: number;
  position_id: number;
  join_date: string;
  status: EmployeeStatus;
  department_name?: string;
  position_title?: string;
  candidate_code?: string;
  round_1_score?: number | string | null;
  round_2_score?: number | string | null;
  round_3_score?: number | string | null;
  overall_percentage?: number | string | null;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'super_admin' | 'hr_manager' | 'dept_manager' | 'interviewer' | 'employee';

export interface UserSession {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  department_id: number | null;
}
