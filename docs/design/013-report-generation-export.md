# Design: Report Generation & Export

**Status:** Draft  
**Sprint:** 4c  
**Author:** Archer  
**Requirement:** #158  
**Date:** 2026-02-19

## Context

Building survey reports must be generated as professional PDF and Word documents for council submission. Output quality must match manually-created reports with proper formatting, cross-references, and embedded attachments.

## Decision

Implement a multi-format document generation system using:
- Puppeteer for PDF (HTML → PDF with full CSS support)
- docx library for Word documents
- Shared template engine for consistent content
- Background job queue for generation

## Architecture

### Generation Pipeline

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Report    │────▶│   Content   │────▶│   Render    │────▶│   Output    │
│   Data      │     │   Builder   │     │   Engine    │     │   Storage   │
└─────────────┘     └─────────────┘     └──────┬──────┘     └─────────────┘
                                               │
                              ┌────────────────┼────────────────┐
                              ▼                ▼                ▼
                        ┌──────────┐    ┌──────────┐    ┌──────────┐
                        │   PDF    │    │   DOCX   │    │  Preview │
                        │ Puppeteer│    │   docx   │    │   HTML   │
                        └──────────┘    └──────────┘    └──────────┘
```

### Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| ContentBuilder | Assembles report data into structured content |
| TemplateEngine | Renders content with templates (#156) |
| ImageProcessor | Compresses and embeds photos |
| PdfRenderer | HTML → PDF via Puppeteer |
| DocxRenderer | Structured content → Word document |
| OutputStorage | Stores and serves generated files |
| JobQueue | Background processing for generation |

## Data Model

### Generated Report

```prisma
model GeneratedReport {
  id            String    @id @default(uuid())
  reportId      String
  report        Report    @relation(fields: [reportId], references: [id])
  
  format        OutputFormat
  version       Int       // Report version at generation time
  
  filePath      String    // Storage path
  fileSize      Int       // Bytes
  fileName      String    // "260206CoA-76a-chilcott-R3.pdf"
  mimeType      String
  
  status        GenerationStatus @default(PENDING)
  progress      Int       @default(0)  // 0-100
  errorMessage  String?
  
  // Metadata
  pageCount     Int?
  photoCount    Int?
  generatedAt   DateTime?
  expiresAt     DateTime? // Download link expiry
  
  createdAt     DateTime  @default(now())
  
  @@index([reportId, format])
}

enum OutputFormat {
  PDF
  DOCX
  HTML  // Preview
}

enum GenerationStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

## API Endpoints

### Generation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reports/:id/generate` | Start generation |
| GET | `/api/reports/:id/generate/status` | Check progress |
| GET | `/api/reports/:id/preview` | HTML preview |

### Downloads

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/:id/download/:format` | Download file |
| GET | `/api/generated/:id/download` | Download by generated ID |
| GET | `/api/reports/:id/generated` | List generated files |

### Batch

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reports/batch-generate` | Generate multiple |
| GET | `/api/reports/batch/:batchId/status` | Batch status |

## PDF Generation

### Puppeteer Configuration

```typescript
interface PdfConfig {
  format: 'A4';
  margin: {
    top: '25mm',
    bottom: '25mm',
    left: '20mm',
    right: '20mm',
  };
  printBackground: true;
  displayHeaderFooter: true;
  headerTemplate: string;
  footerTemplate: string;
  preferCSSPageSize: false;
}

const headerTemplate = `
  <div style="font-size: 10px; width: 100%; text-align: center;">
    <span class="title"></span>
  </div>
`;

const footerTemplate = `
  <div style="font-size: 10px; width: 100%; display: flex; justify-content: space-between; padding: 0 20mm;">
    <span>{{jobNumber}}</span>
    <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
    <span>{{companyName}}</span>
  </div>
`;
```

### Page Structure

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    @page {
      size: A4;
      margin: 25mm 20mm;
      @top-center { content: element(header); }
      @bottom-center { content: element(footer); }
    }
    
    .page-break { page-break-after: always; }
    .no-break { page-break-inside: avoid; }
    
    /* Cover page */
    .cover { height: 100vh; display: flex; flex-direction: column; }
    
    /* Tables */
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ccc; padding: 8px; }
    
    /* Photos */
    .photo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .photo-item img { max-width: 100%; height: auto; }
  </style>
</head>
<body>
  {{> cover}}
  {{> toc}}
  {{#each sections}}
    {{> section this}}
  {{/each}}
  {{#each appendices}}
    {{> appendix this}}
  {{/each}}
</body>
</html>
```

## DOCX Generation

### Using docx Library

```typescript
import { Document, Paragraph, Table, ImageRun, HeadingLevel } from 'docx';

async function generateDocx(report: ReportContent): Promise<Buffer> {
  const doc = new Document({
    sections: [
      // Cover page
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new ImageRun({
                data: report.companyLogo,
                transformation: { width: 200, height: 80 },
              }),
            ],
          }),
          new Paragraph({
            text: report.title,
            heading: HeadingLevel.TITLE,
          }),
          // ... more cover content
        ],
      },
      // Content sections
      ...report.sections.map(section => ({
        properties: {},
        children: renderSection(section),
      })),
      // Appendices
      ...report.appendices.map(appendix => ({
        properties: {},
        children: renderAppendix(appendix),
      })),
    ],
  });

  return Packer.toBuffer(doc);
}
```

### Table Generation

```typescript
function renderClauseReviewTable(reviews: ClauseReview[]): Table {
  return new Table({
    rows: [
      // Header row
      new TableRow({
        children: [
          cell('NZBC Clause'),
          cell('Photos'),
          cell('Observations'),
          cell('Docs Provided'),
          cell('Compliance'),
          cell('Remedial'),
        ],
        tableHeader: true,
      }),
      // Data rows
      ...reviews.map(review => new TableRow({
        children: [
          cell(`${review.clause.code} ${review.clause.title}`),
          cell(formatPhotoRefs(review.photoIds)),
          cell(review.observations),
          cell(formatDocRefs(review.docIds)),
          cell(review.clause.performanceText),
          cell(review.remedialWorks || 'Nil'),
        ],
      })),
    ],
  });
}
```

## Image Processing

### Compression Pipeline

```typescript
import sharp from 'sharp';

interface ImageProcessingOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: 'jpeg' | 'png';
}

async function processImage(
  input: Buffer,
  options: ImageProcessingOptions
): Promise<Buffer> {
  const { maxWidth, maxHeight, quality, format } = options;
  
  let pipeline = sharp(input)
    .resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  
  if (format === 'jpeg') {
    pipeline = pipeline.jpeg({ quality, progressive: true });
  } else {
    pipeline = pipeline.png({ compressionLevel: 9 });
  }
  
  return pipeline.toBuffer();
}

const DEFAULT_OPTIONS: ImageProcessingOptions = {
  maxWidth: 1200,
  maxHeight: 900,
  quality: 80,
  format: 'jpeg',
};
```

### Photo Grid Layout

```typescript
interface PhotoLayout {
  columns: 1 | 2;
  photosPerPage: number;
  captionPosition: 'below' | 'right';
}

function calculatePhotoLayout(photoCount: number): PhotoLayout {
  if (photoCount <= 4) {
    return { columns: 1, photosPerPage: 2, captionPosition: 'below' };
  }
  return { columns: 2, photosPerPage: 4, captionPosition: 'below' };
}
```

## Cross-References

### Reference Resolution

```typescript
interface CrossReference {
  type: 'photo' | 'appendix' | 'section';
  target: string;  // Photo number, appendix letter, section number
  pageNumber?: number;  // Resolved at generation time
}

function resolvePhotoReferences(text: string, photos: Photo[]): string {
  // Convert "Photograph 7,8,9" to clickable links
  return text.replace(
    /Photograph\s+([\d,\s]+)/g,
    (match, nums) => {
      const photoNums = nums.split(',').map(n => n.trim());
      return photoNums.map(n => 
        `<a href="#photo-${n}">Photograph ${n}</a>`
      ).join(', ');
    }
  );
}

function resolveAppendixReferences(text: string): string {
  return text.replace(
    /Appendix\s+([A-Z])/g,
    (match, letter) => `<a href="#appendix-${letter}">${match}</a>`
  );
}
```

## Table of Contents

### Auto-Generation

```typescript
interface TocEntry {
  level: number;
  title: string;
  anchor: string;
  pageNumber?: number;
}

function generateToc(sections: Section[], appendices: Appendix[]): TocEntry[] {
  const entries: TocEntry[] = [];
  
  sections.forEach((section, i) => {
    entries.push({
      level: 1,
      title: `${i + 1}. ${section.title}`,
      anchor: `section-${i + 1}`,
    });
  });
  
  appendices.forEach((appendix, i) => {
    entries.push({
      level: 1,
      title: `Appendix ${appendix.letter}: ${appendix.title}`,
      anchor: `appendix-${appendix.letter}`,
    });
  });
  
  return entries;
}
```

## Background Job Queue

### Job Processing

```typescript
import { Queue, Worker } from 'bullmq';

const reportQueue = new Queue('report-generation');

// Add job
async function queueGeneration(
  reportId: string,
  format: OutputFormat
): Promise<string> {
  const job = await reportQueue.add('generate', {
    reportId,
    format,
  }, {
    attempts: 2,
    backoff: { type: 'exponential', delay: 5000 },
  });
  
  return job.id;
}

// Process jobs
const worker = new Worker('report-generation', async (job) => {
  const { reportId, format } = job.data;
  
  await updateGenerationStatus(reportId, format, 'PROCESSING', 0);
  
  try {
    // Build content
    await job.updateProgress(10);
    const content = await buildReportContent(reportId);
    
    // Process images
    await job.updateProgress(30);
    const processedImages = await processAllImages(content.photos);
    
    // Render document
    await job.updateProgress(60);
    const buffer = format === 'PDF'
      ? await renderPdf(content, processedImages)
      : await renderDocx(content, processedImages);
    
    // Store output
    await job.updateProgress(90);
    const filePath = await storeGeneratedFile(reportId, format, buffer);
    
    await updateGenerationStatus(reportId, format, 'COMPLETED', 100, {
      filePath,
      fileSize: buffer.length,
    });
    
  } catch (error) {
    await updateGenerationStatus(reportId, format, 'FAILED', 0, {
      errorMessage: error.message,
    });
    throw error;
  }
}, {
  concurrency: 3,  // Max concurrent generations
  limiter: { max: 10, duration: 60000 },  // Rate limit
});
```

## File Storage

### Storage Strategy

```typescript
interface StorageConfig {
  provider: 'local' | 's3';
  basePath: string;
  expiryDays: number;
}

async function storeGeneratedFile(
  reportId: string,
  format: OutputFormat,
  buffer: Buffer
): Promise<string> {
  const fileName = generateFileName(reportId, format);
  const path = `reports/${reportId}/${fileName}`;
  
  if (config.provider === 's3') {
    await s3.putObject({
      Bucket: config.bucket,
      Key: path,
      Body: buffer,
      ContentType: getMimeType(format),
    });
  } else {
    await fs.writeFile(join(config.basePath, path), buffer);
  }
  
  return path;
}

function generateFileName(reportId: string, format: OutputFormat): string {
  const report = await getReport(reportId);
  const ext = format.toLowerCase();
  // 260206CoA-76a-chilcott-R3.pdf
  return `${report.jobNumber}${report.type}-${slugify(report.address)}-R${report.version}.${ext}`;
}
```

## Error Handling

### Graceful Degradation

```typescript
async function buildReportContent(reportId: string): Promise<ReportContent> {
  const report = await getReportWithRelations(reportId);
  const warnings: string[] = [];
  
  // Handle missing photos
  const photos = await Promise.all(
    report.photos.map(async (photo) => {
      try {
        const data = await loadPhoto(photo.id);
        return { ...photo, data };
      } catch (error) {
        warnings.push(`Photo ${photo.reportNumber} not found`);
        return { ...photo, data: PLACEHOLDER_IMAGE, missing: true };
      }
    })
  );
  
  // Handle missing template variables
  const content = renderTemplates(report, {
    onMissingVariable: (name) => {
      warnings.push(`Variable [${name}] not found`);
      return `[MISSING: ${name}]`;
    },
  });
  
  return { ...content, photos, warnings };
}
```

## Preview Mode

### HTML Preview

```typescript
async function generatePreview(reportId: string): Promise<string> {
  const content = await buildReportContent(reportId);
  
  // Render HTML without PDF conversion
  const html = await renderHtml(content, {
    watermark: 'DRAFT - PREVIEW ONLY',
    lowResImages: true,  // Use thumbnails
    skipToc: true,
  });
  
  return html;
}
```

## Dependencies

| Dependency | Relationship |
|------------|--------------|
| #149 COA Report | Report data source |
| #152 Document/Photo | Attachments to embed |
| #156 Report Templates | Section content |
| #157 Report Workflow | Status validation |

## Alternatives Considered

### 1. Server-Side LibreOffice

**Rejected.** Heavy dependency, complex deployment. Puppeteer + docx library is lighter.

### 2. Client-Side PDF Generation

**Rejected.** Large documents with many images need server resources. Background queue handles load.

### 3. LaTeX for PDF

**Rejected.** Complex template syntax, harder to iterate. HTML/CSS more accessible.

## Acceptance Criteria Mapping

- [x] Generate PDF from report data — PdfRenderer
- [x] Generate DOCX from report data — DocxRenderer
- [x] Cover page with branding — cover template
- [x] Auto-generated TOC with links — generateToc()
- [x] Consistent section formatting — templates
- [x] Tables render correctly — table helpers
- [x] Photos in Appendix A with captions — photo grid
- [x] Documents embedded in appendices — appendix renderer
- [x] Cross-references work — resolveReferences()
- [x] Page numbers in footer — footerTemplate
- [x] Professional quality output — CSS styling
- [x] Preview report before generation — HTML preview
- [x] Progress indicator — job progress
- [x] Handle missing attachments — graceful degradation
- [x] Compress images — ImageProcessor
- [x] Download link with expiry — expiresAt field
- [x] Watermark for drafts — preview mode

---

## Next Steps

1. Review with Master for approval
2. Create user stories for implementation
