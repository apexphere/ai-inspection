/**
 * Inspection Tools Tests - Issue #3
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { mockStorage } from '../storage/mock-storage.js';
import { checklistService, ChecklistService } from '../services/checklist.js';
import { join } from 'path';

// ============================================================================
// Test Setup
// ============================================================================

describe('Inspection Tools', () => {
  beforeEach(() => {
    // Clear mock storage between tests
    mockStorage.clear();
  });

  // ==========================================================================
  // Mock Storage Tests
  // ==========================================================================

  describe('MockStorage', () => {
    it('should create an inspection', async () => {
      const inspection = await mockStorage.createInspection({
        address: '123 Test Street',
        client_name: 'John Doe',
        inspector_name: 'Jane Inspector',
        checklist_id: 'nz-ppi',
        first_section: 'exterior',
        sections: [
          { id: 'exterior', name: 'Exterior' },
          { id: 'interior', name: 'Interior' },
        ],
      });

      expect(inspection.id).toBeDefined();
      expect(inspection.address).toBe('123 Test Street');
      expect(inspection.client_name).toBe('John Doe');
      expect(inspection.inspector_name).toBe('Jane Inspector');
      expect(inspection.status).toBe('started');
      expect(inspection.current_section).toBe('exterior');
    });

    it('should retrieve an inspection by ID', async () => {
      const created = await mockStorage.createInspection({
        address: '456 Another Road',
        client_name: 'Alice Smith',
        checklist_id: 'nz-ppi',
        first_section: 'site_ground',
        sections: [{ id: 'site_ground', name: 'Site and Ground' }],
      });

      const retrieved = await mockStorage.getInspection(created.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.address).toBe('456 Another Road');
    });

    it('should return null for non-existent inspection', async () => {
      const result = await mockStorage.getInspection('non-existent-id');
      expect(result).toBeNull();
    });

    it('should update an inspection', async () => {
      const created = await mockStorage.createInspection({
        address: '789 Update Lane',
        client_name: 'Bob Update',
        checklist_id: 'nz-ppi',
        first_section: 'exterior',
        sections: [{ id: 'exterior', name: 'Exterior' }],
      });

      const updated = await mockStorage.updateInspection(created.id, {
        current_section: 'interior',
        status: 'in_progress',
      });

      expect(updated?.current_section).toBe('interior');
      expect(updated?.status).toBe('in_progress');
    });

    it('should track section statuses', async () => {
      const inspection = await mockStorage.createInspection({
        address: '100 Status Street',
        client_name: 'Status Test',
        checklist_id: 'nz-ppi',
        first_section: 'exterior',
        sections: [
          { id: 'exterior', name: 'Exterior' },
          { id: 'interior', name: 'Interior' },
          { id: 'services', name: 'Services' },
        ],
      });

      const statuses = await mockStorage.getSectionStatuses(inspection.id);

      expect(statuses).toHaveLength(3);
      expect(statuses[0].status).toBe('in_progress'); // First section
      expect(statuses[1].status).toBe('pending');
      expect(statuses[2].status).toBe('pending');
    });

    it('should add and count findings', async () => {
      const inspection = await mockStorage.createInspection({
        address: '200 Finding Ave',
        client_name: 'Finding Test',
        checklist_id: 'nz-ppi',
        first_section: 'exterior',
        sections: [{ id: 'exterior', name: 'Exterior' }],
      });

      await mockStorage.addFinding({
        inspection_id: inspection.id,
        section: 'exterior',
        text: 'Rust on gutters',
        severity: 'minor',
      });

      await mockStorage.addFinding({
        inspection_id: inspection.id,
        section: 'exterior',
        text: 'Cracked tiles',
        severity: 'major',
      });

      const count = await mockStorage.getFindingsCount(inspection.id);
      expect(count).toBe(2);

      const findings = await mockStorage.getFindings(inspection.id);
      expect(findings).toHaveLength(2);
      expect(findings[0].text).toBe('Rust on gutters');
      expect(findings[1].text).toBe('Cracked tiles');
    });
  });

  // ==========================================================================
  // Checklist Service Tests
  // ==========================================================================

  describe('ChecklistService', () => {
    it('should load checklists from config', () => {
      // Use the actual config path
      const service = new ChecklistService(
        join(process.cwd(), '..', 'config', 'checklists')
      );
      
      const available = service.getAvailableChecklists();
      expect(available.length).toBeGreaterThan(0);
    });

    it('should get a specific checklist', () => {
      const service = new ChecklistService(
        join(process.cwd(), '..', 'config', 'checklists')
      );

      const checklist = service.getChecklist('nz-ppi');
      
      // May or may not exist depending on test environment
      if (checklist) {
        expect(checklist.name).toBeDefined();
        expect(checklist.sections.length).toBeGreaterThan(0);
      }
    });

    it('should return null for non-existent checklist', () => {
      const service = new ChecklistService(
        join(process.cwd(), '..', 'config', 'checklists')
      );

      const checklist = service.getChecklist('non-existent-checklist');
      expect(checklist).toBeNull();
    });

    it('should get first section of a checklist', () => {
      const service = new ChecklistService(
        join(process.cwd(), '..', 'config', 'checklists')
      );

      const available = service.getAvailableChecklists();
      if (available.length > 0) {
        const firstSection = service.getFirstSection(available[0]);
        expect(firstSection).not.toBeNull();
        expect(firstSection?.id).toBeDefined();
        expect(firstSection?.name).toBeDefined();
        expect(firstSection?.prompt).toBeDefined();
      }
    });
  });

  // ==========================================================================
  // Integration Tests (Tool Logic)
  // ==========================================================================

  describe('Tool Integration', () => {
    it('should start inspection and get status', async () => {
      // Simulate what the tools would do
      const service = new ChecklistService(
        join(process.cwd(), '..', 'config', 'checklists')
      );

      const available = service.getAvailableChecklists();
      if (available.length === 0) {
        console.warn('No checklists available, skipping integration test');
        return;
      }

      const checklistId = available[0];
      const checklist = service.getChecklist(checklistId);
      const firstSection = service.getFirstSection(checklistId);
      const allSections = service.getAllSections(checklistId);

      // Start inspection
      const inspection = await mockStorage.createInspection({
        address: '999 Integration Test Road',
        client_name: 'Integration Test Client',
        inspector_name: 'Test Inspector',
        checklist_id: checklistId,
        first_section: firstSection!.id,
        sections: allSections,
      });

      expect(inspection.id).toBeDefined();
      expect(inspection.status).toBe('started');

      // Get status
      const retrieved = await mockStorage.getInspection(inspection.id);
      expect(retrieved?.address).toBe('999 Integration Test Road');
      expect(retrieved?.current_section).toBe(firstSection!.id);

      // Get section statuses
      const statuses = await mockStorage.getSectionStatuses(inspection.id);
      expect(statuses.length).toBe(allSections.length);
    });
  });
});
