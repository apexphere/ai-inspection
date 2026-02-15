# Design: MVP Inspection Workflow

**Status:** Draft  
**Author:** Megan  
**Date:** 2026-02-16

## Problem

Building inspectors spend significant time writing reports after each inspection. They:
- Collect photos, notes, and measurements on-site
- Manually organize this information by section
- Write up findings into a templated report
- Embed photos into the final document

The report writing is tedious and time-consuming. A guided workflow during inspection could both organize data capture AND eliminate manual report assembly.

## Solution

A WhatsApp-based assistant that:
1. **Guides** the inspector through a checklist during the inspection
2. **Captures** photos, notes, and readings in a structured way
3. **Generates** a professional PDF report from the collected data

### Target Standard

NZS4306:2005 — Residential Property Inspection (New Zealand)

Report structure based on real inspection template from Eastern Building Surveyors.

---

## User Workflow

### Starting an Inspection

**Inspector:** "I'm at 123 Megan Street"

**Assistant:** "Got it, starting inspection at **123 Megan Street**. Let's begin with **Exterior**. Check the roof, gutters, cladding, and external walls. Send photos of any issues."

### During Inspection

**Inspector:** [sends photo] "Gutters rusted on north side"

**Assistant:** "Noted — rusted gutters, north side. Anything else for Exterior, or ready for **Subfloor**?"

**Inspector:** "Roof tiles cracked too" [sends photo]

**Assistant:** "Added — cracked roof tiles. Ready for next section?"

**Inspector:** "Yes"

**Assistant:** "Moving to **Subfloor**. Check for moisture, ventilation, and pile condition. What are you seeing?"

### Navigation Commands

- **"Next"** / **"Move on"** — proceed to next section
- **"Back to [section]"** — return to a previous section
- **"Skip"** — skip current section (mark as not inspected)
- **"Where am I"** — show current section and progress
- **"What's left"** — list remaining sections

### Completing an Inspection

**Inspector:** "Done" / "Finish inspection"

**Assistant:** "Inspection complete. I captured:
- Exterior: 2 issues, 2 photos
- Subfloor: 1 issue, 1 photo
- Interior: No issues
- ...

Generating your report now..."

[Sends PDF report]

---

## Checklist Structure

MVP uses a single default checklist. Configurable checklists come later.

### Default Residential Checklist

```yaml
sections:
  - id: exterior
    name: Exterior
    prompt: "Check the roof, gutters, cladding, and external walls."
    items:
      - Roof condition
      - Gutters and downpipes
      - Cladding/weatherboards
      - External joinery
      - Decks and balconies

  - id: subfloor
    name: Subfloor
    prompt: "Check for moisture, ventilation, and pile condition."
    items:
      - Access and clearance
      - Moisture levels
      - Ventilation
      - Piles and bearers
      - Insulation

  - id: interior
    name: Interior
    prompt: "Check walls, ceilings, floors, and doors."
    items:
      - Walls and ceilings
      - Floors
      - Doors and windows
      - Built-in fixtures

  - id: kitchen
    name: Kitchen
    prompt: "Check under the sink, rangehood, and cabinetry."
    items:
      - Sink and plumbing
      - Rangehood/ventilation
      - Cabinetry condition
      - Benchtops
      - Appliance spaces

  - id: bathroom
    name: Bathroom
    prompt: "Check for leaks, ventilation, and tile condition."
    items:
      - Shower/bath condition
      - Toilet
      - Vanity and plumbing
      - Ventilation
      - Tiles and waterproofing

  - id: electrical
    name: Electrical
    prompt: "Check switchboard, outlets, and visible wiring."
    items:
      - Switchboard
      - Power outlets
      - Light switches
      - Visible wiring
      - Smoke alarms

  - id: plumbing
    name: Plumbing
    prompt: "Check hot water, pipes, and drainage."
    items:
      - Hot water system
      - Visible pipework
      - Water pressure
      - Drainage

  - id: roof_space
    name: Roof Space
    prompt: "Check framing, insulation, and ventilation."
    items:
      - Roof framing
      - Insulation
      - Ventilation
      - Signs of leaks
```

---

## Data Model

### Inspection Session

```typescript
interface Inspection {
  id: string;
  address: string;
  startedAt: Date;
  completedAt?: Date;
  currentSection: string;
  sections: SectionData[];
}

interface SectionData {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  findings: Finding[];
}

interface Finding {
  text: string;
  photos: string[];  // file paths
  timestamp: Date;
  measurements?: Record<string, string>;  // e.g., { "humidity": "78%" }
}
```

### Storage

MVP: Single JSON file per inspection stored locally.

```
data/inspections/
  2026-02-16-123-megan-street.json
  2026-02-16-45-oak-avenue.json
```

---

## Report Generation

### MVP Approach

1. Collect all findings into structured data
2. Render to Markdown using a template
3. Convert Markdown + images to PDF

### Template Structure

```markdown
# Building Inspection Report

**Property:** {{ address }}
**Date:** {{ date }}
**Inspector:** {{ inspector_name }}

---

## Executive Summary

{{ summary }}

---

{% for section in sections %}
## {{ section.name }}

{% if section.findings %}
{% for finding in section.findings %}
- {{ finding.text }}
{% if finding.photos %}
{% for photo in finding.photos %}
![]({{ photo }})
{% endfor %}
{% endif %}
{% endfor %}
{% else %}
No issues identified.
{% endif %}

{% endfor %}

---

## Disclaimer

This report represents the condition of the property at the time of inspection...
```

### PDF Generation

Options (in order of preference for MVP):
1. **Pandoc** — Markdown to PDF, widely available
2. **WeasyPrint** — HTML/CSS to PDF, good for styling
3. **Puppeteer** — Render HTML, screenshot to PDF

MVP: Start with Pandoc. Upgrade if styling needs are more complex.

---

## Technical Architecture

### Overview

The system uses a **separate backend service** exposed via **MCP (Model Context Protocol)**. OpenClaw handles conversation and calls MCP tools. The backend handles data, state, and PDF generation.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────────┐
│    WhatsApp     │────▶│    OpenClaw     │────▶│   ai-inspection     │
│    (channel)    │     │    (agent)      │     │   (MCP server)      │
└─────────────────┘     └────────┬────────┘     └──────────┬──────────┘
                                 │                         │
                           uses skill               ┌──────┴──────┐
                           calls MCP tools          │             │
                                 │                  ▼             ▼
                        ┌────────┴────────┐   ┌─────────┐   ┌─────────┐
                        │    SKILL.md     │   │ Storage │   │   PDF   │
                        │    (prompts)    │   │  (data) │   │  Gen    │
                        └─────────────────┘   └─────────┘   └─────────┘
```

### Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| **WhatsApp** | Message transport only (text, photos in/out) |
| **OpenClaw Agent** | Conversation flow, interprets user intent, calls MCP tools |
| **Skill (SKILL.md)** | Tool descriptions, conversation guidance, checklist prompts |
| **MCP Server** | State management, photo storage, checklist logic, PDF generation |

### Why MCP?

- **Separation of concerns** — Conversation logic vs data/business logic
- **Reusable backend** — Could add web UI, mobile app, different channels later
- **Proper state management** — Database, not hacky JSON files
- **Scalable** — MCP server can run separately, be upgraded independently
- **Standard protocol** — MCP is well-defined, tooling available

---

## MCP Tool Definitions

### `inspection_start`

Creates a new inspection session.

**Parameters:**
```typescript
{
  address: string;           // Property address
  client_name: string;       // Client name
  inspector_name?: string;   // Inspector (optional, from config)
  checklist?: string;        // Checklist ID (default: "nz-ppi")
  metadata?: {
    property_type?: string;
    bedrooms?: number;
    bathrooms?: number;
    year_built?: number;
  }
}
```

**Returns:**
```typescript
{
  inspection_id: string;
  status: "started";
  first_section: {
    id: string;
    name: string;
    prompt: string;
    items: string[];
  };
  message: "Inspection started. Ready to begin with {section_name}.";
}
```

---

### `inspection_add_finding`

Records a finding (note + optional photos) for the current or specified section.

**Parameters:**
```typescript
{
  inspection_id: string;
  section?: string;          // Section ID (default: current section)
  text: string;              // Inspector's note
  photos?: string[];         // Photo URLs/paths
  severity?: "info" | "minor" | "major" | "urgent";
}
```

**Returns:**
```typescript
{
  finding_id: string;
  section: string;
  matched_comment?: string;  // Boilerplate text matched (if any)
  photos_stored: number;
  message: "Noted: {summary}. Anything else for {section}, or move on?";
}
```

---

### `inspection_suggest_next`

Returns guidance for what to do next based on current state.

**Parameters:**
```typescript
{
  inspection_id: string;
}
```

**Returns:**
```typescript
{
  current_section: {
    id: string;
    name: string;
    prompt: string;           // What to check
    items: string[];          // Checklist items
    findings_count: number;   // Findings recorded so far
  };
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
  suggestions: string[];      // e.g., ["Check under the sink", "Test rangehood"]
  can_complete: boolean;      // True if minimum sections done
}
```

---

### `inspection_navigate`

Move to a different section.

**Parameters:**
```typescript
{
  inspection_id: string;
  action: "next" | "back" | "skip" | string;  // "next", "back", "skip", or section ID
}
```

**Returns:**
```typescript
{
  previous_section: string;
  current_section: {
    id: string;
    name: string;
    prompt: string;
    items: string[];
  };
  progress: {
    completed: number;
    total: number;
  };
  message: "Moving to {section_name}. {prompt}";
}
```

---

### `inspection_status`

Get current inspection state and summary.

**Parameters:**
```typescript
{
  inspection_id: string;
}
```

**Returns:**
```typescript
{
  inspection_id: string;
  address: string;
  started_at: string;
  current_section: string;
  sections: Array<{
    id: string;
    name: string;
    status: "pending" | "in_progress" | "completed" | "skipped";
    findings_count: number;
  }>;
  total_findings: number;
  total_photos: number;
  can_complete: boolean;
}
```

---

### `inspection_complete`

Finalize inspection and generate PDF report.

**Parameters:**
```typescript
{
  inspection_id: string;
  summary_notes?: string;     // Optional overall notes
  weather?: string;           // Weather at time of inspection
}
```

**Returns:**
```typescript
{
  inspection_id: string;
  status: "completed";
  report_path: string;        // Path to generated PDF
  report_url?: string;        // URL if hosted
  summary: {
    sections_completed: number;
    total_findings: number;
    total_photos: number;
    major_issues: number;
  };
  message: "Inspection complete. Report generated with {n} findings across {m} sections.";
}
```

---

### `inspection_get_report`

Retrieve a generated report.

**Parameters:**
```typescript
{
  inspection_id: string;
  format?: "pdf" | "markdown";  // Default: pdf
}
```

**Returns:**
```typescript
{
  inspection_id: string;
  report_path: string;
  report_url?: string;
  file_size: number;
  generated_at: string;
}
```

---

## Tech Stack (MCP Server)

### Recommended

- **Runtime:** Node.js (TypeScript) or Python
- **Database:** SQLite (MVP) → PostgreSQL (scale)
- **Photo Storage:** Local filesystem (MVP) → S3/Cloud (scale)
- **PDF Generation:** Puppeteer (HTML → PDF) or WeasyPrint (Python)
- **MCP Framework:** `@modelcontextprotocol/sdk` (Node) or `mcp` (Python)

### Project Structure

```
ai-inspection/
├── server/                   # MCP server
│   ├── src/
│   │   ├── index.ts          # MCP server entry
│   │   ├── tools/            # Tool implementations
│   │   ├── services/         # Business logic
│   │   ├── storage/          # Database + file storage
│   │   └── pdf/              # Report generation
│   ├── package.json
│   └── tsconfig.json
├── skill/                    # OpenClaw skill
│   ├── SKILL.md
│   └── mcp.json              # MCP connection config
├── config/
│   ├── checklists/
│   └── comments/
├── templates/
│   └── report/               # PDF template (HTML/CSS)
└── docs/
```

---

## OpenClaw Skill Integration

### SKILL.md

The skill tells OpenClaw how to use the MCP tools:

```markdown
# Building Inspection Assistant

You are guiding a building inspector through a property inspection.

## Workflow

1. When inspector arrives, call `inspection_start` with address and client
2. Use `inspection_suggest_next` to get the current section prompt
3. Present the prompt and checklist items to the inspector
4. When they send findings (text/photos), call `inspection_add_finding`
5. Confirm what you captured, ask if there's more or ready to move on
6. Use `inspection_navigate` to move between sections
7. When complete, call `inspection_complete` to generate report
8. Send the PDF to the inspector

## Key Behaviors

- Always confirm findings before moving on
- If unclear what section a finding belongs to, ask
- Keep responses concise — inspector is on-site
- Photos should be stored with findings, not separately
```

### MCP Connection

```json
{
  "mcpServers": {
    "ai-inspection": {
      "command": "node",
      "args": ["server/dist/index.js"],
      "env": {
        "DATA_DIR": "./data",
        "PORT": "3100"
      }
    }
  }
}
```

---

## Comment Library

The system includes a boilerplate comment library for professional report text.

### How It Works

1. Inspector sends notes: *"rust on gutters north side"*
2. System matches keywords to comment library
3. Report uses professional boilerplate: *"Rust/corrosion observed in gutters. Monitor for leaks. Consider replacement when deterioration progresses."*
4. Inspector can override with custom text if needed

### Structure

```
config/comments/
├── defaults.yaml    # Built-in sensible defaults
└── custom.yaml      # Inspector's own boilerplate (added later)
```

### Match Priority

1. Custom comments (inspector's own library)
2. Default comments (sensible boilerplate)
3. AI-generated (from inspector's notes if no match)

Custom comments override defaults. This allows the inspector to feed in their preferred wording later without changing the system.

---

## MVP Scope

### In Scope (v0.1)

- [ ] Single default checklist (NZ PPI based on real template)
- [ ] Start/end inspection flow
- [ ] Section-by-section guidance
- [ ] Photo capture with section tagging
- [ ] Text notes with section tagging
- [ ] Basic navigation (next, back, skip)
- [ ] Progress tracking
- [ ] Comment library with defaults
- [ ] Markdown report generation
- [ ] PDF conversion (matching real template structure)

### Out of Scope (Future)

- Custom checklists per user
- Multiple checklist templates
- Measurements/readings with validation
- Voice message transcription
- Report customization/branding
- Multi-inspector support
- Cloud storage for reports
- Report history/search
- Integration with inspection software

---

## Open Questions

1. ~~**Photo handling**~~ ✅ — Photos passed to MCP server via `inspection_add_finding`, stored by backend.

2. **Session timeout** — What if inspector doesn't say "done"? Auto-complete after X hours? Or leave as draft?

3. **Multiple inspections** — If he starts a new inspection before finishing the current one, what happens? 
   - Option A: Save draft, switch to new
   - Option B: Force complete/cancel first
   - Option C: Allow multiple active (track by ID)

4. ~~**Report delivery**~~ ✅ — PDF returned via MCP tool, OpenClaw sends via WhatsApp.

5. **Inspector identity** — MVP assumes single user. Config for inspector name/credentials. Multi-inspector = future.

6. **Photo URLs** — How does OpenClaw pass photos to MCP? 
   - WhatsApp photos → OpenClaw receives as attachment → passes URL/path to MCP server
   - Need to verify OpenClaw's handling of inbound media

7. **MCP hosting** — Where does MCP server run?
   - Same machine as OpenClaw (localhost)
   - Separate server (needs network config)
   - MVP: localhost

---

## Next Steps

1. ✅ Review and approve design
2. **Set up MCP server project**
   - Initialize Node.js/TypeScript project
   - Set up MCP SDK
   - Define tool stubs
3. **Implement core tools**
   - `inspection_start` + `inspection_status`
   - `inspection_add_finding`
   - `inspection_suggest_next` + `inspection_navigate`
4. **Implement storage**
   - SQLite schema for inspections/findings
   - Photo file storage
5. **Implement PDF generation**
   - HTML template matching real report
   - Photo embedding
   - Puppeteer/WeasyPrint rendering
6. **Create OpenClaw skill**
   - SKILL.md with workflow guidance
   - MCP connection config
7. **End-to-end testing**
   - Test via WhatsApp
   - Refine prompts and flow
8. **Inspector feedback**
   - Real-world test with inspector
   - Iterate based on feedback

---

## Appendix: Example Interaction

See User Workflow section above for detailed interaction examples.