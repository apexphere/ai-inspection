/**
 * Navigation Tools Tests - Issue #5
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { mockStorage } from '../storage/mock-storage.js';
import { ChecklistService } from '../services/checklist.js';
import { join } from 'path';

// ============================================================================
// Test Setup
// ============================================================================

describe('Navigation Tools', () => {
  let checklistService: ChecklistService;

  beforeEach(() => {
    // Clear mock storage between tests
    mockStorage.clear();
    // Create fresh checklist service
    checklistService = new ChecklistService(
      join(process.cwd(), '..', 'config', 'checklists')
    );
  });

  // ==========================================================================
  // Navigation Helper Tests
  // ==========================================================================

  describe('Section Navigation', () => {
    it('should navigate to next section', async () => {
      const sections = [
        { id: 'exterior', name: 'Exterior' },
        { id: 'interior', name: 'Interior' },
        { id: 'services', name: 'Services' },
      ];

      const inspection = await mockStorage.createInspection({
        address: '123 Nav Test St',
        client_name: 'Nav Test Client',
        checklist_id: 'test',
        first_section: 'exterior',
        sections,
      });

      // Verify starting position
      expect(inspection.current_section).toBe('exterior');

      // Get current index
      const currentIndex = await mockStorage.getSectionIndex(inspection.id, 'exterior');
      expect(currentIndex).toBe(0);

      // Get next section
      const nextSection = await mockStorage.getSectionByIndex(inspection.id, currentIndex + 1);
      expect(nextSection?.id).toBe('interior');

      // Update to next section
      await mockStorage.updateSectionStatus(inspection.id, 'exterior', 'completed');
      await mockStorage.updateSectionStatus(inspection.id, 'interior', 'in_progress');
      await mockStorage.updateInspection(inspection.id, { current_section: 'interior' });

      // Verify navigation
      const updated = await mockStorage.getInspection(inspection.id);
      expect(updated?.current_section).toBe('interior');

      const statuses = await mockStorage.getSectionStatuses(inspection.id);
      expect(statuses.find(s => s.id === 'exterior')?.status).toBe('completed');
      expect(statuses.find(s => s.id === 'interior')?.status).toBe('in_progress');
    });

    it('should navigate back to previous section', async () => {
      const sections = [
        { id: 'exterior', name: 'Exterior' },
        { id: 'interior', name: 'Interior' },
      ];

      const inspection = await mockStorage.createInspection({
        address: '456 Back Test Ave',
        client_name: 'Back Test Client',
        checklist_id: 'test',
        first_section: 'exterior',
        sections,
      });

      // Move to second section first
      await mockStorage.updateSectionStatus(inspection.id, 'exterior', 'completed');
      await mockStorage.updateSectionStatus(inspection.id, 'interior', 'in_progress');
      await mockStorage.updateInspection(inspection.id, { current_section: 'interior' });

      // Now go back
      const currentIndex = await mockStorage.getSectionIndex(inspection.id, 'interior');
      expect(currentIndex).toBe(1);

      const prevSection = await mockStorage.getSectionByIndex(inspection.id, currentIndex - 1);
      expect(prevSection?.id).toBe('exterior');

      // Update back to previous
      await mockStorage.updateSectionStatus(inspection.id, 'exterior', 'in_progress');
      await mockStorage.updateInspection(inspection.id, { current_section: 'exterior' });

      const updated = await mockStorage.getInspection(inspection.id);
      expect(updated?.current_section).toBe('exterior');
    });

    it('should skip current section', async () => {
      const sections = [
        { id: 'exterior', name: 'Exterior' },
        { id: 'interior', name: 'Interior' },
        { id: 'services', name: 'Services' },
      ];

      const inspection = await mockStorage.createInspection({
        address: '789 Skip Test Rd',
        client_name: 'Skip Test Client',
        checklist_id: 'test',
        first_section: 'exterior',
        sections,
      });

      // Skip exterior
      await mockStorage.updateSectionStatus(inspection.id, 'exterior', 'skipped');
      await mockStorage.updateSectionStatus(inspection.id, 'interior', 'in_progress');
      await mockStorage.updateInspection(inspection.id, { current_section: 'interior' });

      const statuses = await mockStorage.getSectionStatuses(inspection.id);
      expect(statuses.find(s => s.id === 'exterior')?.status).toBe('skipped');
      expect(statuses.find(s => s.id === 'interior')?.status).toBe('in_progress');
    });

    it('should jump to specific section by ID', async () => {
      const sections = [
        { id: 'exterior', name: 'Exterior' },
        { id: 'interior', name: 'Interior' },
        { id: 'services', name: 'Services' },
      ];

      const inspection = await mockStorage.createInspection({
        address: '100 Jump Test Blvd',
        client_name: 'Jump Test Client',
        checklist_id: 'test',
        first_section: 'exterior',
        sections,
      });

      // Jump directly to services
      await mockStorage.updateSectionStatus(inspection.id, 'exterior', 'completed');
      await mockStorage.updateSectionStatus(inspection.id, 'services', 'in_progress');
      await mockStorage.updateInspection(inspection.id, { current_section: 'services' });

      const updated = await mockStorage.getInspection(inspection.id);
      expect(updated?.current_section).toBe('services');
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle first section (no back)', async () => {
      const sections = [
        { id: 'exterior', name: 'Exterior' },
        { id: 'interior', name: 'Interior' },
      ];

      const inspection = await mockStorage.createInspection({
        address: '200 First Test Lane',
        client_name: 'First Test Client',
        checklist_id: 'test',
        first_section: 'exterior',
        sections,
      });

      const currentIndex = await mockStorage.getSectionIndex(inspection.id, 'exterior');
      expect(currentIndex).toBe(0);

      // Trying to go back should return null
      const prevSection = await mockStorage.getSectionByIndex(inspection.id, currentIndex - 1);
      expect(prevSection).toBeNull();
    });

    it('should handle last section (no next)', async () => {
      const sections = [
        { id: 'exterior', name: 'Exterior' },
        { id: 'interior', name: 'Interior' },
      ];

      const inspection = await mockStorage.createInspection({
        address: '300 Last Test Way',
        client_name: 'Last Test Client',
        checklist_id: 'test',
        first_section: 'exterior',
        sections,
      });

      // Move to last section
      await mockStorage.updateInspection(inspection.id, { current_section: 'interior' });

      const currentIndex = await mockStorage.getSectionIndex(inspection.id, 'interior');
      expect(currentIndex).toBe(1);

      const totalSections = await mockStorage.getSectionCount(inspection.id);
      expect(currentIndex).toBe(totalSections - 1);

      // Trying to go next should return null
      const nextSection = await mockStorage.getSectionByIndex(inspection.id, currentIndex + 1);
      expect(nextSection).toBeNull();
    });

    it('should handle invalid section ID', async () => {
      const sections = [
        { id: 'exterior', name: 'Exterior' },
      ];

      const inspection = await mockStorage.createInspection({
        address: '400 Invalid Test Dr',
        client_name: 'Invalid Test Client',
        checklist_id: 'test',
        first_section: 'exterior',
        sections,
      });

      const index = await mockStorage.getSectionIndex(inspection.id, 'nonexistent');
      expect(index).toBe(-1);
    });
  });

  // ==========================================================================
  // Progress Tracking Tests
  // ==========================================================================

  describe('Progress Tracking', () => {
    it('should calculate progress correctly', async () => {
      const sections = [
        { id: 'section1', name: 'Section 1' },
        { id: 'section2', name: 'Section 2' },
        { id: 'section3', name: 'Section 3' },
        { id: 'section4', name: 'Section 4' },
      ];

      const inspection = await mockStorage.createInspection({
        address: '500 Progress Test Ct',
        client_name: 'Progress Test Client',
        checklist_id: 'test',
        first_section: 'section1',
        sections,
      });

      // Complete first two sections
      await mockStorage.updateSectionStatus(inspection.id, 'section1', 'completed');
      await mockStorage.updateSectionStatus(inspection.id, 'section2', 'completed');

      const statuses = await mockStorage.getSectionStatuses(inspection.id);
      const completed = statuses.filter(s => s.status === 'completed' || s.status === 'skipped').length;
      const total = statuses.length;
      const percentage = Math.round((completed / total) * 100);

      expect(completed).toBe(2);
      expect(total).toBe(4);
      expect(percentage).toBe(50);
    });

    it('should include skipped sections in progress', async () => {
      const sections = [
        { id: 'section1', name: 'Section 1' },
        { id: 'section2', name: 'Section 2' },
        { id: 'section3', name: 'Section 3' },
      ];

      const inspection = await mockStorage.createInspection({
        address: '600 Skip Progress Pl',
        client_name: 'Skip Progress Client',
        checklist_id: 'test',
        first_section: 'section1',
        sections,
      });

      // Complete one, skip one
      await mockStorage.updateSectionStatus(inspection.id, 'section1', 'completed');
      await mockStorage.updateSectionStatus(inspection.id, 'section2', 'skipped');

      const statuses = await mockStorage.getSectionStatuses(inspection.id);
      const completed = statuses.filter(s => s.status === 'completed' || s.status === 'skipped').length;

      expect(completed).toBe(2); // Both completed and skipped count toward progress
    });
  });

  // ==========================================================================
  // Suggestions Tests
  // ==========================================================================

  describe('Suggestions', () => {
    it('should provide suggestions based on checklist items', async () => {
      const available = checklistService.getAvailableChecklists();
      if (available.length === 0) {
        console.warn('No checklists available, skipping test');
        return;
      }

      const checklistId = available[0];
      const firstSection = checklistService.getFirstSection(checklistId);
      
      expect(firstSection).not.toBeNull();
      expect(firstSection?.items).toBeDefined();
      expect(firstSection?.items.length).toBeGreaterThan(0);
    });

    it('should include prompt in current section info', async () => {
      const available = checklistService.getAvailableChecklists();
      if (available.length === 0) {
        console.warn('No checklists available, skipping test');
        return;
      }

      const checklistId = available[0];
      const firstSection = checklistService.getFirstSection(checklistId);
      
      expect(firstSection?.prompt).toBeDefined();
      expect(firstSection?.prompt.length).toBeGreaterThan(0);
    });
  });
});
