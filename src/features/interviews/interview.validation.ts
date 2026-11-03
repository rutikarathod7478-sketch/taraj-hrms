import { InterviewRoundType } from '@/types/question';
import { InterviewRecommendation } from '@/types/interview';

export interface ScoreSubmission {
  interview_id: number;
  question_id: number;
  score: number;
  interviewer_remarks?: string;
  duration_seconds?: number;
  recording_url?: string;
}

export interface RoundCompletionInput {
  candidateId: number;
  round: InterviewRoundType;
  recommendation: InterviewRecommendation;
  interviewerSummary?: string;
  answers: Array<{
    question_id: number;
    score: number;
    remarks?: string;
    duration_seconds?: number;
    recording_url?: string;
  }>;
}

export function validateScore(score: unknown, maxScore: number = 10): { isValid: boolean; error?: string } {
  const num = Number(score);
  if (isNaN(num)) {
    return { isValid: false, error: 'Score must be a valid number.' };
  }
  if (num < 0 || num > maxScore) {
    return { isValid: false, error: `Score must be between 0 and ${maxScore}.` };
  }
  return { isValid: true };
}

export function validateRoundCompletion(data: RoundCompletionInput): { isValid: boolean; error?: string } {
  if (!data.candidateId || Number(data.candidateId) <= 0) {
    return { isValid: false, error: 'Valid candidate ID is required.' };
  }
  if (!['hr', 'department', 'final'].includes(data.round)) {
    return { isValid: false, error: 'Invalid interview round type.' };
  }
  if (!['recommended', 'hold', 'rejected'].includes(data.recommendation)) {
    return { isValid: false, error: 'Valid recommendation (recommended, hold, or rejected) is required.' };
  }
  return { isValid: true };
}
