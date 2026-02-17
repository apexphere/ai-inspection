/**
 * Inspection Tools
 * 
 * MCP tools for starting and managing inspections via API.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { inspectionApi, navigationApi } from "../api/client.js";
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

        // Create inspection via API
        const result = await inspectionApi.create({
          address,
          clientName: client_name,
          inspectorName: inspector_name,
          checklistId,
          currentSection: firstSection.id,
          metadata,
        });

        if (!result.ok || !result.data) {
          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({
                error: "Failed to create inspection",
                details: result.error,
              }, null, 2),
            }],
            isError: true,
          };
        }

        const inspection = result.data;

        // Build response
        const response = {
          inspection_id: inspection.id,
          status: "started",
          address: inspection.address,
          client_name: inspection.clientName,
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
        // Get status via API
        const result = await navigationApi.getStatus(inspection_id);

        if (!result.ok || !result.data) {
          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({
                error: result.error?.error || "Failed to get inspection status",
                inspection_id,
              }, null, 2),
            }],
            isError: true,
          };
        }

        const status = result.data;

        // Build response matching original format
        const response = {
          inspection_id: status.inspectionId,
          address: status.address,
          client_name: status.clientName,
          inspector_name: status.inspectorName,
          status: status.status,
          current_section: {
            id: status.currentSection.id,
            name: status.currentSection.name,
            status: 'in_progress',
            findings_count: status.currentSection.findingsCount,
            prompt: status.currentSection.prompt,
            items: status.currentSection.items,
          },
          sections: status.sections.map(s => ({
            id: s.id,
            name: s.name,
            status: s.hasFindings ? 'completed' : 'pending',
            findings_count: s.findingsCount,
          })),
          progress: status.progress,
          total_findings: status.totalFindings,
          can_complete: status.canComplete,
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
