import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { registerInspectionTools } from "./inspection.js";
import { registerFindingTools } from "./finding.js";
import { registerReportTools } from "./report.js";

/**
 * Register all MCP tools with the server.
 */
export function registerTools(server: McpServer): void {
  // Register inspection_start and inspection_status tools (Issue #3)
  registerInspectionTools(server);

  // Register inspection_add_finding tool (Issue #4)
  registerFindingTools(server);

  // Register inspection_complete and inspection_get_report tools (Issue #7)
  registerReportTools(server);

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
}
