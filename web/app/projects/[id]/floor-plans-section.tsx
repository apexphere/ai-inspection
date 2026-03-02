'use client';

import { useEffect, useState } from 'react';
import { CollapsibleSection } from '@/components/collapsible-section';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface FloorPlan {
  id: string;
  floor: number;
  label: string;
  rooms: string[];
  photoIds: string[];
  createdAt: string;
}

interface FloorPlansBySite {
  inspectionId: string;
  inspectionStage: string;
  floorPlans: FloorPlan[];
}

interface FloorPlansSectionProps {
  inspections: Array<{ id: string; stage: string; type: string }>;
  authToken?: string;
}

export function FloorPlansSection({ inspections, authToken }: FloorPlansSectionProps): React.ReactElement | null {
  const [data, setData] = useState<FloorPlansBySite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFloorPlans(): Promise<void> {
      const results: FloorPlansBySite[] = [];

      for (const inspection of inspections) {
        try {
          const res = await fetch(
            `${API_URL}/api/site-inspections/${inspection.id}/floor-plans`,
            {
              headers: {
                ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
              },
            }
          );
          if (res.ok) {
            const plans = await res.json() as FloorPlan[];
            if (plans.length > 0) {
              results.push({
                inspectionId: inspection.id,
                inspectionStage: inspection.stage,
                floorPlans: plans,
              });
            }
          }
        } catch {
          // skip failed fetches
        }
      }

      setData(results);
      setLoading(false);
    }

    if (inspections.length > 0) {
      void fetchFloorPlans();
    } else {
      setLoading(false);
    }
  }, [inspections, authToken]);

  if (loading || data.length === 0) return null;

  const totalFloors = data.reduce((acc, s) => acc + s.floorPlans.length, 0);

  return (
    <CollapsibleSection
      id="floor-plans"
      title="Floor Plans"
      completionStatus={`${totalFloors} floor${totalFloors !== 1 ? 's' : ''}`}
    >
      <div className="space-y-6">
        {data.map((site) => (
          <div key={site.inspectionId}>
            {data.length > 1 && (
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                {site.inspectionStage}
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {site.floorPlans
                .sort((a, b) => a.floor - b.floor)
                .map((plan) => (
                  <div
                    key={plan.id}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      {plan.label || `Floor ${plan.floor}`}
                    </h3>
                    {plan.rooms.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {plan.rooms.map((room) => (
                          <span
                            key={room}
                            className="inline-block px-2 py-0.5 rounded-md text-xs bg-white border border-gray-200 text-gray-700"
                          >
                            {room}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No rooms listed</p>
                    )}
                    {plan.photoIds.length > 0 && (
                      <p className="mt-2 text-xs text-gray-400">
                        📎 {plan.photoIds.length} photo{plan.photoIds.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}
