/**
 * Inspection Tools - Issues #3, #5
 * 
 * MCP tools for starting and managing inspections.
 * - inspection_start: Create a new inspection session
 * - inspection_status: Get current inspection state
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { StorageService } from "../storage/index.js";
import { checklistService } from "../services/checklist.js";

// ============================================================================
// Tool Registration
// ============================================================================

export function registerInspectionTools(server: McpServer, storage: StorageService): void {
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
        property_type: z.string().optional().describe("Type of property"),
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

        // Create the inspection using real storage
        const inspection = storage.createInspection({
          address,
          client_name,
          inspector_name,
        });

        // Set current section
        storage.updateInspection(inspection.id, {
          current_section: firstSection.id,
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
        const inspection = storage.getInspection(inspection_id);
        
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

        // Get findings for this inspection
        const findings = storage.getFindings(inspection_id);
        const photos = storage.getPhotos(inspection_id);

        // Get checklist info (default to nz-ppi if not stored)
        const checklistId = 'nz-ppi'; // TODO: Store checklist ID with inspection
        const checklist = checklistService.getChecklist(checklistId);
        const sections = checklist?.sections || [];
        
        // Build section statuses
        const sectionStatuses = sections.map(section => {
          const sectionFindings = findings.filter(f => f.section === section.id);
          const isCurrentSection = inspection.current_section === section.id;
          
          // Determine status based on findings and position
          let status: string = 'pending';
          if (isCurrentSection) {
            status = 'in_progress';
          } else if (sectionFindings.length > 0) {
            status = 'completed';
          }

          return {
            id: section.id,
            name: section.name,
            status,
            findings_count: sectionFindings.length,
          };
        });

        // Calculate progress
        const completedSections = sectionStatuses.filter(s => 
          s.status === 'completed' || s.status === 'skipped'
        ).length;
        const totalSections = sectionStatuses.length;
        
        // Get current section details
        const currentSection = sections.find(s => s.id === inspection.current_section);
        const currentSectionStatus = sectionStatuses.find(s => s.id === inspection.current_section);

        // Determine if can complete (at least 50% done)
        const canComplete = completedSections >= Math.ceil(totalSections * 0.5);

        // Build response
        const response = {
          inspection_id: inspection.id,
          address: inspection.address,
          client_name: inspection.client_name,
          inspector_name: inspection.inspector_name,
          started_at: inspection.started_at,
          status: inspection.status,
          current_section: currentSection ? {
            id: inspection.current_section,
            name: currentSection.name,
            status: currentSectionStatus?.status || 'in_progress',
            findings_count: currentSectionStatus?.findings_count || 0,
            prompt: currentSection.prompt,
            items: currentSection.items,
          } : null,
          sections: sectionStatuses,
          progress: {
            completed: completedSections,
            total: totalSections,
            percentage: totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0,
          },
          total_findings: findings.length,
          total_photos: photos.length,
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
