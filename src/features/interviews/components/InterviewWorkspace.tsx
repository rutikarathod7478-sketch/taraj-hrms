'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Candidate } from '@/types/candidate';
import { Question, InterviewRoundType } from '@/types/question';
import { Interview, InterviewAnswer } from '@/types/interview';
import { ScoreForm } from './ScoreForm';
import { RemarksField } from './RemarksField';
import { SecondRoundModal } from './SecondRoundModal';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/feedback/ToastProvider';
import { useMediaRecorder } from '@/hooks/useMediaRecorder';
import { formatDuration } from '@/lib/utils';
import {
  CheckCircle2,
  Save,
  Send,
  AlertCircle,
  HelpCircle,
  Award,
  ChevronRight,
  ChevronLeft,
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Upload,
  ArrowRight,
  Radio,
  FileText,
  Clock,
  Briefcase,
  Mail,
  Phone,
  Building2,
  CheckCircle,
  ArrowLeft,
  Sparkles,
  Plus,
  Eye,
  EyeOff,
  Check,
  X,
} from 'lucide-react';

export interface InterviewWorkspaceProps {
  candidate: Candidate;
  initialRound?: InterviewRoundType;
  onRoundComplete?: () => void;
}

interface QuestionAnswerState {
  score: number | null;
  answerText: string;
  remarks: string;
  duration: number;
  recordingUrl?: string;
}

export const InterviewWorkspace: React.FC<InterviewWorkspaceProps> = ({
  candidate,
  initialRound = 'hr',
  onRoundComplete,
}) => {
  const { success, error } = useToast();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, QuestionAnswerState>>({});
  const [roundInterview, setRoundInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingAnswer, setSavingAnswer] = useState<boolean>(false);
  const [submittingRound, setSubmittingRound] = useState<boolean>(false);
  const [recommendation, setRecommendation] = useState<'recommended' | 'hold' | 'rejected'>('recommended');
  const [roundSummary, setRoundSummary] = useState<string>('');

  // Continuous Session Audio Recorder across Q1 to Q10
  const {
    isRecording,
    isPaused,
    recordingDuration,
    audioBlob,
    audioUrl,
    error: recorderError,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    uploadRecording,
  } = useMediaRecorder();

  const [sessionAudioUploaded, setSessionAudioUploaded] = useState<boolean>(false);
  const [sessionAudioUrl, setSessionAudioUrl] = useState<string | null>(null);
  const [isUploadingAudio, setIsUploadingAudio] = useState<boolean>(false);

  // Second Round Modal State
  const [isSecondRoundModalOpen, setIsSecondRoundModalOpen] = useState<boolean>(false);
  const [isSubmittingSecondRound, setIsSubmittingSecondRound] = useState<boolean>(false);

  // Add Question Modal State
  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState<boolean>(false);
  const [newQuestionType, setNewQuestionType] = useState<string>('');
  const [newQuestionText, setNewQuestionText] = useState<string>('');
  const [newOptionA, setNewOptionA] = useState<string>('');
  const [newOptionB, setNewOptionB] = useState<string>('');
  const [newOptionC, setNewOptionC] = useState<string>('');
  const [newOptionD, setNewOptionD] = useState<string>('');
  const [newCorrectAnswer, setNewCorrectAnswer] = useState<string>('A');
  const [newMultipleCorrect, setNewMultipleCorrect] = useState<string[]>(['A']);
  const [newTrueFalseAnswer, setNewTrueFalseAnswer] = useState<string>('True');
  const [newGuidance, setNewGuidance] = useState<string>('');
  const [isAddingQuestion, setIsAddingQuestion] = useState<boolean>(false);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState<boolean>(false);
  const [submittedQuestions, setSubmittedQuestions] = useState<Record<number, boolean>>({});

  // View mode: One-by-one questions vs. HR Round Evaluation Summary
  const [isSummaryView, setIsSummaryView] = useState<boolean>(false);

  // Active round state (supports HR, Technical, Practical rounds)
  const [activeRound, setActiveRound] = useState<InterviewRoundType>(initialRound || 'hr');

  // Dynamic question type options matching round specifications
  const availableQuestionTypes = React.useMemo(() => {
    if (activeRound === 'department') {
      return [
        { value: 'mcq', label: 'MCQ' },
        { value: 'multiple_select', label: 'Multiple Select' },
        { value: 'true_false', label: 'True/False' },
        { value: 'short_answer', label: 'Short Ans' },
        { value: 'scenario_based', label: 'Scenario Based' },
      ];
    }
    if (activeRound === 'final') {
      return [
        { value: 'practical_task', label: 'Practical Task' },
        { value: 'mcq', label: 'MCQ' },
        { value: 'multiple_select', label: 'Multiple Select' },
        { value: 'true_false', label: 'True/False' },
        { value: 'short_answer', label: 'Short Ans' },
        { value: 'scenario_based', label: 'Scenario Based' },
      ];
    }
    return [
      { value: 'mcq', label: 'MCQ' },
      { value: 'short_answer', label: 'Short Ans' },
      { value: 'scenario_based', label: 'Scenario Based' },
    ];
  }, [activeRound]);

  useEffect(() => {
    if (initialRound) {
      setActiveRound(initialRound);
    }
  }, [initialRound]);

  // Load questions & existing answers for the active round
  useEffect(() => {
    async function loadRoundData() {
      setLoading(true);
      try {
        // 1. Fetch questions for active round
        const qRes = await fetch(`/api/interviews/questions?candidate_id=${candidate.id}&round=${activeRound}`);
        let loadedQuestions: Question[] = [];
        if (qRes.ok) {
          const qData = await qRes.json();
          loadedQuestions = qData.data || [];
        }

        // If no questions found for technical or practical round, provide fallback structured assessment criteria
        if (loadedQuestions.length === 0) {
          if (activeRound === 'department') {
            loadedQuestions = [
              { id: 901, round_type: 'department', question_type: 'technical', question_text: 'Core Technical Knowledge & Architecture: Evaluate proficiency in core technologies, system design, and practical concepts.', max_score: 10, is_active: true, department_id: null, position_id: null, category_id: null, time_limit_seconds: 180, weight: 1 },
              { id: 902, round_type: 'department', question_type: 'technical', question_text: 'Problem Solving & Coding Skills: Evaluate logic, analytical thinking, speed, and algorithmic clarity.', max_score: 10, is_active: true, department_id: null, position_id: null, category_id: null, time_limit_seconds: 180, weight: 1 },
              { id: 903, round_type: 'department', question_type: 'technical', question_text: 'Debugging, Testing & Code Quality: Review ability to isolate issues, write clean code, and follow best practices.', max_score: 10, is_active: true, department_id: null, position_id: null, category_id: null, time_limit_seconds: 180, weight: 1 },
              { id: 904, round_type: 'department', question_type: 'technical', question_text: 'Hands-on Execution & Edge Cases: Assess performance under technical scenarios and realistic project tasks.', max_score: 10, is_active: true, department_id: null, position_id: null, category_id: null, time_limit_seconds: 180, weight: 1 },
            ];
          } else if (activeRound === 'final') {
            loadedQuestions = [
              { id: 911, round_type: 'final', question_type: 'technical', question_text: 'Practical Task Completion: Evaluate delivery quality, accuracy, and adherence to requirements.', max_score: 10, is_active: true, department_id: null, position_id: null, category_id: null, time_limit_seconds: 180, weight: 1 },
              { id: 912, round_type: 'final', question_type: 'technical', question_text: 'Efficiency & Autonomy: Ability to perform with minimal handholding and meet project deadlines.', max_score: 10, is_active: true, department_id: null, position_id: null, category_id: null, time_limit_seconds: 180, weight: 1 },
              { id: 913, round_type: 'final', question_type: 'technical', question_text: 'Culture Fit & Production Readiness: Professional demeanor, collaborative mindset, and readiness for onboarding.', max_score: 10, is_active: true, department_id: null, position_id: null, category_id: null, time_limit_seconds: 180, weight: 1 },
            ];
          }
        }

        setQuestions(loadedQuestions);

        // 2. Fetch existing session & answers for active round
        const intRes = await fetch(`/api/interviews?candidate_id=${candidate.id}&round=${activeRound}`);
        if (intRes.ok) {
          const intData = await intRes.json();
          const existingInterview = intData.data?.interview || null;
          setRoundInterview(existingInterview);

          if (existingInterview?.interviewer_summary) {
            setRoundSummary(existingInterview.interviewer_summary);
          } else {
            setRoundSummary('');
          }
          if (existingInterview?.recommendation) {
            setRecommendation(existingInterview.recommendation);
          } else {
            setRecommendation('recommended');
          }

          if (intData.data?.answers && Array.isArray(intData.data.answers)) {
            const mapped: Record<number, QuestionAnswerState> = {};
            const submittedMap: Record<number, boolean> = {};
            let scoredAnswersCount = 0;
            intData.data.answers.forEach((ans: InterviewAnswer) => {
              const hasScore = ans.score !== undefined && ans.score !== null;
              if (hasScore) {
                scoredAnswersCount++;
                submittedMap[ans.question_id] = true;
              }
              mapped[ans.question_id] = {
                score: hasScore ? Number(ans.score) : null,
                answerText: ans.answer_text || '',
                remarks: ans.interviewer_remarks || ans.remarks || '',
                duration: ans.duration_seconds || 0,
                recordingUrl: ans.recording_url || undefined,
              };
              if (ans.recording_url) {
                setSessionAudioUrl(ans.recording_url);
                setSessionAudioUploaded(true);
              }
            });
            setAnswers(mapped);
            setSubmittedQuestions(submittedMap);

            if (scoredAnswersCount >= (loadedQuestions.length || 3) || existingInterview?.status === 'completed') {
              setIsSummaryView(true);
            } else {
              setIsSummaryView(false);
            }
          } else {
            setAnswers({});
            setSubmittedQuestions({});
            setIsSummaryView(false);
          }
        }
      } catch (err) {
        console.error('Failed to load round data:', err);
      } finally {
        setLoading(false);
        setCurrentQIndex(0);
      }
    }

    loadRoundData();
  }, [candidate.id, activeRound]);

  useEffect(() => {
    setShowCorrectAnswer(false);
  }, [currentQIndex]);

  const currentQuestion = questions[currentQIndex];
  const currentAnswer: QuestionAnswerState = currentQuestion
    ? answers[currentQuestion.id] || { score: null, answerText: '', remarks: '', duration: 0 }
    : { score: null, answerText: '', remarks: '', duration: 0 };

  const roundName =
    activeRound === 'department'
      ? 'Technical Round'
      : activeRound === 'final'
      ? 'Practical Round'
      : 'HR Round';

  const handleScoreChange = (score: number) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...(prev[currentQuestion.id] || { score: null, answerText: '', remarks: '', duration: 0 }),
        score,
      },
    }));
  };

  const handleAnswerTextChange = (answerText: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...(prev[currentQuestion.id] || { score: null, answerText: '', remarks: '', duration: 0 }),
        answerText,
      },
    }));
  };

  const handleRemarksChange = (remarks: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...(prev[currentQuestion.id] || { score: null, answerText: '', remarks: '', duration: 0 }),
        remarks,
      },
    }));
  };

  // Upload full session audio recording
  const handleUploadAudio = async () => {
    if (!audioBlob) return;
    setIsUploadingAudio(true);
    try {
      const res = await uploadRecording('/api/interviews/recordings', {
        candidate_id: candidate.id,
        interview_id: roundInterview?.id || 0,
        question_id: currentQuestion?.id || 210,
        duration: recordingDuration,
      });

      if (res.success && res.fileUrl) {
        setSessionAudioUploaded(true);
        setSessionAudioUrl(res.fileUrl);
        success('HR Round audio recording uploaded and linked successfully!');
      } else {
        throw new Error(res.error || 'Failed to upload audio recording');
      }
    } catch (err: any) {
      error('Upload Failed', err.message || 'Audio upload error');
    } finally {
      setIsUploadingAudio(false);
    }
  };

  // Automatically upload recording when audioBlob is available
  useEffect(() => {
    if (audioBlob && !sessionAudioUploaded && !isUploadingAudio) {
      handleUploadAudio();
    }
  }, [audioBlob, sessionAudioUploaded, isUploadingAudio]);

  // Save current question answer progress
  const saveCurrentAnswer = async (advanceToNext: boolean = false, finishRound: boolean = false) => {
    if (!currentQuestion) return;

    const isRecordingActive = isRecording || isPaused || recordingDuration > 0 || Boolean(audioUrl) || Boolean(sessionAudioUrl);
    if (advanceToNext && currentQIndex === 0 && !isRecordingActive) {
      error(
        'Recording Required',
        'Please start the audio recording on Question 1 before moving forward to the 2nd question.'
      );
      return;
    }

    setSavingAnswer(true);
    try {
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_answer',
          candidate_id: candidate.id,
          round: activeRound,
          question_id: currentQuestion.id,
          score: currentAnswer.score !== null ? currentAnswer.score : 0,
          answer_text: currentAnswer.answerText,
          remarks: currentAnswer.remarks,
          duration_seconds: currentAnswer.duration,
          recording_url: sessionAudioUrl || currentAnswer.recordingUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save question score.');
      }
      setSubmittedQuestions((prev) => ({ ...prev, [currentQuestion.id]: true }));
      success('Question evaluation saved.');

      if (finishRound) {
        // Check if all questions are scored
        const missingIndices: number[] = [];
        questions.forEach((q, idx) => {
          const ans = q.id === currentQuestion.id ? currentAnswer : answers[q.id];
          if (!ans || ans.score === null || ans.score === undefined) {
            missingIndices.push(idx);
          }
        });

        if (missingIndices.length > 0) {
          error(
            'Incomplete Scoring',
            `Please score all questions before proceeding. Unscored: Questions ${missingIndices
              .map((i) => `#${i + 1}`)
              .join(', ')}.`
          );
          setCurrentQIndex(missingIndices[0]);
          return;
        }

        setIsSummaryView(true);
        success(
          'All Questions Completed!',
          `Review the ${activeRound === 'hr' ? 'HR Round' : activeRound === 'department' ? 'Technical Round' : 'Practical Round'} Evaluation Summary and make your final recommendation.`
        );
      } else if (advanceToNext && currentQIndex < questions.length - 1) {
        setCurrentQIndex((prev) => prev + 1);
      }
    } catch (err: unknown) {
      const e = err as Error;
      error('Save Error', e.message);
    } finally {
      setSavingAnswer(false);
    }
  };

  // Section calculation and live score aggregates
  let sectionAScore = 0;
  let sectionBScore = 0;
  let totalScore = 0;
  let scoredCount = 0;
  const unansweredIndices: number[] = [];

  questions.forEach((q, idx) => {
    const ans = answers[q.id];
    if (ans && ans.score !== null && ans.score !== undefined) {
      scoredCount++;
      totalScore += ans.score;
      if (idx < 5) {
        sectionAScore += ans.score;
      } else {
        sectionBScore += ans.score;
      }
    } else {
      unansweredIndices.push(idx);
    }
  });

  const maxPossibleScore = React.useMemo(() => {
    return questions.reduce((sum, q) => sum + (Number(q.max_score) || 10), 0);
  }, [questions]);

  const percentageScore = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

  // Complete Round
  const handleCompleteRound = async () => {
    if (unansweredIndices.length > 0) {
      error(
        'Incomplete Scoring',
        `Please score all questions before submitting. Unanswered: Questions ${unansweredIndices
          .map((i) => i + 1)
          .join(', ')}.`
      );
      setCurrentQIndex(unansweredIndices[0]);
      return;
    }

    setSubmittingRound(true);
    try {
      let finalAudioUrl = sessionAudioUrl;
      if (isRecording) {
        stopRecording();
      }
      if (!finalAudioUrl && audioBlob) {
        try {
          const uploadRes = await uploadRecording('/api/interviews/recordings', {
            candidate_id: candidate.id,
            interview_id: roundInterview?.id || 0,
            question_id: currentQuestion?.id || 210,
            duration: recordingDuration,
          });
          if (uploadRes?.success && uploadRes.fileUrl) {
            finalAudioUrl = uploadRes.fileUrl;
            setSessionAudioUrl(uploadRes.fileUrl);
            setSessionAudioUploaded(true);
          }
        } catch (upErr) {
          console.error('Upload on complete error:', upErr);
        }
      }

      const formattedAnswers = questions.map((q) => {
        const ans = answers[q.id] || { score: 0, answerText: '', remarks: '', duration: 0 };
        return {
          question_id: q.id,
          score: ans.score !== null ? ans.score : 0,
          answer_text: ans.answerText,
          remarks: ans.remarks,
          duration_seconds: ans.duration,
          recording_url: finalAudioUrl || sessionAudioUrl || ans.recordingUrl,
        };
      });

      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete_round',
          candidate_id: candidate.id,
          round: activeRound,
          recommendation,
          interviewer_summary: roundSummary,
          answers: formattedAnswers,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to complete interview round.');
      }

      const roundLabel = activeRound === 'hr' ? 'HR Round' : activeRound === 'department' ? 'Technical Round' : 'Practical Round';
      success(
        `${roundLabel} Completed Successfully!`,
        `Score Recorded • Recommendation: ${recommendation.toUpperCase()}`
      );

      onRoundComplete?.();
    } catch (err: unknown) {
      const e = err as Error;
      error('Submission Error', e.message);
    } finally {
      setSubmittingRound(false);
    }
  };

  // Submit Second Round Promotion & Schedule
  const handleSubmitSecondRound = async (secondRoundData: {
    department_id: number;
    department_name: string;
    role: string;
    interviewer: string;
    mode: string;
    scheduled_at: string;
    notes: string;
  }) => {
    setIsSubmittingSecondRound(true);
    try {
      let finalAudioUrl = sessionAudioUrl;
      if (isRecording) {
        stopRecording();
      }
      if (!finalAudioUrl && audioBlob) {
        try {
          const uploadRes = await uploadRecording('/api/interviews/recordings', {
            candidate_id: candidate.id,
            interview_id: roundInterview?.id || 0,
            question_id: currentQuestion?.id || 210,
            duration: recordingDuration,
          });
          if (uploadRes?.success && uploadRes.fileUrl) {
            finalAudioUrl = uploadRes.fileUrl;
            setSessionAudioUrl(uploadRes.fileUrl);
            setSessionAudioUploaded(true);
          }
        } catch (upErr) {
          console.error('Upload on promotion error:', upErr);
        }
      }

      const formattedAnswers = questions.map((q) => {
        const ans = answers[q.id] || { score: 0, answerText: '', remarks: '', duration: 0 };
        return {
          question_id: q.id,
          score: ans.score !== null ? ans.score : 0,
          answer_text: ans.answerText,
          remarks: ans.remarks,
          duration_seconds: ans.duration,
          recording_url: finalAudioUrl || sessionAudioUrl || ans.recordingUrl,
        };
      });

      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete_and_advance',
          candidate_id: candidate.id,
          round: 'hr',
          recommendation: 'recommended',
          interviewer_summary:
            roundSummary || `Passed HR Round with score ${totalScore}/100. Promoted to Second Round.`,
          answers: formattedAnswers,
          second_round: {
            department_id: secondRoundData.department_id,
            department_name: secondRoundData.department_name,
            scheduled_at: secondRoundData.scheduled_at,
            mode: secondRoundData.mode,
            interviewer_name: secondRoundData.interviewer,
            notes: secondRoundData.notes,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to advance candidate to second round.');
      }

      success(
        'Second Round Scheduled!',
        `${candidate.full_name} promoted to Second Round in ${secondRoundData.department_name} Department.`
      );

      setIsSecondRoundModalOpen(false);
      onRoundComplete?.();
    } catch (err: any) {
      error('Second Round Scheduling Error', err.message || 'Error advancing candidate');
    } finally {
      setIsSubmittingSecondRound(false);
    }
  };

  // Handle Add Question submission
  const handleAddQuestionSubmit = async () => {
    if (!newQuestionType) {
      error('Question Type Required', 'Please select a question type.');
      return;
    }
    if (!newQuestionText.trim()) {
      error('Question Text Required', 'Please write the question text.');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let optionsPayload: any = null;
    let correctAnswerPayload: any = null;

    if (newQuestionType === 'mcq') {
      if (!newOptionA.trim() || !newOptionB.trim()) {
        error('Options Required', 'Please provide at least Option A and Option B for MCQ.');
        return;
      }
      optionsPayload = {
        A: newOptionA.trim(),
        B: newOptionB.trim(),
        ...(newOptionC.trim() ? { C: newOptionC.trim() } : {}),
        ...(newOptionD.trim() ? { D: newOptionD.trim() } : {}),
      };
      correctAnswerPayload = newCorrectAnswer;
    } else if (newQuestionType === 'multiple_select') {
      if (!newOptionA.trim() || !newOptionB.trim()) {
        error('Options Required', 'Please provide at least Option A and Option B for Multiple Select.');
        return;
      }
      if (newMultipleCorrect.length === 0) {
        error('Correct Answer Required', 'Please select at least one correct option.');
        return;
      }
      optionsPayload = {
        A: newOptionA.trim(),
        B: newOptionB.trim(),
        ...(newOptionC.trim() ? { C: newOptionC.trim() } : {}),
        ...(newOptionD.trim() ? { D: newOptionD.trim() } : {}),
      };
      correctAnswerPayload = newMultipleCorrect.join(', ');
    } else if (newQuestionType === 'true_false') {
      optionsPayload = {
        A: 'True',
        B: 'False',
      };
      correctAnswerPayload = newTrueFalseAnswer;
    }

    setIsAddingQuestion(true);
    try {
      const res = await fetch('/api/interviews/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department_id: candidate.department_id || null,
          position_id: candidate.position_id || null,
          candidate_id: candidate.id,
          round_type: activeRound,
          question_type: newQuestionType,
          question_text: newQuestionText.trim(),
          options: optionsPayload,
          correct_answer: correctAnswerPayload,
          expected_answer_guidance: newGuidance.trim() || null,
          max_score: 10,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add question');
      }

      const createdQ: Question = data.data || {
        id: Date.now(),
        department_id: candidate.department_id || null,
        position_id: candidate.position_id || null,
        candidate_id: candidate.id,
        round_type: activeRound,
        round: activeRound,
        question_type: newQuestionType,
        question_text: newQuestionText.trim(),
        options: optionsPayload,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        correct_answer: correctAnswerPayload as any,
        expected_answer_guidance: newGuidance.trim() || null,
        max_score: 10,
        time_limit_seconds: 180,
        weight: 1,
        is_active: true,
      };

      const nextIndex = questions.length;
      setQuestions((prev) => [...prev, createdQ]);
      setCurrentQIndex(nextIndex);

      // Reset modal state
      setIsAddQuestionModalOpen(false);
      setNewQuestionType('');
      setNewQuestionText('');
      setNewOptionA('');
      setNewOptionB('');
      setNewOptionC('');
      setNewOptionD('');
      setNewCorrectAnswer('A');
      setNewMultipleCorrect(['A']);
      setNewTrueFalseAnswer('True');
      setNewGuidance('');

      success(
        'Question Added',
        `Question ${nextIndex + 1} added to interview! Now displaying on screen.`
      );
    } catch (err: unknown) {
      const e = err as Error;
      error('Error Adding Question', e.message || 'Failed to add question');
    } finally {
      setIsAddingQuestion(false);
    }
  };

  // Helper to render MCQ / Multiple Select / True-False options cleanly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderQuestionOptions = (options: any, correctAnswer?: string | null, questionType?: string) => {
    if (!options && questionType !== 'true_false') return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: any = options;
    if (typeof options === 'string') {
      try {
        parsed = JSON.parse(options);
      } catch {
        // fallback
      }
    }

    if (questionType === 'true_false' && !parsed) {
      parsed = { A: 'True', B: 'False' };
    }

    const items: { key: string; text: string }[] = [];
    if (Array.isArray(parsed)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      parsed.forEach((opt: any, i: number) => {
        if (typeof opt === 'object' && opt !== null) {
          items.push({ key: opt.key || String.fromCharCode(65 + i), text: opt.text || '' });
        } else {
          items.push({ key: String.fromCharCode(65 + i), text: String(opt) });
        }
      });
    } else if (typeof parsed === 'object' && parsed !== null) {
      Object.entries(parsed).forEach(([k, v]) => {
        items.push({ key: k, text: String(v) });
      });
    }

    if (items.length === 0) return null;

    // Standardize correct keys (e.g. ['B'] or ['A', 'C'])
    const rawCorrectList = correctAnswer
      ? String(correctAnswer)
          .split(',')
          .map((s) => s.trim().toUpperCase())
      : [];

    const correctKeys: string[] = [];
    items.forEach((opt) => {
      const k = opt.key.toUpperCase();
      const txt = opt.text.toUpperCase();
      if (rawCorrectList.includes(k) || rawCorrectList.includes(txt)) {
        correctKeys.push(k);
      }
    });

    // Extract keys chosen by candidate
    const candidateSelectedKeys: string[] = [];
    if (currentAnswer.answerText) {
      const trimmed = currentAnswer.answerText.trim();
      const parts = trimmed.split(',').map((s) => s.trim().toUpperCase());
      items.forEach((opt) => {
        const k = opt.key.toUpperCase();
        if (
          parts.includes(k) ||
          trimmed.toUpperCase().startsWith(`${k}:`) ||
          trimmed.toUpperCase() === k ||
          trimmed.toLowerCase() === opt.text.toLowerCase()
        ) {
          candidateSelectedKeys.push(k);
        }
      });
    }

    const isQuestionSubmitted = Boolean(
      currentQuestion &&
        (submittedQuestions[currentQuestion.id] ||
          (currentAnswer.score !== null && currentAnswer.score !== undefined))
    );

    const isTechnicalOrPractical = activeRound === 'department' || activeRound === 'final';

    const hasSelection = candidateSelectedKeys.length > 0;
    const isAllCorrect =
      hasSelection &&
      correctKeys.length > 0 &&
      candidateSelectedKeys.length === correctKeys.length &&
      candidateSelectedKeys.every((k) => correctKeys.includes(k));

    const isIncorrect = hasSelection && !isAllCorrect;

    // Handle candidate answer submission
    const handleOptionSubmit = () => {
      if (!currentQuestion) return;
      if (!hasSelection) {
        error('Select Answer', 'Please choose an option before submitting.');
        return;
      }
      setSubmittedQuestions((prev) => ({ ...prev, [currentQuestion.id]: true }));
      const qMax = currentQuestion?.max_score ?? 1;
      const awardedScore = isAllCorrect ? qMax : 0;
      handleScoreChange(awardedScore);

      if (isTechnicalOrPractical) {
        success('Answer Saved', `Option ${candidateSelectedKeys.join(', ')} recorded.`);
      } else {
        if (isAllCorrect) {
          success('Correct Answer!', `Candidate selected the correct answer (Option ${candidateSelectedKeys.join(', ')}). ${qMax} mark${qMax > 1 ? 's' : ''} awarded.`);
        } else {
          error(
            'Incorrect Answer',
            `Candidate selected Option ${candidateSelectedKeys.join(', ')}. The correct answer is Option ${correctKeys.join(', ')} (revealed in green).`
          );
        }
      }
    };

    return (
      <div className="mt-3.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {questionType === 'multiple_select'
              ? 'Multiple Select Options:'
              : questionType === 'true_false'
              ? 'True / False Options:'
              : 'Options (Click to select candidate answer):'}
          </p>

          <div className="flex items-center gap-2">
            {questionType === 'multiple_select' && (
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                Multi-Select
              </span>
            )}

            {!isTechnicalOrPractical && !isQuestionSubmitted && correctKeys.length > 0 && (
              <button
                type="button"
                onClick={() => setShowCorrectAnswer((prev) => !prev)}
                className="text-[11px] font-bold flex items-center gap-1.5 px-2 py-0.5 rounded-md text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs transition-all"
                title="Hidden from candidate. Click to reveal answer for interviewer only."
              >
                {showCorrectAnswer ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                    <span>Hide Answer</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Reveal Answer</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {items.map((opt) => {
            const optKeyUpper = opt.key.toUpperCase();
            const isOptSelected = candidateSelectedKeys.includes(optKeyUpper);
            const isOptCorrect = correctKeys.includes(optKeyUpper);

            let cardClass = '';
            let badgeCircleClass = '';
            let statusBadge = null;

            if (isTechnicalOrPractical) {
              // During Technical and Practical rounds: never leak right/wrong answers while test is ongoing
              if (isOptSelected) {
                cardClass =
                  'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 shadow-2xs font-semibold ring-2 ring-blue-500/30';
                badgeCircleClass = 'bg-blue-600 text-white';
                statusBadge = (
                  <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-md shrink-0">
                    Candidate Ans
                  </span>
                );
              } else {
                cardClass =
                  'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600';
                badgeCircleClass = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
              }
            } else if (isQuestionSubmitted && hasSelection) {
              if (isOptSelected && !isOptCorrect) {
                // INCORRECT CANDIDATE SELECTION -> RED
                cardClass =
                  'border-rose-500 bg-rose-50/90 dark:bg-rose-950/50 text-rose-950 dark:text-rose-100 ring-2 ring-rose-500/40 shadow-xs font-semibold';
                badgeCircleClass = 'bg-rose-600 text-white';
                statusBadge = (
                  <span className="text-[10px] font-black text-rose-700 dark:text-rose-200 bg-rose-100 dark:bg-rose-900/80 px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1 border border-rose-300 dark:border-rose-800">
                    <X className="w-3 h-3 stroke-[3]" /> Candidate Ans (Incorrect)
                  </span>
                );
              } else if (isOptSelected && isOptCorrect) {
                // CORRECT CANDIDATE SELECTION -> GREEN
                cardClass =
                  'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/40 shadow-xs font-semibold';
                badgeCircleClass = 'bg-emerald-600 text-white';
                statusBadge = (
                  <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-900/80 px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
                    <Check className="w-3 h-3 stroke-[3]" /> Correct (Candidate Ans)
                  </span>
                );
              } else if (!isOptSelected && isOptCorrect) {
                // CORRECT ANSWER REVEALED IN GREEN
                cardClass =
                  'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/30 shadow-xs font-semibold animate-in fade-in duration-300';
                badgeCircleClass = 'bg-emerald-600 text-white';
                statusBadge = (
                  <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-900/80 px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
                    <Check className="w-3 h-3 stroke-[3]" /> Correct Answer
                  </span>
                );
              } else {
                cardClass =
                  'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500 opacity-60';
                badgeCircleClass = 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500';
              }
            } else {
              // NOT SUBMITTED YET
              if (isOptSelected) {
                cardClass =
                  'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 shadow-2xs font-semibold ring-2 ring-blue-500/30';
                badgeCircleClass = 'bg-blue-600 text-white';
                statusBadge = (
                  <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-md shrink-0">
                    Candidate Ans
                  </span>
                );
              } else if (showCorrectAnswer && isOptCorrect) {
                cardClass =
                  'border-emerald-500/60 bg-emerald-50/60 dark:bg-emerald-950/30 text-slate-900 dark:text-white font-semibold';
                badgeCircleClass = 'bg-emerald-600 text-white';
                statusBadge = (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-900/40 px-2 py-0.5 rounded-md shrink-0">
                    Correct
                  </span>
                );
              } else {
                cardClass =
                  'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600';
                badgeCircleClass = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
              }
            }

            return (
              <div
                key={opt.key}
                onClick={() => {
                  if (isQuestionSubmitted) {
                    setSubmittedQuestions((prev) => ({ ...prev, [currentQuestion.id]: false }));
                  }

                  if (questionType === 'multiple_select') {
                    const existing = currentAnswer.answerText ? currentAnswer.answerText.split(', ') : [];
                    let updated: string[];
                    if (existing.includes(opt.key)) {
                      updated = existing.filter((k) => k !== opt.key);
                    } else {
                      updated = [...existing, opt.key];
                    }
                    handleAnswerTextChange(updated.sort().join(', '));
                  } else {
                    handleAnswerTextChange(`${opt.key}: ${opt.text}`);
                  }
                }}
                className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 transition-all cursor-pointer ${cardClass}`}
              >
                <span
                  className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0 transition-colors ${badgeCircleClass}`}
                >
                  {opt.key}
                </span>

                <span className="flex-1 font-medium leading-snug">{opt.text}</span>

                {statusBadge}
              </div>
            );
          })}
        </div>

        {/* Action & Feedback Banner */}
        {!isQuestionSubmitted && hasSelection && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 transition-all">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
              <span className="text-xs text-blue-900 dark:text-blue-200">
                Candidate selected: <strong className="font-bold underline decoration-blue-400">Option {candidateSelectedKeys.join(', ')}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleOptionSubmit}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Answer</span>
            </button>
          </div>
        )}

        {/* Neutral Answer Recorded Banner for Technical and Practical rounds */}
        {isTechnicalOrPractical && isQuestionSubmitted && hasSelection && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 transition-all">
            <div className="flex items-center gap-2 text-xs text-slate-800 dark:text-slate-200">
              <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/70 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span className="text-xs">
                Answer Recorded: <strong className="font-bold text-blue-600 dark:text-blue-400">Option {candidateSelectedKeys.join(', ')}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSubmittedQuestions((prev) => ({ ...prev, [currentQuestion.id]: false }));
              }}
              className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer shrink-0 ml-2"
            >
              Change Answer
            </button>
          </div>
        )}

        {/* Feedback Banners for non-technical/practical rounds */}
        {!isTechnicalOrPractical && isQuestionSubmitted && hasSelection && isIncorrect && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 transition-all">
            <div className="flex items-center gap-2.5 text-xs text-rose-900 dark:text-rose-200">
              <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/70 flex items-center justify-center shrink-0">
                <X className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 stroke-[3]" />
              </div>
              <div>
                <p className="font-bold">Incorrect Answer!</p>
                <p className="text-[11px] text-rose-700 dark:text-rose-300">
                  Candidate selected <span className="font-bold">Option {candidateSelectedKeys.join(', ')}</span>. The correct answer is <span className="font-bold underline decoration-emerald-500 text-emerald-700 dark:text-emerald-300">Option {correctKeys.join(', ')}</span> (revealed in green above).
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSubmittedQuestions((prev) => ({ ...prev, [currentQuestion.id]: false }));
              }}
              className="text-xs font-bold text-rose-700 dark:text-rose-300 hover:underline cursor-pointer shrink-0 ml-2"
            >
              Change Answer
            </button>
          </div>
        )}

        {!isTechnicalOrPractical && isQuestionSubmitted && hasSelection && isAllCorrect && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 transition-all">
            <div className="flex items-center gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
              <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/70 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
              </div>
              <div>
                <p className="font-bold">Correct Answer!</p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  Candidate selected <span className="font-bold">Option {candidateSelectedKeys.join(', ')}</span>. {currentQuestion?.max_score ?? 1} mark{(currentQuestion?.max_score ?? 1) > 1 ? 's' : ''} automatically awarded.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSubmittedQuestions((prev) => ({ ...prev, [currentQuestion.id]: false }));
              }}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer shrink-0 ml-2"
            >
              Change Answer
            </button>
          </div>
        )}
      </div>
    );

  };

  const isFirstQuestion = currentQIndex === 0;
  const isLastQuestion = currentQIndex === questions.length - 1;
  const activeSectionNumber: 'A' | 'B' = currentQIndex < 5 ? 'A' : 'B';

  // Render the Round Evaluation Summary Form (matches user screenshot)
  const renderEvaluationSummaryForm = () => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
        {roundName} Evaluation Summary
      </h4>

      {/* Total Live Score Summary Card */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shadow-sm">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100">
            Total Score
          </span>
          <div className="text-xl font-black mt-0.5">
            {totalScore} <span className="text-xs font-normal text-blue-200">/ {maxPossibleScore}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-black">{percentageScore}%</div>
          <span className="text-[10px] text-blue-200">
            {percentageScore >= 60 ? 'Passed (≥ 60%)' : 'Needs Review (< 60%)'}
          </span>
        </div>
      </div>

      {/* Recommendation Options */}
      <div>
        <label className="block text-xs text-slate-500 mb-1.5 font-medium">
          {activeRound === 'department' ? 'Technical' : activeRound === 'final' ? 'Practical' : 'HR'} Recommendation
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => setRecommendation('recommended')}
            className={`py-2 text-xs font-bold rounded-lg border transition-all ${
              recommendation === 'recommended'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Pass
          </button>
          <button
            type="button"
            onClick={() => setRecommendation('hold')}
            className={`py-2 text-xs font-bold rounded-lg border transition-all ${
              recommendation === 'hold'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Hold
          </button>
          <button
            type="button"
            onClick={() => setRecommendation('rejected')}
            className={`py-2 text-xs font-bold rounded-lg border transition-all ${
              recommendation === 'rejected'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Reject
          </button>
        </div>
      </div>

      {/* Round Executive Summary Notes */}
      <div>
        <label className="block text-xs text-slate-500 mb-1 font-medium">
          Interviewer Overall Remarks
        </label>
        <textarea
          rows={3}
          value={roundSummary}
          onChange={(e) => setRoundSummary(e.target.value)}
          placeholder="Summary of candidate communication, motivation, attitude, and fit..."
          className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
        {activeRound === 'hr' ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="md"
              className="w-full sm:flex-1"
              isLoading={submittingRound}
              icon={<Send className="w-4 h-4 text-slate-600 dark:text-slate-300" />}
              onClick={handleCompleteRound}
              title="Submit and finish HR Round"
            >
              Submit
            </Button>

            <Button
              type="button"
              variant="primary"
              size="md"
              className="w-full sm:flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-md shadow-blue-500/20"
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={() => setIsSecondRoundModalOpen(true)}
              title="Select department and schedule Round 2"
            >
              Go for Second Round
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="primary"
            size="md"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-md shadow-blue-500/20"
            isLoading={submittingRound}
            icon={<Send className="w-4 h-4 text-white" />}
            onClick={handleCompleteRound}
            title={activeRound === 'final' ? 'Submit and proceed to Interview Results' : `Submit and finish ${roundName}`}
          >
            {activeRound === 'final' ? 'Submit & View Interview Results' : `Submit ${roundName} Evaluation`}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* 1. Industry-Grade Candidate Dossier Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {candidate.full_name}
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {candidate.candidate_code || `CAN-${candidate.id}`}
              </span>
              <Badge status={candidate.application_status} size="sm" />
            </div>

            {/* Candidate Metadata Strip */}
            <div className="flex items-center gap-x-5 gap-y-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Department:</span>
                <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                  {candidate.department_name || 'General'}
                </strong>
              </span>

              <span className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                <span>Role:</span>
                <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                  {candidate.position_title || 'Applicant'}
                </strong>
              </span>

              {candidate.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{candidate.email}</span>
                </span>
              )}

              {candidate.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{candidate.phone}</span>
                </span>
              )}

              <span className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-slate-400" />
                <span>Experience:</span>
                <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                  {candidate.experience_years ? `${candidate.experience_years} yrs` : candidate.candidate_type || 'Fresher'}
                </strong>
              </span>
            </div>
          </div>

          {/* Quick Score Metric Card & Add Que Button */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
              onClick={() => setIsAddQuestionModalOpen(true)}
              className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600 font-bold text-slate-800 dark:text-slate-100 shadow-xs cursor-pointer"
            >
              Add Que
            </Button>

            <div className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-3 text-right">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Round Progress</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  {scoredCount} / {questions.length} Evaluated
                </p>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Score</p>
                <p className="text-base font-black text-blue-600 dark:text-blue-400">
                  {totalScore} <span className="text-xs text-slate-400">/ {maxPossibleScore}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* 2. Industry-Grade Continuous Audio Recorder */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
        {/* State A: Question 1 — Initial Start */}
        {isFirstQuestion && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                  isRecording
                    ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                    : audioUrl
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    : 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                }`}
              >
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {isRecording
                      ? `Continuous ${roundName} Recording Active (Q1 of ${questions.length})`
                      : audioUrl
                      ? `${roundName} Audio Recording Captured`
                      : `${roundName} Audio Session Recorder (Question 1)`}
                  </h4>
                  {isRecording && (
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 animate-pulse">
                      ● LIVE RECORDING
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isRecording
                    ? `Elapsed: ${formatDuration(recordingDuration)} • Continuous recording running across all ${questions.length} questions. Stop available on Question ${questions.length}.`
                    : audioUrl
                    ? `Session audio recorded (${formatDuration(recordingDuration)}). Linked to candidate interview dossier.`
                    : `Press Start Recording on this 1st question to record the entire candidate interview. Stops on Question ${questions.length}.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              {!isRecording && !audioUrl && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  icon={<Mic className="w-3.5 h-3.5" />}
                  onClick={startRecording}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-500/20"
                >
                  Start Recording (Q1 to Q{questions.length})
                </Button>
              )}

              {isRecording && (
                <div className="flex items-center gap-2">
                  {isPaused ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={<Play className="w-3.5 h-3.5" />}
                      onClick={resumeRecording}
                    >
                      Resume
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={<Pause className="w-3.5 h-3.5" />}
                      onClick={pauseRecording}
                    >
                      Pause
                    </Button>
                  )}
                  <span
                    className="text-[11px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg cursor-not-allowed"
                    title={`Stop is enabled on Question ${questions.length}`}
                  >
                    Stops on Question {questions.length}
                  </span>
                </div>
              )}

              {audioUrl && (
                <div className="flex items-center gap-2">
                  <audio src={audioUrl} controls className="h-8 max-w-[220px]" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={<RotateCcw className="w-3.5 h-3.5" />}
                    onClick={resetRecording}
                  >
                    Re-record
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* State B: Questions 2 to 9 — Persistent Background Recording */}
        {!isFirstQuestion && !isLastQuestion && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isRecording
                    ? 'bg-rose-500 text-white animate-pulse'
                    : audioUrl
                    ? 'bg-emerald-500 text-white'
                    : 'bg-amber-500 text-white'
                }`}
              >
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {isRecording
                      ? `Continuous Recording Active • Question ${currentQIndex + 1} of ${questions.length}`
                      : audioUrl
                      ? 'Session Audio Captured'
                      : 'Session Audio Not Started'}
                  </span>
                  {isRecording && (
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                      {formatDuration(recordingDuration)}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isRecording
                    ? `Recording continues uninterrupted. Stop and review will be available on Question ${questions.length}.`
                    : audioUrl
                    ? 'Audio recording completed.'
                    : 'Session recording was not started on Question 1. You can start it now to capture remaining answers.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              {isRecording && (
                <>
                  {isPaused ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={<Play className="w-3.5 h-3.5" />}
                      onClick={resumeRecording}
                    >
                      Resume
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={<Pause className="w-3.5 h-3.5" />}
                      onClick={pauseRecording}
                    >
                      Pause
                    </Button>
                  )}
                  <span className="text-[11px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                    Stops on Q{questions.length}
                  </span>
                </>
              )}

              {!isRecording && !audioUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={<Mic className="w-3.5 h-3.5 text-rose-500" />}
                  onClick={startRecording}
                >
                  Start Recording Now
                </Button>
              )}

              {audioUrl && <audio src={audioUrl} controls className="h-8 max-w-[200px]" />}
            </div>
          </div>
        )}

        {/* State C: Question 10 — Stop and Finalize */}
        {isLastQuestion && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-rose-50/70 via-rose-50/30 to-transparent dark:from-rose-950/30 dark:to-transparent p-3 rounded-xl border border-rose-200/80 dark:border-rose-900/60">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-bounce'
                    : audioUrl
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-300 dark:bg-slate-700 text-slate-600'
                }`}
              >
                {isRecording ? <Square className="w-4 h-4 fill-white" /> : <Mic className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {isRecording
                      ? `Question ${questions.length} (Last Question) — Stop Session Recording`
                      : audioUrl
                      ? `${roundName} Audio Recording Completed`
                      : `Question ${questions.length} (Final Question)`}
                  </h4>
                  {isRecording && (
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-rose-600 text-white animate-pulse">
                      {formatDuration(recordingDuration)}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isRecording
                    ? 'Candidate is answering the final question. When completed, click Stop Recording to save the full session audio.'
                    : audioUrl
                    ? `Full ${questions.length}-question recording saved (${formatDuration(recordingDuration)}). Attached to this round.`
                    : 'Session recording was not started during this round.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              {isRecording && (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  icon={<Square className="w-3.5 h-3.5 fill-current" />}
                  onClick={stopRecording}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/30"
                >
                  Stop Recording
                </Button>
              )}

              {audioUrl && (
                <div className="flex items-center gap-2 flex-wrap">
                  <audio src={audioUrl} controls className="h-8 max-w-[220px]" />
                  {!sessionAudioUploaded ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      isLoading={isUploadingAudio}
                      icon={<Upload className="w-3.5 h-3.5 text-blue-600" />}
                      onClick={handleUploadAudio}
                    >
                      Save Audio
                    </Button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-bold">
                      <CheckCircle2 className="w-4 h-4" /> Audio Attached
                    </span>
                  )}
                </div>
              )}

              {!isRecording && !audioUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={<Mic className="w-3.5 h-3.5" />}
                  onClick={startRecording}
                >
                  Start Recording
                </Button>
              )}
            </div>
          </div>
        )}

        {recorderError && (
          <p className="mt-2 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{recorderError}</span>
          </p>
        )}
      </div>

      {/* 3. Main Evaluation Arena */}
      {loading ? (
        <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-blue-600 border-t-transparent mb-2" />
          <p className="text-xs text-slate-500 font-medium">Loading {roundName.toLowerCase()} questions and rubric...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No questions configured for {roundName.toLowerCase()}.
          </p>
        </div>
      ) : isSummaryView ? (
        /* State 2: All 10 Questions Completed — Full Evaluation Summary Mode */
        <div className="space-y-6">
          {/* Summary Header Banner */}
          <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/20 rounded-2xl border border-blue-500/30 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {questions.length} of {questions.length} Questions Evaluated
                </span>
                <span className="text-xs text-slate-300">
                  • Total Score: <strong className="text-white font-bold">{totalScore}/{questions.length * 10} ({percentageScore}%)</strong>
                </span>
              </div>
              <h3 className="text-base font-bold text-white">
                {roundName} Evaluation Summary &amp; Recommendation
              </h3>
              <p className="text-xs text-slate-400">
                All {questions.length} questions have been evaluated. Review candidate responses below, record your final recommendation, and submit.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<ChevronLeft className="w-4 h-4" />}
                onClick={() => setIsSummaryView(false)}
                className="shrink-0"
              >
                Review Questions One-by-One
              </Button>
              {activeRound === 'final' && (
                <Link
                  href="/hr/decisions"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Interview Results &rarr;</span>
                </Link>
              )}
            </div>
          </div>

          {/* Summary 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column (2 Cols): 10-Question Scorecard Review */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      {questions.length}-Question Scorecard Breakdown
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Review awarded marks and candidate notes. Click Edit on any question to adjust.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                    Total: {totalScore} / {questions.length * 10}
                  </span>
                </div>

                {/* Unified Questions Breakdown */}
                <div className="space-y-2.5">
                  {questions.map((q, idx) => {
                    const ans = answers[q.id];
                    return (
                      <div
                        key={q.id}
                        className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            Q{idx + 1}. {q.question_text}
                          </p>
                          {ans?.answerText && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 italic line-clamp-2">
                              &ldquo;{ans.answerText}&rdquo;
                            </p>
                          )}
                          {ans?.remarks && (
                            <p className="text-[11px] text-slate-500">
                              Remarks: {ans.remarks}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {ans?.score !== null && ans?.score !== undefined ? `${ans.score}/10` : '0/10'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentQIndex(idx);
                              setIsSummaryView(false);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-bold px-2 py-1 hover:underline"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column (1 Col): HR Round Evaluation Summary Form */}
            <div>
              {renderEvaluationSummaryForm()}
            </div>
          </div>
        </div>
      ) : (
        /* State 1: Question-by-Question Evaluation Mode */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 Cols): Active Question & Manual Scoring */}
          <div className="lg:col-span-2 space-y-5">
            {/* Question Card */}
            {currentQuestion && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
                {/* Header Tag */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold text-xs">
                      Question {currentQIndex + 1} of {questions.length}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold text-[11px] border border-slate-200 dark:border-slate-700 uppercase tracking-wide">
                      {currentQuestion.question_type === 'mcq'
                        ? 'MCQ'
                        : currentQuestion.question_type === 'scenario_based' || currentQuestion.question_type === 'scenario_base' || currentQuestion.question_type === 'scenario'
                        ? 'Scenario Based'
                        : currentQuestion.question_type === 'short_answer' || currentQuestion.question_type === 'short_ans'
                        ? 'Short Ans'
                        : currentQuestion.question_type}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentAnswer.score !== null && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Scored
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-medium">Max: 10 pts</span>
                  </div>
                </div>

                {/* Question Prompt */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                    {currentQuestion.question_text}
                  </h3>

                  {/* Render Options if MCQ / Multiple Select / True-False */}
                  {renderQuestionOptions(currentQuestion.options, currentQuestion.correct_answer, currentQuestion.question_type)}

                  {/* Interviewer Rubric / Evaluation Guidance */}
                  {currentQuestion.expected_answer_guidance && (
                    <div className="mt-3.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                      <p className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                        <span>Evaluation Rubric &amp; What to Look For:</span>
                      </p>
                      <p className="leading-relaxed pl-5">{currentQuestion.expected_answer_guidance}</p>
                    </div>
                  )}
                </div>


              </div>
            )}

            {/* Manual Marks & Feedback Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Assign Manual Marks
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Score candidate answer from 0 to {currentQuestion?.max_score ?? 10} points
                  </p>
                </div>
                {currentAnswer.score !== null && (
                  <span className="px-3 py-1 rounded-lg text-xs font-black bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                    Awarded: {currentAnswer.score} / {currentQuestion?.max_score ?? 10}
                  </span>
                )}
              </div>

              {/* Score Buttons (0 to max_score) */}
              <ScoreForm score={currentAnswer.score} maxScore={currentQuestion?.max_score ?? 10} onScoreChange={handleScoreChange} />

              {/* Specific Question Remarks */}
              <RemarksField value={currentAnswer.remarks} onChange={handleRemarksChange} />

              {/* Navigation Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentQIndex <= 0}
                  onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
                  icon={<ChevronLeft className="w-4 h-4" />}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    isLoading={savingAnswer}
                    icon={<Save className="w-4 h-4" />}
                    onClick={() => saveCurrentAnswer(false, false)}
                  >
                    Save Progress
                  </Button>

                  {isLastQuestion ? (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      isLoading={savingAnswer}
                      icon={<CheckCircle2 className="w-4 h-4" />}
                      onClick={() => saveCurrentAnswer(false, true)}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-md shadow-blue-500/20"
                    >
                      Complete All {questions.length} Questions &amp; View Summary
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      isLoading={savingAnswer}
                      icon={<ChevronRight className="w-4 h-4" />}
                      onClick={() => {
                        const isRecordingActive = isRecording || isPaused || recordingDuration > 0 || Boolean(audioUrl) || Boolean(sessionAudioUrl);
                        if (currentQIndex === 0 && !isRecordingActive) {
                          error('Recording Required', 'Please start the audio recording on Question 1 before moving forward to the 2nd question.');
                          return;
                        }
                        saveCurrentAnswer(true, false);
                      }}
                    >
                      Save &amp; Next
                    </Button>
                  )}

                  {unansweredIndices.length === 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsSummaryView(true)}
                      className="border-blue-600 text-blue-600 dark:text-blue-400 font-bold"
                    >
                      View Summary &rarr;
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (1 Col): 10 Questions Checklist, Progress & Evaluation Summary */}
          <div className="space-y-5">
            {/* Question Quick Jump Navigator */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Question Navigator
                </h4>
                <span className="text-[11px] text-slate-400 font-medium">
                  {questions.length} Total
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {questions.map((q, idx) => {
                  const ans = answers[q.id];
                  const isScored = ans && ans.score !== null && ans.score !== undefined;
                  const isActive = idx === currentQIndex;
                  return (
                    <button
                      key={q.id || idx}
                      type="button"
                      onClick={() => setCurrentQIndex(idx)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                        isActive
                          ? 'ring-2 ring-blue-500 bg-blue-600 text-white shadow-sm'
                          : isScored
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                      title={`Q${idx + 1}: ${isScored ? `Scored (${ans.score}/${q.max_score ?? 10})` : 'Pending'}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Round Progress Card (Shown while answering questions) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {roundName} Progress
                </h4>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {scoredCount} / {questions.length} Scored
                </span>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(scoredCount / Math.max(1, questions.length)) * 100}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                {scoredCount === questions.length
                  ? `All ${questions.length} questions evaluated! You can now review the Evaluation Summary form below.`
                  : `Evaluate each question one by one (${questions.length - scoredCount} remaining). After completing all ${questions.length} questions, the ${roundName} Evaluation Summary form will unlock to submit your recommendation.`}
              </p>

              {scoredCount === questions.length && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setIsSummaryView(true)}
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-md shadow-blue-500/20"
                >
                  Open Full {roundName} Evaluation Summary
                </Button>
              )}
            </div>

            {/* ONLY visible after completing all 10 questions */}
            {unansweredIndices.length === 0 && scoredCount === questions.length && (
              renderEvaluationSummaryForm()
            )}
          </div>
        </div>
      )}

      {/* Second Round Scheduling Modal (Department Selection & Date/Time Scheduling) */}
      <SecondRoundModal
        isOpen={isSecondRoundModalOpen}
        onClose={() => setIsSecondRoundModalOpen(false)}
        candidate={candidate}
        hrRoundScore={totalScore}
        percentageScore={percentageScore}
        onSubmitSecondRound={handleSubmitSecondRound}
        isLoading={isSubmittingSecondRound}
      />

      {/* Add Question Modal */}
      <Modal
        isOpen={isAddQuestionModalOpen}
        onClose={() => {
          setIsAddQuestionModalOpen(false);
          setNewQuestionType('');
          setNewQuestionText('');
          setNewOptionA('');
          setNewOptionB('');
          setNewOptionC('');
          setNewOptionD('');
          setNewCorrectAnswer('A');
          setNewMultipleCorrect(['A']);
          setNewTrueFalseAnswer('True');
          setNewGuidance('');
        }}
        title="Add Que"
        description={`Add a new question to this candidate's ${roundName}.`}
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddQuestionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              isLoading={isAddingQuestion}
              onClick={handleAddQuestionSubmit}
              disabled={!newQuestionType || !newQuestionText.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
            >
              Add Que
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* 1. Select Que Type Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Que Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={newQuestionType}
              onChange={(e) => {
                setNewQuestionType(e.target.value);
                setNewCorrectAnswer('A');
                setNewMultipleCorrect(['A']);
                setNewTrueFalseAnswer('True');
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="">-- Select Question Type --</option>
              {availableQuestionTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* 2. When one of them is selected: show heading "Write Question" */}
          {newQuestionType && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Write Question <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  placeholder="Write question..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* If MCQ is selected: show Options A, B, C, D & Single Correct Answer */}
              {newQuestionType === 'mcq' && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Options &amp; Correct Answer
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Option A <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newOptionA}
                        onChange={(e) => setNewOptionA(e.target.value)}
                        placeholder="Enter Option A"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Option B <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newOptionB}
                        onChange={(e) => setNewOptionB(e.target.value)}
                        placeholder="Enter Option B"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Option C (Optional)
                      </label>
                      <input
                        type="text"
                        value={newOptionC}
                        onChange={(e) => setNewOptionC(e.target.value)}
                        placeholder="Enter Option C"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Option D (Optional)
                      </label>
                      <input
                        type="text"
                        value={newOptionD}
                        onChange={(e) => setNewOptionD(e.target.value)}
                        placeholder="Enter Option D"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                      Correct Answer
                    </label>
                    <div className="flex items-center gap-4">
                      {['A', 'B', 'C', 'D'].map((opt) => (
                        <label key={opt} className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-300">
                          <input
                            type="radio"
                            name="newCorrectAnswer"
                            value={opt}
                            checked={newCorrectAnswer === opt}
                            onChange={() => setNewCorrectAnswer(opt)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span>Option {opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* If Multiple Select is selected: show Options A, B, C, D & Checkbox for Multiple Correct Answers */}
              {newQuestionType === 'multiple_select' && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Options &amp; Correct Answers
                    </p>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                      Check all correct
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Option A <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newOptionA}
                        onChange={(e) => setNewOptionA(e.target.value)}
                        placeholder="Enter Option A"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Option B <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newOptionB}
                        onChange={(e) => setNewOptionB(e.target.value)}
                        placeholder="Enter Option B"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Option C (Optional)
                      </label>
                      <input
                        type="text"
                        value={newOptionC}
                        onChange={(e) => setNewOptionC(e.target.value)}
                        placeholder="Enter Option C"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Option D (Optional)
                      </label>
                      <input
                        type="text"
                        value={newOptionD}
                        onChange={(e) => setNewOptionD(e.target.value)}
                        placeholder="Enter Option D"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                      Correct Answers (Select all that apply) <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-4">
                      {['A', 'B', 'C', 'D'].map((opt) => (
                        <label key={opt} className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={newMultipleCorrect.includes(opt)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewMultipleCorrect((prev) => [...prev, opt]);
                              } else {
                                setNewMultipleCorrect((prev) => prev.filter((x) => x !== opt));
                              }
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span>Option {opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* If True/False is selected: show Radio for True or False */}
              {newQuestionType === 'true_false' && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Correct Answer
                  </p>
                  <div className="flex items-center gap-6">
                    {['True', 'False'].map((val) => (
                      <label key={val} className="flex items-center gap-2 text-xs font-bold cursor-pointer text-slate-700 dark:text-slate-300">
                        <input
                          type="radio"
                          name="newTrueFalseAnswer"
                          value={val}
                          checked={newTrueFalseAnswer === val}
                          onChange={() => setNewTrueFalseAnswer(val)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className={val === 'True' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          {val}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Evaluation Rubric / Guidance (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Evaluation Rubric / What to Look For (Optional)
                </label>
                <input
                  type="text"
                  value={newGuidance}
                  onChange={(e) => setNewGuidance(e.target.value)}
                  placeholder="e.g. Look for problem solving approach and domain knowledge..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
