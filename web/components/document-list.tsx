'use client';

import { useState, useCallback } from 'react';
import { ConfirmDialog } from './confirm-dialog';

export interface Document {
  id: string;
  appendixLetter: string | null;
  filename: string;
  documentType: string;
  description: string;
  status: string;
  linkedClauses: string[];
  createdAt: string;
}

interface DocumentListProps {
  documents: Document[];
  onUpdate: (docId: string, data: Partial<Document>) => Promise<void>;
  onDelete: (docId: string) => Promise<void>;
  isLoading?: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const DOCUMENT_TYPES = [
  { value: 'PS1', label: 'PS1 - Design Review' },
  { value: 'PS2', label: 'PS2 - Design Certificate' },
  { value: 'PS3', label: 'PS3 - Construction Review' },
  { value: 'PS4', label: 'PS4 - Construction Certificate' },
  { value: 'COC', label: 'Code Compliance Certificate' },
  { value: 'ESC', label: 'Electrical Safety Certificate' },
  { value: 'WARRANTY', label: 'Warranty Document' },
  { value: 'INVOICE', label: 'Invoice' },
  { value: 'DRAWING', label: 'Drawing/Plan' },
  { value: 'REPORT', label: 'Report' },
  { value: 'FLOOD_TEST', label: 'Flood Test Report' },
  { value: 'PROPERTY_FILE', label: 'Property File Document' },
  { value: 'OTHER', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'REQUIRED', label: 'Required', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'RECEIVED', label: 'Received', color: 'bg-green-100 text-green-800' },
  { value: 'OUTSTANDING', label: 'Outstanding', color: 'bg-red-100 text-red-800' },
  { value: 'NA', label: 'N/A', color: 'bg-gray-100 text-gray-800' },
];

/**
 * Document List Component — Issue #188
 * 
 * List of documents with inline editing for description, type, and status.
 */
export function DocumentList({
  documents,
  onUpdate,
  onDelete,
  isLoading = false,
}: DocumentListProps): React.ReactElement {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [deleteDoc, setDeleteDoc] = useState<Document | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = (doc: Document, field: string): void => {
    setEditingId(doc.id);
    setEditingField(field);
    setEditValue(doc[field as keyof Document] as string);
  };

  const handleSave = useCallback(
    async (docId: string, field: string, value: string): Promise<void> => {
      setIsSaving(true);
      try {
        await onUpdate(docId, { [field]: value });
      } finally {
        setIsSaving(false);
        setEditingId(null);
        setEditingField(null);
      }
    },
    [onUpdate]
  );

  const handleKeyDown = (
    e: React.KeyboardEvent,
    docId: string,
    field: string
  ): void => {
    if (e.key === 'Enter') {
      handleSave(docId, field, editValue);
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditingField(null);
    }
  };

  const handleDeleteConfirm = useCallback(async (): Promise<void> => {
    if (!deleteDoc) return;
    setIsSaving(true);
    try {
      await onDelete(deleteDoc.id);
    } finally {
      setIsSaving(false);
      setDeleteDoc(null);
    }
  }, [deleteDoc, onDelete]);

  const getStatusColor = (status: string): string => {
    return STATUS_OPTIONS.find((s) => s.value === status)?.color || 'bg-gray-100 text-gray-800';
  };

  const getDocumentTypeLabel = (type: string): string => {
    return DOCUMENT_TYPES.find((t) => t.value === type)?.label || type;
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg
          className="w-10 h-10 mx-auto mb-3 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p>No documents uploaded</p>
      </div>
    );
  }

  return (
    <>
      <div
        className={`overflow-x-auto ${
          isLoading || isSaving ? 'opacity-50 pointer-events-none' : ''
        }`}
      >
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="py-2 pr-4">Appendix</th>
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">Description</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {documents.map((doc) => (
              <tr key={doc.id} className="text-sm group">
                {/* Appendix */}
                <td className="py-2 pr-4 font-medium">
                  {doc.appendixLetter || '—'}
                </td>

                {/* Type */}
                <td className="py-2 pr-4">
                  {editingId === doc.id && editingField === 'documentType' ? (
                    <select
                      value={editValue}
                      onChange={(e) => {
                        setEditValue(e.target.value);
                        handleSave(doc.id, 'documentType', e.target.value);
                      }}
                      onBlur={() => {
                        setEditingId(null);
                        setEditingField(null);
                      }}
                      autoFocus
                      className="text-sm border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {DOCUMENT_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleEdit(doc, 'documentType')}
                      className="text-left hover:text-blue-600"
                      title="Click to change type"
                    >
                      {getDocumentTypeLabel(doc.documentType)}
                    </button>
                  )}
                </td>

                {/* Description */}
                <td className="py-2 pr-4 max-w-xs">
                  {editingId === doc.id && editingField === 'description' ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleSave(doc.id, 'description', editValue)}
                      onKeyDown={(e) => handleKeyDown(e, doc.id, 'description')}
                      autoFocus
                      className="w-full text-sm border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleEdit(doc, 'description')}
                      className="text-left truncate max-w-full hover:text-blue-600"
                      title="Click to edit description"
                    >
                      {doc.description || <span className="text-gray-400 italic">Add description...</span>}
                    </button>
                  )}
                </td>

                {/* Status */}
                <td className="py-2 pr-4">
                  {editingId === doc.id && editingField === 'status' ? (
                    <select
                      value={editValue}
                      onChange={(e) => {
                        setEditValue(e.target.value);
                        handleSave(doc.id, 'status', e.target.value);
                      }}
                      onBlur={() => {
                        setEditingId(null);
                        setEditingField(null);
                      }}
                      autoFocus
                      className="text-sm border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleEdit(doc, 'status')}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        doc.status
                      )}`}
                      title="Click to change status"
                    >
                      {STATUS_OPTIONS.find((s) => s.value === doc.status)?.label || doc.status}
                    </button>
                  )}
                </td>

                {/* Actions */}
                <td className="py-2">
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={`${API_URL}/api/documents/${doc.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-gray-500 hover:text-blue-600"
                      title="Download"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                    <button
                      type="button"
                      onClick={() => setDeleteDoc(doc)}
                      className="p-1 text-gray-500 hover:text-red-600"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteDoc}
        title="Delete Document"
        message={`Are you sure you want to delete "${deleteDoc?.description || deleteDoc?.filename}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDoc(null)}
      />
    </>
  );
}
