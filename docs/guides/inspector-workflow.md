# Inspector Workflow Guide

> How to conduct building inspections via WhatsApp with the AI assistant.

**Status:** Current  
**Author:** Sage  
**Date:** 2026-02-23  
**Related:** #290, #396

---

## Overview

The AI Inspection assistant guides you through property inspections via WhatsApp. You send text and photos, and it captures everything organized by section, then generates a professional PDF report.

**What you need:**
- WhatsApp on your phone
- The inspector agent phone number (provided by your company)
- Camera for photos

---

## Inspection Modes

The system supports two inspection modes for different purposes:

### Simple Checklist (Council Format)

Use for standard council inspections:
- Pre-line (INS-05)
- Post-line (INS-06)
- Final inspections

**How it works:**
- Walk through predefined checklist items
- Mark each as Pass / Fail / N/A
- Add notes and photos for failed items
- LBP verification included

**To start:**
```
You: "Council inspection at 45 Oak Avenue, pre-line"
```

### Clause Review (COA/CCC Format)

Use for compliance reports:
- Certificate of Acceptance (COA)
- Code Compliance Certificate (CCC)
- CCC Gap Analysis

**How it works:**
- Review Building Code clauses one by one (B1, E2, E3, etc.)
- Record observations and evidence per clause
- Link photos to specific clauses
- Note required documentation (PS forms, warranties)

**To start:**
```
You: "COA inspection at 45 Oak Avenue, bathroom renovation"
```

### Which Mode to Use?

| Situation | Mode |
|-----------|------|
| Council progress inspection | Simple Checklist |
| Pre-line, post-line, final | Simple Checklist |
| Certificate of Acceptance | Clause Review |
| CCC application | Clause Review |
| Gap analysis for existing work | Clause Review |

---

## Quick Start

1. **Message the agent** with the property address
2. **Walk through sections** — send findings and photos as you go
3. **Say "done"** when finished to generate the report

That's it. The assistant handles organization, prompts, and report generation.

---

## Starting an Inspection

Message the assistant with the address:

```
You: "Starting inspection at 45 Oak Avenue"
```

Or just the address:

```
You: "123 Main Street"
```

The assistant confirms and guides you to the first section:

```
Assistant: Starting inspection at 45 Oak Avenue.
First up: Exterior. Check roof, gutters, cladding, external walls.
Send photos of any issues.
```

---

## Recording Findings

As you inspect, send text descriptions and photos of anything notable.

### Text Findings

```
You: "Gutters rusted on north side"
```

The assistant confirms:

```
Assistant: Noted — rusted gutters, north side (minor).
Anything else for Exterior?
```

### Photos

Send photos directly — the assistant asks for context:

```
You: [photo]
Assistant: Got the photo. What does it show?
You: "Cracked cladding near window"
Assistant: Captured — cracked cladding near window. Photo saved.
```

### Photos + Description

Best practice — send photo with description:

```
You: [photo] "Water damage on soffit"
Assistant: Noted — water damage on soffit (minor). Photo saved.
```

### Severity Levels

The assistant infers severity, but you can specify:

| Severity | When to use |
|----------|-------------|
| **Info** | Observations, no action needed |
| **Minor** | Small issues, low priority |
| **Major** | Significant issues, needs attention |
| **Critical** | Safety concerns, urgent |

```
You: "Major: cracked foundation visible"
Assistant: Noted — cracked foundation (major). Photo?
```

---

## Navigating Sections

### Section Order

The standard inspection follows this order:

1. **Exterior** — roof, gutters, cladding, walls, decks
2. **Subfloor** — moisture, ventilation, piles, insulation
3. **Interior** — walls, ceilings, floors, doors, windows
4. **Kitchen** — under sink, rangehood, cabinetry
5. **Bathroom** — shower, toilet, vanity, ventilation
6. **Electrical** — switchboard, outlets, wiring, alarms
7. **Plumbing** — hot water, pipes, pressure, drainage
8. **Roof Space** — framing, insulation, ventilation, leaks

### Moving Between Sections

| Say this | What happens |
|----------|--------------|
| "next" / "done with this" | Move to next section |
| "skip" | Skip current section |
| "back to exterior" | Return to a section |
| "status" / "where am I" | See progress summary |

```
You: "Next"
Assistant: Moving to Subfloor.
Check moisture, ventilation, piles, insulation.
```

### Checking Progress

```
You: "Status"
Assistant: 📋 Inspection Progress — 45 Oak Avenue
✅ Exterior: 2 findings, 3 photos
✅ Subfloor: No issues
🔄 Interior: In progress — 1 finding
⏳ Remaining: Kitchen, Bathroom, Electrical, Plumbing, Roof Space
```

---

## Completing the Inspection

When you've finished all sections:

```
You: "Done" or "Generate report"
```

The assistant summarizes and generates the PDF:

```
Assistant: Inspection complete!

Summary:
- Exterior: 2 issues, 3 photos
- Subfloor: No issues  
- Interior: 1 issue, 1 photo
- Kitchen: No issues
- Bathroom: 1 issue, 2 photos
- Electrical: No issues
- Plumbing: No issues
- Roof Space: 1 issue, 1 photo

Generating PDF report...
[PDF attached]
```

---

## Tips & Best Practices

### Be Concise
You're on-site — keep messages short. The assistant understands:
- "Rusted gutters north side" ✅
- "I noticed that the gutters on the north side appear to be rusted" ❌

### Photo Quality
- Get close enough to show the issue
- Include context (surrounding area)
- Good lighting helps

### One Finding Per Message
Easier to track:
- "Cracked tile in shower" ✅
- "Cracked tile, also grout failing, and fan not working" ❌ (split into 3)

### Corrections
Made a mistake? Just say so:
```
You: "Actually that was major not minor"
Assistant: Updated — severity changed to major.
```

---

## Resuming Interrupted Inspections

If you get disconnected or come back later:

```
You: "Hi"
Assistant: Welcome back! You have an active inspection at 45 Oak Avenue.
Last section: Interior (2 findings, 1 photo)
Ready to continue with Kitchen?
```

---

## Common Questions

### "What if I forget where I was?"

Say "status" to get a progress summary.

### "Can I go back to add something?"

Yes — say "back to [section]":
```
You: "Back to exterior"
Assistant: Returning to Exterior. What did you find?
```

### "What if I send the wrong photo?"

Just send the correct one and note the correction:
```
You: "Ignore that last photo, here's the right one" [photo]
```

### "What sections are there?"

Say "sections" or "help" to see the list.

### "Can I do multiple inspections?"

Finish the current inspection first, then start a new one.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Assistant not responding | Wait 30 seconds, try again. Check signal. |
| Photo won't send | Reduce photo size or try WiFi. |
| Wrong section | Say "back to [correct section]" |
| Need to cancel | Say "cancel inspection" (data is saved) |
| Report not generating | Say "generate report" again |

### Getting Help

If you're stuck:
- Say "help" to see available commands
- Contact your supervisor
- Check [Inspector Agent Ops](../ops/inspector-agent.md) for technical issues

---

---

## Clause Review Workflow (COA/CCC)

For compliance reports, the workflow differs from standard inspections:

### Starting a Clause Review

Specify the report type:
```
You: "Starting COA at 42 Smith Street, bathroom conversion"
```

The assistant confirms scope and starts with the first relevant clause:
```
Assistant: COA inspection started.
Property: 42 Smith Street
Scope: Bathroom conversion

Starting with B1 Structure. Check wall framing if visible.
Send photos + observations.
```

### Reviewing Clauses

For each Building Code clause:

1. **Observe and document**
   ```
   You: [photo] "Wall framing visible through access panel, looks compliant"
   ```

2. **Mark applicability**
   ```
   You: "B1 not applicable, no structural work done"
   Assistant: Noted — B1 marked N/A (no structural work).
   Moving to B2 Durability.
   ```

3. **Note required documents**
   ```
   You: "Need PS3 for this"
   Assistant: Noted — PS3 required for B2.
   ```

### Common Clauses for COA/CCC

| Clause | Title | Typical Scope |
|--------|-------|---------------|
| B1 | Structure | Framing, foundations |
| B2 | Durability | Timber treatment, materials |
| E2 | External Moisture | Cladding, flashings |
| E3 | Internal Moisture | Wet area tanking, ventilation |
| G1 | Personal Hygiene | Bathroom fixtures |
| G12 | Water Supply | Plumbing, hot water |
| G13 | Foul Water | Drainage |

### Completing a Clause Review

```
You: "That's all clauses, generate report"
```

The assistant creates a COA/CCC-format report with:
- Clause-by-clause compliance summary
- Photo appendix with references
- Required documentation checklist
- Remedial works (if any)

---

## See Also

- [Workflow Scenario](../workflow-scenario.md) — Complete COA example
- [Inspector Agent Ops](../ops/inspector-agent.md) — For administrators
- [WhatsApp Pairing](../runbooks/whatsapp-pairing.md) — Setup guide
