import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { registerInspectionTools } from "./inspection.js";
import { registerFindingTools } from "./finding.js";

/**
 * Register all MCP tools with the server.
 */
export function registerTools(server: McpServer): void {
  // Register inspection_start and inspection_status tools (Issue #3)
  registerInspectionTools(server);

  // Register inspection_add_finding tool (Issue #4)
  registerFindingTools(server);

  // Stub tools for future implementation
  // These will be replaced as their respective issues are completed

  // Tool: Navigate to a section (Issue #5)
  server.tool(
    "inspection_navigate",
    "Navigate to a different section of the inspection checklist",
    {
      inspection_id: z.string().describe("ID of the active inspection"),
      action: z.string().describe("'next', 'back', 'skip', or section ID"),
    },
    async ({ inspection_id, action }) => {
      // TODO: Implement in #5
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              stub: true,
              message: `Navigation action: ${action}`,
              inspection_id,
            }, null, 2),
          },
        ],
      };
    }
  );

  // Tool: Get suggestions for next steps (Issue #5)
  server.tool(
    "inspection_suggest_next",
    "Get guidance for what to do next based on current state",
    {
      inspection_id: z.string().describe("ID of the active inspection"),
    },
    async ({ inspection_id }) => {
      // TODO: Implement in #5
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              stub: true,
              message: "Suggestions would be provided here",
              inspection_id,
            }, null, 2),
          },
        ],
      };
    }
  );

  // Tool: Complete inspection and generate report (Issue #7)
  server.tool(
    "inspection_complete",
    "Finish the inspection and generate the PDF report",
    {
      inspection_id: z.string().describe("ID of the inspection to complete"),
      summary_notes: z.string().optional().describe("Overall summary or notes"),
      weather: z.string().optional().describe("Weather at time of inspection"),
    },
    async ({ inspection_id, summary_notes, weather }) => {
      // TODO: Implement in #7
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

  // Tool: Get generated report (Issue #7)
  server.tool(
    "inspection_get_report",
    "Retrieve a generated inspection report",
    {
      inspection_id: z.string().describe("ID of the inspection"),
      format: z.enum(["pdf", "markdown"]).optional().describe("Report format (default: pdf)"),
    },
    async ({ inspection_id, format }) => {
      // TODO: Implement in #7
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
