'use client';

import { useState, useCallback, useRef } from 'react';

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
  error?: string;
}

interface DocumentUploadProps {
  projectId: string;
  onUploadComplete: () => void;
  acceptedTypes?: string[];
  maxSizeMB?: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const DEFAULT_ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

/**
 * Document Upload Component — Issue #188
 * 
 * Drag & drop upload zone with progress indicators.
 */
export function DocumentUpload({
  projectId,
  onUploadComplete,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  maxSizeMB = 25,
}: DocumentUploadProps): React.ReactElement {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `Invalid file type: ${file.type}`;
    }
    if (file.size > maxSizeBytes) {
      return `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max ${maxSizeMB}MB)`;
    }
    return null;
  };

  const uploadFile = useCallback(
    async (file: File): Promise<void> => {
      const uploadId = crypto.randomUUID();

      // Validate file
      const error = validateFile(file);
      if (error) {
        setUploadingFiles((prev) => [
          ...prev,
          { id: uploadId, name: file.name, progress: 0, error },
        ]);
        return;
      }

      // Add to uploading list
      setUploadingFiles((prev) => [
        ...prev,
        { id: uploadId, name: file.name, progress: 0 },
      ]);

      try {
        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        formData.append('description', file.name);

        // Upload with progress tracking via XMLHttpRequest
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const progress = Math.round((e.loaded / e.total) * 100);
              setUploadingFiles((prev) =>
                prev.map((f) =>
                  f.id === uploadId ? { ...f, progress } : f
                )
              );
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed: ${xhr.status}`));
            }
          });

          xhr.addEventListener('error', () => {
            reject(new Error('Network error'));
          });

          xhr.open('POST', `${API_URL}/api/projects/${projectId}/documents`);
          xhr.withCredentials = true;
          xhr.send(formData);
        });

        // Success - remove from list after delay
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadId ? { ...f, progress: 100 } : f
          )
        );

        setTimeout(() => {
          setUploadingFiles((prev) => prev.filter((f) => f.id !== uploadId));
          onUploadComplete();
        }, 1000);
      } catch (err) {
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadId
              ? { ...f, error: err instanceof Error ? err.message : 'Upload failed' }
              : f
          )
        );
      }
    },
    [projectId, onUploadComplete, maxSizeBytes, acceptedTypes]
  );

  const handleFiles = useCallback(
    (files: FileList | null): void => {
      if (!files) return;
      Array.from(files).forEach(uploadFile);
    },
    [uploadFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent): void => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent): void => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent): void => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = (): void => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    handleFiles(e.target.files);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          className="hidden"
        />
        <svg
          className={`w-10 h-10 mx-auto mb-3 ${
            isDragging ? 'text-blue-500' : 'text-gray-400'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="text-sm text-gray-600">
          <span className="font-medium text-blue-600">Click to upload</span> or
          drag and drop
        </p>
        <p className="text-xs text-gray-500 mt-1">
          PDF, Word, or images up to {maxSizeMB}MB
        </p>
      </div>

      {/* Upload progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((file) => (
            <div
              key={file.id}
              className={`p-3 rounded-lg ${
                file.error ? 'bg-red-50' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 truncate">
                  {file.name}
                </span>
                {file.error ? (
                  <span className="text-xs text-red-600">{file.error}</span>
                ) : (
                  <span className="text-xs text-gray-500">{file.progress}%</span>
                )}
              </div>
              {!file.error && (
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
