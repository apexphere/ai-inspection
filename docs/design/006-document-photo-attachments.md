# 006 — Document & Photo Attachments

**Status:** Draft  
**Requirement:** #152  
**Author:** Archer  
**Created:** 2026-02-19

---

## 1. Context

Inspectors collect evidence (photos and documents) during inspections. This system manages:
- Photo capture and organization
- Document uploads and classification
- Cross-referencing in reports
- Appendix generation

---

## 2. Decision

Create separate `Photo` and `Document` entities with:
- Sequential numbering within reports
- Clause linking for evidence tracking
- Source tracking (site/owner/contractor)
- Auto-detection of document types

---

## 3. Data Model

### Photo

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| projectId | UUID | Yes | Parent project |
| inspectionId | UUID | No | Which inspection captured it |
| reportNumber | Integer | Auto | Sequential (1, 2, 3...) |
| filePath | String | Yes | Storage path |
| thumbnailPath | String | Auto | Compressed preview |
| caption | String | Yes | Description |
| source | Enum | Yes | SITE / OWNER / CONTRACTOR |
| takenAt | DateTime | No | When photo was taken |
| location | JSON | No | GPS coordinates |
| linkedClauses | String[] | No | Building Code clauses |
| sortOrder | Integer | Yes | Display order |
| createdAt | DateTime | Auto | Upload timestamp |

### Document

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| projectId | UUID | Yes | Parent project |
| appendixLetter | String | Auto | A, B, C, D... |
| filePath | String | Yes | Storage path |
| filename | String | Yes | Original filename |
| documentType | Enum | Yes | PS3, COC, WARRANTY, etc. |
| description | String | Yes | What document covers |
| issuer | String | No | Who issued it |
| issuedAt | Date | No | Document date |
| referenceNumber | String | No | License/cert number |
| status | Enum | Yes | REQUIRED / RECEIVED / OUTSTANDING / NA |
| verified | Boolean | No | Content verified |
| linkedClauses | String[] | No | Building Code clauses |
| sortOrder | Integer | Yes | Display order |
| createdAt | DateTime | Auto | Upload timestamp |

### Enums

```typescript
enum PhotoSource {
  SITE = 'SITE',           // Taken during inspection
  OWNER = 'OWNER',         // Client provided
  CONTRACTOR = 'CONTRACTOR' // Builder/trade provided
}

enum DocumentType {
  PS1 = 'PS1',   // Producer Statement Design
  PS2 = 'PS2',   // Producer Statement Design Review
  PS3 = 'PS3',   // Producer Statement Construction
  PS4 = 'PS4',   // Producer Statement Construction Review
  COC = 'COC',   // Electrical Certificate of Compliance
  ESC = 'ESC',   // Electrical Safety Certificate
  WARRANTY = 'WARRANTY',
  INVOICE = 'INVOICE',
  DRAWING = 'DRAWING',
  REPORT = 'REPORT',
  FLOOD_TEST = 'FLOOD_TEST',
  PROPERTY_FILE = 'PROPERTY_FILE',
  OTHER = 'OTHER',
}

enum DocumentStatus {
  REQUIRED = 'REQUIRED',
  RECEIVED = 'RECEIVED',
  OUTSTANDING = 'OUTSTANDING',
  NA = 'NA',
}
```

---

## 4. API Endpoints

### Photos

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/projects/:id/photos | Upload photo |
| GET | /api/projects/:id/photos | List photos |
| GET | /api/photos/:id | Get photo |
| GET | /api/photos/:id/file | Download file |
| PUT | /api/photos/:id | Update metadata |
| DELETE | /api/photos/:id | Delete photo |
| PUT | /api/projects/:id/photos/reorder | Reorder photos |

### Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/projects/:id/documents | Upload document |
| GET | /api/projects/:id/documents | List documents |
| GET | /api/documents/:id | Get document |
| GET | /api/documents/:id/file | Download file |
| PUT | /api/documents/:id | Update metadata |
| DELETE | /api/documents/:id | Delete document |

---

## 5. Storage Architecture

### File Storage

```
storage/
├── photos/
│   └── {project_id}/
│       ├── {uuid}.jpg          # Original
│       └── {uuid}_thumb.jpg    # Thumbnail
└── documents/
    └── {project_id}/
        └── {uuid}.pdf
```

### Cloud Storage (Production)

- S3-compatible storage (AWS S3, DigitalOcean Spaces, etc.)
- Pre-signed URLs for secure access
- Automatic thumbnail generation via Lambda/worker

### Local Storage (Development)

- Local filesystem in `data/` directory
- Sharp library for thumbnail generation

---

## 6. Photo Workflow

### Phase 1: WhatsApp Capture

```
Inspector sends photo + text
    → OpenClaw receives
    → Calls MCP inspection_add_finding
    → MCP creates Photo record
    → Auto-links to current clause
    → Caption from message text
    → Source = SITE (default)
```

### Phase 2: Web Management

```
View all photos
    → Reorder via drag & drop
    → Edit captions
    → Change clause links
    → Move between clauses
    → Numbers update automatically
```

### Auto-Numbering

Photos numbered sequentially within project:
- Photo 1, Photo 2, Photo 3...
- Renumber on delete/reorder
- Report references use these numbers

---

## 7. Document Workflow

### Upload Flow

```
User uploads file
    → AI detects document type (optional)
    → Auto-suggests type + clauses
    → User confirms or corrects
    → Appendix letter assigned
    → Status set (Received)
```

### Auto-Detection

Use AI (Claude) to detect document type from content:

| Signal | Detection |
|--------|-----------|
| "PRODUCER STATEMENT PS3" | PS3 |
| "Certificate of Compliance" | COC |
| "WARRANTY" in header | WARRANTY |
| Electrician letterhead | COC/ESC |

### Auto-Linking

| Document Type | Auto-Link Clauses |
|---------------|-------------------|
| PS3 Plumbing | G12, G13 |
| PS3 Waterproofing | E3 |
| PS3 Structural | B1 |
| COC/ESC | G9 |
| WARRANTY | B2 |

### Appendix Assignment

Standard order for appendix letters:

| Letter | Content |
|--------|---------|
| A | Inspection Photographs |
| B | Drawings |
| C | Construction Reports |
| D | Electrical Certificates |
| E | PS3 Documents |
| F | Warranties |

---

## 8. Report Integration

### Appendix A: Photos

```
APPENDIX A: INSPECTION PHOTOGRAPHS

Photograph 1: View of bathroom from doorway
Photograph 2: Shower installation showing tanking
Photograph 3: Moisture reading at shower base (Photo provided by owner)
...
```

### Other Appendices

Group documents by type:
- Appendix B: COA Drawings
- Appendix C: Construction Reports
- etc.

### Cross-References

In clause observations:
- "See Photograph 7" → links to Appendix A
- "Refer to Appendix E" → links to PS3 docs

### Validation

Before report generation:
- Warn if referenced photo/doc missing
- Block if REQUIRED documents not received
- Allow override with reason

---

## 9. Acceptance Criteria

### Photos
- [ ] Upload photos (camera + file)
- [ ] Generate thumbnails automatically
- [ ] Auto-number within project
- [ ] Add/edit captions
- [ ] Mark source (site/owner/contractor)
- [ ] Link to Building Code clauses
- [ ] Reorder via drag & drop
- [ ] Renumber after changes

### Documents
- [ ] Upload documents (PDF, images)
- [ ] Select document type
- [ ] Auto-detect type (AI)
- [ ] Auto-assign appendix letter
- [ ] Link to Building Code clauses
- [ ] Track status (required/received)
- [ ] Block finalization if required docs missing

### WhatsApp Capture
- [ ] Receive photos via WhatsApp
- [ ] Auto-link to current clause
- [ ] Use message text as caption
- [ ] Confirm capture in chat

### Report Export
- [ ] Generate Appendix A (photos)
- [ ] Generate other appendices (documents)
- [ ] Validate cross-references

---

## 10. User Stories (after approval)

1. **Photo entity and API** — CRUD, storage, thumbnails
2. **Document entity and API** — CRUD, storage, types
3. **Photo upload via WhatsApp** — MCP integration
4. **Document auto-detection** — AI classification
5. **Photo management UI** — reorder, edit, link
6. **Document management UI** — upload, status tracking
7. **Appendix generation** — export for reports

---

## 11. Dependencies

- Storage provider configuration (S3 or local)
- #150 Inspection entity (for linking)
- #151 Building Code data (for clause references)

---

## References

- Requirement: #152
- Related: #149, #150, #158
- Domain research: `docs/research/template-analysis.md`
