'use client';

import { useState, useCallback } from 'react';
import { CollapsibleSection } from '@/components/collapsible-section';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface ClauseReview {
  id: string;
  clauseId: string;
  applicability: 'APPLICABLE' | 'NA';
  naReason: string | null;
  observations: string | null;
  photoIds: string[];
  docIds: string[];
  docsRequired: string | null;
  remedialWorks: string | null;
  clause: {
    code: string;
    title: string;
    description: string | null;
  };
}

interface SiteInspection {
  id: string;
  type: string;
  stage: string;
  clauseReviews?: ClauseReview[];
}

interface ClauseReviewSectionProps {
  inspections: SiteInspection[];
  photos?: Array<{ id: string; reportNumber: number; caption: string; thumbnailPath: string | null }>;
  documents?: Array<{ id: string; documentType: string; description: string }>;
}

const APPLICABILITY_COLORS = {
  APPLICABLE: 'bg-green-100 text-green-800',
  NA: 'bg-gray-100 text-gray-600',
};

export function ClauseReviewSection({
  inspections,
  photos = [],
  documents = [],
}: ClauseReviewSectionProps): React.ReactElement {
  // Get all clause reviews from inspections
  const allReviews = inspections.flatMap((i) => 
    (i.clauseReviews || []).map((r) => ({ ...r, inspectionId: i.id, stage: i.stage }))
  );

  const reviewCount = allReviews.length;
  const applicableCount = allReviews.filter((r) => r.applicability === 'APPLICABLE').length;

  if (reviewCount === 0) {
    return (
      <CollapsibleSection id="clause-reviews" title="Clause Reviews">
        <p className="text-sm text-gray-500 italic">No clause reviews recorded</p>
      </CollapsibleSection>
    );
  }

  return (
    <CollapsibleSection
      id="clause-reviews"
      title="Clause Reviews"
      completionStatus={`${applicableCount}/${reviewCount} applicable`}
    >
      <div className="space-y-4">
        {allReviews.map((review) => (
          <ClauseReviewCard
            key={review.id}
            review={review}
            photos={photos.filter((p) => review.photoIds.includes(p.id))}
            documents={documents.filter((d) => review.docIds.includes(d.id))}
          />
        ))}
      </div>
    </CollapsibleSection>
  );
}

interface ClauseReviewCardProps {
  review: ClauseReview & { inspectionId: string; stage: string };
  photos: Array<{ id: string; reportNumber: number; caption: string; thumbnailPath: string | null }>;
  documents: Array<{ id: string; documentType: string; description: string }>;
}

function ClauseReviewCard({ review, photos, documents }: ClauseReviewCardProps): React.ReactElement {
  const [observations, setObservations] = useState(review.observations || '');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const saveObservations = useCallback(async (newObservations: string) => {
    setSaving(true);
    try {
      const response = await fetch(
        `${API_URL}/api/site-inspections/${review.inspectionId}/clause-reviews/${review.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ observations: newObservations }),
        }
      );

      if (response.ok) {
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error('Failed to save observations:', error);
    } finally {
      setSaving(false);
    }
  }, [review.inspectionId, review.id]);

  // Debounced auto-save
  const handleObservationsChange = useCallback((value: string) => {
    setObservations(value);
    
    // Auto-save after 1 second of inactivity
    const timeoutId = setTimeout(() => {
      saveObservations(value);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [saveObservations]);

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-blue-700">
              {review.clause.code}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                APPLICABILITY_COLORS[review.applicability]
              }`}
            >
              {review.applicability === 'APPLICABLE' ? 'Applicable' : 'N/A'}
            </span>
          </div>
          <h4 className="text-sm font-medium text-gray-900 mt-1">
            {review.clause.title}
          </h4>
          {review.clause.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {review.clause.description}
            </p>
          )}
        </div>
        <span className="text-xs text-gray-400">{review.stage}</span>
      </div>

      {/* N/A Reason */}
      {review.applicability === 'NA' && review.naReason && (
        <div className="mb-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
          <span className="font-medium">N/A Reason:</span> {review.naReason}
        </div>
      )}

      {/* Observations Editor */}
      {review.applicability === 'APPLICABLE' && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-gray-500">
              Observations
            </label>
            <span className="text-xs text-gray-400">
              {saving ? 'Saving...' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : ''}
            </span>
          </div>
          <textarea
            value={observations}
            onChange={(e) => handleObservationsChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[80px]"
            placeholder="Enter observations..."
          />
        </div>
      )}

      {/* Remedial Works */}
      {review.remedialWorks && (
        <div className="mb-3 p-2 bg-yellow-50 rounded text-sm">
          <span className="font-medium text-yellow-800">Remedial Works:</span>{' '}
          <span className="text-yellow-700">{review.remedialWorks}</span>
        </div>
      )}

      {/* Linked Photos */}
      {photos.length > 0 && (
        <div className="mb-3">
          <label className="text-xs font-medium text-gray-500 block mb-2">
            Linked Photos ({photos.length})
          </label>
          <div className="flex gap-2 flex-wrap">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="w-16 h-16 bg-gray-100 rounded overflow-hidden"
                title={`#${photo.reportNumber}: ${photo.caption}`}
              >
                {photo.thumbnailPath ? (
                  <img
                    src={photo.thumbnailPath}
                    alt={photo.caption}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    #{photo.reportNumber}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Linked Documents */}
      {documents.length > 0 && (
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-2">
            Linked Documents ({documents.length})
          </label>
          <div className="flex gap-2 flex-wrap">
            {documents.map((doc) => (
              <span
                key={doc.id}
                className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                title={doc.description}
              >
                {doc.documentType}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
