import { getApiUrl } from '@/lib/api-url';
'use client';

import { useEffect, useState } from 'react';
import { CollapsibleSection } from '@/components/collapsible-section';

const API_URL = getApiUrl();

interface FloorPlan {
  id: string;
  floor: number;
  label: string;
  rooms: string[];
  photoIds: string[];
}

interface FloorPlansSectionProps {
  projectId: string;
  authToken?: string;
}

export function FloorPlansSection({ projectId, authToken }: FloorPlansSectionProps): React.ReactElement | null {
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFloorPlans(): Promise<void> {
      try {
        const res = await fetch(`${API_URL}/api/projects/${projectId}/floor-plans`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        });
        if (res.ok) {
          setFloorPlans(await res.json() as FloorPlan[]);
        }
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    }
    void fetchFloorPlans();
  }, [projectId, authToken]);

  if (loading || floorPlans.length === 0) return null;

  return (
    <CollapsibleSection
      id="floor-plans"
      title="Floor Plans"
      completionStatus={`${floorPlans.length} floor${floorPlans.length !== 1 ? 's' : ''}`}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {floorPlans.map((plan) => (
          <div key={plan.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
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
    </CollapsibleSection>
  );
}
