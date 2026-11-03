'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, File, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FileUploadProps {
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  onFileSelect: (file: File | null) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  accept = '.pdf,.doc,.docx',
  maxSizeMB = 15,
  onFileSelect,
  error: initialError,
  helperText = 'PDF or Word documents up to 15MB',
  required,
  className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(initialError || null);

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setError(null);
      onFileSelect(null);
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      const err = `File exceeds the maximum size limit of ${maxSizeMB}MB.`;
      setError(err);
      setSelectedFile(null);
      onFileSelect(null);
      return;
    }

    setError(null);
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleFileChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
          {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
        </label>
      )}

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all',
          dragOver
            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
            : selectedFile
            ? 'border-emerald-300 bg-emerald-50/30 dark:bg-emerald-950/10'
            : error
            ? 'border-rose-300 bg-rose-50/20 dark:bg-rose-950/10'
            : 'border-slate-300 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-900/30 hover:border-slate-400 dark:hover:border-slate-600'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileChange(e.target.files[0]);
            }
          }}
        />

        {selectedFile ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <File className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate max-w-xs">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
              <UploadCloud className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Click to select or drag and drop file here
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{helperText}</p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
