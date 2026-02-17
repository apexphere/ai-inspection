'use client';

import { useState, useCallback } from 'react';
import { Finding, FindingSeverity, Photo, api, ApiError } from '@/lib/api';
import { SeveritySelect } from './severity-select';
import { PhotoUploader } from './photo-uploader';

interface FindingEditorProps {
  finding: Finding;
  inspectionId: string;
  onSave: (updatedFinding: Finding) => void;
  onDelete: () => void;
  onCancel: () => void;
}

export function FindingEditor({
  finding,
  inspectionId,
  onSave,
  onDelete,
  onCancel,
}: FindingEditorProps): React.ReactElement {
  const [text, setText] = useState(finding.text);
  const [severity, setSeverity] = useState<FindingSeverity>(finding.severity);
  const [photos, setPhotos] = useState<Photo[]>(finding.photos);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanges =
    text !== finding.text ||
    severity !== finding.severity ||
    photos.length !== finding.photos.length;

  const handleSave = async (): Promise<void> => {
    if (!text.trim()) {
      setError('Finding text is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const updatedFinding = await api.findings.update(inspectionId, finding.id, {
        text: text.trim(),
        severity,
      });

      // Merge photos since the update endpoint doesn't return them
      onSave({ ...updatedFinding, photos });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to save changes');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    try {
      setDeleting(true);
      setError(null);

      await api.findings.delete(inspectionId, finding.id);
      onDelete();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to delete finding');
      }
      setDeleting(false);
    }
  };

  const handlePhotoUpload = useCallback(
    async (base64Data: string, mimeType: string): Promise<void> => {
      try {
        setError(null);
        const photo = await api.photos.upload(finding.id, base64Data, mimeType);
        setPhotos((prev) => [...prev, photo]);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Failed to upload photo');
        }
        throw err;
      }
    },
    [finding.id]
  );

  const handlePhotoDelete = async (photoId: string): Promise<void> => {
    try {
      setError(null);
      await api.photos.delete(photoId);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to delete photo');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Edit Finding</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg">
              {error}
            </div>
          )}

          {/* Text */}
          <div>
            <label
              htmlFor="finding-text"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Finding
            </label>
            <textarea
              id="finding-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              disabled={saving || deleting}
              className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              placeholder="Describe the finding..."
            />
          </div>

          {/* Severity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Severity
            </label>
            <SeveritySelect
              value={severity}
              onChange={setSeverity}
              disabled={saving || deleting}
            />
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photos
            </label>
            
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={api.photos.getUrl(photo.id)}
                        alt={photo.filename}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePhotoDelete(photo.id)}
                      disabled={saving || deleting}
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                      aria-label="Delete photo"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <PhotoUploader
              onUpload={handlePhotoUpload}
              disabled={saving || deleting}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          {showDeleteConfirm ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Delete this finding?</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={saving || deleting}
                className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                Delete Finding
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={saving || deleting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || deleting || !hasChanges}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
