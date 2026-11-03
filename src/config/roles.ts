export type Role =
  | 'super_admin'
  | 'admin'
  | 'hr_manager'
  | 'dept_manager'
  | 'interviewer'
  | 'employee';

export interface RoleConfig {
  name: string;
  label: string;
  description: string;
  allowedRoutes: string[];
}

export const ROLES: Record<string, RoleConfig> = {
  super_admin: {
    name: 'super_admin',
    label: 'Super Admin',
    description: 'Complete unrestricted administrative control across all departments and system settings.',
    allowedRoutes: ['/hr', '/manager', '/employees', '/onboarding', '/settings'],
  },
  admin: {
    name: 'admin',
    label: 'Administrator',
    description: 'System administration and full access to recruitment and employee modules.',
    allowedRoutes: ['/hr', '/manager', '/employees', '/onboarding', '/settings'],
  },
  hr_manager: {
    name: 'hr_manager',
    label: 'HR Manager',
    description: 'Manages candidate pipeline, Round 1 HR interviews, decisions, offer letters, and onboarding.',
    allowedRoutes: ['/hr', '/employees', '/onboarding', '/settings'],
  },
  dept_manager: {
    name: 'dept_manager',
    label: 'Department Manager',
    description: 'Conducts Round 2 technical assessments and evaluations for their assigned department.',
    allowedRoutes: ['/manager'],
  },
  interviewer: {
    name: 'interviewer',
    label: 'Interviewer',
    description: 'Conducts assigned interview rounds, scores questions, and records evaluation remarks.',
    allowedRoutes: ['/manager', '/hr/interviews'],
  },
  employee: {
    name: 'employee',
    label: 'Employee',
    description: 'Self-service employee portal for document verification, status, and profile information.',
    allowedRoutes: ['/employees/me'],
  },
};
