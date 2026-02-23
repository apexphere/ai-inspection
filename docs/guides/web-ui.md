# Web UI User Guide

> Review, edit, and finalize inspections from your browser.

**Status:** Current  
**Author:** Sage  
**Date:** 2026-02-23  
**Related:** #397

---

## Overview

The AI Inspection web interface is where you review and finalize inspection data captured via WhatsApp. Use it to:

- View all your projects and inspections
- Edit findings and observations
- Manage photos and documents
- Generate and download reports

**URL:** Provided by your administrator (e.g., `https://app.example.com`)

---

## Getting Started

### Logging In

1. Go to the web app URL
2. Enter your email and password
3. Click **Login**

First time? Click **Register** to create an account, or ask your administrator.

### Navigation

After logging in, you'll see the **Projects** list. From here:

```
Projects List → Project Page → Inspection Details
```

---

## Projects List

The main dashboard shows all your inspection projects.

### What You See

| Column | Description |
|--------|-------------|
| **Job #** | Unique project identifier |
| **Address** | Property address |
| **Client** | Client name |
| **Status** | Current status (Draft, In Progress, Completed) |
| **Updated** | Last modified time |

### Actions

- **Search** — Type in the search box to filter by address or client
- **Filter by Status** — Use the dropdown to show only certain statuses
- **New Project** — Click **+ New** to create a project manually
- **Open Project** — Click any row to view details

---

## Project Page

Click a project to see its full details.

### Sections

The project page is organized into expandable sections:

| Section | Contents |
|---------|----------|
| **Project Info** | Job number, dates, status, assigned personnel |
| **Property Details** | Address, property type, year built, etc. |
| **Client Info** | Client name, contact details |
| **Inspections** | List of inspections for this project |
| **Documents** | Uploaded files and attachments |
| **Photos** | All captured photos |

### Editing

Click any field to edit. Changes save automatically (you'll see "Saving..." then "Saved").

### Status

Change project status using the dropdown:
- **Draft** — Work in progress
- **In Progress** — Inspection underway
- **Review** — Ready for review
- **Completed** — Finalized

---

## Inspection Details

From the Project Page, click an inspection to view its details.

### Sections

Each inspection follows the standard inspection areas:

- Exterior
- Subfloor
- Interior
- Kitchen
- Bathroom
- Electrical
- Plumbing
- Roof Space

### Viewing Findings

Each section shows:
- **Findings** — Issues and observations recorded
- **Photos** — Images attached to this section
- **Notes** — Additional comments

### Editing Findings

1. Click a finding to expand it
2. Edit the description, severity, or notes
3. Changes save automatically

### Adding Findings

1. Navigate to the appropriate section
2. Click **+ Add Finding**
3. Enter description and severity
4. Optionally attach a photo

### Severity Levels

| Level | Color | Meaning |
|-------|-------|---------|
| **Info** | Gray | Observation, no action needed |
| **Minor** | Yellow | Low priority issue |
| **Major** | Orange | Significant issue |
| **Critical** | Red | Safety concern, urgent |

---

## Photos

### Viewing Photos

Photos are shown in the **Photos** section of each project and within each inspection section where they were captured.

### Photo Actions

- **View full size** — Click a photo to enlarge
- **Download** — Click the download icon
- **Edit caption** — Click the caption text to edit
- **Delete** — Click the trash icon (confirms before deleting)

### Uploading Photos

1. Go to the section where you want to add a photo
2. Click **Upload Photo** or drag and drop
3. Add a caption describing what it shows
4. The photo is linked to the current section

### Photo Source

Set who provided the photo:

| Source | Use for |
|--------|---------|
| **Site Inspection** | Photos you took on-site |
| **Owner Provided** | Photos from the client/homeowner |
| **Contractor Provided** | Photos from the builder/trades |

The source appears in reports: "(Photo provided by owner)"

### Linking to Clauses

For COA/CCC reports, link photos to Building Code clauses:

1. Open the photo details
2. Click **Link to Clause**
3. Select relevant clauses (B1, E2, E3, etc.)

Linked photos appear in the report appendix with clause references.

---

## Reports

### Generating a Report

1. Open the project
2. Ensure all sections are complete
3. Click **Generate Report**
4. Wait for processing (usually under a minute)
5. Download the PDF

### Report Contents

The generated PDF includes:
- Cover page with property and client info
- Section-by-section findings
- Embedded photos with captions
- Summary and recommendations
- Inspector signature block

### Re-generating

If you make edits after generating, click **Regenerate Report** to create an updated version.

---

## Tips

### Auto-Save
All changes save automatically. Look for:
- **Saving...** — Change being saved
- **Saved** — Change confirmed
- **Error** — Problem saving (try again)

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Esc` | Close modal/dialog |
| `Enter` | Submit form |
| `Tab` | Move between fields |

### Mobile
The web UI works on tablets and phones, but is optimized for desktop use. For field work, use the WhatsApp interface.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't log in | Check email/password, try "Forgot Password" |
| Changes not saving | Check internet connection, refresh page |
| Photos not loading | May be slow connection, wait or refresh |
| Report generation stuck | Wait 2 minutes, then try again |
| Page not loading | Clear browser cache, try different browser |

### Getting Help

Contact your administrator for:
- Account issues
- Permission problems
- Technical errors

---

## See Also

- [Getting Started](getting-started.md) — Overall introduction
- [Inspector Workflow](inspector-workflow.md) — WhatsApp field guide
