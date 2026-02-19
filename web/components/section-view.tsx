'use client';

import { useState } from 'react';
import { Finding } from '@/lib/api';
import { FindingCard } from './finding-card';

interface SectionViewProps {
  section: string;
  findings: Finding[];
  defaultOpen?: boolean;
  onEditFinding?: (finding: Finding) => void;
}

export function SectionView({
  section,
  findings,
  defaultOpen = true,
  onEditFinding,
}: SectionViewProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const urgentCount = findings.filter((f) => f.severity === 'URGENT').length;
  const majorCount = findings.filter((f) => f.severity === 'MAJOR').length;

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <span className="text-lg font-medium text-gray-900 capitalize">
            {section.replace(/-/g, ' ')}
          </span>
          <span className="text-sm text-gray-500">
            {findings.length} finding{findings.length !== 1 ? 's' : ''}
          </span>
          {urgentCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
              {urgentCount} urgent
            </span>
          )}
          {majorCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
              {majorCount} major
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="px-6 pb-4 space-y-3">
          {findings.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No findings in this section</p>
          ) : (
            findings.map((finding) => (
              <FindingCard
                key={finding.id}
                finding={finding}
                onEdit={onEditFinding ? () => onEditFinding(finding) : undefined}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

interface SectionListProps {
  findings: Finding[];
  onEditFinding?: (finding: Finding) => void;
}

export function SectionList({ findings, onEditFinding }: SectionListProps): React.ReactElement {
  // Group findings by section
  const sections = findings.reduce<Record<string, Finding[]>>((acc, finding) => {
    const section = finding.section;
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(finding);
    return acc;
  }, {});

  const sectionNames = Object.keys(sections).sort();

  if (sectionNames.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <p className="text-gray-500">No findings recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sectionNames.map((section, index) => (
        <SectionView
          key={section}
          section={section}
          findings={sections[section]}
          defaultOpen={index === 0}
          onEditFinding={onEditFinding}
        />
      ))}
    </div>
  );
}
