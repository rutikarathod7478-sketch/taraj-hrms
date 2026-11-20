'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DEPARTMENTS_CONFIG } from '@/features/departments/department.config';
import { validateCandidateForm, CandidateFormState } from '@/features/candidates/candidate.validation';
import { useToast } from '@/components/feedback/ToastProvider';
import { Position } from '@/types/department';
import { Candidate } from '@/types/candidate';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Building2,
  GraduationCap,
  FileText,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  UploadCloud,
  Sparkles,
  AlertCircle,
  FileCheck2,
  Check,
  DollarSign,
  Clock,
  CreditCard,
  Users
} from 'lucide-react';

export interface CandidateFormProps {
  initialData?: Candidate;
  isPublic?: boolean;
  onSuccess?: (candidate: Candidate) => void;
}

export const CandidateForm: React.FC<CandidateFormProps> = ({
  initialData,
  isPublic = false,
  onSuccess,
}) => {
  const router = useRouter();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<CandidateFormState>({
    firstName: initialData?.full_name ? initialData.full_name.split(' ')[0] : '',
    middleName: '',
    lastName: initialData?.full_name ? initialData.full_name.split(' ').slice(1).join(' ') : '',
    gender: 'Male',
    dateOfBirth: initialData?.date_of_birth || '',
    email: initialData?.email || '',
    mobileNumber: initialData?.phone || '',
    alternateContact: '',
    aadharId: initialData?.aadhar_id || '',
    panId: initialData?.pan_id || '',
    location: initialData?.address || '',
    candidateType: initialData?.candidate_type || 'Experienced',
    departmentId: initialData?.department_id ? String(initialData.department_id) : '2',
    positionId: initialData?.position_id ? String(initialData.position_id) : '',
    education: initialData?.qualification || '',
    skills: '',
    projects: '',
    previousCompany: initialData?.current_employer || '',
    designation: '',
    currentCtc: initialData?.current_ctc || '',
    expectedCtc: initialData?.expected_ctc || '',
    noticePeriod: initialData?.notice_period || 30,
    notes: initialData?.notes || '',
    referFirstName: initialData?.refer_first_name || '',
    referMiddleName: initialData?.refer_middle_name || '',
    referLastName: initialData?.refer_last_name || '',
    referPhone: initialData?.refer_phone || '',
    resumeFile: null,
  });

  const [availablePositions, setAvailablePositions] = useState<Position[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [step2DragOver, setStep2DragOver] = useState<boolean>(false);
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(true);
  const [isParsingResume, setIsParsingResume] = useState<boolean>(false);
  const [parsedSummary, setParsedSummary] = useState<{
    designation?: string;
    skillsCount: number;
    education?: string;
    candidateType: string;
    experienceYears?: number;
  } | null>(null);
  const [preUploadedResumePath, setPreUploadedResumePath] = useState<string | null>(
    initialData?.resume_file_path || null
  );
  const [preUploadedOriginalName, setPreUploadedOriginalName] = useState<string | null>(
    initialData?.resume_original_name || null
  );

  // Load positions when department changes
  useEffect(() => {
    async function loadPositions() {
      if (!formData.departmentId) return;
      try {
        const res = await fetch(`/api/candidates?action=positions&department_id=${formData.departmentId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.data && Array.isArray(data.data)) {
            setAvailablePositions(data.data);
            if (!formData.positionId && data.data.length > 0) {
              setFormData((prev) => ({ ...prev, positionId: String(data.data[0].id) }));
            }
          }
        }
      } catch {
        const dept = DEPARTMENTS_CONFIG.find((d) => String(d.id) === String(formData.departmentId));
        if (dept) {
          const fallbackPositions = dept.defaultRoles.map((r, i) => ({
            id: Number(dept.id) * 10 + (i + 1),
            department_id: dept.id,
            code: r.code,
            title: r.title,
            description: r.description,
            requirements: null,
            is_active: true,
            created_at: '',
            updated_at: '',
          }));
          setAvailablePositions(fallbackPositions);
          if (!formData.positionId && fallbackPositions.length > 0) {
            setFormData((prev) => ({ ...prev, positionId: String(fallbackPositions[0].id) }));
          }
        }
      }
    }
    loadPositions();
  }, [formData.departmentId]);

  const handleChange = (field: keyof CandidateFormState, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      if (field === 'candidateType' && value === 'Fresher') {
        delete next.previousCompany;
        delete next.designation;
      } else if (field === 'candidateType' && value === 'Experienced') {
        delete next.education;
      }
      return next;
    });
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File | null) => {
    if (!file) {
      handleChange('resumeFile', null);
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      showToast('File size exceeds the 15MB maximum limit.', 'error');
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'doc', 'docx'].includes(ext || '')) {
      showToast('Please upload a valid PDF or DOCX document.', 'error');
      return;
    }
    handleChange('resumeFile', file);
  };

  const handleResumeAutoFillUpload = async (file: File) => {
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      showToast('File size exceeds the 15MB limit.', 'error');
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'doc', 'docx'].includes(ext || '')) {
      showToast('Please upload a valid PDF or Word document (.pdf, .doc, .docx).', 'error');
      return;
    }

    setIsParsingResume(true);
    try {
      const uploadBody = new FormData();
      uploadBody.append('file', file);
      uploadBody.append('folder', 'resumes');

      const res = await fetch('/api/candidates?action=parse_resume', {
        method: 'POST',
        body: uploadBody,
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to analyze resume.');
      }

      // Store uploaded file info
      handleChange('resumeFile', file);
      if (resData.filePath) {
        setPreUploadedResumePath(resData.filePath);
        setPreUploadedOriginalName(resData.originalFilename || file.name);
      }

      const parsed = resData.parsed;
      if (parsed) {
        const detectedType: 'Fresher' | 'Experienced' = parsed.candidateType || 'Experienced';

        setFormData((prev) => {
          const next = { ...prev };
          next.candidateType = detectedType;

          if (detectedType === 'Fresher') {
            if (parsed.education) next.education = parsed.education;
            if (parsed.collegeOrInstitution) next.previousCompany = parsed.collegeOrInstitution;
            if (parsed.skills) next.skills = parsed.skills;
            if (parsed.projects) next.projects = parsed.projects;
            if (parsed.expectedCtc) next.expectedCtc = parsed.expectedCtc;
          } else {
            if (parsed.previousCompany) next.previousCompany = parsed.previousCompany;
            if (parsed.designation) next.designation = parsed.designation;
            if (parsed.skills) next.skills = parsed.skills;
            if (parsed.projects) next.projects = parsed.projects;
            if (parsed.currentCtc) next.currentCtc = parsed.currentCtc;
            if (parsed.expectedCtc) next.expectedCtc = parsed.expectedCtc;
            if (parsed.noticePeriod !== undefined && parsed.noticePeriod !== null) {
              next.noticePeriod = parsed.noticePeriod;
            }
            if (parsed.education) next.education = parsed.education;
          }

          // Also populate personal info if missing
          if (!next.email && parsed.email) next.email = parsed.email;
          if (!next.mobileNumber && parsed.phone) next.mobileNumber = parsed.phone;
          if (!next.firstName && parsed.fullName) {
            const parts = parsed.fullName.split(' ');
            next.firstName = parts[0];
            if (parts.length > 1) next.lastName = parts.slice(1).join(' ');
          }

          return next;
        });

        // Clear validation errors for auto-filled fields
        setFormErrors((prev) => {
          const clean = { ...prev };
          delete clean.education;
          delete clean.previousCompany;
          delete clean.designation;
          delete clean.expectedCtc;
          delete clean.resumeFile;
          return clean;
        });

        const skillsCount = parsed.skills ? parsed.skills.split(',').length : 0;
        setParsedSummary({
          designation: parsed.designation,
          skillsCount,
          education: parsed.education,
          candidateType: detectedType,
          experienceYears: parsed.experienceYears,
        });

        showToast(
          `Resume parsed successfully! Auto-filled as ${detectedType} with skills and background.`,
          'success'
        );
      } else {
        showToast('Resume uploaded! Please fill in your experience details below.', 'success');
      }
    } catch (err: unknown) {
      const e = err as Error;
      showToast(e.message || 'Failed to auto-parse resume. Please enter details manually.', 'error');
    } finally {
      setIsParsingResume(false);
    }
  };

  const validateStep = (stepNumber: number): boolean => {
    const errors: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!formData.firstName.trim()) errors.firstName = 'First name is required';
      if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
      if (!formData.email.trim()) {
        errors.email = 'Email address is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        errors.email = 'Valid email is required';
      }
      const phoneDigits = formData.mobileNumber.replace(/\D/g, '');
      if (!formData.mobileNumber.trim()) {
        errors.mobileNumber = 'Phone number is required';
      } else if (phoneDigits.length !== 10) {
        errors.mobileNumber = 'Mobile number must be exactly 10 digits';
      }

      const aadharDigits = (formData.aadharId || '').replace(/\D/g, '');
      if (!formData.aadharId?.trim()) {
        errors.aadharId = 'Aadhar card number is required';
      } else if (aadharDigits.length !== 12) {
        errors.aadharId = 'Aadhar number must be exactly 12 digits';
      }

      const panVal = (formData.panId || '').trim().toUpperCase();
      if (!panVal) {
        errors.panId = 'PAN card number is required';
      } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panVal)) {
        errors.panId = 'PAN card must be exactly 10 characters (e.g. ABCDE1234F)';
      }

      if (formData.referPhone?.trim()) {
        const refDigits = formData.referPhone.replace(/\D/g, '');
        if (refDigits.length !== 10) {
          errors.referPhone = 'Referral phone number must be exactly 10 digits';
        }
      }

      if (!formData.location.trim()) errors.location = 'Current location is required';
      if (!formData.departmentId) errors.departmentId = 'Department is required';
      if (!formData.positionId) errors.positionId = 'Position is required';
    }

    if (stepNumber === 2) {
      if (formData.candidateType === 'Fresher') {
        if (!formData.education?.trim()) errors.education = 'Highest qualification is required';
      } else {
        if (!formData.previousCompany?.trim()) errors.previousCompany = 'Current or previous company is required';
        if (!formData.designation?.trim()) errors.designation = 'Current or latest designation is required';
        if (!formData.expectedCtc?.trim()) errors.expectedCtc = 'Expected CTC is required';
      }
    }

    if (stepNumber === 3) {
      const isCvRequired = !initialData?.resume_file_path && !preUploadedResumePath;
      if (isCvRequired && !formData.resumeFile) {
        errors.resumeFile = 'Resume / CV file is required';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(3, prev + 1));
      window.scrollTo({ top: 100, behavior: 'smooth' });
    } else {
      showToast('Please complete all required fields correctly to continue.', 'error');
    }
  };

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  const handleStepClick = (targetStep: number) => {
    if (targetStep === currentStep) return;
    if (targetStep < currentStep) {
      setCurrentStep(targetStep);
      window.scrollTo({ top: 100, behavior: 'smooth' });
    } else {
      if (validateStep(currentStep)) {
        if (targetStep === 3 && currentStep === 1) {
          if (validateStep(2)) {
            setCurrentStep(3);
            window.scrollTo({ top: 100, behavior: 'smooth' });
          }
        } else {
          setCurrentStep(targetStep);
          window.scrollTo({ top: 100, behavior: 'smooth' });
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isCvRequired = !initialData?.resume_file_path && !preUploadedResumePath;
    const validation = validateCandidateForm(formData, isCvRequired);

    if (!validation.isValid) {
      setFormErrors(validation.errors);
      showToast('Please complete all required fields correctly.', 'error');
      // Jump to step with error
      if (
        validation.errors.firstName ||
        validation.errors.lastName ||
        validation.errors.email ||
        validation.errors.mobileNumber ||
        validation.errors.aadharId ||
        validation.errors.panId ||
        validation.errors.referPhone ||
        validation.errors.location ||
        validation.errors.departmentId ||
        validation.errors.positionId
      ) {
        setCurrentStep(1);
      } else if (
        validation.errors.education ||
        validation.errors.previousCompany ||
        validation.errors.designation ||
        validation.errors.expectedCtc
      ) {
        setCurrentStep(2);
      } else {
        setCurrentStep(3);
      }
      return;
    }

    if (!agreedToTerms) {
      showToast('Please acknowledge and agree to the candidate consent declaration.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload CV if a file was selected and not already uploaded
      let resumePath = preUploadedResumePath || initialData?.resume_file_path || null;
      let resumeOriginalName = preUploadedOriginalName || initialData?.resume_original_name || null;

      if (formData.resumeFile && (!preUploadedResumePath || formData.resumeFile.name !== preUploadedOriginalName)) {
        const uploadBody = new FormData();
        uploadBody.append('file', formData.resumeFile);
        uploadBody.append('folder', 'resumes');

        const uploadRes = await fetch('/api/candidates?action=upload_cv', {
          method: 'POST',
          body: uploadBody,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => null);
          throw new Error(errData?.error || 'Failed to upload CV document. Please verify file type and size.');
        }

        const uploadData = await uploadRes.json();
        resumePath = uploadData.data?.filePath || uploadData.filePath;
        resumeOriginalName = formData.resumeFile.name;
      }

      // 2. Prepare payload
      const fullName = [formData.firstName, formData.middleName, formData.lastName]
        .filter(Boolean)
        .join(' ');

      const expYears =
        formData.candidateType === 'Fresher'
          ? 0
          : parsedSummary?.experienceYears !== undefined
          ? parsedSummary.experienceYears
          : 2;

      const payload = {
        full_name: fullName,
        email: formData.email.trim(),
        phone: formData.mobileNumber.trim(),
        date_of_birth: formData.dateOfBirth || null,
        address: formData.location.trim(),
        aadhar_id: formData.aadharId?.trim() || null,
        pan_id: formData.panId?.trim().toUpperCase() || null,
        refer_first_name: formData.referFirstName?.trim() || null,
        refer_middle_name: formData.referMiddleName?.trim() || null,
        refer_last_name: formData.referLastName?.trim() || null,
        refer_phone: formData.referPhone?.trim() || null,
        candidate_type: formData.candidateType,
        department_id: Number(formData.departmentId),
        position_id: Number(formData.positionId),
        qualification: formData.education || null,
        experience_years: expYears,
        current_employer: formData.previousCompany || null,
        current_ctc: formData.currentCtc || null,
        expected_ctc: formData.expectedCtc || null,
        notice_period: Number(formData.noticePeriod) || 0,
        resume_file_path: resumePath,
        resume_original_name: resumeOriginalName,
        notes: [
          formData.notes,
          formData.skills ? `Skills: ${formData.skills}` : '',
          formData.projects ? `Projects: ${formData.projects}` : '',
          formData.designation ? `Designation: ${formData.designation}` : '',
        ]
          .filter(Boolean)
          .join(' | '),
        registration_source: isPublic ? 'public_portal' : 'hr_internal',
      };

      const url = initialData?.id ? `/api/candidates/${initialData.id}` : '/api/candidates';
      const method = initialData?.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || result.message || 'Failed to submit candidate application.');
      }

      showToast(
        initialData
          ? 'Candidate profile updated successfully!'
          : 'Application submitted successfully! A confirmation email has been dispatched to your email address.',
        'success'
      );

      // Realtime Notification broadcast
      if (!initialData?.id && typeof window !== 'undefined') {
        const deptObj = DEPARTMENTS_CONFIG.find((d) => String(d.id) === String(formData.departmentId));
        const posObj = availablePositions.find((p) => String(p.id) === String(formData.positionId));
        const candidateInfo = {
          id: result.data?.id,
          candidate_code: result.data?.candidate_code,
          full_name: fullName,
          department_name: deptObj?.name || 'Department',
          position_title: posObj?.title || 'Applicant',
          timestamp: Date.now(),
        };

        try {
          if ('BroadcastChannel' in window) {
            const channel = new BroadcastChannel('hr_notifications');
            channel.postMessage({
              type: 'CANDIDATE_REGISTERED',
              candidate: candidateInfo,
            });
            channel.close();
          }
        } catch {}

        try {
          window.localStorage.setItem('hr_new_candidate_registered', JSON.stringify(candidateInfo));
        } catch {}
      }

      if (onSuccess) {
        onSuccess(result.data);
      } else if (isPublic) {
        router.push(`/application-status?code=${result.data?.candidate_code || ''}`);
      } else {
        router.push('/hr/candidates');
      }
    } catch (err: unknown) {
      const e = err as Error;
      showToast(e.message || 'Registration Error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 1, title: 'Personal & Role', subtitle: 'Identity & position' },
    { id: 2, title: 'Experience & Skills', subtitle: 'Career background' },
    { id: 3, title: 'Resume & Submit', subtitle: 'Documents & consent' },
  ];

  return (
    <div className="space-y-5">
      {/* =========================================================================
          COMPACT STEP PROGRESS HEADER
      ========================================================================= */}
      <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-2.5 sm:p-3 shadow-lg">
        <div className="grid grid-cols-3 gap-2">
          {steps.map((step) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => handleStepClick(step.id)}
                className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600/20 border border-blue-500/50 shadow-sm'
                    : isCompleted
                    ? 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                    : 'bg-transparent text-slate-500 hover:text-slate-400'
                }`}
              >
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                      : isCompleted
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[2.5]" /> : step.id}
                </div>
                <div className="min-w-0">
                  <span
                    className={`block text-xs font-bold truncate leading-tight ${
                      isActive ? 'text-white' : isCompleted ? 'text-slate-200' : 'text-slate-400'
                    }`}
                  >
                    {step.title}
                  </span>
                  <span className="hidden sm:block text-[10px] text-slate-400 truncate">
                    {step.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          MAIN FORM CARD (Single-View Step Content)
      ========================================================================= */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white dark:bg-slate-900/95 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl overflow-hidden transition-all">
          {/* =========================================================================
              STEP 1: Personal Details & Target Role
          ========================================================================= */}
          {currentStep === 1 && (
            <div>
              {/* Header */}
              <div className="px-6 py-4 sm:px-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-200/60 dark:border-blue-800/60">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                      Step 1: Personal Details &amp; Target Role
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Enter your identity, verified contact details, and the position you are applying for
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-200/60 dark:border-blue-800/60">
                  Step 1 of 3
                </span>
              </div>

              {/* Body */}
              <div className="p-6 sm:p-8 space-y-5">
                {/* Row 1: Name Breakdown (3 cols) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      placeholder="e.g. Priya"
                      className={`w-full px-3.5 py-2 rounded-xl border text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                        formErrors.firstName
                          ? 'border-red-400 focus:ring-red-500/20'
                          : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500/20 focus:border-blue-500'
                      }`}
                    />
                    {formErrors.firstName && (
                      <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {formErrors.firstName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="middleName" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Middle Name <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      id="middleName"
                      type="text"
                      value={formData.middleName || ''}
                      onChange={(e) => handleChange('middleName', e.target.value)}
                      placeholder="e.g. Kumar"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      placeholder="e.g. Sharma"
                      className={`w-full px-3.5 py-2 rounded-xl border text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                        formErrors.lastName
                          ? 'border-red-400 focus:ring-red-500/20'
                          : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500/20 focus:border-blue-500'
                      }`}
                    />
                    {formErrors.lastName && (
                      <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {formErrors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Row 2: Gender, DOB, Location (3 cols) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="gender" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="gender"
                      value={formData.gender}
                      onChange={(e) => handleChange('gender', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="dateOfBirth" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Date of Birth
                    </label>
                    <input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth || ''}
                      onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label htmlFor="location" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Current City / Location <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="location"
                        type="text"
                        required
                        value={formData.location}
                        onChange={(e) => handleChange('location', e.target.value)}
                        placeholder="e.g. Pune, MH"
                        className={`w-full pl-8 pr-3 py-2 rounded-xl border text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                          formErrors.location
                            ? 'border-red-400 focus:ring-red-500/20'
                            : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500/20 focus:border-blue-500'
                        }`}
                      />
                      <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    {formErrors.location && (
                      <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {formErrors.location}
                      </p>
                    )}
                  </div>
                </div>

                {/* Row 3: Email and Phone (2 cols) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="name@example.com"
                        className={`w-full pl-8 pr-3 py-2 rounded-xl border text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                          formErrors.email
                            ? 'border-red-400 focus:ring-red-500/20'
                            : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500/20 focus:border-blue-500'
                        }`}
                      />
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    {formErrors.email && (
                      <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {formErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="mobileNumber" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Mobile Number <span className="text-red-500">*</span> <span className="text-slate-400 font-normal">(10 digits)</span>
                    </label>
                    <div className="relative">
                      <input
                        id="mobileNumber"
                        type="tel"
                        required
                        maxLength={10}
                        value={formData.mobileNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                          handleChange('mobileNumber', val);
                        }}
                        placeholder="9876543210"
                        className={`w-full pl-8 pr-3 py-2 rounded-xl border text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                          formErrors.mobileNumber
                            ? 'border-red-400 focus:ring-red-500/20'
                            : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500/20 focus:border-blue-500'
                        }`}
                      />
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    {formErrors.mobileNumber && (
                      <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {formErrors.mobileNumber}
                      </p>
                    )}
                  </div>
                </div>

                {/* Row 4: Aadhar Card ID and PAN Card ID (2 cols) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="aadharId" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Aadhar Card ID <span className="text-red-500">*</span> <span className="text-slate-400 font-normal">(12 digits)</span>
                    </label>
                    <div className="relative">
                      <input
                        id="aadharId"
                        type="text"
                        required
                        maxLength={12}
                        value={formData.aadharId || ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                          handleChange('aadharId', val);
                        }}
                        placeholder="12-digit Aadhar (e.g. 123456789012)"
                        className={`w-full pl-8 pr-3 py-2 rounded-xl border text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all tracking-wider ${
                          formErrors.aadharId
                            ? 'border-red-400 focus:ring-red-500/20'
                            : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500/20 focus:border-blue-500'
                        }`}
                      />
                      <CreditCard className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    {formErrors.aadharId && (
                      <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {formErrors.aadharId}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="panId" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      PAN Card ID <span className="text-red-500">*</span> <span className="text-slate-400 font-normal">(10 characters)</span>
                    </label>
                    <div className="relative">
                      <input
                        id="panId"
                        type="text"
                        required
                        maxLength={10}
                        value={formData.panId || ''}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase().slice(0, 10);
                          handleChange('panId', val);
                        }}
                        placeholder="10-digit PAN (e.g. ABCDE1234F)"
                        className={`w-full pl-8 pr-3 py-2 rounded-xl border text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all uppercase tracking-wider ${
                          formErrors.panId
                            ? 'border-red-400 focus:ring-red-500/20'
                            : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500/20 focus:border-blue-500'
                        }`}
                      />
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    {formErrors.panId && (
                      <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {formErrors.panId}
                      </p>
                    )}
                  </div>
                </div>

                {/* Row 5: Department & Position (2 cols) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label htmlFor="departmentId" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Target Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="departmentId"
                      value={formData.departmentId}
                      onChange={(e) => handleChange('departmentId', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                    >
                      {DEPARTMENTS_CONFIG.map((d) => (
                        <option key={d.id} value={String(d.id)}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="positionId" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Applying Position / Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="positionId"
                      value={formData.positionId}
                      onChange={(e) => handleChange('positionId', e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-xl border text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-all font-semibold ${
                        formErrors.positionId
                          ? 'border-red-400 focus:ring-red-500/20'
                          : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500/20 focus:border-blue-500'
                      }`}
                    >
                      <option value="">-- Choose Position --</option>
                      {availablePositions.map((pos) => (
                        <option key={pos.id} value={String(pos.id)}>
                          {pos.title}
                        </option>
                      ))}
                    </select>
                    {formErrors.positionId && (
                      <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {formErrors.positionId}
                      </p>
                    )}
                  </div>
                </div>

                {/* Refer a Friend Section */}
                <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold border border-emerald-200/60 dark:border-emerald-800/60">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Refer a Friend <span className="text-slate-400 font-normal text-xs">(Optional)</span>
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                    Know a talented peer who would be a great candidate? Provide their details below.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="referFirstName" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        First Name
                      </label>
                      <input
                        id="referFirstName"
                        type="text"
                        value={formData.referFirstName || ''}
                        onChange={(e) => handleChange('referFirstName', e.target.value)}
                        placeholder="e.g. Rahul"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div>
                      <label htmlFor="referMiddleName" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Middle Name
                      </label>
                      <input
                        id="referMiddleName"
                        type="text"
                        value={formData.referMiddleName || ''}
                        onChange={(e) => handleChange('referMiddleName', e.target.value)}
                        placeholder="e.g. Kumar"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div>
                      <label htmlFor="referLastName" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Last Name
                      </label>
                      <input
                        id="referLastName"
                        type="text"
                        value={formData.referLastName || ''}
                        onChange={(e) => handleChange('referLastName', e.target.value)}
                        placeholder="e.g. Sharma"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                    <div>
                      <label htmlFor="referPhone" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Phone Number <span className="text-slate-400 font-normal">(10 digits)</span>
                      </label>
                      <div className="relative">
                        <input
                          id="referPhone"
                          type="tel"
                          maxLength={10}
                          value={formData.referPhone || ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                            handleChange('referPhone', val);
                          }}
                          placeholder="e.g. 9876543210"
                          className={`w-full pl-8 pr-3 py-2 rounded-xl border text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                            formErrors.referPhone
                              ? 'border-red-400 focus:ring-red-500/20'
                              : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500/20 focus:border-blue-500'
                          }`}
                        />
                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      {formErrors.referPhone && (
                        <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {formErrors.referPhone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 1 Action Bar */}
              <div className="px-6 py-4 sm:px-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => (isPublic ? router.push('/') : router.back())}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <span>Continue to Experience</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 2: Experience & Qualifications
          ========================================================================= */}
          {currentStep === 2 && (
            <div>
              {/* Header */}
              <div className="px-6 py-4 sm:px-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-200/60 dark:border-indigo-800/60">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                      Step 2: Experience &amp; Professional Background
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Upload your resume to auto-fill details, or select your track and complete manually
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full border border-indigo-200/60 dark:border-indigo-800/60">
                  Step 2 of 3
                </span>
              </div>

              {/* Body */}
              <div className="p-6 sm:p-8 space-y-5">
                {/* 1. Fast-Track Resume Upload & Auto-fill Section */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setStep2DragOver(true);
                  }}
                  onDragLeave={() => setStep2DragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setStep2DragOver(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleResumeAutoFillUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`p-5 rounded-2xl border transition-all relative overflow-hidden ${
                    step2DragOver
                      ? 'border-blue-500 bg-blue-500/10 shadow-lg'
                      : 'bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-slate-50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-slate-900 border-blue-200/90 dark:border-blue-800/60 shadow-xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-blue-600 text-white shadow-xs">
                          <Sparkles className="w-4 h-4" />
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          Auto-Fill Experience &amp; Skills with Resume
                        </h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                          Smart Parsing
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
                        Upload your CV / Resume (PDF or DOCX). Our system will automatically detect whether you are a Fresher or Experienced candidate and auto-fill all career, qualification, and skill fields below.
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <input
                        id="resumeAutoFillInput"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleResumeAutoFillUpload(e.target.files[0]);
                          }
                        }}
                      />
                      <button
                        type="button"
                        disabled={isParsingResume}
                        onClick={() => document.getElementById('resumeAutoFillInput')?.click()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isParsingResume ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Analyzing Resume...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-4 h-4" />
                            <span>{formData.resumeFile ? 'Re-upload & Re-parse' : 'Upload Resume & Auto-fill'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Parsing Progress Indicator */}
                  {isParsingResume && (
                    <div className="mt-4 pt-3 border-t border-blue-200/60 dark:border-blue-900/60 flex items-center gap-3 text-xs text-blue-700 dark:text-blue-300 animate-pulse">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                      <span>Reading resume document, extracting career track, skills, and background information...</span>
                    </div>
                  )}

                  {/* Parsed Success Summary */}
                  {parsedSummary && !isParsingResume && (
                    <div className="mt-4 pt-3.5 border-t border-emerald-200/60 dark:border-emerald-900/60">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Resume parsed successfully! Auto-filled fields below:</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[11px]">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold">
                          Career Track: {formData.candidateType}
                        </span>
                        {parsedSummary.designation && (
                          <span className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-medium">
                            Role: {parsedSummary.designation}
                          </span>
                        )}
                        {parsedSummary.skillsCount > 0 && (
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-medium">
                            {parsedSummary.skillsCount} Skills Detected
                          </span>
                        )}
                        {parsedSummary.education && (
                          <span className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-medium">
                            Education: {parsedSummary.education}
                          </span>
                        )}
                        {formData.resumeFile && (
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium">
                            Attached: {formData.resumeFile.name}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Career Track Toggle */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Select Career Experience Track <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleChange('candidateType', 'Fresher')}
                      className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                        formData.candidateType === 'Fresher'
                          ? 'bg-blue-50/80 border-blue-500 text-blue-900 dark:bg-blue-950/40 dark:border-blue-600 dark:text-blue-200 shadow-sm'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                          formData.candidateType === 'Fresher'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}
                      >
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          <span>Fresher (Entry Level / Graduate)</span>
                          {formData.candidateType === 'Fresher' && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Recent college graduates or entry-level applicants
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleChange('candidateType', 'Experienced')}
                      className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                        formData.candidateType === 'Experienced'
                          ? 'bg-blue-50/80 border-blue-500 text-blue-900 dark:bg-blue-950/40 dark:border-blue-600 dark:text-blue-200 shadow-sm'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                          formData.candidateType === 'Experienced'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}
                      >
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          <span>Experienced Professional</span>
                          {formData.candidateType === 'Experienced' && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Candidates with prior work experience
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Conditional Dynamic Inputs */}
                {formData.candidateType === 'Fresher' ? (
                  <div className="space-y-4 pt-1">
                    {/* Fresher Information Banner */}
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-center gap-2.5">
                      <GraduationCap className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>
                        <strong className="text-white">Fresher Track Selected:</strong> Previous employment, current salary, and notice period are waived. Provide your education, skills, and projects below.
                      </span>
                    </div>

                    {/* Row 1: Degree & College / Institute */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="education" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Degree / Highest Qualification <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="education"
                          type="text"
                          required
                          value={formData.education || ''}
                          onChange={(e) => handleChange('education', e.target.value)}
                          placeholder="e.g. B.Tech Computer Science, MCA, B.Sc IT"
                          className={`w-full px-3.5 py-2 rounded-xl border text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                            formErrors.education
                              ? 'border-red-400 focus:ring-red-500/20'
                              : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500/20 focus:border-blue-500'
                          }`}
                        />
                        {formErrors.education && (
                          <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {formErrors.education}
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="previousCompany" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          College / University / Institute
                        </label>
                        <input
                          id="previousCompany"
                          type="text"
                          value={formData.previousCompany || ''}
                          onChange={(e) => handleChange('previousCompany', e.target.value)}
                          placeholder="e.g. Pune University, COEP, VIT"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                        />
                      </div>
                    </div>

                    {/* Row 2: Expected CTC & Key Skills */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="expectedCtc" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Expected Annual CTC (₹ / Annum)
                        </label>
                        <input
                          id="expectedCtc"
                          type="text"
                          value={formData.expectedCtc || ''}
                          onChange={(e) => handleChange('expectedCtc', e.target.value)}
                          placeholder="e.g. 4,00,000"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                        />
                      </div>

                      <div>
                        <label htmlFor="skills" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Key Technical Skills &amp; Tools
                        </label>
                        <input
                          id="skills"
                          type="text"
                          value={formData.skills || ''}
                          onChange={(e) => handleChange('skills', e.target.value)}
                          placeholder="e.g. React, Next.js, Node.js, Python, SQL"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                        />
                      </div>
                    </div>

                    {/* Row 3: Academic Projects / GitHub */}
                    <div>
                      <label htmlFor="projects" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Academic Projects / Internships / GitHub / Portfolio <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <textarea
                        id="projects"
                        rows={2}
                        value={formData.projects || ''}
                        onChange={(e) => handleChange('projects', e.target.value)}
                        placeholder="Mention key academic projects, final-year capstone, internship summary, or portfolio links..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="previousCompany" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Current / Recent Employer <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="previousCompany"
                          type="text"
                          required
                          value={formData.previousCompany || ''}
                          onChange={(e) => handleChange('previousCompany', e.target.value)}
                          placeholder="e.g. Infosys, TCS, Wipro"
                          className={`w-full px-3.5 py-2 rounded-xl border text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                            formErrors.previousCompany
                              ? 'border-red-400 focus:ring-red-500/20'
                              : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500/20 focus:border-blue-500'
                          }`}
                        />
                        {formErrors.previousCompany && (
                          <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {formErrors.previousCompany}
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="designation" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Current Job Title / Designation <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="designation"
                          type="text"
                          required
                          value={formData.designation || ''}
                          onChange={(e) => handleChange('designation', e.target.value)}
                          placeholder="e.g. Senior Frontend Developer"
                          className={`w-full px-3.5 py-2 rounded-xl border text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                            formErrors.designation
                              ? 'border-red-400 focus:ring-red-500/20'
                              : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500/20 focus:border-blue-500'
                          }`}
                        />
                        {formErrors.designation && (
                          <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {formErrors.designation}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="currentCtc" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Current CTC (₹ / Annum)
                        </label>
                        <input
                          id="currentCtc"
                          type="text"
                          value={formData.currentCtc || ''}
                          onChange={(e) => handleChange('currentCtc', e.target.value)}
                          placeholder="e.g. 6,50,000"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                        />
                      </div>

                      <div>
                        <label htmlFor="expectedCtc" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Expected CTC (₹ / Annum) <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="expectedCtc"
                          type="text"
                          required
                          value={formData.expectedCtc || ''}
                          onChange={(e) => handleChange('expectedCtc', e.target.value)}
                          placeholder="e.g. 9,00,000"
                          className={`w-full px-3.5 py-2 rounded-xl border text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all font-medium ${
                            formErrors.expectedCtc
                              ? 'border-red-400 focus:ring-red-500/20'
                              : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500/20 focus:border-blue-500'
                          }`}
                        />
                        {formErrors.expectedCtc && (
                          <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {formErrors.expectedCtc}
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="noticePeriod" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Notice Period (Days)
                        </label>
                        <input
                          id="noticePeriod"
                          type="number"
                          min="0"
                          max="180"
                          value={String(formData.noticePeriod || 0)}
                          onChange={(e) => handleChange('noticePeriod', e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2 Action Bar */}
              <div className="px-6 py-4 sm:px-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <span>Continue to Resume</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 3: Resume & Final Submission
          ========================================================================= */}
          {currentStep === 3 && (
            <div>
              {/* Header */}
              <div className="px-6 py-4 sm:px-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-200/60 dark:border-emerald-800/60">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                      Step 3: Resume Document &amp; Submission
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Upload your updated resume and confirm your submission
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/60">
                  Step 3 of 3
                </span>
              </div>

              {/* Body */}
              <div className="p-6 sm:p-8 space-y-5">
                {/* Drag & Drop File Upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Curriculum Vitae / Resume File <span className="text-red-500">*</span>
                  </label>

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleFileDrop}
                    className={`border-2 border-dashed rounded-2xl p-5 sm:p-6 text-center transition-all cursor-pointer relative ${
                      dragOver
                        ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30'
                        : formData.resumeFile
                        ? 'border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20'
                        : formErrors.resumeFile
                        ? 'border-red-400 bg-red-50/30 dark:bg-red-950/20'
                        : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 hover:border-blue-400 dark:hover:border-blue-600'
                    }`}
                    onClick={() => document.getElementById('resumeFileInput')?.click()}
                  >
                    <input
                      id="resumeFileInput"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          validateAndSetFile(e.target.files[0]);
                        }
                      }}
                    />

                    {formData.resumeFile || preUploadedResumePath ? (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
                            <FileCheck2 className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                              {formData.resumeFile?.name || preUploadedOriginalName || 'Resume Document'}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {formData.resumeFile
                                ? `${(formData.resumeFile.size / (1024 * 1024)).toFixed(2)} MB • `
                                : ''}
                              Document attached &amp; ready
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleChange('resumeFile', null);
                            setPreUploadedResumePath(null);
                            setPreUploadedOriginalName(null);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          Replace File
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-inner">
                          <UploadCloud className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                            Click to upload resume
                          </span>{' '}
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            or drag &amp; drop file here
                          </span>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                            Supports PDF, DOC, DOCX up to 15MB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {formErrors.resumeFile && (
                    <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {formErrors.resumeFile}
                    </p>
                  )}
                </div>

                {/* Additional Notes */}
                <div>
                  <label htmlFor="notes" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cover Note / Additional Remarks <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    id="notes"
                    rows={2}
                    value={formData.notes || ''}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    placeholder="Briefly state your availability, relocation preference, or portfolio links..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Consent Declaration */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="w-4 h-4 rounded mt-0.5 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      <span className="font-bold text-slate-800 dark:text-white">Declaration: </span>
                      I certify that the information provided is true and accurate. I consent to participation in the multi-stage evaluation process at Taraj Global Solutions.
                    </div>
                  </label>
                </div>
              </div>

              {/* Step 3 Action Bar */}
              <div className="px-6 py-4 sm:px-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !agreedToTerms}
                  className="inline-flex items-center justify-center gap-2 px-7 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Application</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
