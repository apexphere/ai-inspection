# AI Inspection

AI-powered building inspection assistant that guides inspectors through checklists and auto-generates PDF reports.

## Status

**MVP in design phase**

## Overview

Building inspectors spend significant time writing reports after inspections. This tool:
- Guides the inspector through a structured checklist via WhatsApp
- Captures photos, notes, and measurements organized by section
- Automatically generates a PDF report from the collected data

## Documentation

- [MVP Design](docs/design/001-mvp-inspection-workflow.md)

## Project Structure

```
ai-inspection/
├── docs/
│   └── design/           # Design documents
├── src/
│   └── skill/            # OpenClaw skill implementation
├── config/
│   └── checklists/       # Checklist templates (YAML)
├── templates/
│   └── reports/          # Report templates
└── data/
    └── inspections/      # Inspection data (gitignored)
```

## Getting Started

Coming soon — currently in design phase.
