/**
 * Finding Tools - Issue #4
 * 
 * MCP tool for recording findings during inspection.
 * - inspection_add_finding: Record a finding with optional photos
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { mockStorage } from "../storage/mock-storage.js";
import { commentLibrary } from "../services/comments.js";
import { randomUUID } from "crypto";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================================================
// Photo Storage
// ============================================================================

interface PhotoInput {
  data: string;
  filename?: string;
  mime_type?: string;
}

interface StoredPhoto {
  id: string;
  filename: string;
  path: string;
  mime_type: string;
}

/**
 * Store a base64-encoded photo to disk.
 */
function storePhoto(
  inspectionId: string,
  findingId: string,
  photo: PhotoInput,
  index: number
): StoredPhoto {
  // Default values
  const mimeType = photo.mime_type || 'image/jpeg';
  const extension = mimeType.split('/')[1] || 'jpg';
  const filename = photo.filename || `photo_${index + 1}.${extension}`;
  
  // Create photo directory
  const projectRoot = join(__dirname, '..', '..', '..');
  const photoDir = join(projectRoot, 'data', 'photos', inspectionId, findingId);
  
  if (!existsSync(photoDir)) {
    mkdirSync(photoDir, { recursive: true });
  }
  
  // Decode and save
  const id = randomUUID();
  const filePath = join(photoDir, `${id}_${filename}`);
  
  // Handle base64 with or without data URI prefix
  let base64Data = photo.data;
  if (base64Data.includes(',')) {
    base64Data = base64Data.split(',')[1];
  }
  
  const buffer = Buffer.from(base64Data, 'base64');
  writeFileSync(filePath, buffer);
  
  return {
    id,
    filename,
    path: filePath,
    mime_type: mimeType,
  };
}

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

        // Use current section if not specified
        const findingSection = section || inspection.current_section;

        // Match against comment library
        const matchResult = commentLibrary.match(text, findingSection);

        // Add finding to storage
        const finding = await mockStorage.addFinding({
          inspection_id,
          section: findingSection,
          text,
          severity: severity || 'info',
          matched_comment: matchResult.matched ? matchResult.comment : undefined,
        });

        // Store photos if provided
        const storedPhotos: StoredPhoto[] = [];
        if (photos && photos.length > 0) {
          for (let i = 0; i < photos.length; i++) {
            const stored = storePhoto(inspection_id, finding.id, photos[i], i);
            storedPhotos.push(stored);
          }
        }

        // Build response
        const response: Record<string, unknown> = {
          finding_id: finding.id,
          section: findingSection,
          severity: finding.severity,
          text: finding.text,
          photos_stored: storedPhotos.length,
          message: `Finding recorded in ${findingSection}.`,
        };

        // Include matched comment if found
        if (matchResult.matched && matchResult.comment) {
          response.matched_comment = matchResult.comment;
          response.match_confidence = matchResult.confidence;
          response.message = `Finding recorded in ${findingSection}. Matched boilerplate comment available.`;
        }

        // Include photo details if any
        if (storedPhotos.length > 0) {
          response.photos = storedPhotos.map(p => ({
            id: p.id,
            filename: p.filename,
          }));
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
}
