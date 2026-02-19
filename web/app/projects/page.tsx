import { Suspense } from 'react';
import { ProjectList } from './project-list';
import { ProjectFilters } from './project-filters';

export const metadata = {
  title: 'Projects | AI Inspection',
};

export default function ProjectsPage(): React.ReactElement {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <p className="text-gray-600 mt-1">
          View and manage your inspection projects
        </p>
      </div>

      <Suspense fallback={<ProjectFilters.Skeleton />}>
        <ProjectFilters />
      </Suspense>

      <Suspense fallback={<ProjectList.Skeleton />}>
        <ProjectList />
      </Suspense>
    </div>
  );
}
