import { InspectionStatus, FindingSeverity } from '@/lib/api';

interface StatusBadgeProps {
  status: InspectionStatus;
}

const statusConfig: Record<InspectionStatus, { label: string; className: string }> = {
  STARTED: {
    label: 'Started',
    className: 'bg-gray-100 text-gray-800',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    className: 'bg-yellow-100 text-yellow-800',
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-green-100 text-green-800',
  },
};

export function StatusBadge({ status }: StatusBadgeProps): React.ReactElement {
  const config = statusConfig[status] || statusConfig.STARTED;

  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.className}`}
    >
      {config.label}
    </span>
  );
}

interface SeverityBadgeProps {
  severity: FindingSeverity;
}

const severityConfig: Record<FindingSeverity, { label: string; className: string }> = {
  INFO: {
    label: 'Info',
    className: 'bg-blue-100 text-blue-800',
  },
  MINOR: {
    label: 'Minor',
    className: 'bg-gray-100 text-gray-800',
  },
  MAJOR: {
    label: 'Major',
    className: 'bg-yellow-100 text-yellow-800',
  },
  URGENT: {
    label: 'Urgent',
    className: 'bg-red-100 text-red-800',
  },
};

export function SeverityBadge({ severity }: SeverityBadgeProps): React.ReactElement {
  const config = severityConfig[severity] || severityConfig.INFO;

  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.className}`}
    >
      {config.label}
    </span>
  );
}
