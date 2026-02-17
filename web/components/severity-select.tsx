import { FindingSeverity } from '@/lib/api';

interface SeveritySelectProps {
  value: FindingSeverity;
  onChange: (severity: FindingSeverity) => void;
  disabled?: boolean;
}

const severityOptions: { value: FindingSeverity; label: string; color: string }[] = [
  { value: 'INFO', label: 'Info', color: 'bg-blue-100 text-blue-800' },
  { value: 'MINOR', label: 'Minor', color: 'bg-gray-100 text-gray-800' },
  { value: 'MAJOR', label: 'Major', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-800' },
];

export function SeveritySelect({
  value,
  onChange,
  disabled = false,
}: SeveritySelectProps): React.ReactElement {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as FindingSeverity)}
      disabled={disabled}
      className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {severityOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
