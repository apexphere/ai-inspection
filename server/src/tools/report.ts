/**
 * Report Tools - Issue #7
 * 
 * MCP tools for completing inspections and generating reports.
 * - inspection_complete: Finish inspection and generate PDF
 * - inspection_get_report: Retrieve generated report
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { mockStorage } from "../storage/mock-storage.js";
import { getReportGenerator, type ReportData } from "../pdf/index.js";
import { checklistService } from "../services/checklist.js";
import { readFileSync, existsSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

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
      inspection_id: z.string().describe("ID of the inspection to complete"),
      summary_notes: z.string().optional().describe("Overall summary or additional notes"),
      weather: z.string().optional().describe("Weather conditions at time of inspection"),
    },
    async ({ inspection_id, summary_notes, weather }) => {
      try {
        // Get inspection
        const inspection = await mockStorage.getInspection(inspection_id);
        
        if (!inspection) {
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

        if (inspection.status === 'completed') {
          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({
                error: "Inspection already completed",
                inspection_id,
                completed_at: inspection.completed_at,
              }, null, 2),
            }],
            isError: true,
          };
        }

        // Get findings
        const findings = await mockStorage.getFindings(inspection_id);

        // Get section statuses for section names
        const sectionStatuses = await mockStorage.getSectionStatuses(inspection_id);
        const sections = sectionStatuses.map(s => ({
          id: s.id,
          name: s.name,
        }));

        // Build report data
        const reportData: ReportData = {
          inspection: {
            id: inspection.id,
            address: inspection.address,
            client_name: inspection.client_name,
            inspector_name: inspection.inspector_name,
            started_at: inspection.started_at,
            completed_at: new Date().toISOString(),
            metadata: {
              ...inspection.metadata,
              weather: weather || inspection.metadata?.weather,
            },
          },
          findings: findings.map(f => ({
            id: f.id,
            section: f.section,
            text: f.text,
            severity: f.severity,
            matched_comment: f.matched_comment,
          })),
          photos: [], // TODO: Get photos from storage
          sections,
        };

        // Generate PDF
        const generator = getReportGenerator();
        const report = await generator.generate(reportData);

        // Update inspection status
        await mockStorage.updateInspection(inspection_id, {
          status: 'completed',
          completed_at: reportData.inspection.completed_at,
        });

        // Calculate summary stats
        const urgentCount = findings.filter(f => f.severity === 'urgent').length;
        const majorCount = findings.filter(f => f.severity === 'major').length;
        const minorCount = findings.filter(f => f.severity === 'minor').length;

        // Build response
        const response: Record<string, unknown> = {
          status: "completed",
          inspection_id,
          report: {
            path: report.path,
            size_kb: Math.round(report.size / 1024),
            estimated_pages: report.pages,
          },
          summary: {
            total_findings: findings.length,
            urgent: urgentCount,
            major: majorCount,
            minor: minorCount,
            sections_inspected: sections.length,
          },
          message: `Inspection completed. PDF report generated (${Math.round(report.size / 1024)}KB).`,
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
      inspection_id: z.string().describe("ID of the inspection"),
      format: z.enum(["pdf", "markdown"]).optional().describe("Report format (default: pdf)"),
    },
    async ({ inspection_id, format = "pdf" }) => {
      try {
        // Get inspection
        const inspection = await mockStorage.getInspection(inspection_id);
        
        if (!inspection) {
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

        if (inspection.status !== 'completed') {
          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({
                error: "Inspection not completed yet",
                inspection_id,
                status: inspection.status,
                hint: "Use inspection_complete to finish the inspection and generate the report.",
              }, null, 2),
            }],
            isError: true,
          };
        }

        // Check if report exists
        const projectRoot = join(__dirname, '..', '..', '..');
        const pdfPath = join(projectRoot, 'data', 'reports', `${inspection_id}.pdf`);
        const htmlPath = join(projectRoot, 'data', 'reports', `${inspection_id}.html`);

        if (format === "pdf") {
          if (!existsSync(pdfPath)) {
            return {
              content: [{
                type: "text" as const,
                text: JSON.stringify({
                  error: "PDF report not found",
                  inspection_id,
                  expected_path: pdfPath,
                  hint: "The report may need to be regenerated.",
                }, null, 2),
              }],
              isError: true,
            };
          }

          const stats = statSync(pdfPath);

          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({
                inspection_id,
                format: "pdf",
                path: pdfPath,
                size_kb: Math.round(stats.size / 1024),
                generated_at: stats.mtime.toISOString(),
                message: "PDF report available at the specified path.",
              }, null, 2),
            }],
          };
        }

        // Markdown format - return HTML content as markdown-like text
        if (existsSync(htmlPath)) {
          const htmlContent = readFileSync(htmlPath, 'utf-8');
          
          // Basic HTML to text conversion for LLM consumption
          const textContent = htmlContent
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 10000); // Limit for LLM context

          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({
                inspection_id,
                format: "markdown",
                content: textContent,
                truncated: textContent.length >= 10000,
                message: "Report content extracted from HTML.",
              }, null, 2),
            }],
          };
        }

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              error: "Report content not found",
              inspection_id,
            }, null, 2),
          }],
          isError: true,
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
