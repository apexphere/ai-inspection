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

### Components

```
┌─────────────────────────────────────┐
│           WhatsApp Channel          │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│         OpenClaw Gateway            │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│      Inspection Agent/Skill         │
│  ┌─────────────────────────────┐    │
│  │  State Manager              │    │
│  │  - Current inspection       │    │
│  │  - Section progress         │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │  Checklist Engine           │    │
│  │  - Load checklist config    │    │
│  │  - Navigate sections        │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │  Report Generator           │    │
│  │  - Compile findings         │    │
│  │  - Render PDF               │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

### Implementation Options

**Option A: Custom Agent**
- Dedicated OpenClaw agent for inspections
- Full control over workflow
- Separate WhatsApp number/channel
- More setup, more isolation

**Option B: Skill on Existing Agent**
- Add inspection skill to existing agent
- Shares channel with other uses
- Simpler setup
- May have context conflicts

**MVP Recommendation:** Start with **Option B** (Skill). Migrate to dedicated agent if needed.

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

1. **Photo handling** — Where do WhatsApp photos get stored? Need to ensure they persist for report generation.

2. **Session timeout** — What if inspector doesn't say "done"? Auto-complete after X hours?

3. **Multiple inspections** — If he starts a new inspection before finishing the current one, what happens? Save draft and switch?

4. **Report delivery** — Send PDF via WhatsApp? Email? Both?

5. **Inspector identity** — MVP assumes single user. How to handle multiple inspectors later?

---

## Next Steps

1. Review and approve design
2. Set up project structure
3. Implement state management
4. Implement checklist navigation
5. Implement report generation
6. Test end-to-end flow
7. Refine based on feedback

---

## Appendix: Example Interaction

See User Workflow section above for detailed interaction examples.