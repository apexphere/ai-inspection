# Getting Started with AI Inspection

> Your AI-powered building inspection assistant.

**Status:** Current  
**Author:** Sage  
**Date:** 2026-02-23

---

## What is AI Inspection?

AI Inspection is an AI-powered assistant that helps building inspectors conduct thorough property assessments. It guides you through inspections via WhatsApp, captures findings and photos, and generates professional PDF reports.

**Key features:**
- 📱 **WhatsApp-based** — Work from your phone, no special app needed
- 🏠 **Guided workflow** — Step-by-step through each area of the property
- 📸 **Photo capture** — Attach photos to findings automatically
- 📄 **PDF reports** — Professional reports generated instantly
- 🧠 **Smart suggestions** — AI helps categorize and describe issues

---

## How It Works

The system works in two phases:

```
Phase 1: On-Site (WhatsApp)          Phase 2: Office (Web)
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   You       │   │   AI        │   │   Review &  │   │   Final     │
│   (Phone)   │──▶│   Agent     │──▶│   Edit      │──▶│   Report    │
│             │   │             │   │   (Web UI)  │   │   (PDF)     │
│ WhatsApp    │   │ Captures    │   │ Peer review │   │ Submit to   │
│ Text+Photos │   │ findings    │   │ Templates   │   │ council     │
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
```

**Phase 1 — On-site with WhatsApp:**
1. **Message the agent** with a property address
2. **Walk through the property** — the agent guides you section by section
3. **Send findings and photos** as you inspect

**Phase 2 — Back at the office with the web interface:**
4. **Review and edit** captured data on the web UI
5. **Submit for peer review** — reviewer approves or requests changes
6. **Generate PDF/DOCX** — professional report ready for council

---

## Quick Start

### Step 1: Get the WhatsApp Number

Your company administrator will provide the inspector agent's WhatsApp number. Save it to your contacts.

### Step 2: Start an Inspection

Message the agent with the property address:

```
You: "Starting inspection at 123 Main Street"
```

The agent responds:

```
Agent: Starting inspection at 123 Main Street.
First up: Exterior. Check roof, gutters, cladding, external walls.
Send photos of any issues.
```

### Step 3: Record Findings

As you inspect, send what you find:

```
You: "Rusted gutters on north side" [photo]

Agent: Noted — rusted gutters, north side (minor). Photo saved.
Anything else for Exterior?
```

### Step 4: Move Through Sections

When you're done with an area:

```
You: "Next"

Agent: Moving to Subfloor.
Check moisture, ventilation, piles, insulation.
```

### Step 5: Complete and Get Report

When finished:

```
You: "Done"

Agent: Inspection complete!
Summary:
- Exterior: 2 findings, 3 photos
- Subfloor: No issues
...
Generating PDF report...
[PDF attached]
```

---

## Inspection Sections

The agent guides you through these areas in order:

| Section | What to Check |
|---------|---------------|
| **Exterior** | Roof, gutters, cladding, walls, decks |
| **Subfloor** | Moisture, ventilation, piles, insulation |
| **Interior** | Walls, ceilings, floors, doors, windows |
| **Kitchen** | Under sink, rangehood, cabinetry |
| **Bathroom** | Shower, toilet, vanity, ventilation |
| **Electrical** | Switchboard, outlets, wiring, alarms |
| **Plumbing** | Hot water, pipes, pressure, drainage |
| **Roof Space** | Framing, insulation, ventilation, leaks |

You can skip sections that don't apply or go back to add findings.

---

## Useful Commands

| Say this | What happens |
|----------|--------------|
| "next" | Move to next section |
| "skip" | Skip current section |
| "back to exterior" | Return to a section |
| "status" | See progress summary |
| "done" | Complete and generate report |
| "help" | See available commands |

---

## Tips for Success

### 📸 Photos
- Get close enough to show the issue clearly
- Include surrounding context
- Good lighting helps

### 💬 Descriptions
- Be concise: "Cracked tile shower floor"
- Specify location: "north wall", "near window"
- Note severity if obvious: "Major: foundation crack"

### ⏱️ Timing
- The agent saves everything — no rush
- You can pause and resume later
- Long inspections work fine

---

## Next Steps

- **[Inspector Workflow Guide](inspector-workflow.md)** — Detailed WhatsApp usage guide
- **[Web UI Guide](web-ui.md)** — Review and edit on the web
- **[Report System Guide](reports.md)** — Report workflow, templates, and export

---

## Getting Help

### During Inspection
- Say "help" to the agent for available commands
- Say "status" to see where you are

### Technical Issues
- Contact your supervisor
- Check [Inspector Agent Ops](../ops/inspector-agent.md) for admin troubleshooting

---

## Frequently Asked Questions

### Can I use this on any phone?
Yes — any phone with WhatsApp.

### What if I lose connection?
The agent saves your progress. Just message again and it will resume where you left off.

### Can I do multiple inspections?
Complete one inspection before starting another.

### How long does report generation take?
Usually under a minute. The agent will send the PDF when ready.

### Can I edit the report after?
Yes — use the web interface to review and edit before finalizing.
