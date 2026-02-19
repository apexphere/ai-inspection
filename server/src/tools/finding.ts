/**
 * Finding Tools
 * 
 * MCP tool for recording findings during inspection via API.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { 
  inspectionApi, 
  findingsApi, 
  photosApi,
  siteInspectionApi,
  checklistItemApi,
  clauseReviewApi,
} from "../api/client.js";
import { commentLibrary } from "../services/comments.js";

// ============================================================================
// Tool Registration
// ============================================================================

export function registerFindingTools(server: McpServer): void {
  // -------------------------------------------------------------------------
  // inspection_add_finding
  // -------------------------------------------------------------------------
  server.tool(
    "inspection_add_finding",
    "Record a finding or issue during the inspection with optional photos",
    {
      inspection_id: z.string().describe("ID of the active inspection"),
      section: z.string().optional().describe("Section ID (defaults to current section)"),
      text: z.string().describe("Inspector's note or description of the finding"),
      photos: z.array(z.object({
        data: z.string().describe("Base64 encoded photo data"),
        filename: z.string().optional().describe("Original filename"),
        mime_type: z.string().optional().describe("MIME type (default: image/jpeg)"),
      })).optional().describe("Photos to attach to this finding"),
      severity: z.enum(["info", "minor", "major", "urgent"]).optional()
        .describe("Severity level (default: info)"),
    },
    async ({ inspection_id, section, text, photos, severity }) => {
      try {
        // Get inspection to determine current section if not specified
        let findingSection = section;
        
        if (!findingSection) {
          const inspectionResult = await inspectionApi.get(inspection_id);
          if (!inspectionResult.ok || !inspectionResult.data) {
            return {
              content: [{
                type: "text" as const,
                text: JSON.stringify({
                  error: inspectionResult.error?.error || "Inspection not found",
                  inspection_id,
                }, null, 2),
              }],
              isError: true,
            };
          }
          findingSection = inspectionResult.data.currentSection;
        }

        // Match against comment library
        const matchResult = commentLibrary.match(text, findingSection);

        // Map severity to API enum
        const severityMap: Record<string, 'INFO' | 'MINOR' | 'MAJOR' | 'URGENT'> = {
          'info': 'INFO',
          'minor': 'MINOR',
          'major': 'MAJOR',
          'urgent': 'URGENT',
        };

        // Create finding via API
        const findingResult = await findingsApi.create(inspection_id, {
          section: findingSection,
          text,
          severity: severityMap[severity || 'info'],
          matchedComment: matchResult.matched ? matchResult.comment : undefined,
        });

        if (!findingResult.ok || !findingResult.data) {
          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({
                error: findingResult.error?.error || "Failed to create finding",
                details: findingResult.error,
              }, null, 2),
            }],
            isError: true,
          };
        }

        const finding = findingResult.data;

        // Upload photos if provided
        const uploadedPhotos: Array<{ id: string; filename: string }> = [];
        if (photos && photos.length > 0) {
          for (const photo of photos) {
            const photoResult = await photosApi.upload(finding.id, {
              base64Data: photo.data,
              mimeType: photo.mime_type,
            });

            if (photoResult.ok && photoResult.data) {
              uploadedPhotos.push({
                id: photoResult.data.id,
                filename: photoResult.data.filename,
              });
            }
          }
        }

        // Build response
        const response: Record<string, unknown> = {
          finding_id: finding.id,
          section: finding.section,
          severity: finding.severity.toLowerCase(),
          text: finding.text,
          photos_stored: uploadedPhotos.length,
          message: `Finding recorded in ${findingSection}.`,
        };

        // Include matched comment if found
        if (matchResult.matched && matchResult.comment) {
          response.matched_comment = matchResult.comment;
          response.match_confidence = matchResult.confidence;
          response.message = `Finding recorded in ${findingSection}. Matched boilerplate comment available.`;
        }

        // Include photo details if any
        if (uploadedPhotos.length > 0) {
          response.photos = uploadedPhotos;
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
              error: "Failed to add finding",
              details: error instanceof Error ? error.message : String(error),
            }, null, 2),
          }],
          isError: true,
        };
      }
    }
  );

  // -------------------------------------------------------------------------
  // site_inspection_add_finding - Add finding to site inspection
  // -------------------------------------------------------------------------
  server.tool(
    "site_inspection_add_finding",
    "Record a finding for a site inspection - creates ChecklistItem (Simple mode) or ClauseReview observation (Clause Review mode)",
    {
      inspection_id: z.string().describe("ID of the site inspection"),
      // For Simple mode
      category: z.enum(['EXTERIOR', 'INTERIOR', 'DECKS', 'SERVICES', 'SITE']).optional()
        .describe("Category for Simple mode checklist item"),
      item: z.string().optional().describe("Checklist item name (Simple mode)"),
      decision: z.enum(['PASS', 'FAIL', 'NA']).optional().describe("Decision for Simple mode"),
      // For Clause Review mode
      clause_id: z.string().optional().describe("Building code clause ID (Clause Review mode)"),
      applicability: z.enum(['APPLICABLE', 'NA']).optional().describe("Clause applicability (Clause Review mode)"),
      na_reason: z.string().optional().describe("Reason for N/A (Clause Review mode)"),
      // Common
      notes: z.string().optional().describe("Notes or observations"),
      photo_ids: z.array(z.string()).optional().describe("Photo IDs to attach"),
    },
    async ({ inspection_id, category, item, decision, clause_id, applicability, notes, na_reason, photo_ids }) => {
      try {
        // Get inspection to determine type
        const inspResult = await siteInspectionApi.get(inspection_id);
        if (!inspResult.ok || !inspResult.data) {
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

        const inspection = inspResult.data;

        if (inspection.type === 'SIMPLE') {
          // Simple mode - create ChecklistItem
          if (!category || !item || !decision) {
            return {
              content: [{
                type: "text" as const,
                text: JSON.stringify({
                  error: "Simple mode requires category, item, and decision",
                  inspection_type: "SIMPLE",
                }, null, 2),
              }],
              isError: true,
            };
          }

          const result = await checklistItemApi.create(inspection_id, {
            category,
            item,
            decision,
            notes,
            photoIds: photo_ids,
          });

          if (!result.ok || !result.data) {
            return {
              content: [{
                type: "text" as const,
                text: JSON.stringify({
                  error: "Failed to create checklist item",
                  details: result.error,
                }, null, 2),
              }],
              isError: true,
            };
          }

          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({
                item_id: result.data.id,
                category: result.data.category,
                item: result.data.item,
                decision: result.data.decision,
                notes: result.data.notes,
                photos_attached: result.data.photoIds?.length || 0,
                message: `Checklist item recorded: ${item} - ${decision}`,
              }, null, 2),
            }],
          };
        } else {
          // Clause Review mode - create or update ClauseReview
          if (!clause_id) {
            return {
              content: [{
                type: "text" as const,
                text: JSON.stringify({
                  error: "Clause Review mode requires clause_id",
                  inspection_type: "CLAUSE_REVIEW",
                }, null, 2),
              }],
              isError: true,
            };
          }

          const result = await clauseReviewApi.create(inspection_id, {
            clauseId: clause_id,
            applicability: applicability || 'APPLICABLE',
            naReason: na_reason,
            observations: notes,
            photoIds: photo_ids,
          });

          if (!result.ok || !result.data) {
            return {
              content: [{
                type: "text" as const,
                text: JSON.stringify({
                  error: "Failed to create clause review",
                  details: result.error,
                }, null, 2),
              }],
              isError: true,
            };
          }

          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({
                review_id: result.data.id,
                clause_code: result.data.clause.code,
                clause_title: result.data.clause.title,
                applicability: result.data.applicability,
                observations: result.data.observations,
                photos_attached: result.data.photoIds?.length || 0,
                message: `Clause ${result.data.clause.code} reviewed: ${result.data.applicability}`,
              }, null, 2),
            }],
          };
        }
      } catch (error) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              error: "Failed to add finding",
              details: error instanceof Error ? error.message : String(error),
            }, null, 2),
          }],
          isError: true,
        };
      }
    }
  );
}
