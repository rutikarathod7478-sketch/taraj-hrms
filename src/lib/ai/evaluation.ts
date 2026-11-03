import { AiEvaluation } from '@/types/evaluation';

export interface AiEvaluationInput {
  candidateName: string;
  department: string;
  position: string;
  experienceYears: number;
  interviewAnswers: Array<{
    question: string;
    remarks: string;
    score: number;
    durationSeconds: number;
    hasAudio?: boolean;
  }>;
}

export interface StructuredAiResult {
  isAiAssisted: boolean;
  modelUsed: string;
  summary: string;
  strengths: string[];
  areasForImprovement: string[];
  suggestedScore: number;
  technicalRating: number;
  communicationRating: number;
  culturalFitRating: number;
  recommendation: 'strongly_recommend' | 'recommend' | 'neutral' | 'reject';
  transcriptionNote: string;
}

/**
 * Generate candidate evaluation.
 * If AI_API_KEY is present, calls the model.
 * If not present, returns explicit manual fallback and flags `isAiAssisted: false`.
 */
export async function evaluateCandidatePerformance(
  input: AiEvaluationInput
): Promise<StructuredAiResult> {
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL || 'gpt-4o-mini';

  const answers = input.interviewAnswers || [];
  let totalScore = 0;
  let maxScore = 0;
  answers.forEach((a) => {
    totalScore += Number(a.score) || 0;
    maxScore += 10;
  });

  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 70;
  const baseRating = Math.max(1, Math.min(10, Number((percentage / 10).toFixed(1))));

  // If no AI key configured, return explicit manual synthesis fallback
  if (!apiKey || apiKey.trim() === '') {
    let rec: 'strongly_recommend' | 'recommend' | 'neutral' | 'reject' = 'neutral';
    if (baseRating >= 8.5) rec = 'strongly_recommend';
    else if (baseRating >= 6.5) rec = 'recommend';
    else if (baseRating >= 4.5) rec = 'neutral';
    else rec = 'reject';

    return {
      isAiAssisted: false,
      modelUsed: 'Manual Evaluation Fallback (AI Provider Unconfigured)',
      summary: `Manual Evaluation Review: ${input.candidateName} has completed evaluations for ${input.position} (${input.department}). Interviewer ratings average ${baseRating}/10 (${percentage.toFixed(0)}%).`,
      strengths: [
        `Achieved a scored performance index of ${percentage.toFixed(0)}% across evaluated questions.`,
        `Direct interviewer observations recorded across the evaluation rounds.`,
      ],
      areasForImprovement: [
        `Review individual answer remarks for specific technical competencies.`,
        `Conduct follow-up assessment if deeper domain proficiency needs validation.`,
      ],
      suggestedScore: baseRating,
      technicalRating: baseRating,
      communicationRating: Math.min(10, baseRating),
      culturalFitRating: Math.min(10, baseRating),
      recommendation: rec,
      transcriptionNote: 'Direct automated audio-to-text transcription service is not configured. Scores are based on interviewer recordings and entered remarks.',
    };
  }

  // If API key is configured, call OpenAI
  try {
    const prompt = `You are an enterprise HR candidate evaluation assistant for Taraj Global Solutions.
Evaluate the candidate objectively using only the provided interview performance data:
Candidate: ${input.candidateName}
Role: ${input.position} (${input.department})
Experience: ${input.experienceYears} years
Answers: ${JSON.stringify(input.interviewAnswers)}

Output strict JSON:
{
  "summary": "Concise professional evaluation summary",
  "strengths": ["strength 1", "strength 2"],
  "areas_for_improvement": ["area 1", "area 2"],
  "technical_rating": number between 0 and 10,
  "communication_rating": number between 0 and 10,
  "cultural_fit_rating": number between 0 and 10,
  "suggested_score": number between 0 and 10,
  "recommendation": "strongly_recommend" | "recommend" | "neutral" | "reject"
}`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: prompt }],
      }),
    });

    if (!res.ok) {
      throw new Error(`AI API responded with status ${res.status}`);
    }

    const data = await res.json();
    const parsed = JSON.parse(data.choices[0].message.content);

    return {
      isAiAssisted: true,
      modelUsed: model,
      summary: parsed.summary || 'AI-assisted evaluation completed.',
      strengths: parsed.strengths || [],
      areasForImprovement: parsed.areas_for_improvement || [],
      suggestedScore: Number(parsed.suggested_score) || baseRating,
      technicalRating: Number(parsed.technical_rating) || baseRating,
      communicationRating: Number(parsed.communication_rating) || baseRating,
      culturalFitRating: Number(parsed.cultural_fit_rating) || baseRating,
      recommendation: parsed.recommendation || 'recommend',
      transcriptionNote: 'Evaluated using interviewer scoring rubric and entered responses.',
    };
  } catch (err: unknown) {
    const error = err as Error;
    console.warn('[AI Evaluation] API error, falling back to manual scoring summary:', error.message);
    return {
      isAiAssisted: false,
      modelUsed: 'Manual Evaluation Fallback (API Error)',
      summary: `Candidate score average across completed questions: ${baseRating}/10 (${percentage.toFixed(0)}%).`,
      strengths: [`Interviewer evaluated answers successfully.`],
      areasForImprovement: [`Verify department specific technical requirements.`],
      suggestedScore: baseRating,
      technicalRating: baseRating,
      communicationRating: baseRating,
      culturalFitRating: baseRating,
      recommendation: 'recommend',
      transcriptionNote: 'Direct automated audio-to-text transcription service is not configured.',
    };
  }
}
