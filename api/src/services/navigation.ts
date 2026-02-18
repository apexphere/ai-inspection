/**
 * Navigation Service
 * Handles inspection workflow navigation and status.
 */

import type { Finding } from '@prisma/client';
import type { IInspectionRepository } from '../repositories/interfaces/inspection.js';
import { checklistService, type Checklist, type ChecklistItem } from './checklist.js';

export class InspectionNotFoundError extends Error {
  constructor(id: string) {
    super(`Inspection not found: ${id}`);
    this.name = 'InspectionNotFoundError';
  }
}

export class InvalidSectionError extends Error {
  constructor(sectionId: string, checklistId: string) {
    super(`Invalid section '${sectionId}' for checklist '${checklistId}'`);
    this.name = 'InvalidSectionError';
  }
}

export interface NavigationResult {
  inspectionId: string;
  previousSection: string;
  currentSection: string;
  sectionName: string;
  prompt?: string;
  items?: string[];
}

export interface InspectionProgress {
  completed: number;
  total: number;
  percentage: number;
}

export interface SectionStatus {
  id: string;
  name: string;
  findingsCount: number;
  hasFindings: boolean;
}

export interface InspectionStatus {
  inspectionId: string;
  address: string;
  clientName: string;
  inspectorName?: string;
  status: string;
  currentSection: {
    id: string;
    name: string;
    prompt?: string;
    items?: string[];
    findingsCount: number;
  };
  progress: InspectionProgress;
  sections: SectionStatus[];
  totalFindings: number;
  canComplete: boolean;
}

export interface SuggestResult {
  inspectionId: string;
  currentSection: string;
  nextSection?: {
    id: string;
    name: string;
    prompt?: string;
  };
  remainingSections: number;
  canComplete: boolean;
  suggestion: string;
}

export class NavigationService {
  constructor(private repository: IInspectionRepository) {}

  /**
   * Navigate to a specific section.
   */
  async navigate(inspectionId: string, sectionId: string): Promise<NavigationResult> {
    // Get inspection
    const inspection = await this.repository.findById(inspectionId);
    if (!inspection) {
      throw new InspectionNotFoundError(inspectionId);
    }

    // Validate section exists in checklist
    const checklist = checklistService.getChecklist(inspection.checklistId);
    if (!checklist) {
      throw new InvalidSectionError(sectionId, inspection.checklistId);
    }

    const section = this.findSection(checklist, sectionId);
    if (!section) {
      throw new InvalidSectionError(sectionId, inspection.checklistId);
    }

    const previousSection = inspection.currentSection;

    // Update inspection
    await this.repository.update(inspectionId, {
      currentSection: sectionId,
      status: 'IN_PROGRESS',
    });

    return {
      inspectionId,
      previousSection,
      currentSection: sectionId,
      sectionName: section.name,
      prompt: section.prompt,
      items: section.items,
    };
  }

  /**
   * Get current inspection status.
   */
  async getStatus(inspectionId: string): Promise<InspectionStatus> {
    // Get inspection
    const inspection = await this.repository.findById(inspectionId);
    if (!inspection) {
      throw new InspectionNotFoundError(inspectionId);
    }

    // Get findings
    const findings = await this.repository.findFindingsByInspection(inspectionId);

    // Get checklist
    const checklist = checklistService.getChecklist(inspection.checklistId);
    const allSections = checklist ? checklistService.getAllSections(inspection.checklistId) : [];

    // Count findings per section
    const findingsBySection = this.groupFindingsBySection(findings);

    // Build section statuses
    const sectionStatuses: SectionStatus[] = allSections.map((s) => ({
      id: s.id,
      name: s.name,
      findingsCount: findingsBySection.get(s.id) || 0,
      hasFindings: (findingsBySection.get(s.id) || 0) > 0,
    }));

    // Calculate progress (sections with findings are considered visited)
    const visitedSections = sectionStatuses.filter((s) => s.hasFindings).length;
    const totalSections = sectionStatuses.length || 1;

    // Get current section details
    const currentSectionData = checklist
      ? this.findSection(checklist, inspection.currentSection)
      : null;

    const currentFindingsCount = findingsBySection.get(inspection.currentSection) || 0;

    // Can complete if at least 50% of sections visited
    const canComplete = visitedSections >= Math.ceil(totalSections * 0.5);

    return {
      inspectionId,
      address: inspection.address,
      clientName: inspection.clientName,
      inspectorName: inspection.inspectorName || undefined,
      status: inspection.status,
      currentSection: {
        id: inspection.currentSection,
        name: currentSectionData?.name || inspection.currentSection,
        prompt: currentSectionData?.prompt,
        items: currentSectionData?.items,
        findingsCount: currentFindingsCount,
      },
      progress: {
        completed: visitedSections,
        total: totalSections,
        percentage: Math.round((visitedSections / totalSections) * 100),
      },
      sections: sectionStatuses,
      totalFindings: findings.length,
      canComplete,
    };
  }

  /**
   * Get suggestion for next steps.
   */
  async suggest(inspectionId: string): Promise<SuggestResult> {
    // Get inspection
    const inspection = await this.repository.findById(inspectionId);
    if (!inspection) {
      throw new InspectionNotFoundError(inspectionId);
    }

    // Get findings to determine visited sections
    const findings = await this.repository.findFindingsByInspection(inspectionId);
    const findingsBySection = this.groupFindingsBySection(findings);
    const visitedSectionIds = new Set(findingsBySection.keys());

    // Get checklist
    const checklist = checklistService.getChecklist(inspection.checklistId);
    const allSections = checklist ? checklistService.getAllSections(inspection.checklistId) : [];

    // Find next unvisited section
    const currentIndex = allSections.findIndex((s) => s.id === inspection.currentSection);
    let nextSection: { id: string; name: string; prompt?: string } | undefined;

    // Look for next unvisited section after current
    for (let i = currentIndex + 1; i < allSections.length; i++) {
      const section = allSections[i];
      if (section && !visitedSectionIds.has(section.id)) {
        const sectionData = checklist ? this.findSection(checklist, section.id) : null;
        nextSection = {
          id: section.id,
          name: section.name,
          prompt: sectionData?.prompt,
        };
        break;
      }
    }

    // If no unvisited section after current, look from beginning
    if (!nextSection) {
      for (let i = 0; i < currentIndex; i++) {
        const section = allSections[i];
        if (section && !visitedSectionIds.has(section.id)) {
          const sectionData = checklist ? this.findSection(checklist, section.id) : null;
          nextSection = {
            id: section.id,
            name: section.name,
            prompt: sectionData?.prompt,
          };
          break;
        }
      }
    }

    const remainingSections = allSections.filter((s) => !visitedSectionIds.has(s.id)).length;
    const canComplete = visitedSectionIds.size >= Math.ceil(allSections.length * 0.5);

    // Generate suggestion text
    let suggestion: string;
    if (remainingSections === 0) {
      suggestion = 'All sections have been visited. You can complete the inspection and generate a report.';
    } else if (canComplete) {
      suggestion = `You have visited ${visitedSectionIds.size} of ${allSections.length} sections. You can complete now or continue with ${remainingSections} remaining section(s).`;
    } else {
      suggestion = `Continue inspection. ${remainingSections} section(s) remaining. Visit at least ${Math.ceil(allSections.length * 0.5) - visitedSectionIds.size} more section(s) before completing.`;
    }

    return {
      inspectionId,
      currentSection: inspection.currentSection,
      nextSection,
      remainingSections,
      canComplete,
      suggestion,
    };
  }

  /**
   * Find a section in checklist (handles nested subareas).
   */
  private findSection(checklist: Checklist, sectionId: string): ChecklistItem | null {
    // Check top-level sections
    const section = checklist.sections.find((s) => s.id === sectionId);
    if (section) return section;

    // Check subareas (format: "section.subarea")
    if (sectionId.includes('.')) {
      const [parentId, subareaId] = sectionId.split('.');
      const parent = checklist.sections.find((s) => s.id === parentId);
      if (parent?.subareas) {
        const subarea = parent.subareas.find((sub) => sub.id === subareaId);
        if (subarea) {
          return {
            id: sectionId,
            name: `${parent.name} - ${subarea.name}`,
            prompt: subarea.prompt,
            items: subarea.items,
          };
        }
      }
    }

    return null;
  }

  /**
   * Group findings by section.
   */
  private groupFindingsBySection(findings: Finding[]): Map<string, number> {
    const map = new Map<string, number>();
    for (const finding of findings) {
      const count = map.get(finding.section) || 0;
      map.set(finding.section, count + 1);
    }
    return map;
  }
}
