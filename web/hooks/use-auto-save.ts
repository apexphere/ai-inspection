'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions<T> {
  /** Data to save */
  data: T;
  /** Save function - should throw on error */
  onSave: (data: T) => Promise<void>;
  /** Debounce delay in ms (default: 1000) */
  debounceMs?: number;
  /** Max history length for undo/redo (default: 50) */
  maxHistory?: number;
  /** Whether auto-save is enabled (default: true) */
  enabled?: boolean;
}

interface UseAutoSaveReturn<T> {
  /** Current save status */
  status: SaveStatus;
  /** Error message if status is 'error' */
  error: string | null;
  /** Undo to previous state, returns the state or null if can't undo */
  undo: () => T | null;
  /** Redo to next state, returns the state or null if can't redo */
  redo: () => T | null;
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** Manually trigger save */
  save: () => Promise<void>;
  /** Retry failed save */
  retry: () => Promise<void>;
}

/**
 * Hook for auto-saving data with debouncing and undo/redo support.
 * 
 * @example
 * ```tsx
 * const { status, undo, redo, canUndo, canRedo } = useAutoSave({
 *   data: observations,
 *   onSave: (data) => api.updateObservations(id, data),
 * });
 * ```
 */
export function useAutoSave<T>({
  data,
  onSave,
  debounceMs = 1000,
  maxHistory = 50,
  enabled = true,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn<T> {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // History for undo/redo
  const historyRef = useRef<T[]>([data]);
  const historyIndexRef = useRef(0);
  const lastSavedDataRef = useRef<T>(data);
  const isUndoRedoRef = useRef(false);

  // Update canUndo/canRedo state
  const updateUndoRedoState = useCallback(() => {
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, []);

  // Debounce timer
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Save function
  const performSave = useCallback(async (dataToSave: T) => {
    if (!enabled) return;

    setStatus('saving');
    setError(null);

    try {
      await onSave(dataToSave);
      lastSavedDataRef.current = dataToSave;
      setStatus('saved');

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setStatus((current) => (current === 'saved' ? 'idle' : current));
      }, 2000);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  }, [onSave, enabled]);

  // Debounced save effect
  useEffect(() => {
    // Skip if this change came from undo/redo
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }

    // Skip if data hasn't changed from last saved
    if (JSON.stringify(data) === JSON.stringify(lastSavedDataRef.current)) {
      return;
    }

    // Add to history (truncate any redo history)
    const currentIndex = historyIndexRef.current;
    const newHistory = historyRef.current.slice(0, currentIndex + 1);
    newHistory.push(data);

    // Limit history size
    if (newHistory.length > maxHistory) {
      newHistory.shift();
    } else {
      historyIndexRef.current = newHistory.length - 1;
    }
    historyRef.current = newHistory;
    updateUndoRedoState();

    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Set new debounced save
    timerRef.current = setTimeout(() => {
      performSave(data);
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [data, debounceMs, maxHistory, performSave, updateUndoRedoState]);

  // Undo function
  const undo = useCallback((): T | null => {
    if (historyIndexRef.current <= 0) return null;

    historyIndexRef.current -= 1;
    isUndoRedoRef.current = true;
    const previousState = historyRef.current[historyIndexRef.current];

    // Save the undone state
    performSave(previousState);
    updateUndoRedoState();

    return previousState;
  }, [performSave, updateUndoRedoState]);

  // Redo function
  const redo = useCallback((): T | null => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return null;

    historyIndexRef.current += 1;
    isUndoRedoRef.current = true;
    const nextState = historyRef.current[historyIndexRef.current];

    // Save the redone state
    performSave(nextState);
    updateUndoRedoState();

    return nextState;
  }, [performSave, updateUndoRedoState]);

  // Manual save
  const save = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    await performSave(data);
  }, [data, performSave]);

  // Retry failed save
  const retry = useCallback(async () => {
    await performSave(lastSavedDataRef.current);
  }, [performSave]);

  return {
    status,
    error,
    undo,
    redo,
    canUndo,
    canRedo,
    save,
    retry,
  };
}
