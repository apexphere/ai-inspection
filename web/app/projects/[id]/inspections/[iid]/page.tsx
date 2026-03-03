import { getApiUrl } from '@/lib/api-url';
import { auth } from '@/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';

const API_URL = getApiUrl();

interface PageProps {
  params: Promise<{ id: string; iid: string }>;
}

interface SiteInspection {
  id: string;
  type: string;
  stage: string;
  date: string;
  status: string;
  inspectorName: string;
  outcome: string | null;
  projectId: string;
}

interface ChecklistItem {
  id: string;
  category: string;
  description: string;
  decision: 'PASS' | 'FAIL' | 'NA' | null;
  notes: string | null;
  orderIndex: number;
}

interface ClauseReview {
  id: string;
  clauseId: string;
  applicability: 'APPLICABLE' | 'NA';
  naReason: string | null;
  observations: string | null;
  remedialWorks: string | null;
  clause: {
    code: string;
    title: string;
    description: string | null;
    category: string;
  };
}

interface Project {
  id: string;
  property: { streetAddress: string };
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  REVIEW: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-green-100 text-green-700',
};

const DECISION_ICONS: Record<string, string> = {
  PASS: '✓',
  FAIL: '✗',
  NA: '—',
};

const DECISION_COLORS: Record<string, string> = {
  PASS: 'text-green-700',
  FAIL: 'text-red-700',
  NA: 'text-gray-400',
};

async function getSiteInspection(id: string, token?: string): Promise<SiteInspection | null> {
  const response = await fetch(`${API_URL}/api/site-inspections/${id}`, {
    cache: 'no-store',
    headers: { ...(token && { Authorization: `Bearer ${token}` }) },
  });
  if (!response.ok) return null;
  return response.json();
}

async function getProject(id: string, token?: string): Promise<Project | null> {
  const response = await fetch(`${API_URL}/api/projects/${id}`, {
    cache: 'no-store',
    headers: { ...(token && { Authorization: `Bearer ${token}` }) },
  });
  if (!response.ok) return null;
  return response.json();
}

async function getChecklistItems(inspectionId: string, token?: string): Promise<ChecklistItem[]> {
  const response = await fetch(
    `${API_URL}/api/site-inspections/${inspectionId}/checklist-items`,
    { cache: 'no-store', headers: { ...(token && { Authorization: `Bearer ${token}` }) } }
  );
  if (!response.ok) return [];
  return response.json();
}

async function getClauseReviews(inspectionId: string, token?: string): Promise<ClauseReview[]> {
  const response = await fetch(
    `${API_URL}/api/site-inspections/${inspectionId}/clause-reviews`,
    { cache: 'no-store', headers: { ...(token && { Authorization: `Bearer ${token}` }) } }
  );
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? data : data.reviews ?? [];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item);
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

export async function generateMetadata({ params }: PageProps): Promise<{ title: string }> {
  const { iid } = await params;
  const session = await auth();
  const token = (session as { apiToken?: string } | null)?.apiToken;
  const inspection = await getSiteInspection(iid, token);
  if (!inspection) return { title: 'Inspection Not Found | AI Inspection' };
  return { title: `${inspection.stage} Inspection | AI Inspection` };
}

export default async function InspectionDetailPage({ params }: PageProps): Promise<React.ReactElement> {
  const { id, iid } = await params;
  const session = await auth();
  const token = (session as { apiToken?: string } | null)?.apiToken;

  const [inspection, project] = await Promise.all([
    getSiteInspection(iid, token),
    getProject(id, token),
  ]);

  if (!inspection) notFound();

  const isSimple = inspection.type === 'SIMPLE';
  const [checklistItems, clauseReviews] = await Promise.all([
    isSimple ? getChecklistItems(iid, token) : Promise.resolve([]),
    !isSimple ? getClauseReviews(iid, token) : Promise.resolve([]),
  ]);

  const address = project?.property.streetAddress ?? id;

  // Group checklist items by category
  const checklistGroups = groupBy(
    [...checklistItems].sort((a, b) => a.orderIndex - b.orderIndex),
    (item) => item.category
  );

  // Group clause reviews by clause category
  const clauseGroups = groupBy(clauseReviews, (r) => r.clause.category ?? 'Other');

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-4">
        <ol className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
          <li>
            <Link href="/projects" className="hover:text-gray-900">Projects</Link>
          </li>
          <li>/</li>
          <li>
            <Link href={`/projects/${id}`} className="hover:text-gray-900">{address}</Link>
          </li>
          <li>/</li>
          <li className="text-gray-900 font-medium">
            {inspection.stage} — {formatDate(inspection.date)}
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {inspection.stage} Site Inspection
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {inspection.type} · {inspection.inspectorName} · {formatDate(inspection.date)}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium self-start ${
            STATUS_COLORS[inspection.status] || 'bg-gray-100 text-gray-700'
          }`}
        >
          {inspection.status.replace('_', ' ')}
        </span>
      </div>

      {/* Checklist Items (SIMPLE) */}
      {isSimple && (
        <div className="space-y-4">
          {Object.keys(checklistGroups).length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <p className="text-sm text-gray-500 italic">No checklist items recorded.</p>
            </div>
          ) : (
            Object.entries(checklistGroups).map(([category, items]) => (
              <div key={category} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    {category} <span className="text-gray-400 font-normal">({items.length})</span>
                  </h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {items.map((item) => (
                    <div key={item.id} className="px-6 py-3 flex items-start gap-4">
                      <span
                        className={`mt-0.5 text-sm font-bold w-4 shrink-0 ${
                          DECISION_COLORS[item.decision ?? 'NA']
                        }`}
                      >
                        {DECISION_ICONS[item.decision ?? 'NA']}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{item.description}</p>
                        {item.notes && (
                          <p className="text-xs text-gray-500 mt-0.5 italic">{item.notes}</p>
                        )}
                      </div>
                      <span
                        className={`text-xs font-medium shrink-0 ${
                          DECISION_COLORS[item.decision ?? 'NA']
                        }`}
                      >
                        {item.decision ?? 'N/A'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Clause Reviews (CLAUSE_REVIEW / COA) */}
      {!isSimple && (
        <div className="space-y-4">
          {Object.keys(clauseGroups).length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <p className="text-sm text-gray-500 italic">No clause reviews recorded.</p>
            </div>
          ) : (
            Object.entries(clauseGroups).map(([category, reviews]) => (
              <div key={category} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    {category} <span className="text-gray-400 font-normal">({reviews.length})</span>
                  </h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {reviews.map((review) => (
                    <div key={review.id} className="px-6 py-4">
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <div>
                          <span className="text-sm font-mono font-medium text-gray-900">
                            {review.clause.code}
                          </span>
                          <span className="text-sm text-gray-700 ml-2">{review.clause.title}</span>
                        </div>
                        <span
                          className={`text-xs font-medium shrink-0 px-2 py-0.5 rounded-full ${
                            review.applicability === 'APPLICABLE'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {review.applicability === 'APPLICABLE' ? 'Applicable' : 'N/A'}
                        </span>
                      </div>
                      {review.naReason && (
                        <p className="text-xs text-gray-500 italic mt-1">{review.naReason}</p>
                      )}
                      {review.observations && (
                        <p className="text-sm text-gray-600 mt-2">{review.observations}</p>
                      )}
                      {review.remedialWorks && (
                        <p className="text-sm text-orange-700 mt-1">
                          <span className="font-medium">Remedial: </span>{review.remedialWorks}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
