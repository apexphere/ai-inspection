/**
 * Comment Library Service - Issue #4
 * 
 * Loads and matches boilerplate comments from YAML config.
 * - Loads defaults.yaml
 * - Loads custom.yaml if exists (overrides defaults)
 * - Matches keywords in finding text to boilerplate
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse as parseYaml } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================================================
// Types
// ============================================================================

interface CommentEntry {
  match?: string[];
  text: string;
}

interface CommentSection {
  [key: string]: CommentEntry | CommentSection;
}

interface CommentLibrary {
  version?: string;
  conclusions?: Record<string, CommentEntry>;
  [section: string]: unknown;
}

export interface MatchResult {
  matched: boolean;
  comment?: string;
  section?: string;
  key?: string;
  confidence: 'exact' | 'partial' | 'none';
}

// ============================================================================
// Comment Library Service
// ============================================================================

class CommentLibraryService {
  private library: CommentLibrary = {};
  private configDir: string;
  private loaded = false;

  constructor(configDir?: string) {
    // Default to project's config/comments directory
    const projectRoot = join(__dirname, '..', '..', '..');
    this.configDir = configDir || join(projectRoot, 'config', 'comments');
  }

  /**
   * Load comment library from YAML files.
   * Loads defaults.yaml first, then merges custom.yaml if exists.
   */
  load(): void {
    if (this.loaded) return;

    const defaultsPath = join(this.configDir, 'defaults.yaml');
    const customPath = join(this.configDir, 'custom.yaml');

    // Load defaults
    if (existsSync(defaultsPath)) {
      try {
        const content = readFileSync(defaultsPath, 'utf-8');
        this.library = parseYaml(content) || {};
      } catch (error) {
        console.error('Failed to load defaults.yaml:', error);
        this.library = {};
      }
    }

    // Load and merge custom (overrides defaults)
    if (existsSync(customPath)) {
      try {
        const content = readFileSync(customPath, 'utf-8');
        const custom = parseYaml(content) || {};
        this.library = this.deepMerge(this.library, custom);
      } catch (error) {
        console.error('Failed to load custom.yaml:', error);
      }
    }

    this.loaded = true;
  }

  /**
   * Deep merge two objects, with source overriding target.
   */
  private deepMerge(target: CommentLibrary, source: CommentLibrary): CommentLibrary {
    const result = { ...target };
    
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
          result[key] = this.deepMerge(
            target[key] as CommentLibrary,
            source[key] as CommentLibrary
          );
        } else {
          result[key] = source[key];
        }
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * Match finding text against comment library.
   * Returns the best matching boilerplate comment.
   * 
   * @param text - The finding text to match
   * @param section - Optional section context to narrow matching
   */
  match(text: string, section?: string): MatchResult {
    this.load();
    
    const textLower = text.toLowerCase();
    let bestMatch: MatchResult = { matched: false, confidence: 'none' };
    let bestScore = 0;

    // If section provided, search that section first
    if (section) {
      const sectionKey = this.normalizeSectionKey(section);
      const sectionData = this.library[sectionKey];
      
      if (sectionData && typeof sectionData === 'object') {
        const result = this.searchSection(textLower, sectionData as CommentSection, sectionKey);
        if (result.matched && this.getMatchScore(result) > bestScore) {
          bestMatch = result;
          bestScore = this.getMatchScore(result);
        }
      }
    }

    // Search all sections if no match or searching globally
    if (!bestMatch.matched || bestScore < 3) {
      for (const [sectionKey, sectionData] of Object.entries(this.library)) {
        // Skip metadata fields
        if (sectionKey === 'version') continue;
        
        if (sectionData && typeof sectionData === 'object') {
          const result = this.searchSection(textLower, sectionData as CommentSection, sectionKey);
          if (result.matched && this.getMatchScore(result) > bestScore) {
            bestMatch = result;
            bestScore = this.getMatchScore(result);
          }
        }
      }
    }

    return bestMatch;
  }

  /**
   * Search a section for matching comments.
   */
  private searchSection(textLower: string, section: CommentSection, sectionKey: string): MatchResult {
    let bestMatch: MatchResult = { matched: false, confidence: 'none' };
    let bestScore = 0;

    for (const [key, value] of Object.entries(section)) {
      if (!value || typeof value !== 'object') continue;

      // Check if this is a comment entry (has 'text' property)
      if ('text' in value && typeof value.text === 'string') {
        const entry = value as CommentEntry;
        const matchScore = this.scoreMatch(textLower, entry.match || []);
        
        if (matchScore > bestScore) {
          bestScore = matchScore;
          bestMatch = {
            matched: true,
            comment: entry.text,
            section: sectionKey,
            key,
            confidence: matchScore >= 3 ? 'exact' : 'partial',
          };
        }
      } else {
        // Nested section - recurse
        const nestedResult = this.searchSection(textLower, value as CommentSection, sectionKey);
        if (nestedResult.matched && this.getMatchScore(nestedResult) > bestScore) {
          bestMatch = nestedResult;
          bestScore = this.getMatchScore(nestedResult);
        }
      }
    }

    return bestMatch;
  }

  /**
   * Score how well text matches the keywords.
   */
  private scoreMatch(textLower: string, keywords: string[]): number {
    if (!keywords || keywords.length === 0) return 0;
    
    let score = 0;
    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase();
      if (textLower.includes(keywordLower)) {
        // Longer keywords = higher score
        score += Math.min(keywordLower.length / 3, 3);
      }
    }
    
    return score;
  }

  /**
   * Get numeric score for a match result.
   */
  private getMatchScore(result: MatchResult): number {
    if (!result.matched) return 0;
    return result.confidence === 'exact' ? 10 : 5;
  }

  /**
   * Normalize section name to match YAML keys.
   * e.g., "Site & Ground" -> "site_ground"
   */
  private normalizeSectionKey(section: string): string {
    return section
      .toLowerCase()
      .replace(/[&]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Get a conclusion comment by severity.
   */
  getConclusion(severity: 'good' | 'minor' | 'attention' | 'urgent'): string | null {
    this.load();
    const conclusions = this.library.conclusions as Record<string, CommentEntry> | undefined;
    return conclusions?.[severity]?.text || null;
  }

  /**
   * Reload the library (for testing or config changes).
   */
  reload(): void {
    this.loaded = false;
    this.library = {};
    this.load();
  }
}

// ============================================================================
// Exports
// ============================================================================

// Singleton instance
export const commentLibrary = new CommentLibraryService();

// Export class for testing
export { CommentLibraryService };
