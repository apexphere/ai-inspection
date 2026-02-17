/**
 * Checklist Service
 * 
 * Loads and manages inspection checklists from config files.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename, resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';

// ============================================================================
// Types
// ============================================================================

export interface ChecklistItem {
  id: string;
  name: string;
  prompt: string;
  items: string[];
  subareas?: ChecklistSubarea[];
  report_section?: number;
}

export interface ChecklistSubarea {
  id: string;
  name: string;
  prompt: string;
  items: string[];
}

export interface ChecklistMetadata {
  required: string[];
  optional: string[];
}

export interface Checklist {
  id: string;
  name: string;
  version: string;
  standard?: string;
  metadata?: ChecklistMetadata;
  sections: ChecklistItem[];
  conclusions?: Record<string, string>;
}

// ============================================================================
// Checklist Service
// ============================================================================

class ChecklistService {
  private checklists: Map<string, Checklist> = new Map();
  private configPath: string;
  private loaded: boolean = false;

  constructor(configPath?: string) {
    // Default to config/checklists relative to monorepo root
    const projectRoot = resolve(process.cwd(), '..');
    this.configPath = configPath || join(projectRoot, 'config', 'checklists');
  }

  /**
   * Load all checklists from config directory
   */
  loadChecklists(): void {
    if (this.loaded) return;

    if (!existsSync(this.configPath)) {
      console.warn(`Checklist config path not found: ${this.configPath}`);
      return;
    }

    const files = readdirSync(this.configPath).filter(
      f => f.endsWith('.yaml') || f.endsWith('.yml')
    );

    for (const file of files) {
      try {
        const filePath = join(this.configPath, file);
        const content = readFileSync(filePath, 'utf-8');
        const data = parseYaml(content);
        
        // Generate ID from filename (e.g., nz-ppi.yaml -> nz-ppi)
        const id = basename(file, '.yaml').replace('.yml', '');
        
        const checklist: Checklist = {
          id,
          name: data.name || id,
          version: data.version || '1.0',
          standard: data.standard,
          metadata: data.metadata,
          sections: this.normalizeSections(data.sections || []),
          conclusions: data.conclusions,
        };

        this.checklists.set(id, checklist);
        console.error(`Loaded checklist: ${id} (${checklist.sections.length} sections)`);
      } catch (error) {
        console.error(`Failed to load checklist ${file}:`, error);
      }
    }

    this.loaded = true;
  }

  /**
   * Normalize sections to ensure consistent structure
   */
  private normalizeSections(sections: any[]): ChecklistItem[] {
    return sections.map(section => ({
      id: section.id,
      name: section.name,
      prompt: section.prompt || `Check ${section.name.toLowerCase()}.`,
      items: section.items || [],
      subareas: section.subareas?.map((sub: any) => ({
        id: sub.id,
        name: sub.name,
        prompt: sub.prompt || `Check ${sub.name.toLowerCase()}.`,
        items: sub.items || [],
      })),
      report_section: section.report_section,
    }));
  }

  /**
   * Get a checklist by ID
   */
  getChecklist(id: string): Checklist | null {
    this.loadChecklists();
    return this.checklists.get(id) || null;
  }

  /**
   * Get the default checklist (first one loaded, or 'nz-ppi' if available)
   */
  getDefaultChecklist(): Checklist | null {
    this.loadChecklists();
    
    // Prefer nz-ppi as default
    if (this.checklists.has('nz-ppi')) {
      return this.checklists.get('nz-ppi')!;
    }
    
    // Otherwise return first available
    const first = this.checklists.values().next();
    return first.value || null;
  }

  /**
   * Get all available checklist IDs
   */
  getAvailableChecklists(): string[] {
    this.loadChecklists();
    return Array.from(this.checklists.keys());
  }

  /**
   * Get the first section of a checklist
   */
  getFirstSection(checklistId: string): ChecklistItem | null {
    const checklist = this.getChecklist(checklistId);
    if (!checklist || checklist.sections.length === 0) return null;
    return checklist.sections[0];
  }

  /**
   * Get a specific section by ID
   */
  getSection(checklistId: string, sectionId: string): ChecklistItem | null {
    const checklist = this.getChecklist(checklistId);
    if (!checklist) return null;
    return checklist.sections.find(s => s.id === sectionId) || null;
  }

  /**
   * Get all sections for a checklist (flattened, including subareas)
   */
  getAllSections(checklistId: string): Array<{ id: string; name: string }> {
    const checklist = this.getChecklist(checklistId);
    if (!checklist) return [];

    const sections: Array<{ id: string; name: string }> = [];
    
    for (const section of checklist.sections) {
      sections.push({ id: section.id, name: section.name });
      
      // Add subareas if present
      if (section.subareas) {
        for (const subarea of section.subareas) {
          sections.push({ 
            id: `${section.id}.${subarea.id}`, 
            name: `${section.name} - ${subarea.name}` 
          });
        }
      }
    }

    return sections;
  }
}

// Export singleton instance
export const checklistService = new ChecklistService();

// Export class for testing with custom paths
export { ChecklistService };
