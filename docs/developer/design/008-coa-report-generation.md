# Design: COA Report Generation

**Status:** Draft  
**Sprint:** 4c  
**Author:** Archer  
**Requirement:** #149  
**Date:** 2026-02-19

## Context

Building surveyors need to generate Certificate of Acceptance (COA) reports from inspection data. These reports support applications for unauthorized building work (post-1992) and provide evidence to council that work complies with the Building Code.

Currently, surveyors manually create these reports in Word, a time-consuming and error-prone process. The system should generate professional PDF reports from captured inspection data.

## Decision

Implement a template-driven PDF generation system that:
1. Uses HTML templates with Handlebars for sections
2. Renders to PDF via Puppeteer
3. Stores generated reports for download
4. Supports Form 9 data export for council submissions

## Architecture

### Report Generation Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Inspection    │────▶│   Report        │────▶│   PDF           │
│   Data          │     │   Generator     │     │   Output        │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │ Template │ │ Photo    │ │ Document │
              │ Engine   │ │ Embedder │ │ Linker   │
              └──────────┘ └──────────┘ └──────────┘
```

### Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| ReportService | Orchestrates report generation, validates data |
| TemplateEngine | Renders HTML from Handlebars templates |
| PhotoEmbedder | Embeds photos with captions, handles pagination |
| DocumentLinker | Creates appendix references, links documents |
| PdfRenderer | Converts HTML to PDF via Puppeteer |
| ReportStorage | Stores generated PDFs, manages versions |

## Data Model

### Report Entity

```prisma
model Report {
  id            String        @id @default(uuid())
  inspectionId  String
  inspection    Inspection    @relation(fields: [inspectionId], references: [id])
  
  type          ReportType    @default(COA)
  status        ReportStatus  @default(DRAFT)
  version       Int           @default(1)
  
  // Generated content
  pdfPath       String?       // Path to generated PDF
  pdfSize       Int?          // File size in bytes
  generatedAt   DateTime?
  
  // Metadata
  preparedById  String
  preparedBy    Personnel     @relation("preparedBy", fields: [preparedById], references: [id])
  reviewedById  String?
  reviewedBy    Personnel?    @relation("reviewedBy", fields: [reviewedById], references: [id])
  reviewedAt    DateTime?
  
  // Form 9 data (extracted for council)
  form9Data     Json?         // Structured Form 9 export
  
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}

enum ReportType {
  COA           // Certificate of Acceptance
  CCC_GA        // CCC Gap Analysis
  SAFE_SANITARY // Safe & Sanitary
  PPI           // Pre-Purchase Inspection
}

enum ReportStatus {
  DRAFT         // Being edited
  REVIEW        // Awaiting peer review
  APPROVED      // Peer reviewed, ready for generation
  GENERATED     // PDF created
  SUBMITTED     // Sent to council
}
```

### Report Section Content

```prisma
model ReportSection {
  id            String    @id @default(uuid())
  reportId      String
  report        Report    @relation(fields: [reportId], references: [id], onDelete: Cascade)
  
  sectionNumber Int       // 1-7 for COA
  title         String
  content       Json      // Section-specific structured content
  
  sortOrder     Int
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@unique([reportId, sectionNumber])
}
```

## API Endpoints

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/inspections/:id/reports` | Create report from inspection |
| GET | `/api/reports/:id` | Get report details |
| PUT | `/api/reports/:id` | Update report metadata |
| DELETE | `/api/reports/:id` | Delete report |
| POST | `/api/reports/:id/generate` | Generate PDF |
| GET | `/api/reports/:id/pdf` | Download PDF |
| POST | `/api/reports/:id/review` | Submit for peer review |
| POST | `/api/reports/:id/approve` | Approve after review |
| GET | `/api/reports/:id/form9` | Export Form 9 data |

### Report Preview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/:id/preview` | HTML preview of report |
| GET | `/api/reports/:id/preview/:section` | Preview specific section |

## Template System

### Template Structure

```
templates/
├── coa/
│   ├── base.hbs              # Main layout with header/footer
│   ├── sections/
│   │   ├── 01-summary.hbs
│   │   ├── 02-introduction.hbs
│   │   ├── 03-building-description.hbs
│   │   ├── 04-methodology.hbs
│   │   ├── 05-clause-review.hbs
│   │   ├── 06-remedial-works.hbs
│   │   └── 07-signatures.hbs
│   ├── appendices/
│   │   ├── photos.hbs        # Appendix A
│   │   ├── drawings.hbs      # Appendix B
│   │   ├── reports.hbs       # Appendix C
│   │   └── certificates.hbs  # Appendix D+
│   └── styles/
│       └── report.css        # Print-optimized styles
└── partials/
    ├── header.hbs
    ├── footer.hbs
    ├── clause-row.hbs
    └── photo-grid.hbs
```

### Template Data Context

```typescript
interface COAReportContext {
  // Section 1: Summary
  project: {
    jobNumber: string;
    activity: string;
    address: string;
    client: string;
    council: string;
  };
  personnel: {
    author: { name: string; credentials: string; signature?: string };
    reviewer: { name: string; credentials: string; signature?: string };
    inspectors: Array<{ name: string; role: string }>;
  };
  inspection: {
    date: string;
    weather: string;
  };
  
  // Section 3: Property
  property: {
    lotDp: string;
    councilId: string;
    zones: {
      wind: string;
      earthquake: string;
      exposure: string;
    };
    buildingHistory: Array<{
      type: string;
      reference: string;
      date: string;
    }>;
    worksDescription: string;
  };
  
  // Section 4: Methodology
  methodology: {
    description: string;
    equipment: string[];
    areasNotAccessed: string;
    documentsReviewed: string[];
  };
  
  // Section 5: Clause Review
  clauseReviews: Array<{
    code: string;
    title: string;
    applicability: 'Applicable' | 'N/A';
    naReason?: string;
    photoRefs: string[];       // "Photograph 1, 2"
    observations: string;
    docsProvided: string[];    // "Appendix C"
    docsRequired: string;
    complianceText: string;    // From BuildingCodeClause
    remedialWorks: string;
  }>;
  
  // Section 6: Remedial Works
  remedialItems: Array<{
    item: string;
    description: string;
  }>;
  
  // Appendices
  appendices: {
    photos: Array<{
      number: number;
      caption: string;
      source: string;          // "Site" | "Owner Provided"
      base64: string;          // For embedding
    }>;
    documents: Array<{
      letter: string;          // "A", "B", "C"
      title: string;
      pages: number;
    }>;
  };
}
```

### Handlebars Helpers

```typescript
// Register custom helpers
Handlebars.registerHelper('formatDate', (date: Date) => 
  format(date, 'dd MMMM yyyy')
);

Handlebars.registerHelper('photoRef', (photoIds: string[]) =>
  photoIds.map(id => `Photograph ${id}`).join(', ')
);

Handlebars.registerHelper('ifApplicable', function(applicability, options) {
  return applicability === 'Applicable' ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('clauseClass', (applicability) =>
  applicability === 'N/A' ? 'clause-na' : 'clause-applicable'
);
```

## PDF Generation

### Puppeteer Configuration

```typescript
interface PdfOptions {
  format: 'A4';
  margin: {
    top: '25mm';
    bottom: '25mm';
    left: '20mm';
    right: '20mm';
  };
  printBackground: true;
  displayHeaderFooter: true;
  headerTemplate: string;    // Company logo, report title
  footerTemplate: string;    // Page numbers
}
```

### Generation Process

```typescript
class ReportGenerator {
  async generate(reportId: string): Promise<string> {
    // 1. Load report with all relations
    const report = await this.loadReportData(reportId);
    
    // 2. Validate completeness
    this.validateReport(report);
    
    // 3. Build template context
    const context = this.buildContext(report);
    
    // 4. Render HTML
    const html = await this.renderTemplate('coa', context);
    
    // 5. Generate PDF
    const pdfBuffer = await this.renderPdf(html);
    
    // 6. Store PDF
    const pdfPath = await this.storePdf(reportId, pdfBuffer);
    
    // 7. Update report record
    await this.updateReport(reportId, {
      pdfPath,
      pdfSize: pdfBuffer.length,
      generatedAt: new Date(),
      status: 'GENERATED'
    });
    
    return pdfPath;
  }
  
  private validateReport(report: ReportData): void {
    const errors: string[] = [];
    
    // All applicable clauses must have observations
    for (const review of report.clauseReviews) {
      if (review.applicability === 'APPLICABLE' && !review.observations) {
        errors.push(`Clause ${review.clause.code} missing observations`);
      }
    }
    
    // Photos must have captions
    for (const photo of report.photos) {
      if (!photo.caption) {
        errors.push(`Photo ${photo.reportNumber} missing caption`);
      }
    }
    
    // Required documents must be received
    const requiredDocs = ['CoC', 'ESC']; // For electrical work
    // ... validation logic
    
    if (errors.length > 0) {
      throw new ReportValidationError(errors);
    }
  }
}
```

## Photo Handling

### Photo Numbering

Photos are numbered sequentially for the report:

```typescript
async function assignPhotoNumbers(inspectionId: string): Promise<void> {
  const photos = await prisma.photo.findMany({
    where: { inspectionId },
    orderBy: [
      { clauseReview: { clause: { sortOrder: 'asc' } } },
      { sortOrder: 'asc' }
    ]
  });
  
  let number = 1;
  for (const photo of photos) {
    await prisma.photo.update({
      where: { id: photo.id },
      data: { reportNumber: number++ }
    });
  }
}
```

### Photo References in Clause Review

```handlebars
{{!-- Section 5: Clause Review Table --}}
<table class="clause-review-table">
  {{#each clauseReviews}}
  <tr class="{{clauseClass applicability}}">
    <td class="clause-code">{{code}}</td>
    <td class="clause-title">{{title}}</td>
    <td class="applicability">{{applicability}}</td>
    <td class="photo-refs">{{photoRef photoRefs}}</td>
    <td class="observations">{{observations}}</td>
    <td class="docs-provided">{{#each docsProvided}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}</td>
    <td class="compliance-text">{{complianceText}}</td>
    <td class="remedial">{{remedialWorks}}</td>
  </tr>
  {{/each}}
</table>
```

### Appendix A: Photos

```handlebars
{{!-- Appendix A: Inspection Photographs --}}
<section class="appendix" id="appendix-a">
  <h2>Appendix A: Inspection Photographs</h2>
  
  <div class="photo-grid">
    {{#each appendices.photos}}
    <figure class="photo-item">
      <img src="data:image/jpeg;base64,{{base64}}" alt="{{caption}}" />
      <figcaption>
        <strong>Photograph {{number}}</strong>: {{caption}}
        {{#if source}}
        <span class="photo-source">({{source}})</span>
        {{/if}}
      </figcaption>
    </figure>
    {{/each}}
  </div>
</section>
```

## Form 9 Export

### Form 9 Data Structure

```typescript
interface Form9Data {
  // Part A: Applicant Details (from Client)
  applicant: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  
  // Part B: Building Work
  buildingWork: {
    address: string;
    description: string;
    dateCompleted: string;
  };
  
  // Part C: Building Code Compliance
  clausesClaimed: Array<{
    clause: string;
    description: string;
  }>;
  
  // Part D: Limitations
  limitations: string[];
  
  // Part E: Supporting Documents
  documents: Array<{
    type: string;
    reference: string;
    date: string;
  }>;
  
  // Part F: Inspection Details
  inspections: Array<{
    date: string;
    inspector: string;
    credentials: string;
  }>;
}
```

### Form 9 Generation

```typescript
async function generateForm9(reportId: string): Promise<Form9Data> {
  const report = await loadReportWithRelations(reportId);
  
  return {
    applicant: {
      name: report.project.client.name,
      address: report.project.client.address,
      phone: report.project.client.phone,
      email: report.project.client.email,
    },
    buildingWork: {
      address: report.project.property.address,
      description: report.project.activity,
      dateCompleted: report.inspection.date,
    },
    clausesClaimed: report.clauseReviews
      .filter(r => r.applicability === 'APPLICABLE' && r.remedialWorks === 'Nil')
      .map(r => ({
        clause: r.clause.code,
        description: r.clause.title,
      })),
    limitations: [
      report.inspection.areasNotAccessed,
      ...report.methodology.limitations,
    ].filter(Boolean),
    documents: report.documents
      .filter(d => d.status === 'RECEIVED')
      .map(d => ({
        type: d.documentType,
        reference: d.referenceNumber,
        date: d.dateIssued,
      })),
    inspections: [{
      date: report.inspection.date,
      inspector: report.personnel.author.name,
      credentials: report.personnel.author.credentials,
    }],
  };
}
```

## Dependencies

| Dependency | Relationship |
|------------|--------------|
| #150 Inspection Checklist | ClauseReview data for Section 5 |
| #151 Building Code Reference | Clause text for compliance column |
| #152 Document/Photo | Photos for Appendix A, docs for B-H |
| #154 Project/Property | Project, property, client data |
| #155 Personnel | Author/reviewer credentials |

## Alternatives Considered

### 1. WeasyPrint (Python) Instead of Puppeteer

**Rejected.** Team is Node.js-focused. Puppeteer integrates better and handles complex CSS layouts well.

### 2. LaTeX for PDF Generation

**Rejected.** Higher learning curve, harder to iterate on templates. HTML/CSS is more accessible for styling changes.

### 3. Store Reports as JSON, Generate on Download

**Rejected.** PDF generation is expensive. Pre-generate and cache for faster downloads and version control.

### 4. Single Template File

**Rejected.** Modular templates (per section) are easier to maintain and test independently.

## Implementation Notes

### Performance

- Generate PDFs asynchronously (background job)
- Cache rendered PDFs (regenerate only when data changes)
- Compress photos before embedding (max 1MB per photo)
- Consider thumbnail previews for large reports

### Version Control

- Increment version on each regeneration
- Keep previous versions for audit trail
- Link to specific version in Form 9 submission

### Error Handling

- Validate data completeness before generation
- Return detailed errors for missing fields
- Allow partial preview even with incomplete data

## Acceptance Criteria (from Requirement)

### Report Structure
- [x] 7 main sections per COA format
- [x] Appendices A-H for supporting materials
- [x] Clause-by-clause review table (Section 5)

### Data Integration
- [x] Pull data from inspection capture (Phase 1)
- [x] Include edits from web interface (Phase 2)
- [x] Auto-populate Building Code text
- [x] Sequential photo numbering

### Generation
- [x] Generate professional PDF
- [x] Print-optimized layout (A4)
- [x] Header with company logo
- [x] Footer with page numbers
- [x] Embedded photos in appendix

### Form 9 Support
- [x] Extract Form 9 data structure
- [x] List applicable clauses claimed compliant
- [x] List inspection limitations
- [x] List supporting documents
- [x] Export in council-compatible format

### Validation
- [x] All applicable clauses have observations
- [x] All photos have captions
- [x] Required documents received
- [x] Report approved before generation

---

## Next Steps

1. Review with Master for approval
2. Create user stories for implementation
3. Coordinate with #155 Personnel for author/reviewer credentials
