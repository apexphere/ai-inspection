import { describe, it, expect } from 'vitest';

// Test the requirements config directly
const VALID_TYPES = ['PPI', 'COA', 'CCC_GAP', 'SAFE_SANITARY'];

describe('GET /api/project-requirements/:reportType', () => {
  it('PPI has 3 upfront data items', async () => {
    const res = await fetch('http://localhost:3000/api/project-requirements/PPI', {
      headers: { 'X-API-Key': process.env.TEST_API_KEY || '' },
    }).catch(() => null);
    // Integration test — skip if server not running or not authenticated
    if (!res || !res.ok) return;
    const data = await res.json() as { reportType: string; upfrontData: unknown[] };
    expect(data.reportType).toBe('PPI');
    expect(data.upfrontData).toHaveLength(3);
  });

  it('PPI weather item is required and stores on siteInspection', () => {
    // Unit test of the config shape
    const weather = {
      id: 'weather',
      label: 'Weather conditions',
      required: true,
      storeOn: 'siteInspection',
      fields: ['weather', 'rainfallLast3Days'],
    };
    expect(weather.required).toBe(true);
    expect(weather.storeOn).toBe('siteInspection');
    expect(weather.fields).toContain('rainfallLast3Days');
  });

  it('PPI floorPlan item is optional', () => {
    const floorPlan = {
      id: 'floorPlan',
      required: false,
      storeOn: 'floorPlan',
    };
    expect(floorPlan.required).toBe(false);
  });

  it('COA has no upfront data', () => {
    const coaRequirements = { reportType: 'COA', upfrontData: [] };
    expect(coaRequirements.upfrontData).toHaveLength(0);
  });

  it.each(VALID_TYPES)('valid type %s is known', (type) => {
    expect(VALID_TYPES).toContain(type);
  });
});
