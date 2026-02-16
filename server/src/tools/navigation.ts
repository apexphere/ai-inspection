/**
 * Navigation Tools - Issue #5
 * 
 * MCP tools for navigating through inspection sections.
 * - inspection_suggest_next: Get guidance for current section
 * - inspection_navigate: Move between sections
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { mockStorage } from "../storage/mock-storage.js";
import { checklistService } from "../services/checklist.js";

// ============================================================================
// Tool Registration
// ============================================================================

export function registerNavigationTools(server: McpServer): void {
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

        // Get section statuses
        const sectionStatuses = await mockStorage.getSectionStatuses(inspection_id);
        
        // Calculate progress
        const completedSections = sectionStatuses.filter(s => 
          s.status === 'completed' || s.status === 'skipped'
        ).length;
        const totalSections = sectionStatuses.length;
        
        // Get current section details from checklist
        const currentSectionStatus = sectionStatuses.find(s => s.id === inspection.current_section);
        const checklistSection = checklistService.getSection(
          inspection.checklist_id, 
          inspection.current_section
        );

        // Generate suggestions based on checklist items
        const suggestions: string[] = [];
        if (checklistSection?.items) {
          // Suggest unchecked items (in real implementation, would track which are done)
          suggestions.push(...checklistSection.items.slice(0, 3).map(item => `Check: ${item}`));
        }

        // Add contextual suggestions
        if (currentSectionStatus?.findings_count === 0) {
          suggestions.push("Send a photo if you notice any issues");
        }

        // Determine if can complete (at least 50% of sections done)
        const canComplete = completedSections >= Math.ceil(totalSections * 0.5);

        // Build response
        const response = {
          inspection_id,
          current_section: {
            id: inspection.current_section,
            name: currentSectionStatus?.name || inspection.current_section,
            prompt: checklistSection?.prompt || `Check ${currentSectionStatus?.name || inspection.current_section}`,
            items: checklistSection?.items || [],
            findings_count: currentSectionStatus?.findings_count || 0,
          },
          progress: {
            completed: completedSections,
            total: totalSections,
            percentage: Math.round((completedSections / totalSections) * 100),
          },
          suggestions,
          can_complete: canComplete,
          next_section: await getNextSectionInfo(inspection_id, inspection.current_section, sectionStatuses),
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

        const sectionStatuses = await mockStorage.getSectionStatuses(inspection_id);
        const currentIndex = await mockStorage.getSectionIndex(inspection_id, inspection.current_section);
        const totalSections = sectionStatuses.length;
        
        let newSectionId: string | null = null;
        let newStatus: 'in_progress' | 'completed' | 'skipped' = 'in_progress';
        let previousStatus: 'completed' | 'skipped' = 'completed';

        const actionLower = action.toLowerCase();

        switch (actionLower) {
          case 'next':
            // Mark current as completed, move to next
            if (currentIndex < totalSections - 1) {
              newSectionId = sectionStatuses[currentIndex + 1].id;
              previousStatus = 'completed';
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
            // Move to previous section (don't change current section status)
            if (currentIndex > 0) {
              newSectionId = sectionStatuses[currentIndex - 1].id;
              // Don't mark current as completed when going back
              previousStatus = 'completed'; // Keep current status
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
            // Mark current as skipped, move to next
            if (currentIndex < totalSections - 1) {
              newSectionId = sectionStatuses[currentIndex + 1].id;
              previousStatus = 'skipped';
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
            const targetSection = sectionStatuses.find(s => s.id === actionLower);
            if (targetSection) {
              newSectionId = targetSection.id;
              previousStatus = 'completed';
            } else {
              return {
                content: [{
                  type: "text" as const,
                  text: JSON.stringify({
                    error: "Invalid section ID",
                    provided: action,
                    available_sections: sectionStatuses.map(s => s.id),
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

        // Update statuses
        if (actionLower !== 'back') {
          await mockStorage.updateSectionStatus(inspection_id, inspection.current_section, previousStatus);
        }
        await mockStorage.updateSectionStatus(inspection_id, newSectionId, 'in_progress');

        // Update inspection's current section
        await mockStorage.updateInspection(inspection_id, {
          current_section: newSectionId,
          status: 'in_progress',
        });

        // Get new section details
        const newSectionStatus = sectionStatuses.find(s => s.id === newSectionId);
        const checklistSection = checklistService.getSection(inspection.checklist_id, newSectionId);

        // Calculate updated progress
        const updatedStatuses = await mockStorage.getSectionStatuses(inspection_id);
        const completedSections = updatedStatuses.filter(s => 
          s.status === 'completed' || s.status === 'skipped'
        ).length;

        // Build response
        const response = {
          inspection_id,
          action,
          previous_section: {
            id: inspection.current_section,
            status: previousStatus,
          },
          current_section: {
            id: newSectionId,
            name: newSectionStatus?.name || newSectionId,
            prompt: checklistSection?.prompt || `Check ${newSectionStatus?.name || newSectionId}`,
            items: checklistSection?.items || [],
          },
          progress: {
            completed: completedSections,
            total: totalSections,
            percentage: Math.round((completedSections / totalSections) * 100),
          },
          message: `Moved to ${newSectionStatus?.name || newSectionId}. ${checklistSection?.prompt || ''}`,
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

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get info about the next section (for suggestions)
 */
async function getNextSectionInfo(
  inspection_id: string,
  current_section: string,
  sectionStatuses: Array<{ id: string; name: string; status: string }>
): Promise<{ id: string; name: string } | null> {
  const currentIndex = sectionStatuses.findIndex(s => s.id === current_section);
  if (currentIndex < 0 || currentIndex >= sectionStatuses.length - 1) {
    return null;
  }
  const next = sectionStatuses[currentIndex + 1];
  return { id: next.id, name: next.name };
}
