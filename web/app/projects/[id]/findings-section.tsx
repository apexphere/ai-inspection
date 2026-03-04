'use client';

import { CollapsibleSection } from '@/components/collapsible-section';

const DECISION_STYLES: Record<string, string> = {
  PASS: 'bg-green-100 text-green-800',
  FAIL: 'bg-red-100 text-red-800',
  NA: 'bg-gray-100 text-gray-500',
  MONITOR: 'bg-yellow-100 text-yellow-800',
};

const SEVERITY_STYLES: Record<string, string> = {
  CRITICAL: 'text-red-600 font-semibold',
  MAJOR: 'text-orange-600 font-semibold',
  MINOR: 'text-yellow-600',
  COSMETIC: 'text-gray-500',
};

const DECISION_LABEL: Record<string, string> = {
  PASS: 'Pass',
  FAIL: 'Fail',
  NA: 'N/A',
  MONITOR: 'Monitor',
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface ChecklistItem {
  id: string;
  category: string;
  item: string;
  decision: string;
  notes: string | null;
  room: string | null;
  floorPlanId: string | null;
  severity: string | null;
  photoIds: string[];
  sortOrder: number;
}

export interface SectionConclusion {
  section: string;
  conclusion: string;
}

function FindingCard({ item }: { item: ChecklistItem }) {
  return (
    <div className="rounded border border-gray-200 bg-white p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-800 flex-1">{item.item}</p>
        <div className="flex items-center gap-2 shrink-0">
          {item.severity && SEVERITY_STYLES[item.severity] && (
            <span className={`text-xs ${SEVERITY_STYLES[item.severity]}`}>
              {item.severity}
            </span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DECISION_STYLES[item.decision] ?? 'bg-gray-100 text-gray-600'}`}>
            {DECISION_LABEL[item.decision] ?? item.decision}
          </span>
        </div>
      </div>
      {item.notes && (
        <p className="text-sm text-gray-600">{item.notes}</p>
      )}
      {item.photoIds.length > 0 && (
        <div className="grid grid-cols-3 gap-1 mt-1">
          {item.photoIds.map((photoId) => (
            <img
              key={photoId}
              src={`${API_URL}/api/photos/${photoId}/file?thumbnail=true`}
              alt=""
              className="h-20 w-full rounded object-cover border border-gray-200"
              loading="lazy"
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SectionFindingsProps {
  id: string;
  title: string;
  items: ChecklistItem[];
  conclusion?: SectionConclusion;
  groupByRoom?: boolean;
}

function SectionFindings({ id, title, items, conclusion, groupByRoom }: SectionFindingsProps) {
  if (items.length === 0) return null;

  const failCount = items.filter((i) => i.decision === 'FAIL').length;
  const completionStatus = failCount > 0
    ? `${failCount} issue${failCount !== 1 ? 's' : ''}`
    : `${items.length} item${items.length !== 1 ? 's' : ''}`;

  let content: React.ReactNode;

  if (groupByRoom) {
    const byRoom = new Map<string, ChecklistItem[]>();
    for (const item of items) {
      const room = item.room ?? 'General';
      if (!byRoom.has(room)) byRoom.set(room, []);
      byRoom.get(room)!.push(item);
    }
    content = (
      <div className="space-y-4">
        {[...byRoom.entries()].map(([room, roomItems]) => (
          <div key={room}>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{room}</h4>
            <div className="space-y-2">
              {roomItems.map((item) => <FindingCard key={item.id} item={item} />)}
            </div>
          </div>
        ))}
      </div>
    );
  } else {
    content = (
      <div className="space-y-2">
        {items.map((item) => <FindingCard key={item.id} item={item} />)}
      </div>
    );
  }

  return (
    <CollapsibleSection id={id} title={title} completionStatus={completionStatus}>
      {conclusion && (
        <div className="mb-4 rounded bg-blue-50 border border-blue-200 px-3 py-2 text-sm text-blue-800">
          {conclusion.conclusion}
        </div>
      )}
      {content}
    </CollapsibleSection>
  );
}

interface FindingsSectionsProps {
  checklistItems: ChecklistItem[];
  sectionConclusions: SectionConclusion[];
}

const CATEGORY_CONFIG = [
  { category: 'SITE', id: 'findings-site', title: 'Site & Ground' },
  { category: 'EXTERIOR', id: 'findings-exterior', title: 'Exterior' },
  { category: 'INTERIOR', id: 'findings-interior', title: 'Interior', groupByRoom: true },
  { category: 'SERVICES', id: 'findings-services', title: 'Services' },
];

export function FindingsSections({ checklistItems, sectionConclusions }: FindingsSectionsProps) {
  if (checklistItems.length === 0) return null;

  const conclusionMap = new Map(sectionConclusions.map((c) => [c.section, c]));

  return (
    <>
      {CATEGORY_CONFIG.map(({ category, id, title, groupByRoom }) => {
        const items = checklistItems.filter((i) => i.category === category);
        const conclusion = conclusionMap.get(category);
        return (
          <SectionFindings
            key={category}
            id={id}
            title={title}
            items={items}
            conclusion={conclusion}
            groupByRoom={groupByRoom}
          />
        );
      })}
    </>
  );
}
