'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApi } from '@/lib/use-api';
import { ApiError, CreateInspectionInput } from '@/lib/api';

// Common checklist options - could be fetched from API in future
const CHECKLIST_OPTIONS = [
  { value: 'coa-standard', label: 'COA Standard' },
  { value: 'ccc-gap', label: 'CCC Gap Analysis' },
  { value: 'ppi-standard', label: 'Pre-Purchase Inspection' },
];

export default function NewInspectionPage(): React.ReactElement {
  const router = useRouter();
  const api = useApi();
  
  const [address, setAddress] = useState('');
  const [clientName, setClientName] = useState('');
  const [inspectorName, setInspectorName] = useState('');
  const [checklistId, setChecklistId] = useState('coa-standard');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!address.trim()) {
      setError('Address is required');
      return;
    }
    if (!clientName.trim()) {
      setError('Client name is required');
      return;
    }
    if (!checklistId) {
      setError('Please select a checklist');
      return;
    }

    setSubmitting(true);

    try {
      const data: CreateInspectionInput = {
        address: address.trim(),
        clientName: clientName.trim(),
        checklistId,
      };

      if (inspectorName.trim()) {
        data.inspectorName = inspectorName.trim();
      }

      const inspection = await api.inspections.create(data);
      router.push(`/inspections/${inspection.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to create inspection');
      }
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Back Link */}
      <Link
        href="/inspections"
        className="text-sm text-blue-600 hover:text-blue-900 mb-4 inline-block"
      >
        ← Back to Inspections
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">New Inspection</h1>
        <p className="text-base text-gray-600 mt-1">
          Create a new property inspection
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-xl">
        <div className="bg-white shadow-sm rounded-xl p-6">
          {/* Error Alert */}
          {error && (
            <div 
              className="mb-6 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Address */}
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Property Address <span className="text-red-500">*</span>
              </label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={submitting}
                required
                autoFocus
                placeholder="123 Main Street, Auckland"
                className="block w-full h-11 px-3 border border-gray-200 rounded-lg text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
              />
            </div>

            {/* Client Name */}
            <div>
              <label
                htmlFor="clientName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Client Name <span className="text-red-500">*</span>
              </label>
              <input
                id="clientName"
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                disabled={submitting}
                required
                placeholder="Acme Corporation"
                className="block w-full h-11 px-3 border border-gray-200 rounded-lg text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
              />
            </div>

            {/* Inspector Name (Optional) */}
            <div>
              <label
                htmlFor="inspectorName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Inspector Name
              </label>
              <input
                id="inspectorName"
                type="text"
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
                disabled={submitting}
                placeholder="John Smith"
                className="block w-full h-11 px-3 border border-gray-200 rounded-lg text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
              />
            </div>

            {/* Checklist */}
            <div>
              <label
                htmlFor="checklistId"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Inspection Checklist <span className="text-red-500">*</span>
              </label>
              <select
                id="checklistId"
                value={checklistId}
                onChange={(e) => setChecklistId(e.target.value)}
                disabled={submitting}
                required
                className="block w-full h-11 px-3 border border-gray-200 rounded-lg text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
              >
                {CHECKLIST_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting || !address || !clientName}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating...' : 'Create Inspection'}
            </button>
            <Link
              href="/inspections"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
