'use client';

import { useCallback } from 'react';
import { CollapsibleSection } from '@/components/collapsible-section';
import { PhotoGrid, Photo } from '@/components/photo-grid';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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

interface ProjectSectionsProps {
  project: Project;
}

const TA_LABELS: Record<string, string> = {
  AKL: 'Auckland Council',
  WCC: 'Wellington City Council',
  CCC: 'Christchurch City Council',
  HDC: 'Hamilton District Council',
  TCC: 'Tauranga City Council',
  DCC: 'Dunedin City Council',
  HCC: 'Hutt City Council',
  PCC: 'Porirua City Council',
  NCC: 'Nelson City Council',
  ICC: 'Invercargill City Council',
  NPDC: 'New Plymouth District Council',
  WDC: 'Whangarei District Council',
  RDC: 'Rotorua District Council',
  OTHER: 'Other',
};

const INSPECTION_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  REVIEW: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
};

const DOCUMENT_STATUS_COLORS: Record<string, string> = {
  REQUIRED: 'bg-yellow-100 text-yellow-800',
  RECEIVED: 'bg-green-100 text-green-800',
  OUTSTANDING: 'bg-red-100 text-red-800',
  NA: 'bg-gray-100 text-gray-800',
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }): React.ReactElement | null {
  if (!value) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4 py-2 border-b border-gray-100 last:border-0">
      <dt className="text-sm font-medium text-gray-500 sm:w-40 shrink-0">{label}</dt>
      <dd className="text-sm text-gray-900">{value}</dd>
    </div>
  );
}

export function ProjectSections({ project }: ProjectSectionsProps): React.ReactElement {
  const inspectionCount = project.siteInspections?.length ?? 0;
  const completedInspections = project.siteInspections?.filter(
    (i) => i.status === 'COMPLETED'
  ).length ?? 0;

  const documentCount = project.documents?.length ?? 0;
  const receivedDocuments = project.documents?.filter(
    (d) => d.status === 'RECEIVED'
  ).length ?? 0;

  const photoCount = project.photos?.length ?? 0;

  return (
    <div className="space-y-4">
      {/* Project Info Section */}
      <CollapsibleSection id="project-info" title="Project Info">
        <dl className="space-y-1">
          <InfoRow label="Job Number" value={project.jobNumber} />
          <InfoRow label="Activity" value={project.activity} />
          <InfoRow label="Report Type" value={project.reportType} />
          <InfoRow label="Status" value={project.status} />
          <InfoRow label="Created" value={formatDate(project.createdAt)} />
          <InfoRow label="Last Updated" value={formatDate(project.updatedAt)} />
        </dl>
      </CollapsibleSection>

      {/* Client Section */}
      <CollapsibleSection id="client" title="Client">
        <dl className="space-y-1">
          <InfoRow label="Name" value={project.client.name} />
          <InfoRow label="Contact Person" value={project.client.contactPerson} />
          <InfoRow label="Email" value={project.client.email} />
          <InfoRow label="Phone" value={project.client.phone} />
          <InfoRow label="Mobile" value={project.client.mobile} />
          <InfoRow label="Address" value={project.client.address} />
        </dl>
      </CollapsibleSection>

      {/* Property Section */}
      <CollapsibleSection id="property" title="Property">
        <dl className="space-y-1">
          <InfoRow label="Street Address" value={project.property.streetAddress} />
          <InfoRow label="Suburb" value={project.property.suburb} />
          <InfoRow label="City" value={project.property.city} />
          <InfoRow label="Postcode" value={project.property.postcode} />
          <InfoRow label="Lot/DP" value={project.property.lotDp} />
          <InfoRow
            label="Territorial Authority"
            value={TA_LABELS[project.property.territorialAuthority] || project.property.territorialAuthority}
          />
          <InfoRow label="BC Number" value={project.property.bcNumber} />
          <InfoRow
            label="Year Built"
            value={project.property.yearBuilt?.toString()}
          />
        </dl>
      </CollapsibleSection>

      {/* Inspections Section */}
      <CollapsibleSection
        id="inspections"
        title="Inspections"
        completionStatus={inspectionCount > 0 ? `${completedInspections}/${inspectionCount} complete` : undefined}
      >
        {inspectionCount === 0 ? (
          <p className="text-sm text-gray-500 italic">No inspections recorded</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="py-2 pr-4">Stage</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Inspector</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {project.siteInspections?.map((inspection) => (
                  <tr key={inspection.id} className="text-sm">
                    <td className="py-2 pr-4 font-medium">{inspection.stage}</td>
                    <td className="py-2 pr-4">{inspection.type}</td>
                    <td className="py-2 pr-4">{formatDate(inspection.date)}</td>
                    <td className="py-2 pr-4">{inspection.inspectorName}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          INSPECTION_STATUS_COLORS[inspection.status] || 'bg-gray-100'
                        }`}
                      >
                        {inspection.status}
                      </span>
                    </td>
                    <td className="py-2">{inspection.outcome || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CollapsibleSection>

      {/* Documents Section */}
      <CollapsibleSection
        id="documents"
        title="Documents"
        completionStatus={documentCount > 0 ? `${receivedDocuments}/${documentCount} received` : undefined}
      >
        {documentCount === 0 ? (
          <p className="text-sm text-gray-500 italic">No documents attached</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="py-2 pr-4">Appendix</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Description</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {project.documents?.map((doc) => (
                  <tr key={doc.id} className="text-sm">
                    <td className="py-2 pr-4 font-medium">
                      {doc.appendixLetter || '—'}
                    </td>
                    <td className="py-2 pr-4">{doc.documentType}</td>
                    <td className="py-2 pr-4">{doc.description}</td>
                    <td className="py-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          DOCUMENT_STATUS_COLORS[doc.status] || 'bg-gray-100'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CollapsibleSection>

      {/* Photos Section */}
      <PhotosSection
        projectId={project.id}
        photos={project.photos ?? []}
        photoCount={photoCount}
      />
    </div>
  );
}

/**
 * Photos Section with PhotoGrid — Issue #187
 */
function PhotosSection({
  projectId,
  photos,
  photoCount,
}: {
  projectId: string;
  photos: Photo[];
  photoCount: number;
}): React.ReactElement {
  const handleReorder = useCallback(
    async (photoIds: string[]): Promise<void> => {
      await fetch(`${API_URL}/api/projects/${projectId}/photos/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ photoIds }),
      });
    },
    [projectId]
  );

  const handleUpdateCaption = useCallback(
    async (photoId: string, caption: string): Promise<void> => {
      await fetch(`${API_URL}/api/photos/${photoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ caption }),
      });
    },
    []
  );

  const handleDelete = useCallback(
    async (photoId: string): Promise<void> => {
      await fetch(`${API_URL}/api/photos/${photoId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
    },
    []
  );

  return (
    <CollapsibleSection
      id="photos"
      title="Photos"
      completionStatus={photoCount > 0 ? `${photoCount} photos` : undefined}
    >
      <PhotoGrid
        photos={photos}
        onReorder={handleReorder}
        onUpdateCaption={handleUpdateCaption}
        onDelete={handleDelete}
      />
    </CollapsibleSection>
  );
}
