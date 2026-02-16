import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { registerInspectionTools } from "./inspection.js";
import { registerNavigationTools } from "./navigation.js";

/**
 * Register all MCP tools with the server.
 */
export function registerTools(server: McpServer): void {
  // Register inspection_start and inspection_status tools (Issue #3)
  registerInspectionTools(server);

  // Register inspection_suggest_next and inspection_navigate tools (Issue #5)
  registerNavigationTools(server);

  // Stub tools for future implementation
  // These will be replaced as their respective issues are completed

  // Tool: Add a finding to the current inspection (Issue #4)
  server.tool(
    "inspection_add_finding",
    "Record a finding or issue during the inspection",
    {
      inspection_id: z.string().describe("ID of the active inspection"),
      section: z.string().optional().describe("Section ID (default: current section)"),
      text: z.string().describe("Description of the finding"),
      photos: z.array(z.object({
        data: z.string().describe("Base64 encoded photo data"),
        filename: z.string().optional(),
        mime_type: z.string().optional(),
      })).optional().describe("Photos to attach"),
      severity: z.enum(["info", "minor", "major", "urgent"]).optional().describe("Severity level"),
    },
    async ({ inspection_id, section, text, photos, severity }) => {
      // TODO: Implement in #4
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              stub: true,
              message: `Finding would be added: ${text} (${severity || "info"})`,
              inspection_id,
              section,
              photos_count: photos?.length || 0,
            }, null, 2),
          },
        ],
      };
    }
  );

  // Tool: Complete inspection and generate report (Issue #6)
  server.tool(
    "inspection_complete",
    "Finish the inspection and generate the PDF report",
    {
      inspection_id: z.string().describe("ID of the inspection to complete"),
      summary_notes: z.string().optional().describe("Overall summary or notes"),
      weather: z.string().optional().describe("Weather at time of inspection"),
    },
    async ({ inspection_id, summary_notes, weather }) => {
      // TODO: Implement in #6
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              stub: true,
              message: "Inspection would be completed and report generated",
              inspection_id,
              summary_notes,
              weather,
            }, null, 2),
          },
        ],
      };
    }
  );

  // Tool: Get generated report (Issue #6)
  server.tool(
    "inspection_get_report",
    "Retrieve a generated inspection report",
    {
      inspection_id: z.string().describe("ID of the inspection"),
      format: z.enum(["pdf", "markdown"]).optional().describe("Report format (default: pdf)"),
    },
    async ({ inspection_id, format }) => {
      // TODO: Implement in #6
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              stub: true,
              message: "Report would be retrieved here",
              inspection_id,
              format: format || "pdf",
            }, null, 2),
          },
        ],
      };
    }
  );
}
