export type CandidateStatus =
  | 'registered'
  | 'hr_interview'
  | 'dept_interview'
  | 'final_screening'
  | 'evaluation'
  | 'offered'
  | 'rejected'
  | 'on_hold'
  | 'joined';

export type CandidateType = 'Fresher' | 'Experienced';

export interface Candidate {
  id: number;
  candidate_code: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone: string;
  date_of_birth?: string | null;
  address?: string | null;
  candidate_type: CandidateType;
  department_id: number;
  position_id: number;
  qualification?: string | null;
  college_or_institution?: string | null;
  graduation_year?: number | null;
  experience_years: number;
  current_employer?: string | null;
  current_ctc?: string | null;
  expected_ctc?: string | null;
  expected_salary?: string | null; // Alias
  notice_period?: number | null; // in days
  resume_file_path?: string | null;
  resume_original_name?: string | null;
  application_status: CandidateStatus;
  status?: CandidateStatus; // Alias for UI
  registration_source?: string;
  qr_token?: string | null;
  notes?: string | null;
  is_archived?: boolean;
  department_name?: string;
  position_title?: string;
  overall_percentage?: number | string | null;
  evaluation_status?: string | null;
  round_1_score?: number | string | null;
  round_1_max_score?: number | string | null;
  round_1_status?: string | null;
  round_1_interview_id?: number | null;
  round_1_interview_status?: string | null;
  round_1_completed_at?: string | null;
  round_1_summary?: string | null;
  round_1_interviewer_name?: string | null;
  round_2_score?: number | string | null;
  round_2_max_score?: number | string | null;
  round_2_status?: string | null;
  round_3_score?: number | string | null;
  round_3_max_score?: number | string | null;
  round_3_status?: string | null;
  hr_done?: boolean;
  tech_done?: boolean;
  practical_done?: boolean;
  hr_score_formatted?: string | null;
  tech_score_formatted?: string | null;
  practical_score_formatted?: string | null;
  overall_score_formatted?: string | null;
  remaining_rounds?: string[];
  interview_count?: number;
  registered_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CandidateFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  department_id?: number | string;
  departmentId?: number | string;
  status?: string;
  candidate_type?: CandidateType | string;
  pipeline_only?: boolean | string;
}

export interface CandidateDocument {
  id: number;
  candidate_id: number;
  document_type: 'resume' | 'id_proof' | 'qualification' | 'offer_letter' | 'relieving_letter' | 'other';
  original_filename: string;
  stored_filename: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  uploaded_at: string;
}

export interface CandidateRegistrationInput {
  full_name: string;
  email: string;
  phone: string;
  date_of_birth?: string;
  address?: string;
  candidate_type?: CandidateType;
  department_id: number;
  position_id: number;
  qualification?: string;
  college_or_institution?: string;
  graduation_year?: number;
  experience_years?: number;
  current_employer?: string;
  current_ctc?: string;
  expected_ctc?: string;
  notice_period?: number;
  notes?: string;
  registration_source?: string;
  resume_file_path?: string;
  resume_original_name?: string;
}
