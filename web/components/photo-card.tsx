'use client';

import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Photo {
  id: string;
  reportNumber: number;
  caption: string;
  filePath: string;
  thumbnailPath: string | null;
  source: string;
  linkedClauses: string[];
}

interface PhotoCardProps {
  photo: Photo;
  sourceColor: string;
  sourceLabel: string;
  onView: () => void;
  onCaptionSave: (caption: string) => Promise<void>;
  onDelete: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Photo Card Component — Issue #187
 * 
 * Sortable photo card with inline caption editing.
 */
export function PhotoCard({
  photo,
  sourceColor,
  sourceLabel,
  onView,
  onCaptionSave,
  onDelete,
}: PhotoCardProps): React.ReactElement {
  const [isEditing, setIsEditing] = useState(false);
  const [caption, setCaption] = useState(photo.caption);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async (): Promise<void> => {
    if (caption.trim() === photo.caption) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onCaptionSave(caption.trim());
      setIsEditing(false);
    } catch (error) {
      setCaption(photo.caption); // Revert on error
      console.error('Failed to save caption:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setCaption(photo.caption);
      setIsEditing(false);
    }
  };

  const thumbnailUrl = photo.thumbnailPath
    ? photo.thumbnailPath.startsWith('http')
      ? photo.thumbnailPath
      : `${API_URL}${photo.thumbnailPath}`
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-white border border-gray-200 rounded-lg overflow-hidden ${
        isDragging ? 'shadow-lg ring-2 ring-blue-500' : ''
      }`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 p-1 bg-white/80 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
      >
        <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
        </svg>
      </div>

      {/* Delete button */}
      <button
        type="button"
        onClick={onDelete}
        className="absolute top-2 right-2 z-10 p-1 bg-white/80 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
        aria-label="Delete photo"
      >
        <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      {/* Source badge */}
      <span
        className={`absolute top-2 left-1/2 -translate-x-1/2 z-10 px-2 py-0.5 rounded-full text-xs font-medium ${sourceColor}`}
      >
        {sourceLabel}
      </span>

      {/* Image */}
      <button
        type="button"
        onClick={onView}
        className="w-full aspect-square bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={photo.caption}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </button>

      {/* Caption */}
      <div className="p-2 border-t border-gray-100">
        <div className="text-xs text-gray-500 mb-1">#{photo.reportNumber}</div>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            className="w-full text-sm px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="w-full text-left text-sm text-gray-700 hover:text-gray-900 truncate"
            title="Click to edit caption"
          >
            {photo.caption || <span className="text-gray-400 italic">Add caption...</span>}
          </button>
        )}
      </div>
    </div>
  );
}
