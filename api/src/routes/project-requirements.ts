/**
 * Project Requirements
 *
 * Returns the upfront data requirements for a given report type.
 * Kai calls this after project creation to know what to collect
 * before starting inspection sections.
 *
 * GET /api/project-requirements/:reportType
 */

import { Router, type Request, type Response } from 'express';

export const projectRequirementsRouter = Router();

interface UpfrontDataItem {
  id: string;
  label: string;
  description: string;
  required: boolean;
  storeOn: 'siteInspection' | 'property' | 'floorPlan';
  fields: string[];
}

interface ProjectRequirements {
  reportType: string;
  upfrontData: UpfrontDataItem[];
}

const REQUIREMENTS: Record<string, ProjectRequirements> = {
  PPI: {
    reportType: 'PPI',
    upfrontData: [
      {
        id: 'weather',
        label: 'Weather conditions',
        description: 'Current weather (e.g. Fine, Overcast, Rain) + rainfall last 3 days in mm',
        required: true,
        storeOn: 'siteInspection',
        fields: ['weather', 'rainfallLast3Days'],
      },
      {
        id: 'buildingInfo',
        label: 'Building info',
        description: 'New or existing build, storeys, year built, bedrooms, bathrooms, parking',
        required: true,
        storeOn: 'property',
        fields: ['buildingType', 'storeys', 'yearBuilt', 'bedrooms', 'bathrooms', 'parking'],
      },
      {
        id: 'floorPlan',
        label: 'Floor plan',
        description: 'Floor plan photo (optional) + room list per floor',
        required: false,
        storeOn: 'floorPlan',
        fields: ['photoIds', 'rooms'],
      },
    ],
  },
  COA: {
    reportType: 'COA',
    upfrontData: [],
  },
  CCC_GAP: {
    reportType: 'CCC_GAP',
    upfrontData: [],
  },
  SAFE_SANITARY: {
    reportType: 'SAFE_SANITARY',
    upfrontData: [],
  },
};

// GET /api/project-requirements/:reportType
projectRequirementsRouter.get('/:reportType', (req: Request, res: Response): void => {
  const reportType = (req.params.reportType as string)?.toUpperCase();
  const requirements = REQUIREMENTS[reportType];

  if (!requirements) {
    res.status(404).json({
      error: `Unknown report type: ${req.params.reportType}`,
      validTypes: Object.keys(REQUIREMENTS),
    });
    return;
  }

  res.json(requirements);
});
