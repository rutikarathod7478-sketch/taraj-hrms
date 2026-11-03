import { UserSession } from '@/types/employee';

/**
 * Super Admin or HR can manage all departments and candidates
 */
export function canManageAllDepartments(user: UserSession): boolean {
  return user.role === 'super_admin' || user.role === 'hr_manager';
}

/**
 * Checks whether user has permission to evaluate candidate in a specific department
 */
export function canConductInterview(user: UserSession, departmentId?: number | null): boolean {
  if (user.role === 'super_admin' || user.role === 'hr_manager') return true;
  if (user.role === 'dept_manager' || user.role === 'interviewer') {
    if (!departmentId) return true;
    return user.department_id === Number(departmentId);
  }
  return false;
}

/**
 * Checks if user is permitted to make final hiring decisions
 */
export function canMakeHiringDecision(user: UserSession): boolean {
  return user.role === 'super_admin' || user.role === 'hr_manager';
}

/**
 * Checks if user can access onboarding and offer generation
 */
export function canManageOnboarding(user: UserSession): boolean {
  return user.role === 'super_admin' || user.role === 'hr_manager';
}

/**
 * Checks if user can access employee directory
 */
export function canViewEmployees(user: UserSession): boolean {
  return (
    user.role === 'super_admin' ||
    user.role === 'hr_manager' ||
    user.role === 'dept_manager'
  );
}
