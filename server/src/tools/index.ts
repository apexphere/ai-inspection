import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Register all MCP tools with the server.
 * Tool naming convention: inspection_* prefix for all inspection-related tools.
 */
export function registerTools(server: McpServer): void {
  // Tool: Start a new inspection
  server.tool(
    "inspection_start",
    "Start a new building inspection at the specified address",
    {
      address: z.string().describe("Property address for the inspection"),
      client_name: z.string().describe("Name of the client"),
      inspector_name: z.string().optional().describe("Name of the inspector"),
      checklist: z.string().optional().describe("Checklist ID to use (default: nz-ppi)"),
      metadata: z.object({
        property_type: z.string().optional(),
        bedrooms: z.number().optional(),
        bathrooms: z.number().optional(),
        year_built: z.number().optional(),
      }).optional().describe("Property metadata"),
    },
    async ({ address, client_name, inspector_name, checklist, metadata }) => {
      // TODO: Implement in #2
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              inspection_id: "stub-id",
              status: "started",
              first_section: {
                id: "exterior",
                name: "Exterior",
                prompt: "Check the roof, gutters, cladding, and external walls.",
                items: ["Roof condition", "Gutters and downpipes", "Cladding/weatherboards"],
              },
              message: `Inspection started at ${address} for ${client_name}. Ready to begin with Exterior.`,
            }),
          },
        ],
      };
    }
  );

  // Tool: Add a finding to the inspection
  server.tool(
    "inspection_add_finding",
    "Record a finding or issue during the inspection",
    {
      inspection_id: z.string().describe("ID of the active inspection"),
      section: z.string().optional().describe("Section ID (default: current section)"),
      text: z.string().describe("Inspector's note describing the finding"),
      photos: z.array(z.object({
        data: z.string().describe("Base64 encoded photo data"),
        filename: z.string().optional(),
        mime_type: z.string().optional(),
      })).optional().describe("Photos to attach to this finding"),
      severity: z.enum(["info", "minor", "major", "urgent"]).optional().describe("Severity level"),
    },
    async ({ inspection_id, section, text, photos, severity }) => {
      // TODO: Implement in #3
      const photoCount = photos?.length || 0;
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              finding_id: "stub-finding-id",
              section: section || "exterior",
              photos_stored: photoCount,
              message: `Noted: ${text}. ${photoCount > 0 ? `${photoCount} photo(s) attached. ` : ""}Anything else for this section, or move on?`,
            }),
          },
        ],
      };
    }
  );

  // Tool: Navigate to a section
  server.tool(
    "inspection_navigate",
    "Navigate to a different section of the inspection checklist",
    {
      inspection_id: z.string().describe("ID of the active inspection"),
      action: z.string().describe("Navigation action: 'next', 'back', 'skip', or a section ID"),
    },
    async ({ inspection_id, action }) => {
      // TODO: Implement in #2
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              previous_section: "exterior",
              current_section: {
                id: "subfloor",
                name: "Subfloor",
                prompt: "Check for moisture, ventilation, and pile condition.",
                items: ["Access and clearance", "Moisture levels", "Ventilation", "Piles and bearers"],
              },
              progress: {
                completed: 1,
                total: 8,
              },
              message: "Moving to Subfloor. Check for moisture, ventilation, and pile condition.",
            }),
          },
        ],
      };
    }
  );

  // Tool: Get current inspection status
  server.tool(
    "inspection_status",
    "Get the current inspection progress and status",
    {
      inspection_id: z.string().describe("ID of the inspection"),
    },
    async ({ inspection_id }) => {
      // TODO: Implement in #2
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              inspection_id,
              address: "123 Example Street",
              started_at: new Date().toISOString(),
              current_section: "exterior",
              sections: [
                { id: "exterior", name: "Exterior", status: "in_progress", findings_count: 0 },
                { id: "subfloor", name: "Subfloor", status: "pending", findings_count: 0 },
                { id: "interior", name: "Interior", status: "pending", findings_count: 0 },
              ],
              total_findings: 0,
              total_photos: 0,
              can_complete: false,
            }),
          },
        ],
      };
    }
  );

  // Tool: Get suggestions for next steps
  server.tool(
    "inspection_suggest_next",
    "Get guidance on what to check next based on current section and progress",
    {
      inspection_id: z.string().describe("ID of the active inspection"),
    },
    async ({ inspection_id }) => {
      // TODO: Implement
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              current_section: {
                id: "exterior",
                name: "Exterior",
                prompt: "Check the roof, gutters, cladding, and external walls.",
                items: ["Roof condition", "Gutters and downpipes", "Cladding/weatherboards", "External joinery", "Decks and balconies"],
                findings_count: 0,
              },
              progress: {
                completed: 0,
                total: 8,
                percentage: 0,
              },
              suggestions: [
                "Check roof for damaged or missing tiles",
                "Inspect gutters for rust or blockages",
                "Look for cracks or damage in cladding",
              ],
              can_complete: false,
            }),
          },
        ],
      };
    }
  );

  // Tool: Complete inspection and generate report
  server.tool(
    "inspection_complete",
    "Finish the inspection and generate the PDF report",
    {
      inspection_id: z.string().describe("ID of the inspection to complete"),
      summary_notes: z.string().optional().describe("Overall summary or notes for the report"),
      weather: z.string().optional().describe("Weather conditions at time of inspection"),
    },
    async ({ inspection_id, summary_notes, weather }) => {
      // TODO: Implement in #5
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              inspection_id,
              status: "completed",
              report_path: `/data/reports/${inspection_id}.pdf`,
              summary: {
                sections_completed: 8,
                total_findings: 5,
                total_photos: 12,
                major_issues: 1,
              },
              message: "Inspection complete. Report generated with 5 findings across 8 sections.",
            }),
          },
        ],
      };
    }
  );

  // Tool: Get generated report
  server.tool(
    "inspection_get_report",
    "Retrieve a generated inspection report",
    {
      inspection_id: z.string().describe("ID of the inspection"),
      format: z.enum(["pdf", "markdown"]).optional().describe("Report format (default: pdf)"),
    },
    async ({ inspection_id, format }) => {
      // TODO: Implement
      const reportFormat = format || "pdf";
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              inspection_id,
              format: reportFormat,
              report_path: `/data/reports/${inspection_id}.${reportFormat === "pdf" ? "pdf" : "md"}`,
              file_size: 1024000,
              generated_at: new Date().toISOString(),
            }),
          },
        ],
      };
    }
  );
}
