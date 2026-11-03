import { InterviewRoundType } from '@/types/question';

export interface RoundConfig {
  key: InterviewRoundType;
  title: string;
  shortName: string;
  description: string;
  maxScorePerQuestion: number;
  weightPercentage: number;
  allowedRoles: string[];
  stages: string[];
}

export const INTERVIEW_ROUNDS: Record<InterviewRoundType, RoundConfig> = {
  hr: {
    key: 'hr',
    title: 'Round 1 — HR Screening & Communication',
    shortName: 'HR Screening',
    description: 'B2B business understanding, company culture fit, communication skills, career motivation, and behavioral assessment.',
    maxScorePerQuestion: 10,
    weightPercentage: 25,
    allowedRoles: ['super_admin', 'admin', 'hr_manager'],
    stages: ['Company Knowledge', 'Communication & Fluency', 'B2B Acumen', 'Behavioral Alignment'],
  },
  department: {
    key: 'department',
    title: 'Round 2 — Department Technical Assessment',
    shortName: 'Dept Assessment',
    description: 'Job-specific technical competencies, domain-specific problem solving, hands-on tasks, and department workflow evaluation.',
    maxScorePerQuestion: 10,
    weightPercentage: 45,
    allowedRoles: ['super_admin', 'dept_manager', 'interviewer'],
    stages: ['Core Competencies', 'Practical Execution', 'Quality & Standards', 'Tool Proficiencies'],
  },
  final: {
    key: 'final',
    title: 'Round 3 — Final Executive Screening',
    shortName: 'Final Screening',
    description: 'Strategic leadership, cross-functional collaboration, compensation expectations alignment, and final hiring suitability.',
    maxScorePerQuestion: 10,
    weightPercentage: 30,
    allowedRoles: ['super_admin', 'admin', 'hr_manager'],
    stages: ['Strategic Fit', 'Leadership Potential', 'Compensation & Onboarding', 'Final Recommendation'],
  },
};

/**
 * Formula for consolidated percentage:
 * (Round 1 Earned / Round 1 Max) * 25% + (Round 2 Earned / Round 2 Max) * 45% + (Round 3 Earned / Round 3 Max) * 30%
 * If some rounds are still pending, normalizes across completed rounds.
 */
export function calculateOverallScore(
  r1: { earned: number; max: number } | null,
  r2: { earned: number; max: number } | null,
  r3: { earned: number; max: number } | null
): { totalEarned: number; totalPossible: number; percentage: number } {
  let totalEarned = 0;
  let totalPossible = 0;

  if (r1 && r1.max > 0) {
    totalEarned += r1.earned;
    totalPossible += r1.max;
  }
  if (r2 && r2.max > 0) {
    totalEarned += r2.earned;
    totalPossible += r2.max;
  }
  if (r3 && r3.max > 0) {
    totalEarned += r3.earned;
    totalPossible += r3.max;
  }

  const percentage = totalPossible > 0 ? Number(((totalEarned / totalPossible) * 100).toFixed(1)) : 0;

  return {
    totalEarned,
    totalPossible,
    percentage,
  };
}

/**
 * Weighted consolidated scoring rule:
 * R1 (HR): 25%, R2 (Dept): 45%, R3 (Final): 30%
 */
export function calculateConsolidatedScore(r1Score = 0, r2Score = 0, r3Score = 0): number {
  const weighted = (r1Score / 10) * 25 + (r2Score / 10) * 45 + (r3Score / 10) * 30;
  return Number(weighted.toFixed(1));
}
