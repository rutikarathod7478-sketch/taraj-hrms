'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/feedback/ToastProvider';
import {
  Plus,
  HelpCircle,
  BookOpen,
  Layers,
  Award,
  Sparkles,
  Filter,
  CheckCircle2,
  User,
  Building2,
  FileText,
  AlertCircle,
  Check,
  Code2,
  CheckSquare,
  ListOrdered,
  HelpCircle as QuestionIcon
} from 'lucide-react';
import { DEPARTMENTS_CONFIG } from '@/features/departments/department.config';

interface QuestionItem {
  id: number;
  department_id: number | null;
  department_name?: string;
  position_id: number | null;
  position_title?: string;
  candidate_id?: number | null;
  candidate_name?: string;
  candidate_code?: string;
  round_type: string;
  question_type: string;
  question_text: string;
  options?: any;
  correct_answer?: string | null;
  max_score: number;
  expected_answer_guidance?: string | null;
  is_active: number;
}

export default function QuestionBankPage() {
  const { showToast } = useToast();
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [roundFilter, setRoundFilter] = useState<'all' | 'hr' | 'technical' | 'practical'>('all');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Question Form State
  const [roundType, setRoundType] = useState<'hr' | 'tech' | 'practical'>('hr');
  const [questionType, setQuestionType] = useState('mcq');
  const [departmentId, setDepartmentId] = useState('');
  const [candidateId, setCandidateId] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [maxScore, setMaxScore] = useState('10');
  const [expectedGuidance, setExpectedGuidance] = useState('');

  // Options for MCQ / Multiple Select
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctAnswerSingle, setCorrectAnswerSingle] = useState('A');
  const [correctAnswerMulti, setCorrectAnswerMulti] = useState<string[]>(['A']);
  const [trueFalseAnswer, setTrueFalseAnswer] = useState<'True' | 'False'>('True');

  // Load questions
  const loadQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/interviews/questions');
      const data = await res.json();
      if (res.ok && data.data) {
        setQuestions(data.data);
      }
    } catch (e) {
      console.error('Failed to load questions', e);
      showToast('Failed to load question repository', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load candidates and interviews for eligibility filtering
  const loadCandidateData = async () => {
    try {
      const [candRes, ivRes] = await Promise.all([
        fetch('/api/candidates?limit=100'),
        fetch('/api/interviews')
      ]);
      const candData = await candRes.json();
      const ivData = await ivRes.json();

      if (candRes.ok && candData.data) {
        setCandidates(candData.data);
      }
      if (ivRes.ok && ivData.data) {
        setInterviews(ivData.data);
      }
    } catch (e) {
      console.error('Failed to load candidate or interview data', e);
    }
  };

  useEffect(() => {
    loadQuestions();
    loadCandidateData();
  }, []);

  // Compute Candidates who have NOT completed all 3 rounds (HR, Tech, Practical)
  const eligibleCandidates = useMemo(() => {
    return candidates
      .filter((c) => {
        const appStatus = (c.application_status || c.status || '').toLowerCase();
        // Ignore already finalized or rejected candidates
        if (['joined', 'offered', 'rejected'].includes(appStatus)) return false;

        const isHrCompleted = interviews.some(
          (iv) => iv.candidate_id === c.id && iv.round_type === 'hr' && iv.status === 'completed'
        );
        const isTechCompleted = interviews.some(
          (iv) => iv.candidate_id === c.id && iv.round_type === 'department' && iv.status === 'completed'
        );
        const isPracticalCompleted = interviews.some(
          (iv) => iv.candidate_id === c.id && iv.round_type === 'final' && iv.status === 'completed'
        );

        // If candidate has completed ALL 3 rounds, exclude them!
        if (isHrCompleted && isTechCompleted && isPracticalCompleted) return false;

        return true;
      })
      .map((c) => {
        const isHrCompleted = interviews.some(
          (iv) => iv.candidate_id === c.id && iv.round_type === 'hr' && iv.status === 'completed'
        );
        const isTechCompleted = interviews.some(
          (iv) => iv.candidate_id === c.id && iv.round_type === 'department' && iv.status === 'completed'
        );
        const isPracticalCompleted = interviews.some(
          (iv) => iv.candidate_id === c.id && iv.round_type === 'final' && iv.status === 'completed'
        );

        const pendingRounds: string[] = [];
        if (!isHrCompleted) pendingRounds.push('HR');
        if (!isTechCompleted) pendingRounds.push('Tech');
        if (!isPracticalCompleted) pendingRounds.push('Practical');

        const deptName =
          DEPARTMENTS_CONFIG.find((d) => d.id === c.department_id)?.name || 'General';

        return {
          ...c,
          pendingRounds,
          deptName,
          isHrCompleted,
          isTechCompleted,
          isPracticalCompleted,
        };
      });
  }, [candidates, interviews]);

  // Dynamic question type options based on handwritten round specifications
  const availableQuestionTypes = useMemo(() => {
    if (roundType === 'hr') {
      return [
        { value: 'mcq', label: 'MCQ (Multiple Choice)' },
        { value: 'short_answer', label: 'Short Answer' },
        { value: 'scenario_based', label: 'Scenario Based' },
      ];
    }
    if (roundType === 'tech') {
      return [
        { value: 'mcq', label: 'MCQ (Multiple Choice)' },
        { value: 'multiple_select', label: 'Multiple Select' },
        { value: 'true_false', label: 'True / False' },
        { value: 'short_answer', label: 'Short Answer' },
        { value: 'scenario_based', label: 'Scenario Based' },
      ];
    }
    // Practical
    return [
      { value: 'practical_task', label: 'Practical / Hands-on Task' },
      { value: 'scenario_based', label: 'Scenario Based' },
      { value: 'coding_problem', label: 'Problem Solving / Coding' },
      { value: 'short_answer', label: 'Short Answer' },
      { value: 'mcq', label: 'MCQ (Multiple Choice)' },
    ];
  }, [roundType]);

  // When round changes, ensure question type is valid for that round
  useEffect(() => {
    const validValues = availableQuestionTypes.map((t) => t.value);
    if (!validValues.includes(questionType)) {
      setQuestionType(validValues[0] || 'mcq');
    }
  }, [roundType, availableQuestionTypes, questionType]);

  // Handle Candidate Selection in Add Form
  const handleCandidateSelect = (candId: string) => {
    setCandidateId(candId);
    if (!candId) return;

    const cand = eligibleCandidates.find((c) => String(c.id) === candId);
    if (cand) {
      if (cand.department_id) {
        setDepartmentId(String(cand.department_id));
      }
      // Suggest the next pending round
      if (!cand.isHrCompleted) {
        setRoundType('hr');
      } else if (!cand.isTechCompleted) {
        setRoundType('tech');
      } else if (!cand.isPracticalCompleted) {
        setRoundType('practical');
      }
    }
  };

  // Toggle Multiple Select answers
  const toggleMultiAnswer = (optKey: string) => {
    setCorrectAnswerMulti((prev) =>
      prev.includes(optKey) ? prev.filter((k) => k !== optKey) : [...prev, optKey]
    );
  };

  // Submit New Question
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) {
      showToast('Please enter the question text.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      let optionsPayload: any = null;
      let finalCorrectAnswer: string | null = null;

      if (questionType === 'mcq') {
        if (!optionA.trim() || !optionB.trim()) {
          showToast('Please provide at least Option A and Option B for the MCQ.', 'error');
          setSubmitting(false);
          return;
        }
        optionsPayload = {
          A: optionA.trim(),
          B: optionB.trim(),
          C: optionC.trim(),
          D: optionD.trim(),
        };
        finalCorrectAnswer = correctAnswerSingle;
      } else if (questionType === 'multiple_select') {
        if (!optionA.trim() || !optionB.trim()) {
          showToast('Please provide at least Option A and Option B for Multiple Select.', 'error');
          setSubmitting(false);
          return;
        }
        optionsPayload = {
          A: optionA.trim(),
          B: optionB.trim(),
          C: optionC.trim(),
          D: optionD.trim(),
        };
        finalCorrectAnswer = correctAnswerMulti.join(', ');
      } else if (questionType === 'true_false') {
        optionsPayload = ['True', 'False'];
        finalCorrectAnswer = trueFalseAnswer;
      }

      const payload = {
        round_type: roundType,
        question_type: questionType,
        department_id: departmentId && departmentId !== 'all' ? Number(departmentId) : null,
        candidate_id: candidateId ? Number(candidateId) : null,
        question_text: questionText.trim(),
        options: optionsPayload,
        correct_answer: finalCorrectAnswer,
        expected_answer_guidance: expectedGuidance.trim() || null,
        max_score: Number(maxScore) || 10,
      };

      const res = await fetch('/api/interviews/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || result.message || 'Failed to add question');
      }

      showToast('Question added successfully to question bank!', 'success');
      setIsAddModalOpen(false);

      // Reset Form
      setQuestionText('');
      setExpectedGuidance('');
      setOptionA('');
      setOptionB('');
      setOptionC('');
      setOptionD('');
      setCorrectAnswerSingle('A');
      setCorrectAnswerMulti(['A']);
      setTrueFalseAnswer('True');
      setCandidateId('');

      // Refresh list
      loadQuestions();
    } catch (err: any) {
      showToast(err.message || 'Error adding question', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Compute round counts
  const hrCount = useMemo(() => {
    return questions.filter((q) => q.round_type === 'hr' || q.round_type === 'hr_round').length;
  }, [questions]);

  const techCount = useMemo(() => {
    return questions.filter(
      (q) =>
        q.round_type === 'department' ||
        q.round_type === 'dept_round' ||
        q.round_type === 'tech' ||
        q.round_type === 'technical'
    ).length;
  }, [questions]);

  const practicalCount = useMemo(() => {
    return questions.filter(
      (q) =>
        q.round_type === 'final' ||
        q.round_type === 'final_round' ||
        q.round_type === 'practical'
    ).length;
  }, [questions]);

  // Helper to remove prefixes like "Unfamiliar task: ", "Missed deadline: ", etc.
  const cleanQuestionText = (text: string) => {
    if (!text) return '';
    return text.replace(/^(Unfamiliar task|Workplace mistake|Multiple urgent tasks|Missed deadline|Team disagreement):\s*/i, '');
  };

  // Filtered Questions List
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      let matchesRound = true;
      if (roundFilter === 'hr') {
        matchesRound = q.round_type === 'hr' || q.round_type === 'hr_round';
      } else if (roundFilter === 'technical') {
        matchesRound =
          q.round_type === 'department' ||
          q.round_type === 'dept_round' ||
          q.round_type === 'tech' ||
          q.round_type === 'technical';
      } else if (roundFilter === 'practical') {
        matchesRound =
          q.round_type === 'final' ||
          q.round_type === 'final_round' ||
          q.round_type === 'practical';
      }

      return matchesRound;
    });
  }, [questions, roundFilter]);

  interface QuestionGroup {
    key: string;
    departmentId: number | null;
    title: string;
    subtitle?: string;
    color?: string;
    questions: QuestionItem[];
    totalMarks: number;
  }

  const groupedQuestions = useMemo<QuestionGroup[]>(() => {
    if (roundFilter === 'hr') {
      const totalMarks = filteredQuestions.reduce((sum, q) => sum + (Number(q.max_score) || 0), 0);
      return [
        {
          key: 'hr_screening',
          departmentId: null,
          title: 'HR Screening',
          subtitle: 'Universal HR Round Assessment',
          color: '#3b82f6',
          questions: filteredQuestions,
          totalMarks,
        },
      ];
    }

    // Always group department-wise
    const groups: QuestionGroup[] = [];
    DEPARTMENTS_CONFIG.forEach((dept) => {
      const deptQuestions = filteredQuestions.filter((q) => q.department_id === dept.id);
      if (deptQuestions.length > 0) {
        const totalMarks = deptQuestions.reduce((sum, q) => sum + (Number(q.max_score) || 0), 0);
        groups.push({
          key: `dept_${dept.id}`,
          departmentId: dept.id,
          title: `${dept.name} Department`,
          subtitle: dept.description,
          color: dept.color,
          questions: deptQuestions,
          totalMarks,
        });
      }
    });

    const generalQuestions = filteredQuestions.filter((q) => !q.department_id);
    if (generalQuestions.length > 0) {
      const totalMarks = generalQuestions.reduce((sum, q) => sum + (Number(q.max_score) || 0), 0);
      groups.push({
        key: 'general',
        departmentId: null,
        title: 'General / Universal',
        subtitle: 'Cross-departmental screening questions',
        color: '#64748b',
        questions: generalQuestions,
        totalMarks,
      });
    }

    return groups;
  }, [filteredQuestions, roundFilter]);

  const getRoundBadge = (type: string) => {
    if (type === 'department' || type === 'tech' || type === 'dept_round') {
      return <Badge variant="info">Technical Round</Badge>;
    }
    if (type === 'final' || type === 'practical' || type === 'final_round') {
      return <Badge variant="success">Practical Round</Badge>;
    }
    return <Badge variant="neutral">HR Screening</Badge>;
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'mcq':
        return 'MCQ';
      case 'multiple_select':
        return 'Multiple Select';
      case 'true_false':
        return 'True / False';
      case 'short_answer':
        return 'Short Answer';
      case 'scenario_based':
        return 'Scenario Based';
      case 'practical_task':
        return 'Practical Task';
      case 'coding_problem':
        return 'Coding Problem';
      default:
        return type;
    }
  };

  const renderQuestionCard = (q: QuestionItem) => {
    const isHrRound = q.round_type === 'hr' || q.round_type === 'hr_round';
    const deptName =
      q.department_name ||
      DEPARTMENTS_CONFIG.find((d) => d.id === q.department_id)?.name ||
      'Universal / All';

    let parsedOptions: any = null;
    if (q.options) {
      if (typeof q.options === 'string') {
        try {
          parsedOptions = JSON.parse(q.options);
        } catch {
          parsedOptions = q.options;
        }
      } else {
        parsedOptions = q.options;
      }
    }

    return (
      <div key={q.id} className="p-5 hover:bg-slate-50/60 dark:hover:bg-slate-700/20 transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {getRoundBadge(q.round_type)}
            {!isHrRound && (
              <>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60">
                  {getQuestionTypeLabel(q.question_type)}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
                  {q.max_score} Mark{q.max_score > 1 ? 's' : ''}
                </span>
              </>
            )}
            {q.candidate_name && (
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/60 flex items-center gap-1">
                <User className="w-3 h-3" />
                {q.candidate_name} ({q.candidate_code})
              </span>
            )}
          </div>
        </div>

        <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
          {cleanQuestionText(q.question_text)}
        </p>

        {/* MCQ / Options Display */}
        {parsedOptions && (
          <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs space-y-1.5">
            <span className="font-bold text-slate-600 dark:text-slate-400 block mb-1">
              Answer Options:
            </span>
            {Array.isArray(parsedOptions) ? (
              <div className="flex gap-4">
                {parsedOptions.map((opt, i) => (
                  <span
                    key={i}
                    className={`px-2 py-1 rounded-md ${
                      q.correct_answer === opt
                        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {opt} {q.correct_answer === opt && '✓'}
                  </span>
                ))}
              </div>
            ) : typeof parsedOptions === 'object' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(parsedOptions).map(([key, val]) => {
                  const isCorrect =
                    q.correct_answer && q.correct_answer.includes(key);
                  return (
                    <div
                      key={key}
                      className={`p-2 rounded-lg border flex items-center gap-2 ${
                        isCorrect
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 font-bold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] shrink-0">
                        {key}
                      </span>
                      <span>{String(val)}</span>
                      {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600 ml-auto" />}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        )}

        {/* Short Answer / Scenario Expected Answer Display */}
        {!parsedOptions && q.correct_answer && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 text-xs">
            <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
              Expected Answer / Evaluation Key:
            </span>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {q.correct_answer}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header with Add Question Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Question Bank"
          description="Standardized question sets for HR Screening, Technical Round, and Practical Round."
        />

        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Question</span>
        </Button>
      </div>

      {/* Filter Tabs: All Questions, HR, Technical, Practical */}
      <div className="space-y-3">
        <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center justify-between flex-wrap gap-3">
          {/* Round Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl overflow-x-auto">
            <button
              type="button"
              onClick={() => setRoundFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                roundFilter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>All Questions</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  roundFilter === 'all'
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 font-bold'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {questions.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setRoundFilter('hr')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                roundFilter === 'hr'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>HR</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  roundFilter === 'hr'
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 font-bold'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {hrCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setRoundFilter('technical')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                roundFilter === 'technical'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Technical</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  roundFilter === 'technical'
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 font-bold'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {techCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setRoundFilter('practical')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                roundFilter === 'practical'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Practical</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  roundFilter === 'practical'
                    ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 font-bold'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {practicalCount}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Questions Listing Grouped Department-Wise */}
      <div className="space-y-6">
        {loading ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-12 text-center text-slate-500 text-sm">
            Loading question repository...
          </div>
        ) : groupedQuestions.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-12 text-center text-slate-500 text-sm">
            No questions found matching your filter criteria.
          </div>
        ) : (
          groupedQuestions.map((group) => (
            <div
              key={group.key}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden"
            >
              {/* Department Name Header in medium font right before questions start */}
              <div className="bg-slate-50/90 dark:bg-slate-900/80 px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: group.color || '#3b82f6' }}
                  />
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-normal">
                    {group.title}
                  </h2>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    {group.questions.length} Questions
                  </span>
                </div>
              </div>

              {/* Question Cards for this department */}
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {group.questions.map(renderQuestionCard)}
              </div>
            </div>
          ))
        )}
      </div>


      {/* =========================================================================
          ADD QUESTION MODAL
      ========================================================================= */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Question"
        description="Add a new interview question with round specification, type, department, and optional candidate assignment."
        maxWidth="3xl"
      >
        <form onSubmit={handleSaveQuestion} className="space-y-5">
          {/* 1. Round Selection (HR, Tech, Practical) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Select Round <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setRoundType('hr')}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  roundType === 'hr'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-blue-200 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    roundType === 'hr'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  1
                </div>
                <div>
                  <div className="text-xs font-bold">HR Screening</div>
                  <div className="text-[10px] text-slate-400">Round 1 (General)</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRoundType('tech')}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  roundType === 'tech'
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    roundType === 'tech'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  2
                </div>
                <div>
                  <div className="text-xs font-bold">Technical Round</div>
                  <div className="text-[10px] text-slate-400">Round 2 (Skills &amp; Tech)</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRoundType('practical')}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  roundType === 'practical'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    roundType === 'practical'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  3
                </div>
                <div>
                  <div className="text-xs font-bold">Practical Round</div>
                  <div className="text-[10px] text-slate-400">Round 3 (Hands-on / Final)</div>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Question Type & Department (2 cols) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="questionTypeSelect" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Question Type <span className="text-red-500">*</span>
              </label>
              <select
                id="questionTypeSelect"
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold"
              >
                {availableQuestionTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Showing question types configured for {roundType === 'hr' ? 'HR' : roundType === 'tech' ? 'Technical' : 'Practical'} round
              </p>
            </div>

            <div>
              <label htmlFor="departmentSelect" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select Department
              </label>
              <select
                id="departmentSelect"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold"
              >
                <option value="">-- Universal / All Departments --</option>
                {DEPARTMENTS_CONFIG.map((d) => (
                  <option key={d.id} value={String(d.id)}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Select Candidate (Only candidates who haven't completed all 3 rounds) */}
          <div>
            <label htmlFor="candidateSelect" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Target Candidate <span className="text-slate-400 font-normal">(Filtered: Candidates with pending rounds)</span>
            </label>
            <select
              id="candidateSelect"
              value={candidateId}
              onChange={(e) => handleCandidateSelect(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
            >
              <option value="">-- None (General / Universal Question Bank) --</option>
              {eligibleCandidates.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.full_name} ({c.candidate_code || `CAN-${c.id}`}) • {c.deptName} — Pending: [{c.pendingRounds.join(', ')}]
                </option>
              ))}
            </select>
            {candidateId && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Candidate selected. Department and suggested round auto-assigned.
              </p>
            )}
          </div>

          {/* 4. Question Text & Max Score */}
          <div className="space-y-4">
            <div>
              <label htmlFor="questionText" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Question Text <span className="text-red-500">*</span>
              </label>
              <textarea
                id="questionText"
                rows={3}
                required
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Type the full interview question, test scenario, or problem statement..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="w-40">
              <label htmlFor="maxScore" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Max Score (Points)
              </label>
              <input
                id="maxScore"
                type="number"
                min="1"
                max="100"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
              />
            </div>
          </div>

          {/* 5. Dynamic Options Builder for MCQ / Multiple Select / True False */}
          {questionType === 'mcq' && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                MCQ Options &amp; Correct Answer
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Option A <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={optionA}
                    onChange={(e) => setOptionA(e.target.value)}
                    placeholder="First option choice"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Option B <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={optionB}
                    onChange={(e) => setOptionB(e.target.value)}
                    placeholder="Second option choice"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Option C
                  </label>
                  <input
                    type="text"
                    value={optionC}
                    onChange={(e) => setOptionC(e.target.value)}
                    placeholder="Third option choice (optional)"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Option D
                  </label>
                  <input
                    type="text"
                    value={optionD}
                    onChange={(e) => setOptionD(e.target.value)}
                    placeholder="Fourth option choice (optional)"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Correct Answer
                </label>
                <div className="flex gap-4">
                  {['A', 'B', 'C', 'D'].map((key) => (
                    <label key={key} className="flex items-center gap-1.5 cursor-pointer text-xs font-bold">
                      <input
                        type="radio"
                        name="correctAnswerSingle"
                        value={key}
                        checked={correctAnswerSingle === key}
                        onChange={() => setCorrectAnswerSingle(key)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>Option {key}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {questionType === 'multiple_select' && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Multiple Select Options &amp; Correct Answers
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Option A <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={optionA}
                    onChange={(e) => setOptionA(e.target.value)}
                    placeholder="Option A text"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Option B <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={optionB}
                    onChange={(e) => setOptionB(e.target.value)}
                    placeholder="Option B text"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Option C
                  </label>
                  <input
                    type="text"
                    value={optionC}
                    onChange={(e) => setOptionC(e.target.value)}
                    placeholder="Option C text"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Option D
                  </label>
                  <input
                    type="text"
                    value={optionD}
                    onChange={(e) => setOptionD(e.target.value)}
                    placeholder="Option D text"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Correct Options (Check all that apply)
                </label>
                <div className="flex gap-4">
                  {['A', 'B', 'C', 'D'].map((key) => (
                    <label key={key} className="flex items-center gap-1.5 cursor-pointer text-xs font-bold">
                      <input
                        type="checkbox"
                        checked={correctAnswerMulti.includes(key)}
                        onChange={() => toggleMultiAnswer(key)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>Option {key}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {questionType === 'true_false' && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Correct Answer (True or False)
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                  <input
                    type="radio"
                    name="trueFalseChoice"
                    value="True"
                    checked={trueFalseAnswer === 'True'}
                    onChange={() => setTrueFalseAnswer('True')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>True</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                  <input
                    type="radio"
                    name="trueFalseChoice"
                    value="False"
                    checked={trueFalseAnswer === 'False'}
                    onChange={() => setTrueFalseAnswer('False')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>False</span>
                </label>
              </div>
            </div>
          )}

          {/* 6. Evaluation Guidance / Rubric */}
          <div>
            <label htmlFor="expectedGuidance" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Expected Answer / Evaluation Rubric <span className="text-slate-400 font-normal">(Optional guidance for interviewers)</span>
            </label>
            <textarea
              id="expectedGuidance"
              rows={2}
              value={expectedGuidance}
              onChange={(e) => setExpectedGuidance(e.target.value)}
              placeholder="Outline expected key points, scoring criteria, or sample answer..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Saving Question...' : 'Save to Question Bank'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
