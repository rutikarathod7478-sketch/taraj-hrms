import { isValidEmail, isValidPhone, isNonEmptyString } from '@/lib/validators/common';

export interface EmployeeUpdateInput {
  full_name?: string;
  email?: string;
  phone?: string;
  status?: 'active' | 'probation' | 'notice' | 'terminated' | 'resigned';
  join_date?: string;
}

export function validateEmployeeUpdate(data: EmployeeUpdateInput): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (data.email && !isValidEmail(data.email)) {
    errors.email = 'Invalid corporate email address.';
  }

  if (data.phone && !isValidPhone(data.phone)) {
    errors.phone = 'Invalid phone number format.';
  }

  if (data.status && !['active', 'probation', 'notice', 'terminated', 'resigned'].includes(data.status)) {
    errors.status = 'Invalid employment status.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
