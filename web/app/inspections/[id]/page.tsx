import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Placeholder data until API is connected
const mockInspection = {
  id: "1",
  propertyAddress: "123 Main Street, Auckland",
  inspectorName: "John Smith",
  status: "in_progress" as const,
  checklistId: "pre-purchase",
  createdAt: "2026-02-17T10:00:00Z",
  updatedAt: "2026-02-17T12:30:00Z",
  findings: [
    {
      id: "f1",
      sectionId: "exterior",
      itemId: "roof",
      status: "pass" as const,
      notes: "Roof in good condition, minor wear on north side",
    },
    {
      id: "f2",
      sectionId: "exterior",
      itemId: "gutters",
      status: "fail" as const,
      notes: "Gutters blocked with debris, recommend cleaning",
    },
    {
      id: "f3",
      sectionId: "interior",
      itemId: "walls",
      status: "pending" as const,
    },
  ],
};

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
};

const statusLabels = {
  draft: "Draft",
  in_progress: "In Progress",
  completed: "Completed",
};

const findingStatusColors = {
  pass: "bg-green-100 text-green-800",
  fail: "bg-red-100 text-red-800",
  na: "bg-gray-100 text-gray-800",
  pending: "bg-yellow-100 text-yellow-800",
};

const findingStatusLabels = {
  pass: "Pass",
  fail: "Fail",
  na: "N/A",
  pending: "Pending",
};

export default async function InspectionDetailPage({
  params,
}: PageProps): Promise<React.ReactElement> {
  const { id } = await params;
  
  // TODO: Fetch from API
  const inspection = { ...mockInspection, id };

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/inspections"
          className="text-sm text-blue-600 hover:text-blue-900 mb-2 inline-block"
        >
          ← Back to Inspections
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {inspection.propertyAddress}
            </h1>
            <p className="text-gray-500">
              Inspector: {inspection.inspectorName} • Checklist:{" "}
              {inspection.checklistId}
            </p>
          </div>
          <span
            className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${statusColors[inspection.status]}`}
          >
            {statusLabels[inspection.status]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Findings */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Findings</h2>
            </div>
            <ul className="divide-y divide-gray-200">
              {inspection.findings.map((finding) => (
                <li key={finding.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {finding.sectionId} / {finding.itemId}
                      </p>
                      {finding.notes && (
                        <p className="text-sm text-gray-500 mt-1">
                          {finding.notes}
                        </p>
                      )}
                    </div>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${findingStatusColors[finding.status]}`}
                    >
                      {findingStatusLabels[finding.status]}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Actions sidebar */}
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
            <div className="space-y-3">
              <button
                className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                disabled
              >
                Generate Report
              </button>
              <button
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                disabled
              >
                Edit Inspection
              </button>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Details</h3>
            <dl className="space-y-2 text-sm">
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
              <div className="flex justify-between">
                <dt className="text-gray-500">Findings</dt>
                <dd className="text-gray-900">{inspection.findings.length}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <p className="mt-8 text-sm text-gray-500 text-center">
        💡 Using mock data — connect API to see real inspection
      </p>
    </div>
  );
}
