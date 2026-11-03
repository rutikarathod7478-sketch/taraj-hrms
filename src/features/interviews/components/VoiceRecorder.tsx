'use client';

import React from 'react';
import { useMediaRecorder } from '@/hooks/useMediaRecorder';
import { Mic, Square, Pause, Play, RotateCcw, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatDuration } from '@/lib/utils';

export interface VoiceRecorderProps {
  onRecordingComplete?: (audioBlob: Blob, durationSeconds: number) => void;
  onUploaded?: (filePath: string) => void;
  candidateId?: number;
  questionId?: number;
  interviewId?: number;
  className?: string;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  onUploaded,
  candidateId,
  questionId,
  interviewId,
  className,
}) => {
  const {
    isRecording,
    isPaused,
    recordingDuration,
    audioBlob,
    audioUrl,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    uploadRecording,
  } = useMediaRecorder();

  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadSuccess, setUploadSuccess] = React.useState(false);

  const handleStop = () => {
    stopRecording();
    if (audioBlob) {
      onRecordingComplete?.(audioBlob, recordingDuration);
    }
  };

  const handleUpload = async () => {
    if (!audioBlob) return;
    setIsUploading(true);
    try {
      const res = await uploadRecording('/api/interviews/recordings', {
        candidate_id: candidateId || 0,
        interview_id: interviewId || 0,
        question_id: questionId || 0,
      });

      if (res.success && res.fileUrl) {
        setUploadSuccess(true);
        onUploaded?.(res.fileUrl);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 ${className || ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              isRecording
                ? 'bg-rose-500 text-white animate-pulse'
                : audioUrl
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
            }`}
          >
            <Mic className="w-4 h-4" />
          </div>

          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {isRecording ? 'Recording Voice Response...' : audioUrl ? 'Voice Recorded' : 'Voice Answer Recorder'}
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              {formatDuration(recordingDuration)}
              {isRecording && <span className="text-rose-500 ml-1.5 font-bold">• LIVE</span>}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {!isRecording && !audioUrl && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={<Mic className="w-3.5 h-3.5" />}
              onClick={startRecording}
            >
              Start Recording
            </Button>
          )}

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
              <Button
                type="button"
                variant="danger"
                size="sm"
                icon={<Square className="w-3.5 h-3.5" />}
                onClick={handleStop}
              >
                Stop
              </Button>
            </>
          )}

          {audioUrl && (
            <div className="flex items-center gap-2">
              <audio src={audioUrl} controls className="h-8 max-w-[200px]" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={<RotateCcw className="w-3.5 h-3.5" />}
                onClick={() => {
                  resetRecording();
                  setUploadSuccess(false);
                }}
              >
                Re-record
              </Button>
              {candidateId && !uploadSuccess && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  isLoading={isUploading}
                  icon={<Upload className="w-3.5 h-3.5" />}
                  onClick={handleUpload}
                >
                  Save Audio
                </Button>
              )}
              {uploadSuccess && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Saved
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-2 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
