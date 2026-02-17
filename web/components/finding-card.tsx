import { Finding } from '@/lib/api';
import { SeverityBadge } from './status-badge';

interface FindingCardProps {
  finding: Finding;
}

export function FindingCard({ finding }: FindingCardProps): React.ReactElement {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{finding.text}</p>
          {finding.matchedComment && (
            <p className="mt-1 text-sm text-gray-500 italic">
              &ldquo;{finding.matchedComment}&rdquo;
            </p>
          )}
        </div>
        <SeverityBadge severity={finding.severity} />
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
                src={photo.path}
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
