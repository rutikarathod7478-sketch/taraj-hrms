export interface AiEvaluation {
  id: number;
  candidate_id: number;
  interview_id?: number | null;
  summary: string;
  strengths: string[];
  areas_for_assessment: string[];
  weaknesses?: string[];
  suggested_followups: string[];
  technical_rating: number;
  communication_rating: number;
  cultural_fit_rating: number;
  overall_ai_score: number;
  recommendation: 'strongly_recommend' | 'recommend' | 'neutral' | 'reject';
  rubric_version?: string;
  model_used: string;
  generation_status?: 'pending' | 'completed' | 'failed';
  raw_response?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface CandidateEvaluation {
  id?: number;
  candidate_id: number;
  round_1_score: number | null;
  round_1_max_score: number | null;
  round_2_score: number | null;
  round_2_max_score: number | null;
  round_3_score: number | null;
  round_3_max_score: number | null;
  total_earned_score: number;
  total_possible_score: number;
  overall_percentage: number;
  evaluation_summary?: string | null;
  evaluation_status: 'pending' | 'completed';
  calculated_at?: string;
  updated_at?: string;
}

export interface HiringDecision {
  id?: number;
  candidate_id: number;
  decision: 'selected' | 'rejected' | 'on_hold';
  decision_notes: string | null;
  offered_salary?: string | null;
  offered_position_id?: number | null;
  joining_date?: string | null;
  decided_by?: number | null;
  decided_at?: string;
  decision_timestamp?: string;
  is_current?: boolean;
  decided_by_name?: string;
  candidate_name?: string;
  department_name?: string;
  position_title?: string;
  created_at?: string;
  updated_at?: string;
}

export interface JoiningRecord {
  id?: number;
  candidate_id: number;
  employee_id?: number | null;
  joining_status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  proposed_joining_date: string;
  joining_date?: string;
  confirmed_joining_date?: string | null;
  assigned_department_id: number;
  assigned_position_id: number;
  reporting_manager_id?: number | null;
  probation_months: number;
  offer_status: 'draft' | 'sent' | 'accepted' | 'declined';
  documents_verified: boolean;
  checklist_status: Record<string, boolean>;
  notes: string | null;
  candidate_name?: string;
  department_name?: string;
  position_title?: string;
  created_at?: string;
  updated_at?: string;
}
