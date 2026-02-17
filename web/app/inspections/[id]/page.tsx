'use client';

import { useEffect, useState, use, useCallback } from 'react';
import Link from 'next/link';
import { api, InspectionDetail, Finding, ApiError } from '@/lib/api';
import { StatusBadge, LoadingPage, ErrorPage, SectionList, FindingEditor } from '@/components';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function InspectionDetailPage({ params }: PageProps): React.ReactElement {
  const { id } = use(params);
  const [inspection, setInspection] = useState<InspectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [editingFinding, setEditingFinding] = useState<Finding | null>(null);

  const fetchInspection = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.inspections.get(id);
      setInspection(data);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setError('Inspection not found');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to load inspection');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleGenerateReport = async (): Promise<void> => {
    if (!inspection) return;

    try {
      setGenerating(true);
      const result = await api.reports.generate(inspection.id);
      // Open report in new tab
      window.open(result.url, '_blank');
    } catch (err) {
      if (err instanceof ApiError) {
        alert(`Failed to generate report: ${err.message}`);
      } else {
        alert('Failed to generate report');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleEditFinding = (finding: Finding): void => {
    setEditingFinding(finding);
  };

  const handleSaveFinding = (updatedFinding: Finding): void => {
    if (!inspection) return;

    // Update the finding in the inspection state
    setInspection({
      ...inspection,
      findings: inspection.findings.map((f) =>
        f.id === updatedFinding.id ? updatedFinding : f
      ),
    });
    setEditingFinding(null);
  };

  const handleDeleteFinding = (): void => {
    if (!inspection || !editingFinding) return;

    // Remove the finding from the inspection state
    setInspection({
      ...inspection,
      findings: inspection.findings.filter((f) => f.id !== editingFinding.id),
    });
    setEditingFinding(null);
  };

  useEffect(() => {
    fetchInspection();
  }, [fetchInspection]);

  if (loading) {
    return <LoadingPage />;
  }

  if (error || !inspection) {
    return <ErrorPage message={error || 'Inspection not found'} retry={fetchInspection} />;
  }

  const findingsCount = inspection.findings.length;
  const urgentCount = inspection.findings.filter((f) => f.severity === 'URGENT').length;
  const majorCount = inspection.findings.filter((f) => f.severity === 'MAJOR').length;

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/inspections"
          className="text-sm text-blue-600 hover:text-blue-900 mb-2 inline-block"
        >
          ← Back to Inspections
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{inspection.address}</h1>
            <p className="text-gray-500 mt-1">
              Client: {inspection.clientName}
              {inspection.inspectorName && ` • Inspector: ${inspection.inspectorName}`}
            </p>
          </div>
          <StatusBadge status={inspection.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Findings */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Findings</h2>
          <SectionList
            findings={inspection.findings}
            onEditFinding={handleEditFinding}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
            <div className="space-y-3">
              <button
                onClick={handleGenerateReport}
                disabled={generating || inspection.status !== 'COMPLETED'}
                className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? 'Generating...' : 'Generate Report'}
              </button>
              {inspection.status !== 'COMPLETED' && (
                <p className="text-xs text-gray-500 text-center">
                  Complete the inspection to generate a report
                </p>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Total Findings</dt>
                <dd className="font-medium text-gray-900">{findingsCount}</dd>
              </div>
              {urgentCount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-red-600">Urgent</dt>
                  <dd className="font-medium text-red-600">{urgentCount}</dd>
                </div>
              )}
              {majorCount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-yellow-600">Major</dt>
                  <dd className="font-medium text-yellow-600">{majorCount}</dd>
                </div>
              )}
              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Current Section</dt>
                  <dd className="font-medium text-gray-900 capitalize">
                    {inspection.currentSection.replace(/-/g, ' ')}
                  </dd>
                </div>
              </div>
            </dl>
          </div>

          {/* Details */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Checklist</dt>
                <dd className="text-gray-900">{inspection.checklistId}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Created</dt>
                <dd className="text-gray-900">
                  {new Date(inspection.createdAt).toLocaleDateString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Updated</dt>
                <dd className="text-gray-900">
                  {new Date(inspection.updatedAt).toLocaleDateString()}
                </dd>
              </div>
              {inspection.completedAt && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Completed</dt>
                  <dd className="text-gray-900">
                    {new Date(inspection.completedAt).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>

      {/* Finding Editor Modal */}
      {editingFinding && (
        <FindingEditor
          finding={editingFinding}
          inspectionId={id}
          onSave={handleSaveFinding}
          onDelete={handleDeleteFinding}
          onCancel={() => setEditingFinding(null)}
        />
      )}
    </div>
  );
}
