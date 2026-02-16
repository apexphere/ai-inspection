import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { StorageService } from "../storage/index.js";
import { registerInspectionTools } from "./inspection.js";
import { registerNavigationTools } from "./navigation.js";

/**
 * Register all MCP tools with the server.
 * Tool naming convention: inspection_* prefix for all inspection-related tools.
 */
export function registerTools(server: McpServer, storage: StorageService): void {
  // Register inspection_start and inspection_status tools (Issues #3)
  registerInspectionTools(server, storage);

  // Register inspection_suggest_next and inspection_navigate tools (Issue #5)
  registerNavigationTools(server, storage);

  // Tool: Add a finding to the inspection (Issue #4 - stub)
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
      // TODO: Implement in #4
      const photoCount = photos?.length || 0;
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              stub: true,
              finding_id: "stub-finding-id",
              section: section || "current",
              photos_stored: photoCount,
              message: `Noted: ${text}. ${photoCount > 0 ? `${photoCount} photo(s) attached. ` : ""}Anything else for this section, or move on?`,
            }),
          },
        ],
      };
    }
  );

  // Tool: Complete inspection and generate report (Issue #6 - stub)
  server.tool(
    "inspection_complete",
    "Finish the inspection and generate the PDF report",
    {
      inspection_id: z.string().describe("ID of the inspection to complete"),
      summary_notes: z.string().optional().describe("Overall summary or notes for the report"),
      weather: z.string().optional().describe("Weather conditions at time of inspection"),
    },
    async ({ inspection_id, summary_notes, weather }) => {
      // TODO: Implement in #6
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              stub: true,
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

  // Tool: Get generated report (Issue #6 - stub)
  server.tool(
    "inspection_get_report",
    "Retrieve a generated inspection report",
    {
      inspection_id: z.string().describe("ID of the inspection"),
      format: z.enum(["pdf", "markdown"]).optional().describe("Report format (default: pdf)"),
    },
    async ({ inspection_id, format }) => {
      // TODO: Implement in #6
      const reportFormat = format || "pdf";
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              stub: true,
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
