import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Register all MCP tools with the server.
 * Tools are stubs for now — implementations will be added as features are built.
 */
export function registerTools(server: McpServer): void {
  // Tool: Start a new inspection
  server.tool(
    "start_inspection",
    "Start a new building inspection at the specified address",
    {
      address: z.string().describe("Property address for the inspection"),
      inspector_name: z.string().optional().describe("Name of the inspector"),
    },
    async ({ address, inspector_name }) => {
      // TODO: Implement in #2
      return {
        content: [
          {
            type: "text" as const,
            text: `Inspection started at ${address}${inspector_name ? ` by ${inspector_name}` : ""}. [STUB]`,
          },
        ],
      };
    }
  );

  // Tool: Add a finding to the current inspection
  server.tool(
    "add_finding",
    "Record a finding or issue during the inspection",
    {
      section: z.string().describe("Section of the inspection (e.g., exterior, subfloor)"),
      description: z.string().describe("Description of the finding"),
      severity: z.enum(["info", "minor", "major", "critical"]).optional().describe("Severity level"),
    },
    async ({ section, description, severity }) => {
      // TODO: Implement in #3
      return {
        content: [
          {
            type: "text" as const,
            text: `Finding added to ${section}: ${description} (${severity || "info"}). [STUB]`,
          },
        ],
      };
    }
  );

  // Tool: Add a photo to the current inspection
  server.tool(
    "add_photo",
    "Attach a photo to the current section or finding",
    {
      section: z.string().describe("Section the photo belongs to"),
      caption: z.string().optional().describe("Caption for the photo"),
      photo_url: z.string().describe("URL or path to the photo"),
    },
    async ({ section, caption, photo_url }) => {
      // TODO: Implement in #4
      return {
        content: [
          {
            type: "text" as const,
            text: `Photo added to ${section}${caption ? `: ${caption}` : ""}. [STUB]`,
          },
        ],
      };
    }
  );

  // Tool: Navigate to a section
  server.tool(
    "go_to_section",
    "Navigate to a specific section of the inspection checklist",
    {
      section: z.string().describe("Section to navigate to"),
    },
    async ({ section }) => {
      // TODO: Implement in #2
      return {
        content: [
          {
            type: "text" as const,
            text: `Moved to section: ${section}. [STUB]`,
          },
        ],
      };
    }
  );

  // Tool: Get current inspection status
  server.tool(
    "get_status",
    "Get the current inspection progress and status",
    {},
    async () => {
      // TODO: Implement in #2
      return {
        content: [
          {
            type: "text" as const,
            text: "No active inspection. [STUB]",
          },
        ],
      };
    }
  );

  // Tool: Complete inspection and generate report
  server.tool(
    "complete_inspection",
    "Finish the inspection and generate the PDF report",
    {
      summary: z.string().optional().describe("Overall summary or notes"),
    },
    async ({ summary }) => {
      // TODO: Implement in #5
      return {
        content: [
          {
            type: "text" as const,
            text: `Inspection completed${summary ? ` with summary: ${summary}` : ""}. Report generation pending. [STUB]`,
          },
        ],
      };
    }
  );
}
