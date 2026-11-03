import { isValidEmail, isValidPhone, isNonEmptyString } from '@/lib/validators/common';

export interface CandidateFormState {
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: string;
  dateOfBirth?: string;
  email: string;
  mobileNumber: string;
  alternateContact?: string;
  location: string;
  profilePhoto?: string;
  candidateType: 'Fresher' | 'Experienced';
  departmentId: string | number;
  positionId: string | number;
  // Fresher fields
  education?: string;
  skills?: string;
  projects?: string;
  // Experienced fields
  previousCompany?: string;
  designation?: string;
  currentCtc?: string;
  expectedCtc?: string;
  noticePeriod?: string | number;
  notes?: string;
  resumeFile?: File | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateCandidateForm(data: CandidateFormState, isCvRequired: boolean = true): ValidationResult {
  const errors: Record<string, string> = {};

  if (!isNonEmptyString(data.firstName)) {
    errors.firstName = 'First name is required.';
  }

  if (!isNonEmptyString(data.lastName)) {
    errors.lastName = 'Last name is required.';
  }

  if (!isNonEmptyString(data.gender)) {
    errors.gender = 'Gender selection is required.';
  }

  if (!isValidEmail(data.email)) {
    errors.email = 'A valid corporate or personal email address is required.';
  }

  if (!isValidPhone(data.mobileNumber)) {
    errors.mobileNumber = 'A valid 10 to 15 digit mobile number is required.';
  }

  if (!data.departmentId || Number(data.departmentId) <= 0) {
    errors.departmentId = 'Please select a department.';
  }

  if (!data.positionId || Number(data.positionId) <= 0) {
    errors.positionId = 'Please select an applying position/role.';
  }

  if (!isNonEmptyString(data.location)) {
    errors.location = 'Current location / city is required.';
  }

  // Fresher vs Experienced
  if (data.candidateType === 'Fresher') {
    if (!isNonEmptyString(data.education)) {
      errors.education = 'Highest education/qualification is required for freshers.';
    }
  } else {
    if (!isNonEmptyString(data.previousCompany)) {
      errors.previousCompany = 'Previous or current employer is required.';
    }
    if (!isNonEmptyString(data.designation)) {
      errors.designation = 'Current or recent designation is required.';
    }
    if (!isNonEmptyString(data.expectedCtc)) {
      errors.expectedCtc = 'Expected CTC is required.';
    }
  }

  if (isCvRequired && !data.resumeFile) {
    errors.resumeFile = 'CV/Resume document is required for submission.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
