import Link from "next/link";

// Placeholder data until API is connected
const mockInspections = [
  {
    id: "1",
    propertyAddress: "123 Main Street, Auckland",
    inspectorName: "John Smith",
    status: "in_progress" as const,
    createdAt: "2026-02-17T10:00:00Z",
  },
  {
    id: "2",
    propertyAddress: "456 Queen Street, Wellington",
    inspectorName: "Jane Doe",
    status: "completed" as const,
    createdAt: "2026-02-16T14:30:00Z",
  },
  {
    id: "3",
    propertyAddress: "789 Beach Road, Christchurch",
    inspectorName: "John Smith",
    status: "draft" as const,
    createdAt: "2026-02-15T09:00:00Z",
  },
];

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

export default function InspectionsPage(): React.ReactElement {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Inspections</h1>
        <button
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          disabled
        >
          + New Inspection
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Property
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Inspector
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
            {mockInspections.map((inspection) => (
              <tr key={inspection.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {inspection.propertyAddress}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {inspection.inspectorName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[inspection.status]}`}
                  >
                    {statusLabels[inspection.status]}
                  </span>
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

      <p className="mt-4 text-sm text-gray-500 text-center">
        💡 Using mock data — connect API to see real inspections
      </p>
    </div>
  );
}
