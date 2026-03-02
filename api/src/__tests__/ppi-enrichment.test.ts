/**
 * Unit tests: PPI data model enrichment — Issue #650
 *
 * Tests for new fields on Property, SiteInspection, ChecklistItem
 * and new models: FloorPlan, InspectionSectionConclusion,
 * FloorLevelSurvey, ThermalImagingRecord.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  Property,
  SiteInspection,
  ChecklistItem,
  FloorPlan,
  InspectionSectionConclusion,
  FloorLevelSurvey,
  ThermalImagingRecord,
} from '@prisma/client';

// ── Property building info fields ────────────────────────────────────────────

describe('Property — building info fields (#650)', () => {
  it('should have buildingType field', () => {
    const property: Partial<Property> = {
      buildingType: 'Two-Storey Residential House (New 2025)',
    };
    expect(property.buildingType).toBe('Two-Storey Residential House (New 2025)');
  });

  it('should have storeys, bedrooms, bathrooms, parking fields', () => {
    const property: Partial<Property> = {
      storeys: 2,
      bedrooms: 4,
      bathrooms: 2,
      parking: 'Single Garaging',
    };
    expect(property.storeys).toBe(2);
    expect(property.bedrooms).toBe(4);
    expect(property.bathrooms).toBe(2);
    expect(property.parking).toBe('Single Garaging');
  });

  it('should allow nullable building info fields', () => {
    const property: Partial<Property> = {
      buildingType: null,
      storeys: null,
      bedrooms: null,
      bathrooms: null,
      parking: null,
    };
    expect(property.buildingType).toBeNull();
  });
});

// ── SiteInspection rainfall field ────────────────────────────────────────────

describe('SiteInspection — rainfallLast3Days (#650)', () => {
  it('should have rainfallLast3Days field', () => {
    const inspection: Partial<SiteInspection> = {
      rainfallLast3Days: 12.5,
    };
    expect(inspection.rainfallLast3Days).toBe(12.5);
  });

  it('should allow zero rainfall', () => {
    const inspection: Partial<SiteInspection> = { rainfallLast3Days: 0.0 };
    expect(inspection.rainfallLast3Days).toBe(0);
  });

  it('should allow null rainfall', () => {
    const inspection: Partial<SiteInspection> = { rainfallLast3Days: null };
    expect(inspection.rainfallLast3Days).toBeNull();
  });
});

// ── ChecklistItem enrichment fields ──────────────────────────────────────────

describe('ChecklistItem — room, floorPlanId, severity (#650)', () => {
  it('should have room field', () => {
    const item: Partial<ChecklistItem> = { room: 'Master Bedroom' };
    expect(item.room).toBe('Master Bedroom');
  });

  it('should have floorPlanId field', () => {
    const item: Partial<ChecklistItem> = { floorPlanId: 'fp-123' };
    expect(item.floorPlanId).toBe('fp-123');
  });

  it('should have severity field with NZS4306:2005 values', () => {
    const severities = [
      'IMMEDIATE_ATTENTION',
      'FURTHER_INVESTIGATION',
      'MONITOR',
      'NO_ACTION',
    ] as const;
    severities.forEach((s) => {
      const item: Partial<ChecklistItem> = { severity: s };
      expect(item.severity).toBe(s);
    });
  });

  it('should allow null room for non-interior categories', () => {
    const item: Partial<ChecklistItem> = { room: null, floorPlanId: null, severity: null };
    expect(item.room).toBeNull();
  });
});

// ── FloorPlan model ───────────────────────────────────────────────────────────

describe('FloorPlan model (#650)', () => {
  it('should represent a floor with rooms', () => {
    const floorPlan: Partial<FloorPlan> = {
      floor: 1,
      label: 'Ground Floor',
      rooms: ['Garage', 'Storage', 'Hall', 'Stairs'],
      photoIds: [],
    };
    expect(floorPlan.floor).toBe(1);
    expect(floorPlan.rooms).toHaveLength(4);
    expect(floorPlan.rooms).toContain('Garage');
  });

  it('should support multiple floors', () => {
    const floors: Array<Partial<FloorPlan>> = [
      { floor: 1, label: 'Ground Floor', rooms: ['Garage', 'Laundry'] },
      { floor: 2, label: 'Second Floor', rooms: ['Master Bedroom', 'Ensuite', 'Living'] },
      { floor: 3, label: 'Third Floor', rooms: ['Kitchen', 'Dining', 'Family Room'] },
    ];
    expect(floors).toHaveLength(3);
    expect(floors[1].rooms).toContain('Master Bedroom');
  });

  it('should support photoIds for floor plan images', () => {
    const floorPlan: Partial<FloorPlan> = {
      photoIds: ['photo-1', 'photo-2'],
    };
    expect(floorPlan.photoIds).toHaveLength(2);
  });
});

// ── InspectionSectionConclusion ───────────────────────────────────────────────

describe('InspectionSectionConclusion model (#650)', () => {
  const validSections = ['SITE', 'EXTERIOR', 'INTERIOR', 'SERVICES'] as const;

  it.each(validSections)('should accept section: %s', (section) => {
    const conclusion: Partial<InspectionSectionConclusion> = {
      section,
      conclusion: 'No obvious defects were noted. No requirement of immediate attention.',
    };
    expect(conclusion.section).toBe(section);
    expect(conclusion.conclusion).toBeTruthy();
  });
});

// ── FloorLevelSurvey ──────────────────────────────────────────────────────────

describe('FloorLevelSurvey model (#650)', () => {
  it('should record floor level survey result', () => {
    const survey: Partial<FloorLevelSurvey> = {
      area: 'Ground Floor',
      maxDeviation: 3.5,
      withinTolerance: true,
      notes: 'Measured deviations fall within MBIE Guide tolerances.',
    };
    expect(survey.maxDeviation).toBe(3.5);
    expect(survey.withinTolerance).toBe(true);
  });

  it('should handle failed survey', () => {
    const survey: Partial<FloorLevelSurvey> = {
      area: '1st Floor',
      maxDeviation: 12.0,
      withinTolerance: false,
      notes: 'Significant undulation detected. Further investigation required.',
    };
    expect(survey.withinTolerance).toBe(false);
  });
});

// ── ThermalImagingRecord ──────────────────────────────────────────────────────

describe('ThermalImagingRecord model (#650)', () => {
  it('should record no anomaly for a room', () => {
    const record: Partial<ThermalImagingRecord> = {
      room: 'Kitchen',
      floor: 3,
      anomalyFound: false,
    };
    expect(record.anomalyFound).toBe(false);
  });

  it('should record anomaly with notes', () => {
    const record: Partial<ThermalImagingRecord> = {
      room: 'Master Bedroom',
      floor: 3,
      anomalyFound: true,
      notes: 'Thermal anomaly at RHS sliding door sill — corroborated with elevated moisture reading.',
    };
    expect(record.anomalyFound).toBe(true);
    expect(record.notes).toContain('elevated moisture');
  });
});
