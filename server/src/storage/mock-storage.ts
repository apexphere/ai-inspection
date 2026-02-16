/**
 * Mock Storage Layer - Issue #3
 * 
 * Temporary in-memory storage for development.
 * Will be replaced by SQLite storage from #2.
 */

import { randomUUID } from 'crypto';

// ============================================================================
// Types
// ============================================================================

export interface InspectionMetadata {
  property_type?: string;
  bedrooms?: number;
  bathrooms?: number;
  year_built?: number;
}

export interface Inspection {
  id: string;
  address: string;
  client_name: string;
  inspector_name?: string;
  checklist_id: string;
  metadata?: InspectionMetadata;
  status: 'started' | 'in_progress' | 'completed';
  current_section: string;
  started_at: string;
  completed_at?: string;
}

export interface Finding {
  id: string;
  inspection_id: string;
  section: string;
  text: string;
  severity: 'info' | 'minor' | 'major' | 'urgent';
  matched_comment?: string;
  timestamp: string;
}

export interface Photo {
  id: string;
  finding_id: string;
  filename: string;
  path: string;
  mime_type: string;
}

export interface SectionStatus {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  findings_count: number;
}

// ============================================================================
// Mock Storage Implementation
// ============================================================================

class MockStorage {
  private inspections: Map<string, Inspection> = new Map();
  private findings: Map<string, Finding[]> = new Map();
  private photos: Map<string, Photo[]> = new Map();
  private sectionStatuses: Map<string, SectionStatus[]> = new Map();

  /**
   * Create a new inspection
   */
  async createInspection(data: {
    address: string;
    client_name: string;
    inspector_name?: string;
    checklist_id: string;
    metadata?: InspectionMetadata;
    first_section: string;
    sections: Array<{ id: string; name: string }>;
  }): Promise<Inspection> {
    const id = randomUUID();
    const now = new Date().toISOString();

    const inspection: Inspection = {
      id,
      address: data.address,
      client_name: data.client_name,
      inspector_name: data.inspector_name,
      checklist_id: data.checklist_id,
      metadata: data.metadata,
      status: 'started',
      current_section: data.first_section,
      started_at: now,
    };

    this.inspections.set(id, inspection);
    this.findings.set(id, []);
    this.photos.set(id, []);

    // Initialize section statuses
    const statuses: SectionStatus[] = data.sections.map((section, index) => ({
      id: section.id,
      name: section.name,
      status: index === 0 ? 'in_progress' : 'pending',
      findings_count: 0,
    }));
    this.sectionStatuses.set(id, statuses);

    return inspection;
  }

  /**
   * Get an inspection by ID
   */
  async getInspection(id: string): Promise<Inspection | null> {
    return this.inspections.get(id) || null;
  }

  /**
   * Update an inspection
   */
  async updateInspection(id: string, updates: Partial<Inspection>): Promise<Inspection | null> {
    const inspection = this.inspections.get(id);
    if (!inspection) return null;

    const updated = { ...inspection, ...updates };
    this.inspections.set(id, updated);
    return updated;
  }

  /**
   * Get findings for an inspection
   */
  async getFindings(inspection_id: string): Promise<Finding[]> {
    return this.findings.get(inspection_id) || [];
  }

  /**
   * Get section statuses for an inspection
   */
  async getSectionStatuses(inspection_id: string): Promise<SectionStatus[]> {
    return this.sectionStatuses.get(inspection_id) || [];
  }

  /**
   * Add a finding
   */
  async addFinding(data: {
    inspection_id: string;
    section: string;
    text: string;
    severity?: 'info' | 'minor' | 'major' | 'urgent';
    matched_comment?: string;
  }): Promise<Finding> {
    const id = randomUUID();
    const finding: Finding = {
      id,
      inspection_id: data.inspection_id,
      section: data.section,
      text: data.text,
      severity: data.severity || 'info',
      matched_comment: data.matched_comment,
      timestamp: new Date().toISOString(),
    };

    const findings = this.findings.get(data.inspection_id) || [];
    findings.push(finding);
    this.findings.set(data.inspection_id, findings);

    // Update section findings count
    const statuses = this.sectionStatuses.get(data.inspection_id) || [];
    const sectionStatus = statuses.find(s => s.id === data.section);
    if (sectionStatus) {
      sectionStatus.findings_count++;
      sectionStatus.status = 'in_progress';
    }

    return finding;
  }

  /**
   * Get total findings count for an inspection
   */
  async getFindingsCount(inspection_id: string): Promise<number> {
    const findings = this.findings.get(inspection_id) || [];
    return findings.length;
  }

  /**
   * Get total photos count for an inspection
   */
  async getPhotosCount(inspection_id: string): Promise<number> {
    const photos = this.photos.get(inspection_id) || [];
    return photos.length;
  }

  /**
   * Update section status
   */
  async updateSectionStatus(
    inspection_id: string,
    section_id: string,
    status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  ): Promise<boolean> {
    const statuses = this.sectionStatuses.get(inspection_id);
    if (!statuses) return false;

    const section = statuses.find(s => s.id === section_id);
    if (!section) return false;

    section.status = status;
    return true;
  }

  /**
   * Get section index in the inspection
   */
  async getSectionIndex(inspection_id: string, section_id: string): Promise<number> {
    const statuses = this.sectionStatuses.get(inspection_id) || [];
    return statuses.findIndex(s => s.id === section_id);
  }

  /**
   * Get section by index
   */
  async getSectionByIndex(inspection_id: string, index: number): Promise<SectionStatus | null> {
    const statuses = this.sectionStatuses.get(inspection_id) || [];
    if (index < 0 || index >= statuses.length) return null;
    return statuses[index];
  }

  /**
   * Get total section count
   */
  async getSectionCount(inspection_id: string): Promise<number> {
    const statuses = this.sectionStatuses.get(inspection_id) || [];
    return statuses.length;
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.inspections.clear();
    this.findings.clear();
    this.photos.clear();
    this.sectionStatuses.clear();
  }
}

// Export singleton instance
export const mockStorage = new MockStorage();

// Export class for testing
export { MockStorage };
