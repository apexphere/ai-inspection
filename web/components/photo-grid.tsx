'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { PhotoCard } from './photo-card';
import { PhotoLightbox } from './photo-lightbox';
import { ConfirmDialog } from './confirm-dialog';

export interface Photo {
  id: string;
  reportNumber: number;
  caption: string;
  filePath: string;
  thumbnailPath: string | null;
  source: string;
  linkedClauses: string[];
}

interface PhotoGridProps {
  photos: Photo[];
  onReorder: (photoIds: string[]) => Promise<void>;
  onUpdateCaption: (photoId: string, caption: string) => Promise<void>;
  onDelete: (photoId: string) => Promise<void>;
  isLoading?: boolean;
}

const SOURCE_COLORS: Record<string, string> = {
  SITE: 'bg-blue-100 text-blue-800',
  OWNER: 'bg-purple-100 text-purple-800',
  CONTRACTOR: 'bg-orange-100 text-orange-800',
};

const SOURCE_LABELS: Record<string, string> = {
  SITE: 'Site',
  OWNER: 'Owner',
  CONTRACTOR: 'Contractor',
};

/**
 * Photo Grid Component — Issue #187
 * 
 * Sortable photo grid with drag & drop reordering.
 */
export function PhotoGrid({
  photos: initialPhotos,
  onReorder,
  onUpdateCaption,
  onDelete,
  isLoading = false,
}: PhotoGridProps): React.ReactElement {
  const [photos, setPhotos] = useState(initialPhotos);
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const [deletePhoto, setDeletePhoto] = useState<Photo | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent): Promise<void> => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = photos.findIndex((p) => p.id === active.id);
        const newIndex = photos.findIndex((p) => p.id === over.id);

        const newPhotos = arrayMove(photos, oldIndex, newIndex);
        setPhotos(newPhotos);

        // Save new order
        setIsSaving(true);
        try {
          await onReorder(newPhotos.map((p) => p.id));
        } catch (error) {
          // Revert on error
          setPhotos(photos);
          console.error('Failed to reorder photos:', error);
        } finally {
          setIsSaving(false);
        }
      }
    },
    [photos, onReorder]
  );

  const handleCaptionSave = useCallback(
    async (photoId: string, caption: string): Promise<void> => {
      setIsSaving(true);
      try {
        await onUpdateCaption(photoId, caption);
        setPhotos((prev) =>
          prev.map((p) => (p.id === photoId ? { ...p, caption } : p))
        );
      } finally {
        setIsSaving(false);
      }
    },
    [onUpdateCaption]
  );

  const handleDeleteConfirm = useCallback(async (): Promise<void> => {
    if (!deletePhoto) return;

    setIsSaving(true);
    try {
      await onDelete(deletePhoto.id);
      setPhotos((prev) => prev.filter((p) => p.id !== deletePhoto.id));
    } finally {
      setIsSaving(false);
      setDeletePhoto(null);
    }
  }, [deletePhoto, onDelete]);

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg
          className="w-12 h-12 mx-auto mb-4 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p>No photos yet</p>
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={photos.map((p) => p.id)} strategy={rectSortingStrategy}>
          <div
            className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 ${
              isLoading || isSaving ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            {photos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                sourceColor={SOURCE_COLORS[photo.source] || 'bg-gray-100 text-gray-800'}
                sourceLabel={SOURCE_LABELS[photo.source] || photo.source}
                onView={() => setLightboxPhoto(photo)}
                onCaptionSave={(caption) => handleCaptionSave(photo.id, caption)}
                onDelete={() => setDeletePhoto(photo)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Lightbox */}
      <PhotoLightbox
        photo={lightboxPhoto}
        photos={photos}
        onClose={() => setLightboxPhoto(null)}
        onNavigate={setLightboxPhoto}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deletePhoto}
        title="Delete Photo"
        message={`Are you sure you want to delete photo #${deletePhoto?.reportNumber}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletePhoto(null)}
      />
    </>
  );
}
