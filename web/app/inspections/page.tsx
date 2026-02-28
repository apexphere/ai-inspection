'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Inspection, ApiError } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import { StatusBadge, LoadingPage, ErrorPage } from '@/components';

export default function InspectionsPage(): React.ReactElement {
  const api = useApi();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInspections = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.inspections.list();
      setInspections(data);
    } catch (err) {
      if (err instanceof ApiError) {
        // Handle 401 specifically - token may be invalid
        if (err.status === 401) {
          setError('Session expired. Please log in again.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to load inspections');
      }
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchInspections();
  }, [fetchInspections]);

  if (loading) {
    return <LoadingPage />;
  }

  if (error) {
    return <ErrorPage message={error} retry={fetchInspections} />;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Inspections</h1>
        <Link
          href="/inspections/new"
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Inspection
        </Link>
      </div>

      {inspections.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 sm:p-12 text-center">
          <p className="text-gray-500 mb-4">No inspections yet</p>
          <Link
            href="/inspections/new"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Create your first inspection
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile: Card Layout */}
          <div className="sm:hidden space-y-4">
            {inspections.map((inspection) => (
              <Link
                key={inspection.id}
                href={`/inspections/${inspection.id}`}
                className="block bg-white shadow rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="text-sm font-medium text-gray-900 line-clamp-2">
                    {inspection.address}
                  </div>
                  <StatusBadge status={inspection.status} />
                </div>
                <div className="text-sm text-gray-500">{inspection.clientName}</div>
                <div className="text-xs text-gray-400 mt-2">
                  {new Date(inspection.createdAt).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop: Table Layout */}
          <div className="hidden sm:block bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inspections.map((inspection) => (
                    <tr key={inspection.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {inspection.address}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {inspection.clientName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={inspection.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(inspection.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/inspections/${inspection.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
