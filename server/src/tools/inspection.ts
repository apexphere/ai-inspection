/**
 * Inspection Tools - Issue #3
 * 
 * MCP tools for starting and managing inspections.
 * - inspection_start: Create a new inspection session
 * - inspection_status: Get current inspection state
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { mockStorage, InspectionMetadata } from "../storage/mock-storage.js";
import { checklistService } from "../services/checklist.js";

// ============================================================================
// Tool Registration
// ============================================================================

export function registerInspectionTools(server: McpServer): void {
  // -------------------------------------------------------------------------
  // inspection_start
  // -------------------------------------------------------------------------
  server.tool(
    "inspection_start",
    "Start a new building inspection at the specified address",
    {
      address: z.string().describe("Property address for the inspection"),
      client_name: z.string().describe("Name of the client"),
      inspector_name: z.string().optional().describe("Name of the inspector"),
      checklist: z.string().optional().describe("Checklist ID (default: 'nz-ppi')"),
      metadata: z.object({
        property_type: z.string().optional().describe("Type of property (e.g., 'residential', 'commercial')"),
        bedrooms: z.number().optional().describe("Number of bedrooms"),
        bathrooms: z.number().optional().describe("Number of bathrooms"),
        year_built: z.number().optional().describe("Year the property was built"),
      }).optional().describe("Additional property metadata"),
    },
    async ({ address, client_name, inspector_name, checklist, metadata }) => {
      try {
        // Determine checklist to use
        const checklistId = checklist || 'nz-ppi';
        const checklistData = checklistService.getChecklist(checklistId);
        
        if (!checklistData) {
          const available = checklistService.getAvailableChecklists();
          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({
                error: `Checklist '${checklistId}' not found`,
                available_checklists: available,
              }, null, 2),
            }],
            isError: true,
          };
        }

        // Get first section
        const firstSection = checklistService.getFirstSection(checklistId);
        if (!firstSection) {
          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({
                error: `Checklist '${checklistId}' has no sections`,
              }, null, 2),
            }],
            isError: true,
          };
        }

        // Get all sections for status tracking
        const allSections = checklistService.getAllSections(checklistId);

        // Create the inspection
        const inspection = await mockStorage.createInspection({
          address,
          client_name,
          inspector_name,
          checklist_id: checklistId,
          metadata: metadata as InspectionMetadata | undefined,
          first_section: firstSection.id,
          sections: allSections,
        });

        // Build response
        const response = {
          inspection_id: inspection.id,
          status: "started",
          address: inspection.address,
          client_name: inspection.client_name,
          checklist: checklistId,
          first_section: {
            id: firstSection.id,
            name: firstSection.name,
            prompt: firstSection.prompt,
            items: firstSection.items,
          },
          message: `Inspection started at ${address}. Ready to begin with ${firstSection.name}.`,
        };

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify(response, null, 2),
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              error: "Failed to start inspection",
              details: error instanceof Error ? error.message : String(error),
            }, null, 2),
          }],
          isError: true,
        };
      }
    }
  );

  // -------------------------------------------------------------------------
  // inspection_status
  // -------------------------------------------------------------------------
  server.tool(
    "inspection_status",
    "Get the current inspection state and progress",
    {
      inspection_id: z.string().describe("ID of the inspection to check"),
    },
    async ({ inspection_id }) => {
      try {
        // Get inspection
        const inspection = await mockStorage.getInspection(inspection_id);
        
        if (!inspection) {
          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({
                error: "Inspection not found",
                inspection_id,
              }, null, 2),
            }],
            isError: true,
          };
        }

        // Get section statuses
        const sectionStatuses = await mockStorage.getSectionStatuses(inspection_id);
        
        // Calculate progress
        const completedSections = sectionStatuses.filter(s => 
          s.status === 'completed' || s.status === 'skipped'
        ).length;
        const totalSections = sectionStatuses.length;
        
        // Get counts
        const totalFindings = await mockStorage.getFindingsCount(inspection_id);
        const totalPhotos = await mockStorage.getPhotosCount(inspection_id);

        // Determine if inspection can be completed
        const canComplete = completedSections >= Math.ceil(totalSections * 0.5); // At least 50% done

        // Get current section details
        const currentSectionStatus = sectionStatuses.find(s => s.id === inspection.current_section);
        const checklistSection = checklistService.getSection(
          inspection.checklist_id, 
          inspection.current_section
        );

        // Build response
        const response = {
          inspection_id: inspection.id,
          address: inspection.address,
          client_name: inspection.client_name,
          inspector_name: inspection.inspector_name,
          started_at: inspection.started_at,
          status: inspection.status,
          current_section: {
            id: inspection.current_section,
            name: currentSectionStatus?.name || inspection.current_section,
            status: currentSectionStatus?.status || 'in_progress',
            findings_count: currentSectionStatus?.findings_count || 0,
            prompt: checklistSection?.prompt,
            items: checklistSection?.items,
          },
          sections: sectionStatuses.map(s => ({
            id: s.id,
            name: s.name,
            status: s.status,
            findings_count: s.findings_count,
          })),
          progress: {
            completed: completedSections,
            total: totalSections,
            percentage: Math.round((completedSections / totalSections) * 100),
          },
          total_findings: totalFindings,
          total_photos: totalPhotos,
          can_complete: canComplete,
        };

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify(response, null, 2),
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              error: "Failed to get inspection status",
              details: error instanceof Error ? error.message : String(error),
            }, null, 2),
          }],
          isError: true,
        };
      }
    }
  );
}
