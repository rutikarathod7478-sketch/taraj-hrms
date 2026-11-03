export type InterviewRoundType = 'hr' | 'department' | 'final';

export interface QuestionCategory {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export interface McqOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface Question {
  id: number;
  department_id: number | null;
  position_id: number | null;
  category_id: number | null;
  round_type: InterviewRoundType;
  round?: InterviewRoundType;
  question_text: string;
  question_type: string;
  expected_answer_guidance?: string | null;
  expected_keywords?: string | null;
  max_score: number;
  time_limit_seconds: number;
  weight: number;
  is_active: boolean;
  category_name?: string;
  department_name?: string;
  position_title?: string;
  created_at?: string;
  updated_at?: string;
  // Screening questions
  questionNumber?: number;
  title?: string;
  section?: 'A' | 'B' | 'C';
  section_title?: string;
  correct_answer?: 'A' | 'B' | 'C' | 'D';
  options?: McqOption[];
  criteria_list?: string[];
}

export interface CreateQuestionInput {
  department_id?: number | null;
  position_id?: number | null;
  category_id?: number | null;
  round_type?: InterviewRoundType;
  round?: InterviewRoundType;
  question_text: string;
  question_type?: string;
  expected_answer_guidance?: string;
  expected_keywords?: string;
  max_score?: number;
  time_limit_seconds?: number;
  weight?: number;
  is_active?: boolean;
}
