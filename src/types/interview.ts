import { InterviewRoundType } from './question';

export type InterviewStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type InterviewRecommendation = 'recommended' | 'hold' | 'rejected';

export interface Interview {
  id: number;
  candidate_id: number;
  round_type: InterviewRoundType;
  round?: InterviewRoundType;
  interviewer_id: number | null;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  status: InterviewStatus;
  total_questions: number;
  total_score: number | null;
  maximum_score: number | null;
  overall_score?: number | null;
  recommendation: InterviewRecommendation | null;
  interviewer_summary?: string | null;
  remarks?: string | null;
  candidate_name?: string;
  interviewer_name?: string;
  created_at: string;
  updated_at: string;
}

export interface InterviewAnswer {
  id?: number;
  interview_id: number;
  question_id: number;
  question_text_snapshot?: string;
  answer_text?: string | null;
  started_at?: string | null;
  answered_at?: string | null;
  score: number;
  maximum_score?: number;
  remarks?: string;
  interviewer_remarks?: string;
  duration_seconds: number;
  evaluation_status?: 'pending' | 'evaluated';
  recording_url?: string | null;
  question_text?: string;
}

export interface RecordingMetadata {
  id?: number;
  interview_id: number;
  interview_answer_id?: number | null;
  candidate_id: number;
  storage_key: string;
  file_path: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  duration_seconds: number;
  consent_recorded_at?: string | null;
  uploaded_at?: string;
  created_at?: string;
}
