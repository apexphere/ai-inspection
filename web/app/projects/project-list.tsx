'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface Project {
  id: string;
  jobNumber: string | null;
  activity: string;
  reportType: string;
  status: string;
  updatedAt: string;
  property?: {
    address: string;
  };
  client?: {
    name: string;
  };
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  REVIEW: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'Review',
  COMPLETED: 'Completed',
};

export function ProjectList(): React.ReactElement {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const status = searchParams.get('status') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'updatedAt';
  const order = searchParams.get('order') || 'desc';

  useEffect(() => {
    async function fetchProjects(): Promise<void> {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (status) params.set('status', status);
        if (search) {
          params.set('address', search);
          params.set('jobNumber', search);
        }

        const response = await fetch(`${API_URL}/api/projects?${params}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }

        let data: Project[] = await response.json();

        // Client-side sorting
        data = data.sort((a, b) => {
          let aVal: string | number = '';
          let bVal: string | number = '';

          switch (sort) {
            case 'jobNumber':
              aVal = a.jobNumber || '';
              bVal = b.jobNumber || '';
              break;
            case 'address':
              aVal = a.property?.address || '';
              bVal = b.property?.address || '';
              break;
            case 'client':
              aVal = a.client?.name || '';
              bVal = b.client?.name || '';
              break;
            case 'status':
              aVal = a.status;
              bVal = b.status;
              break;
            case 'updatedAt':
            default:
              aVal = new Date(a.updatedAt).getTime();
              bVal = new Date(b.updatedAt).getTime();
          }

          if (typeof aVal === 'number' && typeof bVal === 'number') {
            return order === 'asc' ? aVal - bVal : bVal - aVal;
          }
          return order === 'asc'
            ? String(aVal).localeCompare(String(bVal))
            : String(bVal).localeCompare(String(aVal));
        });

        setProjects(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [status, search, sort, order]);

  const handleSort = (column: string): void => {
    const params = new URLSearchParams(searchParams.toString());
    if (sort === column) {
      params.set('order', order === 'asc' ? 'desc' : 'asc');
    } else {
      params.set('sort', column);
      params.set('order', 'desc');
    }
    router.push(`/projects?${params.toString()}`);
  };

  const SortIcon = ({ column }: { column: string }): React.ReactElement | null => {
    if (sort !== column) return null;
    return (
      <span className="ml-1">
        {order === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  if (loading) {
    return <ProjectList.Skeleton />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <div className="text-gray-500 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No projects found</h3>
        <p className="text-gray-500">
          {search || status ? 'Try adjusting your filters' : 'Create your first project to get started'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('jobNumber')}
            >
              Job # <SortIcon column="jobNumber" />
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('address')}
            >
              Address <SortIcon column="address" />
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('client')}
            >
              Client <SortIcon column="client" />
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('status')}
            >
              Status <SortIcon column="status" />
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('updatedAt')}
            >
              Last Updated <SortIcon column="updatedAt" />
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {projects.map((project) => (
            <tr
              key={project.id}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => router.push(`/projects/${project.id}`)}
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {project.jobNumber || '—'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {project.property?.address || '—'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {project.client?.name || '—'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[project.status] || 'bg-gray-100 text-gray-800'}`}>
                  {STATUS_LABELS[project.status] || project.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(project.updatedAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

ProjectList.Skeleton = function ProjectListSkeleton(): React.ReactElement {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse">
      <div className="bg-gray-50 px-6 py-3">
        <div className="flex gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 bg-gray-200 rounded w-20" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="px-6 py-4 flex gap-4">
            <div className="h-4 bg-gray-200 rounded w-16" />
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-4 bg-gray-200 rounded w-20" />
            <div className="h-4 bg-gray-200 rounded w-24" />
          </div>
        ))}
      </div>
    </div>
  );
};
