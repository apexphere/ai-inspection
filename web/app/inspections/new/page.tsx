'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CreateInspectionInput, ApiError } from '@/lib/api';
import { useApi } from '@/lib/use-api';

const CHECKLISTS = [
  { id: 'nz-ppi', name: 'NZ Pre-Purchase Inspection' },
  { id: 'nz-coa', name: 'NZ Certificate of Acceptance' },
  { id: 'nz-ccc', name: 'NZ Code Compliance Certificate' },
];

export default function NewInspectionPage(): React.ReactElement {
  const router = useRouter();
  const api = useApi();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateInspectionInput>({
    address: '',
    clientName: '',
    inspectorName: '',
    checklistId: 'nz-ppi',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!formData.address.trim()) {
      setError('Address is required');
      return;
    }
    if (!formData.clientName.trim()) {
      setError('Client name is required');
      return;
    }

    try {
      setSubmitting(true);
      const inspection = await api.inspections.create(formData);
      router.push(`/inspections/${inspection.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to create inspection');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/inspections"
          className="text-sm text-blue-600 hover:text-blue-900 mb-2 inline-block"
        >
          ← Back to Inspections
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">New Inspection</h1>
      </div>

      <div className="bg-white shadow-sm rounded-xl p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Property Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 Main Street, Auckland"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="clientName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Client Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="clientName"
              name="clientName"
              value={formData.clientName}
              onChange={handleChange}
              placeholder="John Smith"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="inspectorName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Inspector Name
            </label>
            <input
              type="text"
              id="inspectorName"
              name="inspectorName"
              value={formData.inspectorName}
              onChange={handleChange}
              placeholder="Optional"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="checklistId"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Checklist <span className="text-red-500">*</span>
            </label>
            <select
              id="checklistId"
              name="checklistId"
              value={formData.checklistId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {CHECKLISTS.map((checklist) => (
                <option key={checklist.id} value={checklist.id}>
                  {checklist.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating...' : 'Create Inspection'}
            </button>
            <Link
              href="/inspections"
              className="px-6 py-2 text-gray-600 font-medium hover:text-gray-900 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
