import React from 'react';
import { cn } from '@/lib/utils';

export interface FormFieldProps {
  label: string;
  name?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  required,
  error,
  helperText,
  children,
  className,
}) => {
  return (
    <div className={cn('w-full space-y-1.5', className)}>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}
      {!error && helperText && <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>}
    </div>
  );
};
