# Design: Report Templates & Boilerplate

**Status:** Draft  
**Sprint:** 4c  
**Author:** Archer  
**Requirement:** #156  
**Date:** 2026-02-19

## Context

Reports contain significant boilerplate text that should be templated for consistency and efficiency. Introduction, methodology, limitations, and N/A reasons are mostly standard text with variable substitution.

## Decision

Create a template management system with:
- Categorized templates (Section, Clause, N/A Reason)
- Variable substitution using `[Variable Name]` syntax
- Version control for template changes
- Rich text support for formatting

## Architecture

### Template Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Template      │────▶│   Variable      │────▶│   Rendered      │
│   Content       │     │   Resolver      │     │   Output        │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │ Project  │ │ Company  │ │ Person-  │
              │ Data     │ │ Settings │ │ nel      │
              └──────────┘ └──────────┘ └──────────┘
```

## Data Model

### Prisma Schema

```prisma
model Template {
  id            String            @id @default(uuid())
  name          String            // "Introduction - COA"
  category      TemplateCategory
  reportType    ReportType?       // null = all types
  
  content       String            // Rich text with [variables]
  variables     String[]          @default([])  // ["Company Name", "Address"]
  
  active        Boolean           @default(true)
  locked        Boolean           @default(false)  // Admin-locked
  
  // Versioning
  version       Int               @default(1)
  parentId      String?           // Previous version
  parent        Template?         @relation("versions", fields: [parentId], references: [id])
  versions      Template[]        @relation("versions")
  
  createdById   String?
  createdBy     Personnel?        @relation(fields: [createdById], references: [id])
  changeNotes   String?
  
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt
  
  @@index([category, reportType])
  @@index([active])
}

enum TemplateCategory {
  SECTION       // Full section templates (Introduction, Methodology)
  CLAUSE        // Building Code clause templates
  NA_REASON     // N/A explanation templates
  BLOCK         // Reusable blocks (signature, document control)
}

// ReportType already defined in #149
```

## API Endpoints

### Templates CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/templates` | Create template |
| GET | `/api/templates` | List templates (filter by category, reportType) |
| GET | `/api/templates/:id` | Get template |
| PUT | `/api/templates/:id` | Update (creates new version) |
| DELETE | `/api/templates/:id` | Deactivate template |

### Template Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/templates/:id/render` | Render with data |
| POST | `/api/templates/:id/preview` | Preview with sample data |
| POST | `/api/templates/:id/clone` | Clone template |
| GET | `/api/templates/:id/versions` | Get version history |
| POST | `/api/templates/:id/rollback` | Rollback to version |
| POST | `/api/templates/:id/lock` | Lock from editing |
| POST | `/api/templates/:id/unlock` | Unlock for editing |

### Template Discovery

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/templates/categories` | List categories |
| GET | `/api/templates/variables` | List available variables |
| GET | `/api/templates/defaults/:reportType` | Get default templates |

## Variable System

### Variable Syntax

Variables use `[Square Brackets]` for easy identification and replacement:

```
[Company Name] have been engaged to carry out an independent assessment 
of the building works at [Address] to meet the performance requirements 
of the New Zealand Building Code.
```

### Variable Resolution

```typescript
interface VariableContext {
  project: {
    address: string;
    activity: string;
    reportType: string;
  };
  property: {
    lotDp: string;
    councilId: string;
    territorialAuthority: string;
  };
  client: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  personnel: {
    inspectorName: string;
    authorName: string;
    reviewerName: string;
  };
  inspection: {
    date: string;
    weather: string;
  };
}

const VARIABLE_MAP: Record<string, (ctx: VariableContext) => string> = {
  'Company Name': ctx => ctx.company.name,
  'Address': ctx => ctx.project.address,
  'Territorial Authority': ctx => ctx.property.territorialAuthority,
  'Report Type': ctx => ctx.project.reportType,
  'Client Name': ctx => ctx.client.name,
  'Inspector Name': ctx => ctx.personnel.inspectorName,
  'Author Name': ctx => ctx.personnel.authorName,
  'Reviewer Name': ctx => ctx.personnel.reviewerName,
  'Inspection Date': ctx => ctx.inspection.date,
  // ... more variables
};
```

### Variable Extraction

```typescript
function extractVariables(content: string): string[] {
  const regex = /\[([^\]]+)\]/g;
  const variables: string[] = [];
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  
  return variables;
}
```

### Template Rendering

```typescript
function renderTemplate(
  template: Template,
  context: VariableContext
): RenderResult {
  let content = template.content;
  const warnings: string[] = [];
  
  for (const variable of template.variables) {
    const resolver = VARIABLE_MAP[variable];
    if (resolver) {
      const value = resolver(context);
      if (value) {
        content = content.replaceAll(`[${variable}]`, value);
      } else {
        warnings.push(`Variable "${variable}" resolved to empty value`);
      }
    } else {
      warnings.push(`Unknown variable: "${variable}"`);
    }
  }
  
  return { content, warnings };
}
```

## Default Templates

### Introduction (COA)

```typescript
const introductionTemplate = {
  name: 'Introduction - COA',
  category: 'SECTION',
  reportType: 'COA',
  content: `[Company Name] have been engaged to carry out an independent assessment of the building works at [Address] to meet the performance requirements of the New Zealand Building Code.

The purpose of this inspection is to independently inspect and report on the performance against relevant clauses of the New Zealand Building Code.`,
  variables: ['Company Name', 'Address'],
};
```

### Methodology

```typescript
const methodologyTemplate = {
  name: 'Methodology - Standard',
  category: 'SECTION',
  reportType: null, // All types
  content: `In the process of the assessment, photographs were taken during the site inspection. Relevant documents provided by the client were used as references to assess the building works. The floor plans retrieved from the [Territorial Authority] property file are also used as a reference to assess the building works.`,
  variables: ['Territorial Authority'],
};
```

### Limitations

```typescript
const limitationsTemplate = {
  name: 'Limitations - Standard',
  category: 'SECTION',
  reportType: null,
  content: `This report has been prepared for the client by [Company Name] under a specific scope and Terms of Engagement. The report is based on our observations from a visual survey of the building visible at the time of inspection.

The conclusions and recommendations are in general terms only and are intended to provide a guide to achieving a [Report Type].

All recommendations within the scope of works identified in Section 4 of this report must be completed strictly in accordance with the New Zealand Building Code and manufacturer's technical instructions and must be signed off by [Company Name] on completion of the works.

Subject to the above, [Company Name] believes that on reasonable grounds the works will comply with the relevant provisions of the New Zealand Building Code.`,
  variables: ['Company Name', 'Report Type'],
};
```

### N/A Reason Templates

```typescript
const naReasonTemplates = [
  {
    name: 'N/A - Works do not affect',
    category: 'NA_REASON',
    content: 'The CoA works do not affect [Element]. As such, this Clause is not applicable.',
    variables: ['Element'],
  },
  {
    name: 'N/A - Does not apply to space',
    category: 'NA_REASON',
    content: 'This Clause does not apply to [Space Type].',
    variables: ['Space Type'],
  },
  {
    name: 'N/A - Works do not involve',
    category: 'NA_REASON',
    content: 'The CoA works do not involve [System].',
    variables: ['System'],
  },
];
```

## Version Control

### Version Creation

When a template is updated, create a new version instead of overwriting:

```typescript
async function updateTemplate(
  id: string,
  data: UpdateTemplateInput
): Promise<Template> {
  const existing = await prisma.template.findUnique({ where: { id } });
  
  if (existing.locked) {
    throw new Error('Template is locked');
  }
  
  // Deactivate current version
  await prisma.template.update({
    where: { id },
    data: { active: false },
  });
  
  // Create new version
  return prisma.template.create({
    data: {
      ...data,
      parentId: id,
      version: existing.version + 1,
      active: true,
    },
  });
}
```

### Version History

```typescript
async function getVersionHistory(id: string): Promise<Template[]> {
  const versions: Template[] = [];
  let current = await prisma.template.findUnique({ where: { id } });
  
  while (current) {
    versions.push(current);
    current = current.parentId
      ? await prisma.template.findUnique({ where: { id: current.parentId } })
      : null;
  }
  
  return versions;
}
```

### Rollback

```typescript
async function rollbackTemplate(
  id: string,
  targetVersion: number
): Promise<Template> {
  const target = await prisma.template.findFirst({
    where: { id, version: targetVersion },
  });
  
  if (!target) {
    throw new Error(`Version ${targetVersion} not found`);
  }
  
  // Clone target as new version
  return updateTemplate(id, {
    content: target.content,
    variables: target.variables,
    changeNotes: `Rolled back to version ${targetVersion}`,
  });
}
```

## Rich Text Support

### Format

Templates support Markdown formatting:

```markdown
**Bold text** for emphasis
*Italic text* for titles
- Bullet lists
- For items

| Table | Headers |
|-------|---------|
| Cell  | Content |
```

### Rendering

Convert Markdown to HTML during PDF generation:

```typescript
import { marked } from 'marked';

function renderRichText(content: string): string {
  return marked.parse(content);
}
```

## Dependencies

| Dependency | Relationship |
|------------|--------------|
| #149 COA Report | Uses templates for sections |
| #151 Building Code Reference | Clause templates |
| #153 CCC Gap Analysis | Additional templates |

## Alternatives Considered

### 1. Inline Templates in Code

**Rejected.** Templates should be editable by administrators without code changes.

### 2. Full Template Engine (Liquid, Jinja)

**Rejected.** Simple variable substitution is sufficient. Complex logic should be in code, not templates.

### 3. Store Templates as Files

**Rejected.** Database storage enables versioning, searching, and admin UI management.

## Acceptance Criteria Mapping

- [x] Create/edit text templates — CRUD endpoints
- [x] Categorize templates by type — TemplateCategory enum
- [x] Define variables per template — variables array
- [x] Preview template with sample data — POST /preview
- [x] Insert template into report section — renderTemplate()
- [x] Auto-populate variables from project data — VariableContext
- [x] Clone and customize templates — POST /clone
- [x] Default templates for each report type — seed data
- [x] Version control for templates — version, parentId
- [x] Rollback to previous template version — POST /rollback
- [x] Lock templates from editing — locked boolean
- [x] Import/export templates — future enhancement
- [x] Warn if variable not found — RenderResult.warnings
- [x] Support rich text formatting — Markdown

---

## Next Steps

1. Review with Master for approval
2. Create user stories for implementation
3. Create seed data for default templates
