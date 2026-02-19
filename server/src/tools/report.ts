/**
 * Report Tools
 * 
 * MCP tools for completing inspections and generating reports via API.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { inspectionApi, navigationApi, reportsApi, findingsApi } from "../api/client.js";

// ============================================================================
// Tool Registration
// ============================================================================

export function registerReportTools(server: McpServer): void {
  // -------------------------------------------------------------------------
  // inspection_complete
  // -------------------------------------------------------------------------
  server.tool(
    "inspection_complete",
    "Finish the inspection and generate the PDF report",
    {
      inspection_id: z.string().uuid().describe("ID of the inspection to complete"),
      summary_notes: z.string().optional().describe("Overall summary or additional notes"),
      weather: z.string().optional().describe("Weather conditions at time of inspection"),
    },
    async ({ inspection_id, summary_notes }) => {
      try {
        // Get inspection status first
        const statusResult = await navigationApi.getStatus(inspection_id);
        
        if (!statusResult.ok || !statusResult.data) {
          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({
                error: statusResult.error?.error || "Inspection not found",
                inspection_id,
              }, null, 2),
            }],
            isError: true,
          };
        }

        const status = statusResult.data;

        if (status.status === 'COMPLETED') {
          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({
                error: "Inspection already completed",
                inspection_id,
              }, null, 2),
            }],
            isError: true,
          };
        }

        // Update inspection to completed
        const updateResult = await inspectionApi.update(inspection_id, {
          status: 'COMPLETED',
          completedAt: new Date().toISOString(),
        });

        if (!updateResult.ok) {
          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({
                error: updateResult.error?.error || "Failed to complete inspection",
                inspection_id,
              }, null, 2),
            }],
            isError: true,
          };
        }

        // Generate PDF report via API
        const reportResult = await reportsApi.generate(inspection_id);

        if (!reportResult.ok || !reportResult.data) {
          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({
                error: reportResult.error?.error || "Failed to generate report",
                inspection_id,
              }, null, 2),
            }],
            isError: true,
          };
        }

        const report = reportResult.data;

        // Get findings for summary
        const findingsResult = await findingsApi.list(inspection_id);
        const findings = findingsResult.data || [];

        // Calculate summary stats
        const urgentCount = findings.filter(f => f.severity === 'URGENT').length;
        const majorCount = findings.filter(f => f.severity === 'MAJOR').length;
        const minorCount = findings.filter(f => f.severity === 'MINOR').length;

        // Build response
        const response: Record<string, unknown> = {
          status: "completed",
          inspection_id,
          report: {
            id: report.id,
            path: report.path,
            format: report.format,
          },
          summary: {
            total_findings: findings.length,
            urgent: urgentCount,
            major: majorCount,
            minor: minorCount,
            sections_inspected: status.sections.filter(s => s.hasFindings).length,
          },
          message: `Inspection completed. PDF report generated.`,
        };

        if (summary_notes) {
          response.summary_notes = summary_notes;
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
              error: "Failed to complete inspection",
              details: error instanceof Error ? error.message : String(error),
            }, null, 2),
          }],
          isError: true,
        };
      }
    }
  );

  // -------------------------------------------------------------------------
  // inspection_get_report
  // -------------------------------------------------------------------------
  server.tool(
    "inspection_get_report",
    "Retrieve a generated inspection report",
    {
      inspection_id: z.string().uuid().describe("ID of the inspection"),
      format: z.enum(["pdf", "markdown"]).optional().describe("Report format (default: pdf)"),
    },
    async ({ inspection_id, format = "pdf" }) => {
      try {
        // Get latest report via API
        const reportResult = await reportsApi.getLatest(inspection_id);

        if (!reportResult.ok || !reportResult.data) {
          // Check if it's a 404 (inspection or report not found)
          const errorMsg = reportResult.error?.error || "Report not found";
          
          if (errorMsg.includes("Inspection not found")) {
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

          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({
                error: "Report not found",
                inspection_id,
                hint: "Use inspection_complete to finish the inspection and generate the report.",
              }, null, 2),
            }],
            isError: true,
          };
        }

        const report = reportResult.data;

        if (format === "pdf") {
          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({
                inspection_id,
                format: "pdf",
                report_id: report.id,
                path: report.path,
                generated_at: report.createdAt,
                download_url: `/api/inspections/${inspection_id}/report/download`,
                message: "PDF report available. Use download_url to retrieve the file.",
              }, null, 2),
            }],
          };
        }

        // For markdown, we'd need to read and convert - for now just return metadata
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              inspection_id,
              format: "markdown",
              report_id: report.id,
              message: "Markdown format not directly available. Use PDF format or download the report.",
            }, null, 2),
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              error: "Failed to get report",
              details: error instanceof Error ? error.message : String(error),
            }, null, 2),
          }],
          isError: true,
        };
      }
    }
  );
}
