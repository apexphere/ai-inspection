import { Finding, api } from '@/lib/api';
import { SeverityBadge } from './status-badge';

interface FindingCardProps {
  finding: Finding;
  onEdit?: () => void;
}

export function FindingCard({ finding, onEdit }: FindingCardProps): React.ReactElement {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{finding.text}</p>
          {finding.matchedComment && (
            <p className="mt-1 text-sm text-gray-500 italic">
              &ldquo;{finding.matchedComment}&rdquo;
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="p-1.5 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-gray-100"
              aria-label="Edit finding"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
          )}
          <SeverityBadge severity={finding.severity} />
        </div>
      </div>

      {finding.photos.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {finding.photos.map((photo) => (
            <div
              key={photo.id}
              className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={api.photos.getUrl(photo.id)}
                alt={photo.filename}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 text-xs text-gray-400">
        {new Date(finding.createdAt).toLocaleString()}
      </div>
    </div>
  );
}
