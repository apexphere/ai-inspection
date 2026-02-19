'use client';

import { type SaveStatus } from '@/hooks/use-auto-save';

interface SaveIndicatorProps {
  /** Current save status */
  status: SaveStatus;
  /** Error message to display */
  error?: string | null;
  /** Handler for retry button */
  onRetry?: () => void;
}

/**
 * Fixed-position indicator showing save status.
 * Shows in bottom-right corner of viewport.
 */
export function SaveIndicator({ status, error, onRetry }: SaveIndicatorProps) {
  // Don't render when idle
  if (status === 'idle') return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-2 shadow-lg transition-all duration-200"
      style={{
        backgroundColor:
          status === 'error'
            ? 'rgb(254 226 226)' // red-100
            : status === 'saved'
              ? 'rgb(220 252 231)' // green-100
              : 'rgb(241 245 249)', // slate-100
        color:
          status === 'error'
            ? 'rgb(153 27 27)' // red-800
            : status === 'saved'
              ? 'rgb(22 101 52)' // green-800
              : 'rgb(51 65 85)', // slate-700
      }}
      role="status"
      aria-live="polite"
    >
      {status === 'saving' && (
        <>
          <Spinner />
          <span>Saving...</span>
        </>
      )}

      {status === 'saved' && (
        <>
          <CheckIcon />
          <span>Saved</span>
        </>
      )}

      {status === 'error' && (
        <>
          <ErrorIcon />
          <span>{error || 'Save failed'}</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="ml-2 rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
            >
              Retry
            </button>
          )}
        </>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      className="h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}
