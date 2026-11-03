import React from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface FormActionsProps {
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  align?: 'left' | 'center' | 'right' | 'between';
  extraActions?: React.ReactNode;
  className?: string;
}

export const FormActions: React.FC<FormActionsProps> = ({
  submitLabel = 'Save Changes',
  cancelLabel = 'Cancel',
  onCancel,
  isLoading = false,
  disabled = false,
  align = 'right',
  extraActions,
  className,
}) => {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div className={cn('flex items-center gap-3 pt-5 border-t border-slate-200 dark:border-slate-800', alignClasses[align], className)}>
      {extraActions}
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          size="md"
          disabled={isLoading}
          onClick={onCancel}
        >
          {cancelLabel}
        </Button>
      )}
      <Button
        type="submit"
        variant="primary"
        size="md"
        isLoading={isLoading}
        disabled={disabled || isLoading}
      >
        {submitLabel}
      </Button>
    </div>
  );
};
