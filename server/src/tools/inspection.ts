/**
 * Inspection Tools
 * 
 * MCP tools for starting and managing inspections via API.
 * Supports both Simple (Pass/Fail) and Clause Review (COA/CCC) modes.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { 
  inspectionApi, 
  navigationApi,
  siteInspectionApi,
  checklistItemApi,
  clauseReviewApi,
  buildingCodeApi,
} from "../api/client.js";
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
      inspection_id: z.string().uuid().describe("ID of the inspection to check"),
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

  // -------------------------------------------------------------------------
  // site_inspection_start - Start new inspection with type selection
  // -------------------------------------------------------------------------
  server.tool(
    "site_inspection_start",
    "Start a new site inspection with Simple (Pass/Fail) or Clause Review (COA/CCC) mode",
    {
      project_id: z.string().uuid().describe("ID of the project to attach inspection to"),
      type: z.enum(['SIMPLE', 'CLAUSE_REVIEW']).describe("Inspection type: SIMPLE for Pass/Fail, CLAUSE_REVIEW for COA/CCC"),
      stage: z.string().describe("Inspection stage (e.g., INS_05, COA, CCC_GA)"),
      inspector_name: z.string().describe("Name of the inspector"),
      weather: z.string().optional().describe("Weather conditions"),
    },
    async ({ project_id, type, stage, inspector_name, weather }) => {
      try {
        // Create site inspection via API
        const result = await siteInspectionApi.create(project_id, {
          type,
          stage,
          date: new Date().toISOString(),
          inspectorName: inspector_name,
          weather,
        });

        if (!result.ok || !result.data) {
          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({
                error: "Failed to create site inspection",
                details: result.error,
              }, null, 2),
            }],
            isError: true,
          };
        }

        const inspection = result.data;

        // Get first section/clause based on type
        let firstSection;
        if (type === 'SIMPLE') {
          firstSection = {
            type: 'category',
            id: 'EXTERIOR',
            name: 'Exterior',
            prompt: 'Check exterior elements: roof, cladding, flashings, windows.',
            items: ['Roof cladding / flashings', 'Wall cladding', 'Window flashings', 'Window glazing'],
          };
        } else {
          // Get first building code clause
          const clausesResult = await buildingCodeApi.listClauses('B');
          const firstClause = clausesResult.data?.[0];
          firstSection = firstClause ? {
            type: 'clause',
            id: firstClause.id,
            code: firstClause.code,
            name: firstClause.title,
            prompt: `Check: ${firstClause.performanceText}`,
            typical_evidence: firstClause.typicalEvidence,
          } : {
            type: 'clause',
            id: 'B1',
            name: 'Structure',
            prompt: 'Check structural elements and foundations.',
          };
        }

        const response = {
          inspection_id: inspection.id,
          project_id: inspection.projectId,
          type: inspection.type,
          stage: inspection.stage,
          status: 'started',
          address: inspection.project?.property?.streetAddress,
          client_name: inspection.project?.client?.name,
          first_section: firstSection,
          message: `${type === 'SIMPLE' ? 'Simple checklist' : 'Clause review'} inspection started. Ready to begin with ${firstSection.name}.`,
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
              error: "Failed to start site inspection",
              details: error instanceof Error ? error.message : String(error),
            }, null, 2),
          }],
          isError: true,
        };
      }
    }
  );

  // -------------------------------------------------------------------------
  // site_inspection_status - Get status for new inspection system
  // -------------------------------------------------------------------------
  server.tool(
    "site_inspection_status",
    "Get status and progress for a site inspection",
    {
      inspection_id: z.string().uuid().describe("ID of the site inspection"),
    },
    async ({ inspection_id }) => {
      try {
        // Get inspection
        const inspResult = await siteInspectionApi.get(inspection_id);
        if (!inspResult.ok || !inspResult.data) {
          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({
                error: "Failed to get inspection",
                details: inspResult.error,
              }, null, 2),
            }],
            isError: true,
          };
        }

        const inspection = inspResult.data;

        // Get summary based on type
        let summary;
        if (inspection.type === 'SIMPLE') {
          const summaryResult = await checklistItemApi.getSummary(inspection_id);
          summary = summaryResult.data;
        } else {
          const summaryResult = await clauseReviewApi.getSummary(inspection_id);
          summary = summaryResult.data;
        }

        const response = {
          inspection_id: inspection.id,
          project_id: inspection.projectId,
          type: inspection.type,
          stage: inspection.stage,
          status: inspection.status,
          address: inspection.project?.property?.streetAddress,
          client_name: inspection.project?.client?.name,
          current_section: inspection.currentSection,
          current_clause_id: inspection.currentClauseId,
          summary,
          can_complete: inspection.type === 'SIMPLE' 
            ? (summary as { overallResult?: string })?.overallResult !== 'INCOMPLETE'
            : ((summary as { completionPercentage?: number })?.completionPercentage ?? 0) >= 80,
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
