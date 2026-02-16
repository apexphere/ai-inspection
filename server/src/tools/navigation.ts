/**
 * Navigation Tools - Issue #5
 * 
 * MCP tools for navigating through inspection sections.
 * - inspection_suggest_next: Get guidance for current section
 * - inspection_navigate: Move between sections
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { StorageService } from "../storage/index.js";
import { checklistService } from "../services/checklist.js";

// ============================================================================
// Tool Registration
// ============================================================================

export function registerNavigationTools(server: McpServer, storage: StorageService): void {
  // -------------------------------------------------------------------------
  // inspection_suggest_next
  // -------------------------------------------------------------------------
  server.tool(
    "inspection_suggest_next",
    "Get guidance for what to do next based on current inspection state",
    {
      inspection_id: z.string().describe("ID of the active inspection"),
    },
    async ({ inspection_id }) => {
      try {
        // Get inspection
        const inspection = storage.getInspection(inspection_id);
        
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

        // Get checklist and current section
        const checklistId = 'nz-ppi'; // TODO: Store with inspection
        const checklist = checklistService.getChecklist(checklistId);
        const sections = checklist?.sections || [];
        const currentSection = sections.find(s => s.id === inspection.current_section);
        const currentIndex = sections.findIndex(s => s.id === inspection.current_section);

        // Get findings for current section
        const findings = storage.getFindings(inspection_id);
        const currentFindings = findings.filter(f => f.section === inspection.current_section);

        // Generate suggestions based on checklist items
        const suggestions: string[] = [];
        if (currentSection?.items) {
          suggestions.push(...currentSection.items.slice(0, 3).map(item => `Check: ${item}`));
        }

        // Add contextual suggestions
        if (currentFindings.length === 0) {
          suggestions.push("Send a photo if you notice any issues");
        }

        // Calculate progress
        const completedSections = sections.filter(s => {
          const sectionFindings = findings.filter(f => f.section === s.id);
          return sectionFindings.length > 0 || s.id < (inspection.current_section || '');
        }).length;
        const totalSections = sections.length;
        const canComplete = completedSections >= Math.ceil(totalSections * 0.5);

        // Get next section info
        let nextSection = null;
        if (currentIndex >= 0 && currentIndex < sections.length - 1) {
          const next = sections[currentIndex + 1];
          nextSection = { id: next.id, name: next.name };
        }

        // Build response
        const response = {
          inspection_id,
          current_section: currentSection ? {
            id: inspection.current_section,
            name: currentSection.name,
            prompt: currentSection.prompt,
            items: currentSection.items,
            findings_count: currentFindings.length,
          } : null,
          progress: {
            completed: completedSections,
            total: totalSections,
            percentage: totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0,
          },
          suggestions,
          next_section: nextSection,
          can_complete: canComplete,
        };

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

  // -------------------------------------------------------------------------
  // inspection_navigate
  // -------------------------------------------------------------------------
  server.tool(
    "inspection_navigate",
    "Navigate to a different section of the inspection checklist",
    {
      inspection_id: z.string().describe("ID of the active inspection"),
      action: z.string().describe("'next', 'back', 'skip', or a section ID to jump to"),
    },
    async ({ inspection_id, action }) => {
      try {
        // Get inspection
        const inspection = storage.getInspection(inspection_id);
        
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

        // Get checklist
        const checklistId = 'nz-ppi'; // TODO: Store with inspection
        const checklist = checklistService.getChecklist(checklistId);
        const sections = checklist?.sections || [];
        const currentIndex = sections.findIndex(s => s.id === inspection.current_section);
        const totalSections = sections.length;
        
        let newSectionId: string | null = null;
        const actionLower = action.toLowerCase();

        switch (actionLower) {
          case 'next':
            if (currentIndex < totalSections - 1) {
              newSectionId = sections[currentIndex + 1].id;
            } else {
              return {
                content: [{
                  type: "text" as const,
                  text: JSON.stringify({
                    error: "Already at last section",
                    current_section: inspection.current_section,
                    suggestion: "Use 'inspection_complete' to finish the inspection",
                  }, null, 2),
                }],
                isError: true,
              };
            }
            break;

          case 'back':
            if (currentIndex > 0) {
              newSectionId = sections[currentIndex - 1].id;
            } else {
              return {
                content: [{
                  type: "text" as const,
                  text: JSON.stringify({
                    error: "Already at first section",
                    current_section: inspection.current_section,
                  }, null, 2),
                }],
                isError: true,
              };
            }
            break;

          case 'skip':
            if (currentIndex < totalSections - 1) {
              newSectionId = sections[currentIndex + 1].id;
            } else {
              return {
                content: [{
                  type: "text" as const,
                  text: JSON.stringify({
                    error: "Already at last section",
                    current_section: inspection.current_section,
                    suggestion: "Use 'inspection_complete' to finish the inspection",
                  }, null, 2),
                }],
                isError: true,
              };
            }
            break;

          default:
            // Treat action as section ID
            const targetSection = sections.find(s => s.id === actionLower);
            if (targetSection) {
              newSectionId = targetSection.id;
            } else {
              return {
                content: [{
                  type: "text" as const,
                  text: JSON.stringify({
                    error: "Invalid section ID",
                    provided: action,
                    available_sections: sections.map(s => s.id),
                  }, null, 2),
                }],
                isError: true,
              };
            }
        }

        if (!newSectionId) {
          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({
                error: "Navigation failed",
                action,
              }, null, 2),
            }],
            isError: true,
          };
        }

        // Update inspection's current section
        storage.updateInspection(inspection_id, {
          current_section: newSectionId,
        });

        // Get new section details
        const newSection = sections.find(s => s.id === newSectionId);

        // Calculate progress
        const findings = storage.getFindings(inspection_id);
        const completedSections = sections.filter(s => {
          const sectionFindings = findings.filter(f => f.section === s.id);
          return sectionFindings.length > 0;
        }).length;

        // Build response
        const response = {
          inspection_id,
          action,
          previous_section: {
            id: inspection.current_section,
          },
          current_section: newSection ? {
            id: newSectionId,
            name: newSection.name,
            prompt: newSection.prompt,
            items: newSection.items,
          } : null,
          progress: {
            completed: completedSections,
            total: totalSections,
            percentage: totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0,
          },
          message: newSection ? `Moved to ${newSection.name}. ${newSection.prompt}` : `Moved to ${newSectionId}`,
        };

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
              error: "Navigation failed",
              details: error instanceof Error ? error.message : String(error),
            }, null, 2),
          }],
          isError: true,
        };
      }
    }
  );
}
