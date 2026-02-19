import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { registerInspectionTools } from "./inspection.js";
import { registerFindingTools } from "./finding.js";
import { registerReportTools } from "./report.js";
import { navigationApi } from "../api/client.js";

/**
 * Register all MCP tools with the server.
 */
export function registerTools(server: McpServer): void {
  // Register inspection_start and inspection_status tools
  registerInspectionTools(server);

  // Register inspection_add_finding tool
  registerFindingTools(server);

  // Register inspection_complete and inspection_get_report tools
  registerReportTools(server);

  // -------------------------------------------------------------------------
  // inspection_navigate - Navigate to a section via API
  // -------------------------------------------------------------------------
  server.tool(
    "inspection_navigate",
    "Navigate to a different section of the inspection checklist",
    {
      inspection_id: z.string().uuid().describe("ID of the active inspection"),
      section: z.string().describe("Section ID to navigate to"),
    },
    async ({ inspection_id, section }) => {
      try {
        const result = await navigationApi.navigate(inspection_id, { section });

        if (!result.ok || !result.data) {
          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({
                error: result.error?.error || "Failed to navigate",
                inspection_id,
              }, null, 2),
            }],
            isError: true,
          };
        }

        const nav = result.data;

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              inspection_id: nav.inspectionId,
              previous_section: nav.previousSection,
              current_section: nav.currentSection,
              section_name: nav.sectionName,
              prompt: nav.prompt,
              items: nav.items,
              message: `Navigated to ${nav.sectionName}.`,
            }, null, 2),
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              error: "Failed to navigate",
              details: error instanceof Error ? error.message : String(error),
            }, null, 2),
          }],
          isError: true,
        };
      }
    }
  );

  // -------------------------------------------------------------------------
  // inspection_suggest_next - Get suggestions via API
  // -------------------------------------------------------------------------
  server.tool(
    "inspection_suggest_next",
    "Get guidance for what to do next based on current state",
    {
      inspection_id: z.string().uuid().describe("ID of the active inspection"),
    },
    async ({ inspection_id }) => {
      try {
        const result = await navigationApi.suggest(inspection_id);

        if (!result.ok || !result.data) {
          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({
                error: result.error?.error || "Failed to get suggestions",
                inspection_id,
              }, null, 2),
            }],
            isError: true,
          };
        }

        const suggest = result.data;

        const response: Record<string, unknown> = {
          inspection_id: suggest.inspectionId,
          current_section: suggest.currentSection,
          remaining_sections: suggest.remainingSections,
          can_complete: suggest.canComplete,
          suggestion: suggest.suggestion,
        };

        if (suggest.nextSection) {
          response.next_section = {
            id: suggest.nextSection.id,
            name: suggest.nextSection.name,
            prompt: suggest.nextSection.prompt,
          };
        }

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
              error: "Failed to get suggestions",
              details: error instanceof Error ? error.message : String(error),
            }, null, 2),
          }],
          isError: true,
        };
      }
    }
  );
}
