import Database from "better-sqlite3";
import { randomUUID } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Types
export interface Inspection {
  id: string;
  address: string;
  client_name: string | null;
  inspector_name: string | null;
  status: "in_progress" | "completed" | "cancelled";
  current_section: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Finding {
  id: string;
  inspection_id: string;
  section: string;
  description: string;
  severity: "info" | "minor" | "major" | "critical";
  matched_comment: string | null;
  created_at: string;
}

export interface Photo {
  id: string;
  inspection_id: string;
  finding_id: string | null;
  section: string;
  filename: string;
  filepath: string;
  mime_type: string;
  caption: string | null;
  created_at: string;
}

export interface CreateInspectionInput {
  address: string;
  client_name?: string;
  inspector_name?: string;
}

export interface UpdateInspectionInput {
  status?: "in_progress" | "completed" | "cancelled";
  current_section?: string | null;
  completed_at?: string;
}

export interface AddFindingInput {
  inspection_id: string;
  section: string;
  description: string;
  severity?: "info" | "minor" | "major" | "critical";
  matched_comment?: string;
}

export interface StorePhotoInput {
  inspection_id: string;
  finding_id?: string;
  section: string;
  filename: string;
  mime_type: string;
  caption?: string;
  data: Buffer;
}

/**
 * Storage service for inspections, findings, and photos.
 */
export class StorageService {
  private db: Database.Database;
  private dataDir: string;

  constructor(dbPath?: string, dataDir?: string) {
    // Default paths relative to project root
    const projectRoot = join(__dirname, "..", "..");
    this.dataDir = dataDir || join(projectRoot, "..", "data");
    const defaultDbPath = join(this.dataDir, "inspections.db");

    // Ensure data directory exists
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true });
    }

    // Initialize database
    this.db = new Database(dbPath || defaultDbPath);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");

    // Run migrations
    this.migrate();
  }

  /**
   * Initialize database schema.
   */
  private migrate(): void {
    const schemaPath = join(__dirname, "schema.sql");
    const schema = readFileSync(schemaPath, "utf-8");
    this.db.exec(schema);
  }

  /**
   * Create a new inspection.
   */
  createInspection(input: CreateInspectionInput): Inspection {
    const id = randomUUID();
    const stmt = this.db.prepare(`
      INSERT INTO inspections (id, address, client_name, inspector_name)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, input.address, input.client_name || null, input.inspector_name || null);
    return this.getInspection(id)!;
  }

  /**
   * Get an inspection by ID.
   */
  getInspection(id: string): Inspection | null {
    const stmt = this.db.prepare("SELECT * FROM inspections WHERE id = ?");
    return stmt.get(id) as Inspection | null;
  }

  /**
   * Get the most recent active inspection.
   */
  getActiveInspection(): Inspection | null {
    const stmt = this.db.prepare(`
      SELECT * FROM inspections 
      WHERE status = 'in_progress' 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    return stmt.get() as Inspection | null;
  }

  /**
   * List all inspections.
   */
  listInspections(limit = 50): Inspection[] {
    const stmt = this.db.prepare(`
      SELECT * FROM inspections 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    return stmt.all(limit) as Inspection[];
  }

  /**
   * Update an inspection.
   */
  updateInspection(id: string, input: UpdateInspectionInput): Inspection | null {
    const updates: string[] = ["updated_at = datetime('now')"];
    const values: (string | null)[] = [];

    if (input.status !== undefined) {
      updates.push("status = ?");
      values.push(input.status);
    }
    if (input.current_section !== undefined) {
      updates.push("current_section = ?");
      values.push(input.current_section);
    }
    if (input.completed_at !== undefined) {
      updates.push("completed_at = ?");
      values.push(input.completed_at);
    }

    values.push(id);
    const stmt = this.db.prepare(`
      UPDATE inspections SET ${updates.join(", ")} WHERE id = ?
    `);
    stmt.run(...values);
    return this.getInspection(id);
  }

  /**
   * Add a finding to an inspection.
   */
  addFinding(input: AddFindingInput): Finding {
    const id = randomUUID();
    const stmt = this.db.prepare(`
      INSERT INTO findings (id, inspection_id, section, description, severity, matched_comment)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      input.inspection_id,
      input.section,
      input.description,
      input.severity || "info",
      input.matched_comment || null
    );
    return this.getFinding(id)!;
  }

  /**
   * Get a finding by ID.
   */
  getFinding(id: string): Finding | null {
    const stmt = this.db.prepare("SELECT * FROM findings WHERE id = ?");
    return stmt.get(id) as Finding | null;
  }

  /**
   * Get all findings for an inspection.
   */
  getFindings(inspectionId: string, section?: string): Finding[] {
    if (section) {
      const stmt = this.db.prepare(`
        SELECT * FROM findings 
        WHERE inspection_id = ? AND section = ?
        ORDER BY created_at ASC
      `);
      return stmt.all(inspectionId, section) as Finding[];
    }
    const stmt = this.db.prepare(`
      SELECT * FROM findings 
      WHERE inspection_id = ?
      ORDER BY created_at ASC
    `);
    return stmt.all(inspectionId) as Finding[];
  }

  /**
   * Store a photo on disk and record metadata in DB.
   */
  storePhoto(input: StorePhotoInput): Photo {
    const id = randomUUID();

    // Create photo directory for this inspection
    const photoDir = join(this.dataDir, "photos", input.inspection_id);
    if (!existsSync(photoDir)) {
      mkdirSync(photoDir, { recursive: true });
    }

    // Save file
    const filepath = join(photoDir, `${id}_${input.filename}`);
    writeFileSync(filepath, input.data);

    // Record in database
    const stmt = this.db.prepare(`
      INSERT INTO photos (id, inspection_id, finding_id, section, filename, filepath, mime_type, caption)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      input.inspection_id,
      input.finding_id || null,
      input.section,
      input.filename,
      filepath,
      input.mime_type,
      input.caption || null
    );

    return this.getPhoto(id)!;
  }

  /**
   * Get a photo by ID.
   */
  getPhoto(id: string): Photo | null {
    const stmt = this.db.prepare("SELECT * FROM photos WHERE id = ?");
    return stmt.get(id) as Photo | null;
  }

  /**
   * Get all photos for an inspection.
   */
  getPhotos(inspectionId: string, section?: string): Photo[] {
    if (section) {
      const stmt = this.db.prepare(`
        SELECT * FROM photos 
        WHERE inspection_id = ? AND section = ?
        ORDER BY created_at ASC
      `);
      return stmt.all(inspectionId, section) as Photo[];
    }
    const stmt = this.db.prepare(`
      SELECT * FROM photos 
      WHERE inspection_id = ?
      ORDER BY created_at ASC
    `);
    return stmt.all(inspectionId) as Photo[];
  }

  /**
   * Get photos for a specific finding.
   */
  getPhotosForFinding(findingId: string): Photo[] {
    const stmt = this.db.prepare(`
      SELECT * FROM photos 
      WHERE finding_id = ?
      ORDER BY created_at ASC
    `);
    return stmt.all(findingId) as Photo[];
  }

  /**
   * Close the database connection.
   */
  close(): void {
    this.db.close();
  }
}

// Singleton instance
let storageInstance: StorageService | null = null;

export function getStorage(): StorageService {
  if (!storageInstance) {
    storageInstance = new StorageService();
  }
  return storageInstance;
}

export function resetStorage(): void {
  if (storageInstance) {
    storageInstance.close();
    storageInstance = null;
  }
}
