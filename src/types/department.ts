export type DepartmentCode =
  | 'QUALITY'
  | 'DEV'
  | 'MGMT'
  | 'SALES'
  | 'HR'
  | 'OPS'
  | 'DBMS'
  | 'EMAIL_MKT';

export interface Department {
  id: number;
  code: DepartmentCode | string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Position {
  id: number;
  department_id: number;
  code: string;
  title: string;
  description: string | null;
  requirements: string | null;
  is_active: boolean;
  department_name?: string;
  created_at: string;
  updated_at: string;
}
