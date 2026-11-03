import React from 'react';

export interface LoadingOverlayProps {
  isLoading?: boolean;
  isVisible?: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  isVisible,
  message = 'Processing request...',
}) => {
  const visible = isVisible !== undefined ? isVisible : isLoading;
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-600 border-t-transparent" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{message}</p>
      </div>
    </div>
  );
};
