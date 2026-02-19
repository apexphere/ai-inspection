'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ConfirmDialog } from './confirm-dialog';

export interface Photo {
  id: string;
  thumbnailUrl: string;
  fullUrl: string;
  caption: string;
  source: 'SITE' | 'OWNER' | 'CONTRACTOR';
  reportNumber?: number;
  clauseId?: string;
}

interface PhotoCardProps {
  photo: Photo;
  onClick: () => void;
  onDelete: () => void;
  onCaptionChange: (caption: string) => void;
  onMove?: (photoId: string, targetClauseId: string) => void;
  clauses?: Array<{ id: string; code: string; title: string }>;
}

const sourceLabels: Record<Photo['source'], string> = {
  SITE: 'Site',
  OWNER: 'Owner',
  CONTRACTOR: 'Contractor',
};

const sourceColors: Record<Photo['source'], string> = {
  SITE: 'bg-blue-100 text-blue-800',
  OWNER: 'bg-purple-100 text-purple-800',
  CONTRACTOR: 'bg-orange-100 text-orange-800',
};

/**
 * Individual photo card with drag handle, caption editing, and actions.
 */
export function PhotoCard({
  photo,
  onClick,
  onDelete,
  onCaptionChange,
  onMove,
  clauses,
}: PhotoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [caption, setCaption] = useState(photo.caption);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
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

  const handleCaptionClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleCaptionBlur = useCallback(() => {
    setIsEditing(false);
    if (caption !== photo.caption) {
      onCaptionChange(caption);
    }
  }, [caption, photo.caption, onCaptionChange]);

  const handleCaptionKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        setIsEditing(false);
        if (caption !== photo.caption) {
          onCaptionChange(caption);
        }
      } else if (e.key === 'Escape') {
        setCaption(photo.caption);
        setIsEditing(false);
      }
    },
    [caption, photo.caption, onCaptionChange]
  );

  const handleMove = useCallback(
    (clauseId: string) => {
      onMove?.(photo.id, clauseId);
      setShowMoveMenu(false);
    },
    [photo.id, onMove]
  );

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className="group relative rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow"
      >
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 z-10 cursor-grab rounded bg-black/50 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Drag to reorder"
        >
          <GripIcon className="h-4 w-4 text-white" />
        </div>

        {/* Photo number badge */}
        {photo.reportNumber && (
          <div className="absolute top-2 right-2 z-10 rounded bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
            #{photo.reportNumber}
          </div>
        )}

        {/* Image */}
        <div
          className="aspect-square cursor-pointer overflow-hidden rounded-t-lg"
          onClick={onClick}
        >
          <img
            src={photo.thumbnailUrl}
            alt={photo.caption || 'Inspection photo'}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Caption */}
        <div className="p-2">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              onBlur={handleCaptionBlur}
              onKeyDown={handleCaptionKeyDown}
              className="w-full rounded border px-2 py-1 text-sm"
              placeholder="Add caption..."
            />
          ) : (
            <p
              onClick={handleCaptionClick}
              className="cursor-pointer text-sm text-gray-700 hover:text-gray-900 truncate"
              title={photo.caption || 'Click to add caption'}
            >
              {photo.caption || (
                <span className="text-gray-400 italic">Add caption...</span>
              )}
            </p>
          )}

          {/* Source badge */}
          <div className="mt-1 flex items-center justify-between">
            <span
              className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${sourceColors[photo.source]}`}
            >
              {sourceLabels[photo.source]}
            </span>

            {/* Action buttons */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onMove && clauses && clauses.length > 0 && (
                <button
                  onClick={() => setShowMoveMenu(!showMoveMenu)}
                  className="rounded p-1 hover:bg-gray-100"
                  title="Move to clause"
                >
                  <MoveIcon className="h-4 w-4 text-gray-500" />
                </button>
              )}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded p-1 hover:bg-red-50"
                title="Delete photo"
              >
                <TrashIcon className="h-4 w-4 text-red-500" />
              </button>
            </div>
          </div>

          {/* Move menu dropdown */}
          {showMoveMenu && clauses && (
            <div className="absolute right-0 bottom-full mb-1 z-20 w-48 rounded-lg border bg-white shadow-lg">
              <div className="p-2 text-xs font-medium text-gray-500 border-b">
                Move to clause
              </div>
              <div className="max-h-48 overflow-y-auto">
                {clauses.map((clause) => (
                  <button
                    key={clause.id}
                    onClick={() => handleMove(clause.id)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                    disabled={clause.id === photo.clauseId}
                  >
                    <span className="font-medium">{clause.code}</span>
                    <span className="ml-2 text-gray-500">{clause.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Photo"
        message="Are you sure you want to delete this photo? This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={() => {
          onDelete();
          setShowDeleteConfirm(false);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}

function GripIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
    </svg>
  );
}

function MoveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
