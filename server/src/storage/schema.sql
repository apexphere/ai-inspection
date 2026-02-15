-- AI Inspection SQLite Schema

CREATE TABLE IF NOT EXISTS inspections (
    id TEXT PRIMARY KEY,
    address TEXT NOT NULL,
    client_name TEXT,
    inspector_name TEXT,
    status TEXT NOT NULL DEFAULT 'in_progress',  -- in_progress, completed, cancelled
    current_section TEXT,
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS findings (
    id TEXT PRIMARY KEY,
    inspection_id TEXT NOT NULL,
    section TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'info',  -- info, minor, major, critical
    matched_comment TEXT,  -- AI-matched standard comment if any
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS photos (
    id TEXT PRIMARY KEY,
    inspection_id TEXT NOT NULL,
    finding_id TEXT,  -- NULL if photo is section-level, not finding-specific
    section TEXT NOT NULL,
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    caption TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE,
    FOREIGN KEY (finding_id) REFERENCES findings(id) ON DELETE SET NULL
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_findings_inspection ON findings(inspection_id);
CREATE INDEX IF NOT EXISTS idx_findings_section ON findings(inspection_id, section);
CREATE INDEX IF NOT EXISTS idx_photos_inspection ON photos(inspection_id);
CREATE INDEX IF NOT EXISTS idx_photos_finding ON photos(finding_id);
