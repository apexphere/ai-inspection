'use client';

import { useEffect } from 'react';

interface UseKeyboardShortcutsOptions {
  /** Handler for undo (Ctrl/Cmd+Z) */
  onUndo?: () => void;
  /** Handler for redo (Ctrl/Cmd+Shift+Z or Ctrl+Y) */
  onRedo?: () => void;
  /** Handler for save (Ctrl/Cmd+S) */
  onSave?: () => void;
  /** Whether shortcuts are enabled (default: true) */
  enabled?: boolean;
}

/**
 * Hook for handling common keyboard shortcuts.
 * 
 * @example
 * ```tsx
 * useKeyboardShortcuts({
 *   onUndo: () => setData(undo()),
 *   onRedo: () => setData(redo()),
 *   onSave: () => save(),
 * });
 * ```
 */
export function useKeyboardShortcuts({
  onUndo,
  onRedo,
  onSave,
  enabled = true,
}: UseKeyboardShortcutsOptions): void {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      // Check for modifier key (Ctrl on Windows/Linux, Cmd on Mac)
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod) return;

      // Don't intercept if user is in an input that handles its own undo
      const target = e.target as HTMLElement;
      const isContentEditable = target.isContentEditable;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      switch (e.key.toLowerCase()) {
        case 'z':
          if (e.shiftKey) {
            // Redo: Ctrl/Cmd+Shift+Z
            if (onRedo && !isContentEditable) {
              e.preventDefault();
              onRedo();
            }
          } else {
            // Undo: Ctrl/Cmd+Z
            if (onUndo && !isContentEditable && !isInput) {
              e.preventDefault();
              onUndo();
            }
          }
          break;

        case 'y':
          // Redo: Ctrl+Y (Windows style)
          if (onRedo && !isContentEditable) {
            e.preventDefault();
            onRedo();
          }
          break;

        case 's':
          // Save: Ctrl/Cmd+S
          if (onSave) {
            e.preventDefault();
            onSave();
          }
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onUndo, onRedo, onSave, enabled]);
}
