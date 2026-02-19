'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { PhotoCard, type Photo } from './photo-card';
import { Lightbox } from './lightbox';

interface PhotoGridProps {
  /** Photos to display */
  photos: Photo[];
  /** Called when photos are reordered */
  onReorder: (photoIds: string[]) => void;
  /** Called when a photo is deleted */
  onDelete: (photoId: string) => void;
  /** Called when a photo caption is changed */
  onCaptionChange: (photoId: string, caption: string) => void;
  /** Called when a photo is moved to a different clause */
  onMove?: (photoId: string, targetClauseId: string) => void;
  /** Available clauses for moving photos */
  clauses?: Array<{ id: string; code: string; title: string }>;
}

/**
 * Grid of photos with drag & drop reordering.
 */
export function PhotoGrid({
  photos,
  onReorder,
  onDelete,
  onCaptionChange,
  onMove,
  clauses,
}: PhotoGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = photos.findIndex((p) => p.id === active.id);
        const newIndex = photos.findIndex((p) => p.id === over.id);

        const newOrder = arrayMove(photos, oldIndex, newIndex);
        onReorder(newOrder.map((p) => p.id));
      }
    },
    [photos, onReorder]
  );

  const handlePhotoClick = useCallback(
    (index: number) => {
      setLightboxIndex(index);
    },
    []
  );

  const handleLightboxClose = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  const handleLightboxPrev = useCallback(() => {
    setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i));
  }, []);

  const handleLightboxNext = useCallback(() => {
    setLightboxIndex((i) =>
      i !== null && i < photos.length - 1 ? i + 1 : i
    );
  }, [photos.length]);

  if (photos.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center text-gray-500">
        No photos yet. Capture photos via WhatsApp or upload them here.
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
        <SortableContext
          items={photos.map((p) => p.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {photos.map((photo, index) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onClick={() => handlePhotoClick(index)}
                onDelete={() => onDelete(photo.id)}
                onCaptionChange={(caption) => onCaptionChange(photo.id, caption)}
                onMove={onMove}
                clauses={clauses}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          currentIndex={lightboxIndex}
          onClose={handleLightboxClose}
          onPrev={handleLightboxPrev}
          onNext={handleLightboxNext}
        />
      )}
    </>
  );
}
