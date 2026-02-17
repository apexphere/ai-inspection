import Link from "next/link";

export default function HomePage(): React.ReactElement {
  return (
    <div className="text-center py-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        AI Inspection Assistant
      </h1>
      <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
        Streamline your building inspections with AI-powered checklists 
        and automated PDF report generation.
      </p>
      <Link
        href="/inspections"
        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        View Inspections
      </Link>
    </div>
  );
}
