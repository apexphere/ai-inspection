import { Suspense } from 'react';
import { ProjectList } from './project-list';
import { ProjectFilters } from './project-filters';

export const metadata = {
  title: 'Projects | AI Inspection',
};

function FiltersSkeleton(): React.ReactElement {
  return (
    <div className="mb-6 flex flex-col sm:flex-row gap-4 animate-pulse">
      <div className="flex-1 h-10 bg-gray-200 rounded-lg" />
      <div className="sm:w-48 h-10 bg-gray-200 rounded-lg" />
    </div>
  );
}

function ListSkeleton(): React.ReactElement {
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
}

export default function ProjectsPage(): React.ReactElement {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <p className="text-gray-600 mt-1">
          View and manage your inspection projects
        </p>
      </div>

      <Suspense fallback={<FiltersSkeleton />}>
        <ProjectFilters />
      </Suspense>

      <Suspense fallback={<ListSkeleton />}>
        <ProjectList />
      </Suspense>
    </div>
  );
}
