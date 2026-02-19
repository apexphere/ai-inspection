import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ProjectSections } from './project-sections';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

interface Project {
  id: string;
  jobNumber: string | null;
  activity: string;
  reportType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  property: {
    id: string;
    streetAddress: string;
    suburb: string | null;
    city: string | null;
    postcode: string | null;
    lotDp: string | null;
    territorialAuthority: string;
    bcNumber: string | null;
    yearBuilt: number | null;
    siteData: Record<string, unknown> | null;
    construction: Record<string, unknown> | null;
  };
  client: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    mobile: string | null;
    address: string | null;
    contactPerson: string | null;
  };
  siteInspections?: Array<{
    id: string;
    type: string;
    stage: string;
    date: string;
    status: string;
    inspectorName: string;
    outcome: string | null;
  }>;
  documents?: Array<{
    id: string;
    appendixLetter: string | null;
    documentType: string;
    description: string;
    status: string;
  }>;
  photos?: Array<{
    id: string;
    reportNumber: number;
    caption: string;
    filePath: string;
    thumbnailPath: string | null;
    source: string;
    linkedClauses: string[];
  }>;
}

async function getProject(id: string): Promise<Project | null> {
  try {
    const response = await fetch(`${API_URL}/api/projects/${id}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch project: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching project:', error);
    return null;
  }
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

const REPORT_TYPE_LABELS: Record<string, string> = {
  COA: 'Certificate of Acceptance',
  CCC_GAP: 'CCC Gap Analysis',
  PPI: 'Pre-Purchase Inspection',
  SAFE_SANITARY: 'Safe & Sanitary',
  TFA: 'Technical Feasibility Assessment',
};

export async function generateMetadata({ params }: ProjectPageProps): Promise<{ title: string }> {
  const { id } = await params;
  const project = await getProject(id);
  
  if (!project) {
    return { title: 'Project Not Found | AI Inspection' };
  }

  return {
    title: `${project.jobNumber || 'Project'} - ${project.property.streetAddress} | AI Inspection`,
  };
}

export default async function ProjectPage({ params }: ProjectPageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-4">
        <ol className="flex items-center gap-2 text-sm text-gray-600">
          <li>
            <Link href="/projects" className="hover:text-gray-900">
              Projects
            </Link>
          </li>
          <li>/</li>
          <li className="text-gray-900 font-medium">
            {project.jobNumber || project.id.slice(0, 8)}
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {project.property.streetAddress}
          </h1>
          <p className="text-gray-600 mt-1">
            {project.jobNumber && (
              <span className="mr-3">Job: {project.jobNumber}</span>
            )}
            <span>{REPORT_TYPE_LABELS[project.reportType] || project.reportType}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              STATUS_COLORS[project.status] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {STATUS_LABELS[project.status] || project.status}
          </span>
        </div>
      </div>

      {/* Sections */}
      <ProjectSections project={project} />
    </div>
  );
}
