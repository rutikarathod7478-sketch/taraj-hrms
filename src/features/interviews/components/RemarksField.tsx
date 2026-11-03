'use client';

import React from 'react';
import { Textarea } from '@/components/ui/Textarea';
import { Tag } from 'lucide-react';

export interface RemarksFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  suggestions?: string[];
}

const DEFAULT_SUGGESTIONS = [
  'Strong Communication',
  'Confident',
  'Good Technical Knowledge',
  'Problem Solver',
  'Quick Learner',
  'Relevant Experience',
  'Team Player',
  'Positive Attitude',
  'Needs Improvement',
  'Recommended',
];

export const RemarksField: React.FC<RemarksFieldProps> = ({
  value,
  onChange,
  label = 'Interviewer Evaluation Remarks',
  placeholder = 'Enter specific observations, strengths, or areas of concern regarding this response...',
  suggestions = DEFAULT_SUGGESTIONS,
}) => {
  const handleTagClick = (tag: string) => {
    if (!value || value.trim() === '') {
      onChange(tag);
    } else if (!value.includes(tag)) {
      onChange(`${value.trim()} • ${tag}`);
    }
  };

  return (
    <div className="space-y-2">
      <Textarea
        label={label}
        rows={3}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      <div className="flex items-center gap-1.5 flex-wrap pt-1">
        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1">
          <Tag className="w-3 h-3" /> Quick Tags:
        </span>
        {suggestions.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => handleTagClick(tag)}
            className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            + {tag}
          </button>
        ))}
      </div>
    </div>
  );
};
